import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

// GET single trip (for pre-filling the edit form)
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const docRef = doc(db, "previous_trips", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE trip
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const docRef = doc(db, "previous_trips", id);

    await updateDoc(docRef, {
      ...body,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "Trip updated" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE trip
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await deleteDoc(doc(db, "previous_trips", id));
    return NextResponse.json({ success: true, message: "Trip deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}