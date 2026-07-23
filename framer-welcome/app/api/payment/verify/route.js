import { NextResponse } from "next/server";
import crypto from "crypto";
import { db, realtimeDb, isFirebaseEnabled } from "@/lib/firebase";
import { ref, runTransaction as runRealtimeTransaction } from "firebase/database";
import { adminAuth } from "@/lib/firebase-admin";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

// Helper function to archive roster
async function archiveEventRoster(tripId) {
  try {
    const tripDocRef = doc(db, "trips", tripId);
    const tripSnap = await getDoc(tripDocRef);
    if (!tripSnap.exists()) return;
    const tripData = tripSnap.data();

    const regQuery = query(
      collection(db, "user-registrations"),
      where("tripId", "==", tripId),
      where("status", "==", "paid")
    );
    const regSnap = await getDocs(regQuery);
    const attendees = regSnap.docs.map((d) => {
      const data = d.data();
      const nameKey = Object.keys(data.formData || {}).find(
        (k) => k.toLowerCase().includes("name") || k.toLowerCase().includes("fullname")
      );
      const studentName = nameKey ? data.formData[nameKey] : "Student";
      return {
        uid: data.uid,
        email: data.email,
        name: studentName,
        gender: data.gender || "unknown",
        paymentVerifiedAt: data.paymentVerifiedAt?.toDate?.()?.toISOString() || null,
      };
    });

    const archiveRef = doc(db, "archived_rosters", tripId);
    await setDoc(archiveRef, {
      tripId,
      tripName: tripData.name || "Unnamed Trip",
      coordinators: tripData.coordinators || [],
      attendees,
      closedAt: new Date(),
    });

    await updateDoc(tripDocRef, {
      finalRosterSaved: true,
    });
  } catch (error) {
    console.error("Error archiving event roster on verify:", error);
  }
}

export async function POST(req) {
  try {
    if (!isFirebaseEnabled || !realtimeDb) {
      return NextResponse.json(
        { error: "Firebase is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : body.token;
    const { orderId, paymentId, signature, sessionId, tripId, registrationId } = body;

    if (!orderId || !paymentId || !signature || !tripId || !registrationId || !token) {
      return NextResponse.json(
        { error: "Missing required fields (orderId, paymentId, signature, tripId, registrationId, token)" },
        { status: 400 }
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

    if (!email || !email.endsWith("iitm.ac.in")) {
      return NextResponse.json({ error: "Unauthorized domain. Only IITM emails are allowed." }, { status: 403 });
    }

    // B. Fetch registration to assert ownership
    const regDocRef = doc(db, "user-registrations", registrationId);
    const regSnap = await getDoc(regDocRef);
    if (!regSnap.exists()) {
      return NextResponse.json({ error: "Registration details not found." }, { status: 404 });
    }
    const regData = regSnap.data();
    if (regData.email?.toLowerCase() !== email?.toLowerCase()) {
      return NextResponse.json({ error: "Access denied: registration ownership mismatch." }, { status: 403 });
    }

    // 1. Fetch trip metadata from Firestore to read event stats
    const tripDocRef = doc(db, "trips", tripId);
    const tripSnap = await getDoc(tripDocRef);
    if (!tripSnap.exists()) {
      return NextResponse.json({ error: "Trip details not found in database" }, { status: 404 });
    }
    const tripData = tripSnap.data();

    // 2. Verify Razorpay Signature using environment secret key
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Payment verification credentials are not configured on the server." },
        { status: 503 }
      );
    }

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generated_signature !== signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Prevent double verification / double seat taking
    if (regData.status === "paid") {
      return NextResponse.json({ success: true, message: "Already verified" }, { status: 200 });
    }

    const gender = regData.gender || "unknown";

    // 3. Update Trip stats in Firestore (reusing tripDocRef and tripData from above)
    const currentTotalJoined = Number(tripData.totalJoined || 0);
    const currentFemaleJoined = Number(tripData.femaleJoined || 0);
    const totalSeats = Number(tripData.totalSeats || 30);

    const newTotalJoined = currentTotalJoined + 1;
    const newFemaleJoined = gender === "female" ? currentFemaleJoined + 1 : currentFemaleJoined;

    const tripUpdate = {
      totalJoined: newTotalJoined,
      femaleJoined: newFemaleJoined,
    };

    // If total seats limit is reached, automatically close registration & payment
    if (newTotalJoined >= totalSeats) {
      tripUpdate.registrationOpen = false;
      tripUpdate.paymentOpen = false;
    }

    await updateDoc(tripDocRef, tripUpdate);

    // 4. Update user-registrations status to "paid"
    await updateDoc(regDocRef, {
      status: "paid",
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      paymentVerifiedAt: serverTimestamp(),
    });

    // 5. If seats reached capacity, trigger archiving
    if (newTotalJoined >= totalSeats) {
      await archiveEventRoster(tripId);
    }

    // 6. Update Realtime DB (Legacy fallback or session cleanup)
    const rtTripRef = ref(realtimeDb, `trips/${tripId}`);
    await runRealtimeTransaction(rtTripRef, (currentData) => {
      const dataCallback = currentData || {};
      const sessions = dataCallback.sessions || {};
      const newSessions = { ...sessions };
      if (sessionId && newSessions[sessionId]) {
        delete newSessions[sessionId];
      }
      const activeCount = Object.keys(newSessions).length;
      return {
        ...dataCallback,
        sessions: newSessions,
        ActivePaymentSession: activeCount,
        PaymentDone: newTotalJoined,
      };
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
