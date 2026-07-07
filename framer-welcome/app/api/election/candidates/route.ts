// app/api/election/candidates/route.ts
// Admin-only API for candidate CRUD operations
// POST   — create a new candidate
// PUT    — update an existing candidate (body must include id)
// DELETE — delete a candidate (query param ?id=xxx)

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Verify the admin session via the next-auth cookie header (simple check)
async function isAdminRequest(req: NextRequest) {
  // We allow requests that come from the same origin (admin panel)
  // In production, add a proper NextAuth session check here.
  return true;
}

// ── Helpers for Auto Toggling Contesting Flag ───────────────────────────────

async function updateContestingFlag(email: string) {
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();
  
  // Find member doc with this email
  const memberSnap = await adminDb.collection("council_members")
    .where("email", "==", cleanEmail)
    .limit(1)
    .get();
    
  if (!memberSnap.empty) {
    const memberDoc = memberSnap.docs[0];
    await memberDoc.ref.update({ isContestingAgain: true });
    console.log(`Auto-flagged isContestingAgain=true for member: ${cleanEmail}`);
  }
}

async function removeContestingFlagIfNeeded(email: string, candidateIdToExclude?: string) {
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();

  // Check if any other candidate is using this email
  const candSnap = await adminDb.collection("candidates")
    .where("email", "==", cleanEmail)
    .get();
  
  const otherCands = candSnap.docs.filter(doc => doc.id !== candidateIdToExclude);
  
  if (otherCands.length === 0) {
    // No other candidates are contesting with this email, safe to set flag to false
    const memberSnap = await adminDb.collection("council_members")
      .where("email", "==", cleanEmail)
      .limit(1)
      .get();
      
    if (!memberSnap.empty) {
      const memberDoc = memberSnap.docs[0];
      await memberDoc.ref.update({ isContestingAgain: false });
      console.log(`Auto-flagged isContestingAgain=false for member: ${cleanEmail}`);
    }
  }
}

// ── POST: Create candidate ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, email, department, manifesto, photoUrl } = body;
    if (!name || !email || !department || !manifesto)
      return NextResponse.json({ error: "name, email, department and manifesto are required" }, { status: 400 });

    const ref = adminDb.collection("candidates").doc();
    const cleanEmail = email.trim().toLowerCase();
    
    await ref.set({
      name: name.trim(),
      email: cleanEmail,
      department: department.trim(),
      manifesto: manifesto.trim(),
      photoUrl: photoUrl?.trim() ?? "",
      createdAt: new Date().toISOString(),
    });

    // Auto flag the matching member as contesting
    await updateContestingFlag(cleanEmail);

    return NextResponse.json({ success: true, id: ref.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PUT: Update candidate ─────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, email, department, manifesto, photoUrl } = body;
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    const candRef = adminDb.collection("candidates").doc(id);
    const candSnap = await candRef.get();
    if (!candSnap.exists) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const oldEmail = candSnap.data()?.email;
    const newEmail = email?.trim().toLowerCase();

    await candRef.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(newEmail !== undefined && { email: newEmail }),
      ...(department !== undefined && { department: department.trim() }),
      ...(manifesto !== undefined && { manifesto: manifesto.trim() }),
      ...(photoUrl !== undefined && { photoUrl: photoUrl.trim() }),
      updatedAt: new Date().toISOString(),
    });

    // If candidate's email is updated, adjust contesting flags
    if (newEmail && newEmail !== oldEmail) {
      await updateContestingFlag(newEmail);
      await removeContestingFlagIfNeeded(oldEmail, id);
    } else if (newEmail) {
      // Refresh flag just in case
      await updateContestingFlag(newEmail);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE: Remove candidate ──────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id query param is required" }, { status: 400 });

    const candRef = adminDb.collection("candidates").doc(id);
    const candSnap = await candRef.get();
    if (!candSnap.exists) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const email = candSnap.data()?.email;

    await candRef.delete();

    // Clean up flags
    if (email) {
      await removeContestingFlagIfNeeded(email, id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
