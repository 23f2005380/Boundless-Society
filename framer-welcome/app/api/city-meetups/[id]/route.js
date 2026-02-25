import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";

// GET a single meetup for the edit form
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const docRef = doc(db, "city_meetups", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Meetup not found" }, { status: 404 });
    }

    return NextResponse.json({ meetup: { id: docSnap.id, ...docSnap.data() } }, { status: 200 });
  } catch (error) {
    console.error("Error fetching meetup:", error);
    return NextResponse.json({ error: "Failed to fetch meetup" }, { status: 500 });
  }
}

// PUT (Update) an existing meetup
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    
    const meetupRef = doc(db, "city_meetups", id);
    
    // THIS is where the color is updated in Firebase!
    const updateData = {
      mainSection: body.mainSection,
      subSection: body.subSection,
      cityName: body.cityName,
      color: body.color, // <--- MAKE SURE THIS LINE IS HERE
    };
    
    // Only update image if a new one was uploaded
    if (body.img) {
      updateData.img = body.img;
    }

    await updateDoc(meetupRef, updateData);

    return NextResponse.json({ message: "Meetup updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating meetup:", error);
    return NextResponse.json({ error: "Failed to update meetup" }, { status: 500 });
  }
}

// DELETE a meetup
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    await deleteDoc(doc(db, "city_meetups", id));
    
    return NextResponse.json({ message: "City meetup deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting meetup:", error);
    return NextResponse.json({ error: "Failed to delete meetup" }, { status: 500 });
  }
}