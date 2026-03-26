import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { token, name } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔐 Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);

    const email = decodedToken.email;

    // 🔐 Domain restriction
    if (!email || !email.endsWith("iitm.ac.in")) {
      return NextResponse.json(
        { error: "Access restricted to IITM accounts" },
        { status: 403 }
      );
    }

    // ✅ Only now accept submission
    console.log("Valid submission:", {
      email,
      name,
      uid: decodedToken.uid,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}