import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { realtimeDb, isFirebaseEnabled } from "@/lib/firebase";
import { ref, runTransaction } from "firebase/database";

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
    if (!isFirebaseEnabled || !realtimeDb) {
      return NextResponse.json(
        { error: "Firebase is not configured. Please try again later." },
        { status: 503 }
      );
    }

    if (!razorpay) {
      return NextResponse.json(
        { error: "Payment system is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { tripId, amount, currency = "INR" } = body;

    if (!tripId || !amount) {
      return NextResponse.json(
        { error: "Trip ID and amount are required" },
        { status: 400 },
      );
    }

    const tripRef = ref(realtimeDb, `trips/${tripId}`);

    // Check if trip exists first
    const { get } = await import("firebase/database");
    const snapshot = await get(tripRef);
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: `Trip not found at path trips/${tripId}` },
        { status: 404 },
      );
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
        amount: amount * 100,
        currency: currency,
        receipt: `receipt_${Date.now()}`,
      };

      try {
        const order = await razorpay.orders.create(options);
        return NextResponse.json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          key: process.env.RAZORPAY_KEY_ID,
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
