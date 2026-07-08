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
import { stats } from "@/data/stats";

// Function to seed Firestore if empty
async function seedIfEmpty() {
  try {
    const statsRef = collection(db, "proud_stats");
    const qSnapshot = await getDocs(statsRef);
    if (qSnapshot.empty) {
      console.log("Proud stats collection is empty. Seeding initial data...");
      const batch = writeBatch(db);
      stats.forEach((s, idx) => {
        const docRef = doc(collection(db, "proud_stats"));
        batch.set(docRef, {
          number: typeof s.number === "number" ? s.number : parseInt(s.number) || 0,
          label: s.label,
          sortOrder: idx,
          createdAt: new Date(),
        });
      });
      await batch.commit();
      console.log("Successfully seeded proud stats.");
    }
  } catch (error) {
    console.error("Error seeding proud stats:", error);
  }
}

/* GET All Stats OR Single Stat (if ?id= is passed) */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const docRef = doc(db, "proud_stats", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return NextResponse.json({ error: "Stat not found" }, { status: 404 });
      }
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() }, { status: 200 });
    }

    await seedIfEmpty();

    const statsRef = collection(db, "proud_stats");
    const q = query(statsRef, orderBy("sortOrder", "asc"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ stats: data }, { status: 200 });
  } catch (error) {
    console.error("GET Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

/* POST: Save new stat */
export async function POST(req) {
  try {
    const body = await req.json();
    if (body.number === undefined || !body.label) {
      return NextResponse.json({ error: "Number and label are required" }, { status: 400 });
    }

    const statData = {
      number: typeof body.number === "number" ? body.number : parseInt(body.number) || 0,
      label: body.label,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : parseInt(body.sortOrder) || 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "proud_stats"), statData);
    return NextResponse.json({ message: "Stat added", id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("POST Stats Error:", error);
    return NextResponse.json({ error: "Failed to save stat" }, { status: 500 });
  }
}

/* PUT: Update stat */
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, number, label, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updateData = {
      number: typeof number === "number" ? number : parseInt(number) || 0,
      label,
      sortOrder: typeof sortOrder === "number" ? sortOrder : parseInt(sortOrder) || 0,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "proud_stats", id), updateData);
    return NextResponse.json({ success: true, message: "Stat updated" }, { status: 200 });
  } catch (error) {
    console.error("PUT Stats Error:", error);
    return NextResponse.json({ error: "Failed to update stat" }, { status: 500 });
  }
}

/* DELETE: Remove stat */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "proud_stats", id));
    return NextResponse.json({ success: true, message: "Stat deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Stat Error:", error);
    return NextResponse.json({ error: "Failed to delete stat" }, { status: 500 });
  }
}
