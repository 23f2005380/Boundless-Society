import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");
    const studentEmail = searchParams.get("studentEmail");

    let q;
    const concernsRef = collection(db, "coordinator_concerns");

    if (tripId && studentEmail) {
      q = query(
        concernsRef,
        where("tripId", "==", tripId),
        where("studentEmail", "==", studentEmail),
        orderBy("createdAt", "desc")
      );
    } else if (studentEmail) {
      q = query(
        concernsRef,
        where("studentEmail", "==", studentEmail),
        orderBy("createdAt", "desc")
      );
    } else if (tripId) {
      q = query(
        concernsRef,
        where("tripId", "==", tripId),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(concernsRef, orderBy("createdAt", "desc"));
    }

    const snapshot = await getDocs(q);
    const concerns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ concerns }, { status: 200 });
  } catch (error) {
    console.error("GET Concerns Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { tripId, studentEmail, coordinatorEmail, concernText } = body;

    if (!tripId || !studentEmail || !concernText) {
      return NextResponse.json(
        { error: "Missing required fields (tripId, studentEmail, concernText)" },
        { status: 400 }
      );
    }

    const docRef = await addDoc(collection(db, "coordinator_concerns"), {
      tripId,
      studentEmail,
      coordinatorEmail: coordinatorEmail || "coordinator",
      concernText,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("POST Concerns Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
