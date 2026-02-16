import { NextResponse } from "next/server";
import { uploadImages } from "@/lib/cloudinary";

// Force dynamic to prevent caching issues
export const dynamic = "force-dynamic"; 

export async function POST(req) {
  try {
    const formData = await req.json();
    const images = formData.images; // Expecting array of base64 strings
    const folder = formData.folder || "uploads";

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    // This now returns an array of URL strings because of the fix in lib/cloudinary.js
    const urls = await uploadImages(images, { folder });

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