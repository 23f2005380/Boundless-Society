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
import { v2 as cloudinary } from "cloudinary";
import { db, isFirebaseEnabled } from "@/lib/firebase";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ─── Helper: upload a single base64 data URI to Cloudinary ─── */
async function uploadToCloudinary(base64DataUrl) {
  if (!base64DataUrl || typeof base64DataUrl !== "string") {
    throw new Error("Invalid image data");
  }
  if (!base64DataUrl.startsWith("data:")) {
    throw new Error('Image data must be a base64 data URI starting with "data:"');
  }

  const result = await cloudinary.uploader.upload(base64DataUrl, {
    folder: "gallery",
    resource_type: "image",
    timeout: 120000,
  });

  return result.secure_url;
}

/* ─── GET → List All ─── */
export async function GET() {
  try {
    if (!isFirebaseEnabled || !db) {
      return NextResponse.json([], { status: 200 });
    }

    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─── POST → Upload image to Cloudinary then save to Firestore ─── */
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, imageData, link } = body;
    // imageData = base64 data URI from the client
    // img       = already-uploaded Cloudinary URL (fallback, not used in new flow)

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!imageData) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary inside this route — no dependency on /api/upload
    const imgUrl = await uploadToCloudinary(imageData);

    const ref = await addDoc(collection(db, "gallery"), {
      name,
      img: imgUrl,
      link: link || "#",
      createdAt: Date.now(),
    });

    return NextResponse.json({ success: true, id: ref.id, img: imgUrl });
  } catch (err) {
    console.error("[gallery POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─── PUT → Update (re-upload image only if new imageData provided) ─── */
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, imageData, img, link } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // If a new file was picked, upload it; otherwise keep existing img URL
    const finalImg = imageData
      ? await uploadToCloudinary(imageData)
      : img;

    await updateDoc(doc(db, "gallery", id), {
      name,
      img: finalImg,
      link,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true, img: finalImg });
  } catch (err) {
    console.error("[gallery PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─── DELETE → Remove ─── */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "gallery", id));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}