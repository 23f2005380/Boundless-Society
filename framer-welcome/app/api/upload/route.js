import { NextResponse } from "next/server";
import { uploadImages } from "@/lib/cloudinary";

// Force dynamic to prevent caching issues
export const dynamic = "force-dynamic"; 

export async function POST(req) {
  try {
    const formData = await req.json();
    const images = formData.images; // Expecting array of base64 strings
    const folder = formData.folder || "uploads";
    const resourceType = formData.resourceType === "video" ? "video" : "image";

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const urls = await uploadImages(images, { folder, resourceType });

    return NextResponse.json({ 
      success: true, 
      links: urls 
    });

  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}