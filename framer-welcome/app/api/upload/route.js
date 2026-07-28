import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { uploadImages } from "@/lib/cloudinary";

// Force dynamic to prevent caching issues
export const dynamic = "force-dynamic"; 

export async function POST(req) {
  try {
    // Auth gate — admin session required
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.json();
    const images = formData.images; // Expecting array of base64 strings
    const folder = formData.folder || "uploads";

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    const urls = await uploadImages(images, { folder });

    return NextResponse.json({ 
      success: true, 
      links: urls 
    });

  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}