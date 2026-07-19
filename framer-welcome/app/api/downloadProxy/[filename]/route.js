import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    let filename = resolvedParams.filename || "download";

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    // Security: Only allow proxying Cloudinary URLs to prevent open proxy abuse
    const isCloudinary = url.startsWith("https://res.cloudinary.com/") || url.startsWith("http://res.cloudinary.com/");
    if (!isCloudinary) {
      return NextResponse.json({ error: "Forbidden: Only Cloudinary assets are allowed" }, { status: 403 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch file from source" }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);
    
    // Detect PDF/Images by checking the file magic bytes
    let isPdf = false;
    let isPng = false;
    let isJpg = false;
    let isDocx = false;

    if (data.length >= 4) {
      if (data[0] === 0x25 && data[1] === 0x50 && data[2] === 0x44 && data[3] === 0x46) {
        isPdf = true; // %PDF
      } else if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
        isPng = true; // \x89PNG
      } else if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
        isJpg = true; // \xFF\xD8\xFF
      } else if (data[0] === 0x50 && data[1] === 0x4B && data[2] === 0x03 && data[3] === 0x04) {
        isDocx = true; // PK.. (ZIP/DOCX/XLSX)
      }
    }

    let contentType = response.headers.get("Content-Type") || "application/octet-stream";

    // Fallbacks to filename/url/contentType if magic bytes aren't recognized
    isPdf = isPdf || url.toLowerCase().includes(".pdf") || filename.toLowerCase().endsWith(".pdf") || contentType.includes("pdf");
    isPng = isPng || url.toLowerCase().includes(".png") || filename.toLowerCase().endsWith(".png") || contentType.includes("image/png");
    isJpg = isJpg || url.toLowerCase().includes(".jpg") || url.toLowerCase().includes(".jpeg") || filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg") || contentType.includes("image/jpeg");
    isDocx = isDocx || url.toLowerCase().includes(".docx") || filename.toLowerCase().endsWith(".docx") || contentType.includes("wordprocessingml");
    
    if (isPdf) {
      contentType = "application/pdf";
      if (!filename.toLowerCase().endsWith(".pdf")) filename += ".pdf";
    } else if (isPng) {
      contentType = "image/png";
      if (!filename.toLowerCase().endsWith(".png")) filename += ".png";
    } else if (isJpg) {
      contentType = "image/jpeg";
      if (!filename.toLowerCase().endsWith(".jpg") && !filename.toLowerCase().endsWith(".jpeg")) filename += ".jpg";
    } else if (isDocx) {
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (!filename.toLowerCase().endsWith(".docx") && !filename.toLowerCase().endsWith(".zip")) filename += ".docx";
    } else {
      // If we don't know the exact magic bytes but Content-Type gives a hint, we can append basic extensions
      if (contentType.includes("msword") && !filename.includes(".")) filename += ".doc";
      else if (contentType.includes("image/webp") && !filename.includes(".")) filename += ".webp";
      else if (contentType.includes("text/plain") && !filename.includes(".")) filename += ".txt";
    }

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `inline; filename="${filename}"`);

    return new Response(data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Proxy download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
