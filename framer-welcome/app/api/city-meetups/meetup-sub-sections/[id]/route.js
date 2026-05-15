import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await deleteDoc(doc(db, "meetup_sub_sections", id));
    
    return NextResponse.json({ message: "Sub Section deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting sub-section:", error);
    return NextResponse.json({ error: "Failed to delete sub-section" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Sub-section name is required" }, { status: 400 });
    }

    await updateDoc(doc(db, "meetup_sub_sections", id), {
      name: body.name.trim(),
    });

    return NextResponse.json({ message: "Sub Section updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating sub-section:", error);
    return NextResponse.json({ error: "Failed to update sub-section" }, { status: 500 });
  }
}
