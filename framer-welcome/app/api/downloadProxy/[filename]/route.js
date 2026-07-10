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

    const data = await response.blob();
    
    // Detect PDF/Images by checking the file magic bytes
    const firstBytes = await data.slice(0, 4).text();
    const isPdf = firstBytes === "%PDF" || url.toLowerCase().includes(".pdf") || filename.toLowerCase().endsWith(".pdf");
    
    let contentType = response.headers.get("Content-Type") || "application/octet-stream";
    if (isPdf) {
      contentType = "application/pdf";
      if (!filename.toLowerCase().endsWith(".pdf")) {
        filename += ".pdf";
      }
    } else if (firstBytes.includes("PNG") || url.toLowerCase().includes(".png") || filename.toLowerCase().endsWith(".png")) {
      contentType = "image/png";
      if (!filename.toLowerCase().endsWith(".png")) {
        filename += ".png";
      }
    } else if (url.toLowerCase().includes(".jpg") || url.toLowerCase().includes(".jpeg") || filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
      contentType = "image/jpeg";
      if (!filename.toLowerCase().endsWith(".jpg") && !filename.toLowerCase().endsWith(".jpeg")) {
        filename += ".jpg";
      }
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
