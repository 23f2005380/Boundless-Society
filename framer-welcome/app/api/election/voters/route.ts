// app/api/election/voters/route.ts
// Admin API for voter management (CRUD operations)
// POST   — Create/add a voter
// PUT    — Update an existing voter
// DELETE — Delete a voter

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function isAdminRequest(req: NextRequest) {
  const session = await getServerSession();
  return !!session;
}

// ── POST: Create/Add voter ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, department, isPreviousHOD, isContestingAgain, hasVoted } = body;

    if (!name || !email || !department) {
      return NextResponse.json({ error: "name, email, and department are required" }, { status: 400 });
    }

    const emailTrim = email.trim().toLowerCase();
    const defaultPassword = "Voter@boundless2024";

    let userRecord;
    try {
      // Check if user already exists in Firebase Auth
      userRecord = await adminAuth.getUserByEmail(emailTrim);
    } catch (authErr: any) {
      if (authErr.code === "auth/user-not-found") {
        // Create in Firebase Auth
        userRecord = await adminAuth.createUser({
          email: emailTrim,
          password: defaultPassword,
          displayName: name.trim(),
        });
      } else {
        throw authErr;
      }
    }

    // Set in Firestore
    const memberRef = adminDb.collection("council_members").doc(userRecord.uid);
    await memberRef.set({
      email: emailTrim,
      name: name.trim(),
      department: department.trim(),
      isPreviousHOD: !!isPreviousHOD,
      isContestingAgain: !!isContestingAgain,
      hasVoted: !!hasVoted,
    }, { merge: true });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (err: any) {
    console.error("[voters POST] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PUT: Update voter ────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { uid, name, email, department, isPreviousHOD, isContestingAgain, hasVoted } = body;

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    const memberRef = adminDb.collection("council_members").doc(uid);
    const snap = await memberRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Voter not found in database" }, { status: 404 });
    }

    const currentData = snap.data();
    const oldEmail = currentData?.email;
    const newEmail = email?.trim().toLowerCase();

    // If email is changing, update it in Firebase Auth first
    if (newEmail && newEmail !== oldEmail) {
      try {
        await adminAuth.updateUser(uid, {
          email: newEmail,
          ...(name && { displayName: name.trim() }),
        });
      } catch (authErr: any) {
        console.error("[voters PUT] Auth update error:", authErr);
        return NextResponse.json({ error: `Auth Error: ${authErr.message}` }, { status: 400 });
      }
    } else if (name) {
      // Just update displayName in Auth if name changed
      try {
        await adminAuth.updateUser(uid, {
          displayName: name.trim(),
        });
      } catch (authErr) {
        console.warn("[voters PUT] Auth displayName update failed:", authErr);
      }
    }

    // Update in Firestore
    await memberRef.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(newEmail !== undefined && { email: newEmail }),
      ...(department !== undefined && { department: department.trim() }),
      ...(isPreviousHOD !== undefined && { isPreviousHOD: !!isPreviousHOD }),
      ...(isContestingAgain !== undefined && { isContestingAgain: !!isContestingAgain }),
      ...(hasVoted !== undefined && { hasVoted: !!hasVoted }),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[voters PUT] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE: Delete voter ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "uid query param is required" }, { status: 400 });
    }

    // Delete from Firestore
    await adminDb.collection("council_members").doc(uid).delete();

    // Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (authErr: any) {
      // If user wasn't in auth, log but don't fail
      console.warn("[voters DELETE] Auth user delete warning:", authErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[voters DELETE] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
