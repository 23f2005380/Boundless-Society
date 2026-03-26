import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

/* GET All Trips OR Single Trip (if ?id= is passed) */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Fetch single item for the Edit page
    if (id) {
      const docRef = doc(db, "previous_trips", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() }, { status: 200 });
    }

    // Fetch all items for the Manage List page
    const tripsRef = collection(db, "previous_trips");
    const q = query(tripsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const trips = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ trips }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 });
  }
}

/* POST: Save a new trip */
export async function POST(req) {
  try {
    const body = await req.json();
    const tripData = {
      heading: body.heading,
      subHeading: body.subHeading,
      img: body.img, 
      link: body.link || "",
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "previous_trips"), tripData);
    return NextResponse.json({ message: "Trip added", id: docRef.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save trip" }, { status: 500 });
  }
}

/* PUT: Update trip */
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, heading, subHeading, img, link } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await updateDoc(doc(db, "previous_trips", id), {
      heading, subHeading, img, link, updatedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true, message: "Trip updated" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}

/* DELETE: Remove trip */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await deleteDoc(doc(db, "previous_trips", id));
    return NextResponse.json({ success: true, message: "Trip deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
  }
}