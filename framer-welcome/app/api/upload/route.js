import { NextResponse } from "next/server";
import { uploadImages } from "@/lib/cloudinary";

export const maxDuration = 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const { images, folder = "trips" } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    const uploadedImages = await uploadImages(images, { folder });

    return NextResponse.json(
      {
        message: "Images uploaded successfully",
        images: uploadedImages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload images. Please try again." },
      { status: 500 }
    );
  }
}
