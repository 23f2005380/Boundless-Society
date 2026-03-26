import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy, serverTimestamp, getDoc } from "firebase/firestore";

/* GET → List All or Single (if ?id= is passed) */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Fetch single item (used for edit pages)
    if (id) {
      const docRef = doc(db, "city_meetups", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ meetup: { id: docSnap.id, ...docSnap.data() } }, { status: 200 });
    }

    // Fetch all items (used for list view)
    const meetupsRef = collection(db, "city_meetups");
    const q = query(meetupsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const meetups = querySnapshot.docs.map((doc) => ({
      id: doc.id, ...doc.data(),
    }));

    return NextResponse.json({ meetups }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch city meetups" }, { status: 500 });
  }
}

/* POST → Create */
export async function POST(req) {
  try {
    const body = await req.json();
    const meetupData = {
      mainSection: body.mainSection,
      subSection: body.subSection,
      cityName: body.cityName, 
      color: body.color || "#FEFAE7",
      img: body.img, // Now simply receiving a string URL like gallery
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "city_meetups"), meetupData);
    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save city meetup" }, { status: 500 });
  }
}

/* PUT → Update */
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, mainSection, subSection, cityName, color, img } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await updateDoc(doc(db, "city_meetups", id), {
      mainSection, subSection, cityName, color, img, updatedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update meetup" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await deleteDoc(doc(db, "city_meetups", id));
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete meetup" }, { status: 500 });
  }
}