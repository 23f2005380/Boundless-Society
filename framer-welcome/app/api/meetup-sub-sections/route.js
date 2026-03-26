import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

export async function GET() {
  try {
    const subSectionsRef = collection(db, "meetup_sub_sections");
    const q = query(subSectionsRef, orderBy("priority", "asc"));
    const querySnapshot = await getDocs(q);

    const subSections = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ subSections }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sub-sections:", error);
    return NextResponse.json({ error: "Failed to fetch sub-sections" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const subSectionData = {
      name: body.name,
      priority: Number(body.priority) || 99,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "meetup_sub_sections"), subSectionData);
    return NextResponse.json({ message: "Sub Section added", id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error adding sub-section:", error);
    return NextResponse.json({ error: "Failed to save sub-section" }, { status: 500 });
  }
}