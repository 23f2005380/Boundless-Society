// app/api/election/wipe-votes/route.ts
// Admin-only API to delete all cast votes, reset hasVoted, currentDepartmentIndex, tempSelections on all council members, and clear overrides.
// Now fully supports resetting both primary and secondary databases to prevent old election data leak.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminDb } from "@/lib/firebase-admin";
import { getSecondaryDb } from "@/lib/firebase-admin-secondary";

async function deleteCollection(db: FirebaseFirestore.Firestore, collectionPath: string) {
  const ref = db.collection(collectionPath);
  let totalDeleted = 0;

  while (true) {
    const snap = await ref.limit(400).get();
    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    totalDeleted += snap.size;
  }

  return totalDeleted;
}

async function resetHasVoted(db: FirebaseFirestore.Firestore) {
  const snap = await db.collection("council_members").get();
  if (snap.empty) return 0;

  // Batch updates in groups of 400
  let count = 0;
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + 400);
    chunk.forEach((doc) => {
      batch.update(doc.ref, {
        hasVoted: false,
        currentDepartmentIndex: 0,
        tempSelections: {}
      });
    });
    await batch.commit();
    count += chunk.length;
  }

  return count;
}

export async function POST(_req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Wipe and Reset Primary Database
    const [votesDeleted, membersReset] = await Promise.all([
      deleteCollection(adminDb, "votes"),
      resetHasVoted(adminDb),
    ]);

    // Clear overrides and published status in primary election_status
    const statusRef = adminDb.collection("election_status").doc("status");
    await statusRef.set({
      isResultsPublished: false,
      resultsOverrides: {}
    }, { merge: true });

    let secondaryVotesDeleted = 0;
    let secondaryMembersReset = 0;

    // 2. Wipe and Reset Secondary Database (if configured)
    if (process.env.FIREBASE_SECONDARY_PROJECT_ID) {
      console.log("[wipe-votes] Resetting secondary database...");
      const secondaryDb = getSecondaryDb();
      
      const [secVotesDel, secMembersRes] = await Promise.all([
        deleteCollection(secondaryDb, "votes"),
        resetHasVoted(secondaryDb),
      ]);

      secondaryVotesDeleted = secVotesDel;
      secondaryMembersReset = secMembersRes;

      const secStatusRef = secondaryDb.collection("election_status").doc("status");
      await secStatusRef.set({
        isResultsPublished: false,
        resultsOverrides: {}
      }, { merge: true });
    }

    return NextResponse.json({
      success: true,
      votesDeleted,
      membersReset,
      secondaryVotesDeleted,
      secondaryMembersReset,
      message: `Database wiped successfully. Primary: ${votesDeleted} votes deleted, ${membersReset} members reset. Secondary: ${secondaryVotesDeleted} votes deleted, ${secondaryMembersReset} members reset.`,
    });
  } catch (err: any) {
    console.error("[wipe-votes] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
