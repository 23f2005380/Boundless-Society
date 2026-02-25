import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

// GET: Fetch all city meetups
export async function GET() {
  try {
    const meetupsRef = collection(db, "city_meetups");
    const q = query(meetupsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const meetups = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ meetups }, { status: 200 });
  } catch (error) {
    console.error("Error fetching city meetups:", error);
    return NextResponse.json({ error: "Failed to fetch city meetups" }, { status: 500 });
  }
}

// POST: Save a new city meetup
export async function POST(request) {
  try {
    const body = await request.json();
    const meetupData = {
      mainSection: body.mainSection,
      subSection: body.subSection,
      cityName: body.cityName, 
      color: body.color || "#FEFAE7",
      img: body.img, 
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "city_meetups"), meetupData);
    return NextResponse.json({ message: "City meetup added", id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error adding city meetup:", error);
    return NextResponse.json({ error: "Failed to save city meetup" }, { status: 500 });
  }
}