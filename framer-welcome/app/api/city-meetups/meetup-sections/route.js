import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

export async function GET() {
  try {
    const sectionsRef = collection(db, "meetup_sections");
    // Order by priority (Ascending: 1 comes first, then 2, etc.)
    const q = query(sectionsRef, orderBy("priority", "asc"));
    const querySnapshot = await getDocs(q);

    const sections = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ sections }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const sectionData = {
      name: body.name,
      priority: Number(body.priority) || 99, // Default to 99 if no priority given
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "meetup_sections"), sectionData);
    return NextResponse.json({ message: "Section added", id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error adding section:", error);
    return NextResponse.json({ error: "Failed to save section" }, { status: 500 });
  }
}
