// app/api/election/sync-overflow/route.ts
// Transfers overflow votes from secondary Firebase (boundless-recovery)
// back to the primary Firebase (boundless-785f1) after quota resets.

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getSecondaryDb } from "@/lib/firebase-admin-secondary";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const token = authHeader.substring(7);
  try {
    await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.FIREBASE_SECONDARY_PROJECT_ID) {
    return NextResponse.json({
      isConfigured: false,
      pendingVotes: 0,
      pendingVoters: 0
    });
  }

  try {
    const secondaryDb = getSecondaryDb();
    const overflowSnap = await secondaryDb
      .collection("votes")
      .where("overflow", "==", true)
      .where("synced", "==", false)
      .get();

    return NextResponse.json({
      pendingVotes: overflowSnap.size,
      // Group by unique voters for display
      pendingVoters: [...new Set(overflowSnap.docs.map((d) => d.data().voterUid))].length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const token = authHeader.substring(7);
  try {
    await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.FIREBASE_SECONDARY_PROJECT_ID) {
    return NextResponse.json(
      { error: "Secondary database credentials are not configured in environment variables." },
      { status: 400 }
    );
  }

  try {
    const secondaryDb = getSecondaryDb();

    // 1. Read all unsynced overflow votes from secondary
    const overflowSnap = await secondaryDb
      .collection("votes")
      .where("overflow", "==", true)
      .where("synced", "==", false)
      .get();

    if (overflowSnap.empty) {
      return NextResponse.json({ success: true, synced: 0, message: "No overflow votes to sync." });
    }

    console.log(`[sync-overflow] Found ${overflowSnap.size} overflow votes to sync`);

    // 2. Collect votes and unique voter UIDs
    const votes = overflowSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() as any }));
    const uniqueVoterUids = [...new Set(votes.map((v) => v.voterUid))] as string[];

    // 3 & 4. Write votes and update voters in primary Firebase in batches of 400
    let primaryBatch = adminDb.batch();
    let opCount = 0;

    for (const vote of votes) {
      const { id, overflow, synced, ...voteData } = vote;
      const newVoteRef = adminDb.collection("votes").doc();
      primaryBatch.set(newVoteRef, {
        ...voteData,
        timestamp: FieldValue.serverTimestamp(),
      });
      opCount++;

      if (opCount >= 400) {
        await primaryBatch.commit();
        primaryBatch = adminDb.batch();
        opCount = 0;
      }
    }

    for (const uid of uniqueVoterUids) {
      primaryBatch.update(adminDb.collection("council_members").doc(uid), {
        hasVoted: true,
        currentDepartmentIndex: 7, // DEPARTMENTS.length
      });
      opCount++;

      if (opCount >= 400) {
        await primaryBatch.commit();
        primaryBatch = adminDb.batch();
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await primaryBatch.commit();
    }
    console.log(`[sync-overflow] Wrote ${votes.length} votes + updated ${uniqueVoterUids.length} voters in primary`);

    // 5 & 6. Mark secondary overflow votes as synced and update secondary council_members hasVoted in batches
    let secondaryBatch = secondaryDb.batch();
    let secOpCount = 0;

    for (const doc of overflowSnap.docs) {
      secondaryBatch.update(doc.ref, { synced: true, syncedAt: FieldValue.serverTimestamp() });
      secOpCount++;

      if (secOpCount >= 400) {
        await secondaryBatch.commit();
        secondaryBatch = secondaryDb.batch();
        secOpCount = 0;
      }
    }

    for (const uid of uniqueVoterUids) {
      secondaryBatch.update(secondaryDb.collection("council_members").doc(uid), {
        hasVoted: true,
        currentDepartmentIndex: 7,
      });
      secOpCount++;

      if (secOpCount >= 400) {
        await secondaryBatch.commit();
        secondaryBatch = secondaryDb.batch();
        secOpCount = 0;
      }
    }

    if (secOpCount > 0) {
      await secondaryBatch.commit();
    }

    return NextResponse.json({
      success: true,
      synced: votes.length,
      votersSynced: uniqueVoterUids.length,
      message: `✅ Synced ${votes.length} votes from ${uniqueVoterUids.length} voters to primary Firebase.`,
    });
  } catch (err: any) {
    console.error("[sync-overflow] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
