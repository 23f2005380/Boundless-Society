import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, where } from "firebase/firestore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("sectionId");

    const subSectionsRef = collection(db, "meetup_sub_sections");
    const q = sectionId
      ? query(subSectionsRef, where("sectionId", "==", sectionId), orderBy("priority", "asc"))
      : query(subSectionsRef, orderBy("priority", "asc"));

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
    if (!body.sectionId) {
      return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
    }

    const subSectionData = {
      name: body.name,
      priority: Number(body.priority) || 99,
      sectionId: body.sectionId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "meetup_sub_sections"), subSectionData);
    return NextResponse.json({ message: "Sub Section added", id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error adding sub-section:", error);
    return NextResponse.json({ error: "Failed to save sub-section" }, { status: 500 });
  }
}
