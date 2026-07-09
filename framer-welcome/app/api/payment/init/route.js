import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { db, realtimeDb, isFirebaseEnabled } from "@/lib/firebase";
import { ref, runTransaction } from "firebase/database";
import { doc as fsDoc, getDoc as fsGetDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { adminAuth } from "@/lib/firebase-admin";

let razorpay = null;

// Only initialize Razorpay if credentials are provided
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function POST(req) {
  try {
    if (!isFirebaseEnabled || !realtimeDb || !db) {
      return NextResponse.json(
        { error: "Database backend is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { tripId, token, currency = "INR" } = body;

    if (!tripId || !token) {
      return NextResponse.json(
        { error: "Missing required parameters (tripId, token)" },
        { status: 400 },
      );
    }

    // A. Verify Firebase ID Token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired user session." }, { status: 401 });
    }
    const email = decodedToken.email;

    // B. Fetch trip metadata from Firestore to read fee and caps
    const fsTripRef = fsDoc(db, "trips", tripId);
    const fsTripSnap = await fsGetDoc(fsTripRef);
    if (!fsTripSnap.exists()) {
      return NextResponse.json({ error: "Trip details not found in database" }, { status: 404 });
    }
    const fsTripData = fsTripSnap.data();
    const tripFee = fsTripData.fee !== undefined ? Number(fsTripData.fee) : 500;

    // C. Verify student registration is approved to pay
    const regQuery = query(
      collection(db, "user-registrations"),
      where("tripId", "==", tripId),
      where("email", "==", email),
      limit(1)
    );
    const regSnap = await getDocs(regQuery);
    if (regSnap.empty) {
      return NextResponse.json({ error: "Registration entry not found for this trip." }, { status: 404 });
    }
    const regData = regSnap.docs[0].data();
    if (regData.status !== "approved_to_pay") {
      return NextResponse.json({ error: "Your registration status does not permit payment." }, { status: 403 });
    }

    // D. Girls Priority Threshold check (Boys payment lock validation)
    if (regData.gender === "male") {
      const girlsThreshold = fsTripData.predefinedGirlsThreshold || 0;
      const femaleJoined = fsTripData.femaleJoined || 0;
      if (femaleJoined < girlsThreshold) {
        return NextResponse.json({ error: "Payment is locked for boys until the girls priority quota is met." }, { status: 403 });
      }
    }

    // 2. Select global Razorpay client from environment variables
    const activeRazorpay = razorpay;
    const activeKeyId = process.env.RAZORPAY_KEY_ID;

    if (!activeRazorpay) {
      return NextResponse.json(
        { error: "Payment system is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const tripRef = ref(realtimeDb, `trips/${tripId}`);

    // Check if trip exists first in RTDB, initialize if missing
    const { get, set } = await import("firebase/database");
    let snapshot = await get(tripRef);
    if (!snapshot.exists()) {
      const initialRTData = {
        TotalSeates: Number(fsTripData.totalSeats || 30),
        PaymentDone: Number(fsTripData.totalJoined || 0),
        ActivePaymentSession: 0,
        sessions: {}
      };
      await set(tripRef, initialRTData);
      snapshot = await get(tripRef);
    }

    let debugInfo = {};
    const now = Date.now();
    const newSessionId = `sess_${now}_${Math.random().toString(36).substr(2, 9)}`;

    const transactionResult = await runTransaction(tripRef, (currentData) => {
      const dataCallback = currentData || {};

      const SESSION_TIMEOUT_MS = 1 * 60 * 1000; // 1 minutes

      const sessions = dataCallback.sessions || {};
      let activeCount = 0;
      const newSessions = {};

      Object.entries(sessions).forEach(([sessionId, timestamp]) => {
        if (now - timestamp < SESSION_TIMEOUT_MS) {
          newSessions[sessionId] = timestamp;
          activeCount++;
        }
      });

      const totalSeats = Number(dataCallback.TotalSeates || 0);
      const paymentDone = Number(dataCallback.PaymentDone || 0);
      const available = totalSeats - paymentDone - activeCount;

      console.log(`[PaymentDebug] Trip: ${tripId}`, {
        totalSeats,
        paymentDone,
        activeCount,
        available,
        sessionsCount: Object.keys(sessions).length,
      });

      debugInfo = { totalSeats, paymentDone, activeCount, available };

      if (available > 0) {
        newSessions[newSessionId] = now;

        return {
          ...dataCallback,
          sessions: newSessions,
          ActivePaymentSession: activeCount + 1,
        };
      } else {
        if (totalSeats === 0) {
          console.log(
            "[PaymentDebug] Cold cache detected (TotalSeats=0). Forcing rewrite to sync.",
          );
          return {
            ...dataCallback,
            _sync: now,
          };
        }

        return undefined;
      }
    });

    if (transactionResult.committed) {
      const snapshot = transactionResult.snapshot.val();

      const options = {
        amount: tripFee * 100,
        currency: currency,
        receipt: `receipt_${Date.now()}`,
      };

      try {
        const order = await activeRazorpay.orders.create(options);
        return NextResponse.json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          key: activeKeyId,
          sessionId: newSessionId,
        });
      } catch (rpError) {
        console.error("Razorpay Error:", rpError);
        return NextResponse.json(
          { error: "Failed to create payment order" },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json(
        {
          error: "Seats are currently full or trip not found.",
          debug: debugInfo,
        },
        { status: 409 },
      );
    }
  } catch (error) {
    console.error("Payment Init Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
