import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

// GET: Fetch all trips for the frontend
export async function GET() {
  try {
    const tripsRef = collection(db, "previous_trips");
    // Order by creation time so newest appears first
    const q = query(tripsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const trips = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ trips }, { status: 200 });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 });
  }
}

// POST: Save a new trip (called from Admin)
export async function POST(request) {
  try {
    const body = await request.json();
    const tripData = {
      heading: body.heading,
      subHeading: body.subHeading,
      img: body.img, // Cloudinary URL
      link: body.link,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "previous_trips"), tripData);
    return NextResponse.json({ message: "Trip added", id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error adding trip:", error);
    return NextResponse.json({ error: "Failed to save trip" }, { status: 500 });
  }
}