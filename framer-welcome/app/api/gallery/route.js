import { NextResponse } from "next/server";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  orderBy,
  query,
} from "firebase/firestore";

import { db, isFirebaseEnabled } from "@/lib/firebase";

/* GET → List All */
export async function GET() {
  try {
    if (!isFirebaseEnabled || !db) {
      return NextResponse.json([], { status: 200 });
    }

    const q = query(
      collection(db, "gallery"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json(data);

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/*POST → Create*/
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, img, link } = body;

    if (!name || !img) {
      return NextResponse.json(
        { error: "Name & Image required" },
        { status: 400 }
      );
    }

    const ref = await addDoc(collection(db, "gallery"), {
      name,
      img,
      link: link || "#",
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      id: ref.id,
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/* PUT → Update */
export async function PUT(req) {
  try {
    const body = await req.json();

    const { id, name, img, link } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID required" },
        { status: 400 }
      );
    }

    await updateDoc(doc(db, "gallery", id), {
      name,
      img,
      link,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/* DELETE → Remove*/
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID required" },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, "gallery", id));

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
