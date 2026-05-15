import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

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
