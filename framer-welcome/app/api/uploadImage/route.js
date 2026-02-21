import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(req) {
  try {
    const body = await req.json();
    const { images, folder } = body;

    // ---- Validation ----
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const image = images[0];

    if (
      !image ||
      typeof image !== "string" ||
      !image.startsWith("data:image")
    ) {
      return NextResponse.json(
        { error: "Invalid image format" },
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
