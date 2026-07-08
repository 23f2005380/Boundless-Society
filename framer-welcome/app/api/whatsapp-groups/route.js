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
import { officialGroups, girlsGroups, regionalGroups } from "@/data/whatsapp";

// Function to seed Firestore if the whatsapp_groups collection is empty
async function seedIfEmpty() {
  try {
    const groupsRef = collection(db, "whatsapp_groups");
    const qSnapshot = await getDocs(groupsRef);
    if (qSnapshot.empty) {
      console.log("WhatsApp groups collection is empty. Seeding initial data...");
      const itemsToSeed = [];

      // 1. Official Groups
      officialGroups.forEach((g, idx) => {
        itemsToSeed.push({
          city: g.city,
          img: g.img || "",
          link: g.link || "",
          color: g.color || "#ffffff",
          category: "official",
          linkType: g.linkType || "",
          sortOrder: idx,
        });
      });

      // 2. Girls Groups
      girlsGroups.forEach((g, idx) => {
        itemsToSeed.push({
          city: g.city,
          img: g.img || "",
          link: g.link || "",
          color: g.color || "#ffffff",
          category: "girls",
          linkType: "",
          sortOrder: idx,
        });
      });

      // 3. Regional Groups
      regionalGroups.forEach((g, idx) => {
        itemsToSeed.push({
          city: g.city,
          img: g.img || "",
          link: g.link || "",
          color: g.color || "#ffffff",
          category: "regional",
          linkType: "",
          sortOrder: idx,
        });
      });

      // Batch write to Firestore (limit is 500 documents per batch; we have around 40, so 1 batch is fine)
      const batch = writeBatch(db);
      itemsToSeed.forEach((item) => {
        const docRef = doc(collection(db, "whatsapp_groups"));
        batch.set(docRef, {
          ...item,
          createdAt: new Date(),
        });
      });
      await batch.commit();
      console.log("Successfully seeded WhatsApp groups.");
    }
  } catch (error) {
    console.error("Error seeding WhatsApp groups:", error);
  }
}

/* GET All Groups OR Single Group (if ?id= is passed) */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Fetch single item for the Edit page
    if (id) {
      const docRef = doc(db, "whatsapp_groups", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() }, { status: 200 });
    }

    // Auto-seed if empty
    await seedIfEmpty();

    // Fetch all items for the Manage List page
    const groupsRef = collection(db, "whatsapp_groups");
    const q = query(groupsRef, orderBy("sortOrder", "asc"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const groups = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ groups }, { status: 200 });
  } catch (error) {
    console.error("GET API Error:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

/* POST: Save a new group */
export async function POST(req) {
  try {
    const body = await req.json();
    
    if (!body.city || !body.link || !body.category) {
      return NextResponse.json({ error: "Name/City, invite link, and category are required" }, { status: 400 });
    }

    const groupData = {
      city: body.city,
      img: body.img || "",
      link: body.link,
      color: body.color || "#ffffff",
      category: body.category, // 'official', 'girls', 'regional'
      linkType: body.linkType || "", // 'gspace' or empty
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : parseInt(body.sortOrder) || 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "whatsapp_groups"), groupData);
    return NextResponse.json({ message: "Group added", id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("POST API Error:", error);
    return NextResponse.json({ error: "Failed to save group" }, { status: 500 });
  }
}

/* PUT: Update group */
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, city, img, link, color, category, linkType, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updateData = {
      city,
      img: img || "",
      link,
      color: color || "#ffffff",
      category,
      linkType: linkType || "",
      sortOrder: typeof sortOrder === "number" ? sortOrder : parseInt(sortOrder) || 0,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "whatsapp_groups", id), updateData);
    return NextResponse.json({ success: true, message: "Group updated" }, { status: 200 });
  } catch (error) {
    console.error("PUT API Error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

/* DELETE: Remove group */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "whatsapp_groups", id));
    return NextResponse.json({ success: true, message: "Group deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE API Error:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
