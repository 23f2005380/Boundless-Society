import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

// Import local data for seeding
import { curvedMarque } from "@/data/curvedMarquee";

// Function to seed Firestore if empty
async function seedIfEmpty() {
  try {
    const marqueeRef = collection(db, "proud_marquee");
    const qSnapshot = await getDocs(marqueeRef);
    if (qSnapshot.empty) {
      console.log("Proud marquee collection is empty. Seeding initial data...");
      const batch = writeBatch(db);
      curvedMarque.forEach((m, idx) => {
        const docRef = doc(collection(db, "proud_marquee"));
        batch.set(docRef, {
          title: m.title,
          img: m.img || "",
          sortOrder: idx,
          createdAt: new Date(),
        });
      });
      await batch.commit();
      console.log("Successfully seeded proud marquee items.");
    }
  } catch (error) {
    console.error("Error seeding proud marquee:", error);
  }
}

/* GET All Marquee Items OR Single Item (if ?id= is passed) */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const docRef = doc(db, "proud_marquee", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return NextResponse.json({ error: "Marquee item not found" }, { status: 404 });
      }
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() }, { status: 200 });
    }

    await seedIfEmpty();

    const marqueeRef = collection(db, "proud_marquee");
    const q = query(marqueeRef, orderBy("sortOrder", "asc"));
    const querySnapshot = await getDocs(q);

    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by createdAt desc in-memory if sortOrder is equal
    data.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ marquee: data }, { status: 200 });
  } catch (error) {
    console.error("GET Marquee Error:", error);
    return NextResponse.json({ error: "Failed to fetch marquee items" }, { status: 500 });
  }
}

/* POST: Save new marquee item */
export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.title || !body.img) {
      return NextResponse.json({ error: "Title and image are required" }, { status: 400 });
    }

    const marqueeData = {
      title: body.title,
      img: body.img,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : parseInt(body.sortOrder) || 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "proud_marquee"), marqueeData);
    return NextResponse.json({ message: "Marquee item added", id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("POST Marquee Error:", error);
    return NextResponse.json({ error: "Failed to save marquee item" }, { status: 500 });
  }
}

/* PUT: Update marquee item */
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, title, img, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updateData = {
      title,
      img: img || "",
      sortOrder: typeof sortOrder === "number" ? sortOrder : parseInt(sortOrder) || 0,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "proud_marquee", id), updateData);
    return NextResponse.json({ success: true, message: "Marquee item updated" }, { status: 200 });
  } catch (error) {
    console.error("PUT Marquee Error:", error);
    return NextResponse.json({ error: "Failed to update marquee item" }, { status: 500 });
  }
}

/* DELETE: Remove marquee item */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "proud_marquee", id));
    return NextResponse.json({ success: true, message: "Marquee item deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Marquee Error:", error);
    return NextResponse.json({ error: "Failed to delete marquee item" }, { status: 500 });
  }
}
