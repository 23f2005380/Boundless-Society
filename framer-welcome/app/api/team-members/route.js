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
import { founderDetails } from "@/data/founders";
import { councilMembers, departmentHeads } from "@/data/newCouncil";
import { oldCouncilMembers, oldDepartmentHeads } from "@/data/oldCouncil";

// Function to seed Firestore if the team_members collection is empty
async function seedIfEmpty() {
  try {
    const teamRef = collection(db, "team_members");
    const qSnapshot = await getDocs(teamRef);
    if (qSnapshot.empty) {
      console.log("Team members collection is empty. Seeding initial data...");
      const itemsToSeed = [];

      // 1. Founders
      founderDetails.forEach((f, idx) => {
        itemsToSeed.push({
          name: f.name,
          role: f.role,
          image: f.src || f.image || "",
          type: "founder",
          term: "",
          sortOrder: idx,
        });
      });

      // 2. Current Council (2025-2026)
      councilMembers.forEach((c, idx) => {
        itemsToSeed.push({
          name: c.name,
          role: c.role,
          image: c.image || "",
          type: "council",
          term: "2025-2026",
          sortOrder: idx,
        });
      });

      // 3. Current Dept Heads (2025-2026)
      departmentHeads.forEach((d, idx) => {
        itemsToSeed.push({
          name: d.name,
          role: d.role,
          image: d.image || "",
          type: "dept_head",
          term: "2025-2026",
          sortOrder: idx,
        });
      });

      // 4. Old Council (2024-2025)
      oldCouncilMembers.forEach((c, idx) => {
        itemsToSeed.push({
          name: c.name,
          role: c.role,
          image: c.image || "",
          type: "council",
          term: "2024-2025",
          sortOrder: idx,
        });
      });

      // 5. Old Dept Heads (2024-2025)
      oldDepartmentHeads.forEach((d, idx) => {
        itemsToSeed.push({
          name: d.name,
          role: d.role,
          image: d.image || "",
          type: "dept_head",
          term: "2024-2025",
          sortOrder: idx,
        });
      });

      // Firestore Batch write (limit is 500 documents per batch)
      const batch = writeBatch(db);
      itemsToSeed.forEach((item) => {
        const docRef = doc(collection(db, "team_members"));
        batch.set(docRef, {
          ...item,
          createdAt: new Date(),
        });
      });
      await batch.commit();
      console.log("Successfully seeded 26 team members.");
    }
  } catch (error) {
    console.error("Error seeding team members:", error);
  }
}

/* GET All Team Members OR Single Team Member (if ?id= is passed) */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Fetch single item for the Edit page
    if (id) {
      const docRef = doc(db, "team_members", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() }, { status: 200 });
    }

    // Auto-seed if empty
    await seedIfEmpty();

    // Fetch all items for the Manage List page
    const teamRef = collection(db, "team_members");
    const q = query(teamRef, orderBy("sortOrder", "asc"));
    const querySnapshot = await getDocs(q);

    const members = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by createdAt desc in-memory if sortOrder is equal
    members.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    console.error("GET API Error:", error);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}

/* POST: Save a new team member */
export async function POST(req) {
  try {
    const body = await req.json();
    
    if (!body.name || !body.role || !body.type) {
      return NextResponse.json({ error: "Name, role and type are required" }, { status: 400 });
    }

    const memberData = {
      name: body.name,
      role: body.role,
      image: body.image || "",
      type: body.type, // 'founder', 'council', 'dept_head'
      term: body.type === "founder" ? "" : body.term || "", // e.g. '2025-2026'
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : parseInt(body.sortOrder) || 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "team_members"), memberData);
    return NextResponse.json({ message: "Member added", id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("POST API Error:", error);
    return NextResponse.json({ error: "Failed to save team member" }, { status: 500 });
  }
}

/* PUT: Update team member */
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, role, image, type, term, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updateData = {
      name,
      role,
      image: image || "",
      type,
      term: type === "founder" ? "" : term || "",
      sortOrder: typeof sortOrder === "number" ? sortOrder : parseInt(sortOrder) || 0,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "team_members", id), updateData);
    return NextResponse.json({ success: true, message: "Member updated" }, { status: 200 });
  } catch (error) {
    console.error("PUT API Error:", error);
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
  }
}

/* DELETE: Remove team member */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "team_members", id));
    return NextResponse.json({ success: true, message: "Member deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE API Error:", error);
    return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 });
  }
}
