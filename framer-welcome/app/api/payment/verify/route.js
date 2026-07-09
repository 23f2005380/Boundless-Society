import { NextResponse } from "next/server";
import crypto from "crypto";
import { db, realtimeDb, isFirebaseEnabled } from "@/lib/firebase";
import { ref, runTransaction as runRealtimeTransaction } from "firebase/database";
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
    const { orderId, paymentId, signature, sessionId, tripId, registrationId } = body;

    if (!orderId || !paymentId || !signature || !tripId || !registrationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Fetch trip metadata from Firestore to read custom Key Secret if any
    const tripDocRef = doc(db, "trips", tripId);
    const tripSnap = await getDoc(tripDocRef);
    if (!tripSnap.exists()) {
      return NextResponse.json({ error: "Trip details not found" }, { status: 404 });
    }
    const tripData = tripSnap.data();

    // 2. Verify Razorpay Signature
    const secret = (tripData.razorpayKeySecret && tripData.razorpayKeySecret.trim() !== "")
      ? tripData.razorpayKeySecret
      : process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Payment verification credentials are not configured for this trip." },
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

    // 2. Fetch Registration details to check gender and current status
    const regRef = doc(db, "user-registrations", registrationId);
    const regSnap = await getDoc(regRef);
    if (!regSnap.exists()) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    const regData = regSnap.data();

    // Prevent double verification / double seat taking
    if (regData.status === "paid") {
      return NextResponse.json({ success: true, message: "Already verified" }, { status: 200 });
    }

    const gender = regData.gender || "unknown";

    // 3. Update Trip stats in Firestore
    const tripRef = doc(db, "trips", tripId);
    const tripSnap = await getDoc(tripRef);
    if (!tripSnap.exists()) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    const tripData = tripSnap.data();

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

    await updateDoc(tripRef, tripUpdate);

    // 4. Update user-registrations status to "paid"
    await updateDoc(regRef, {
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
