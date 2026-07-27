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
    const { images, folder, email, tripName, subFolderType, token } = body;

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
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const image = images[0];

    const isDoc =
      image.startsWith("data:application/msword") ||
      image.startsWith("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    if (
      !image ||
      typeof image !== "string" ||
      (!image.startsWith("data:image") && !image.startsWith("data:application/pdf") && !isDoc)
    ) {
      return NextResponse.json(
        { error: "Invalid file format. Please provide an image, PDF, or Word document." },
        { status: 400 }
      );
    }

    // ====================================================================
    // PATH A: Trip Registration (student form) → Google Drive ONLY
    // Detected by presence of subFolderType ("Student IDs", "Consent Forms", "Form Files")
    // ====================================================================
    if (subFolderType) {
      if (!process.env.DRIVE_UPLOAD_URL) {
        return NextResponse.json(
          { error: "File storage is not configured. Please contact the administrator." },
          { status: 503 }
        );
      }

      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: "Invalid base64 format" }, { status: 400 });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      let extension = "bin";
      if (mimeType.includes("pdf")) extension = "pdf";
      else if (mimeType.includes("word") || mimeType.includes("msword")) extension = "doc";
      else if (mimeType.includes("officedocument")) extension = "docx";
      else if (mimeType.includes("image/jpeg") || mimeType.includes("image/jpg")) extension = "jpg";
      else if (mimeType.includes("image/png")) extension = "png";
      else {
        const parts = mimeType.split("/");
        if (parts[1]) extension = parts[1].split(";")[0];
      }

      const fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;

      // 30-second timeout — no Cloudinary fallback for student form uploads
      const driveTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Drive upload timed out after 30 seconds")), 30000)
      );

      let driveRes;
      try {
        driveRes = await Promise.race([
          fetch(process.env.DRIVE_UPLOAD_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName,
              mimeType,
              fileBase64: base64Data,
              email: email || "anonymous",
              tripName: tripName || "Event",
              subFolderType,
            }),
          }),
          driveTimeout,
        ]);
      } catch (err) {
        console.error("Google Drive upload failed:", err.message);
        return NextResponse.json(
          { error: "Failed to upload file to Google Drive. Please try again." },
          { status: 502 }
        );
      }

      const driveResult = await driveRes.json();

      if (driveResult.status === "success" && driveResult.fileUrl) {
        return NextResponse.json(
          {
            success: true,
            images: [
              {
                secure_url: driveResult.fileUrl,
                public_id: fileName,
                width: 0,
                height: 0,
              },
            ],
          },
          { status: 200 }
        );
      }

      console.error("Google Drive Apps Script returned error:", driveResult);
      return NextResponse.json(
        { error: "Failed to upload file to Google Drive. Please try again." },
        { status: 502 }
      );
    }

    // ====================================================================
    // PATH B: Admin Panel uploads → Cloudinary ONLY
    // ====================================================================
    const result = await uploadImage(image, {
      folder: folder || "uploads",
    });

    return NextResponse.json(
      {
        success: true,
        images: [
          {
            secure_url: result.secure_url || result.url,
            public_id: result.public_id || result.publicId,
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
      { error: error.message || "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
