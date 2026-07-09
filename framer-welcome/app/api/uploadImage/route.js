import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminAuth } from "@/lib/firebase-admin";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(req) {
  try {
    // 1. Dual Auth Gating (NextAuth session for admin, Firebase ID token for students)
    const session = await getServerSession();
    let authorized = !!session;

    const body = await req.json();
    const { images, folder, token } = body;

    if (!authorized && token) {
      try {
        await adminAuth.verifyIdToken(token);
        authorized = true;
      } catch (err) {
        console.error("Firebase upload authentication failed:", err);
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized: Access is denied." },
        { status: 401 }
      );
    }

    // ---- Validation ----
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const image = images[0];

    if (
      !image ||
      typeof image !== "string" ||
      (!image.startsWith("data:image") && !image.startsWith("data:application/pdf"))
    ) {
      return NextResponse.json(
        { error: "Invalid file format. Please provide an image or PDF." },
        { status: 400 }
      );
    }

    // ---- Upload to Cloudinary ----
    const result = await uploadImage(image, {
      folder: folder || "uploads",
    });

    return NextResponse.json(
      {
        success: true,
        images: [
          {
            secure_url: result.url,
            public_id: result.publicId,
            width: result.width,
            height: result.height,
          },
        ],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { error: "Image upload failed" },
      { status: 500 }
    );
  }
}
