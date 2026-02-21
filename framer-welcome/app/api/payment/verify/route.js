import { NextResponse } from "next/server";
import crypto from "crypto";
import { realtimeDb, isFirebaseEnabled } from "@/lib/firebase";
import { ref, runTransaction } from "firebase/database";

export async function POST(req) {
  try {
    if (!isFirebaseEnabled || !realtimeDb) {
      return NextResponse.json(
        { error: "Firebase is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { orderId, paymentId, signature, sessionId, tripId } = body;

    if (!orderId || !paymentId || !signature || !tripId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generated_signature !== signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 },
      );
    }

    // 2. Update Firebase
    const tripRef = ref(realtimeDb, `trips/${tripId}`);

    const transactionResult = await runTransaction(tripRef, (currentData) => {
      const dataCallback = currentData || {};

      const sessions = dataCallback.sessions || {};

      const newSessions = { ...sessions };
      if (sessionId && newSessions[sessionId]) {
        delete newSessions[sessionId];
      }

      const activeCount = Object.keys(newSessions).length;
      const paymentDone = Number(dataCallback.PaymentDone || 0) + 1;

      return {
        ...dataCallback,
        sessions: newSessions,
        ActivePaymentSession: activeCount,
        PaymentDone: paymentDone,
      };
    });

    if (transactionResult.committed) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Failed to update trip data" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
