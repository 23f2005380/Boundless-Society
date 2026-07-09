import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc
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
        where("studentEmail", "==", studentEmail)
      );
    } else if (studentEmail) {
      q = query(
        concernsRef,
        where("studentEmail", "==", studentEmail)
      );
    } else if (tripId) {
      q = query(
        concernsRef,
        where("tripId", "==", tripId)
      );
    } else {
      q = query(concernsRef);
    }

    const snapshot = await getDocs(q);
    const concerns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    // Sort in-memory by createdAt desc
    concerns.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

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

export async function DELETE(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Concern ID is required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "coordinator_concerns", id));
    return NextResponse.json({ success: true, message: "Concern deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Concern Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
