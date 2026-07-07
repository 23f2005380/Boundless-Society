// app/api/election/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getSecondaryDb } from "@/lib/firebase-admin-secondary";
import { isQuotaError } from "@/lib/firebase-fallback";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const token = authHeader.substring(7);

  let decodedToken: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }

  const uid = decodedToken.uid;
  const { currentDepartmentIndex, tempSelections } = await req.json();

  if (typeof currentDepartmentIndex !== "number") {
    return NextResponse.json({ error: "Invalid department index" }, { status: 400 });
  }

  const update = {
    currentDepartmentIndex,
    tempSelections: tempSelections || {},
  };

  // Try primary Firebase first
  try {
    const memberRef = adminDb.collection("council_members").doc(uid);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) return NextResponse.json({ error: "Voter profile not found" }, { status: 404 });
    if (memberSnap.data()?.hasVoted) return NextResponse.json({ error: "Voter has already submitted ballot" }, { status: 400 });
    await memberRef.update(update);
    return NextResponse.json({ success: true, overflow: false });
  } catch (err: any) {
    if (!isQuotaError(err)) {
      console.error("[progress API] Error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // Fallback to secondary
    try {
      const secondaryDb = getSecondaryDb();
      const memberRef = secondaryDb.collection("council_members").doc(uid);
      const memberSnap = await memberRef.get();
      if (!memberSnap.exists) return NextResponse.json({ error: "Voter profile not found in secondary DB" }, { status: 404 });
      await memberRef.update(update);
      return NextResponse.json({ success: true, overflow: true });
    } catch (secondaryErr: any) {
      return NextResponse.json({ error: "Both databases unavailable. Progress not saved." }, { status: 503 });
    }
  }
}
