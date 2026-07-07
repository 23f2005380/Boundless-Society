// app/api/election/seed-secondary/route.ts
// Admin-only: copies council_members, candidates, election_status from
// primary Firebase to secondary (boundless-recovery) so it can serve
// voters during quota overflow periods.

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getSecondaryDb } from "@/lib/firebase-admin-secondary";

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
    const { voters, candidates, electionStatus } = await req.json();
    const secondaryDb = getSecondaryDb();

    let membersSeeded = 0;
    let candidatesSeeded = 0;

    // Case A: Client sent the cached data (useful when primary quota is exceeded!)
    if (Array.isArray(voters) && Array.isArray(candidates)) {
      console.log(`[seed-secondary] Seeding using client-provided cache data. Voters: ${voters.length}, Candidates: ${candidates.length}`);

      // Seed voters in batches of 400
      let batch = secondaryDb.batch();
      let count = 0;
      for (const voter of voters) {
        const { uid, id, ...voterData } = voter;
        const docId = uid || id;
        if (!docId) continue;

        batch.set(secondaryDb.collection("council_members").doc(docId), voterData);
        count++;
        membersSeeded++;

        if (count >= 400) {
          await batch.commit();
          batch = secondaryDb.batch();
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }

      // Seed candidates
      let candBatch = secondaryDb.batch();
      let candCount = 0;
      for (const candidate of candidates) {
        const { id, uid, ...candData } = candidate;
        const docId = id || uid;
        if (!docId) continue;

        candBatch.set(secondaryDb.collection("candidates").doc(docId), candData);
        candCount++;
        candidatesSeeded++;

        if (candCount >= 400) {
          await candBatch.commit();
          candBatch = secondaryDb.batch();
          candCount = 0;
        }
      }
      if (candCount > 0) {
        await candBatch.commit();
      }

      // Seed status
      await secondaryDb
        .collection("election_status")
        .doc("status")
        .set({
          isElectionOver: electionStatus?.isElectionOver ?? false,
          isResultsPublished: electionStatus?.isResultsPublished ?? false,
        }, { merge: true });

    } else {
      // Case B: Read from primary database directly (fallback)
      console.log("[seed-secondary] Reading from primary database to seed...");
      const [membersSnap, candidatesSnap, statusSnap] = await Promise.all([
        adminDb.collection("council_members").get(),
        adminDb.collection("candidates").get(),
        adminDb.collection("election_status").doc("status").get(),
      ]);

      // Write council_members to secondary in batches of 400
      let batch = secondaryDb.batch();
      let count = 0;
      for (const doc of membersSnap.docs) {
        batch.set(
          secondaryDb.collection("council_members").doc(doc.id),
          doc.data()
        );
        count++;
        membersSeeded++;
        if (count >= 400) {
          await batch.commit();
          batch = secondaryDb.batch();
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }

      // Write candidates to secondary
      let candidateBatch = secondaryDb.batch();
      let candCount = 0;
      for (const doc of candidatesSnap.docs) {
        candidateBatch.set(
          secondaryDb.collection("candidates").doc(doc.id),
          doc.data()
        );
        candCount++;
        candidatesSeeded++;
        if (candCount >= 400) {
          await candidateBatch.commit();
          candidateBatch = secondaryDb.batch();
          candCount = 0;
        }
      }
      if (candCount > 0) {
        await candidateBatch.commit();
      }

      // Write election_status to secondary
      if (statusSnap.exists) {
        await secondaryDb
          .collection("election_status")
          .doc("status")
          .set(statusSnap.data()!);
      }
    }

    console.log(`[seed-secondary] Successfully seeded ${membersSeeded} members, ${candidatesSeeded} candidates`);

    return NextResponse.json({
      success: true,
      membersSeeded,
      candidatesSeeded,
      message: `Secondary Firebase seeded successfully. ${membersSeeded} voters and ${candidatesSeeded} candidates copied.`,
    });
  } catch (err: any) {
    console.error("[seed-secondary] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
      membersInSecondary: 0,
      pendingOverflowVotes: 0,
      isSeeded: false
    });
  }

  try {
    const secondaryDb = getSecondaryDb();
    const [membersSnap, votedSnap, overflowSnap] = await Promise.all([
      secondaryDb.collection("council_members").select().get(),
      secondaryDb.collection("council_members").where("hasVoted", "==", true).get(),
      secondaryDb.collection("votes").where("overflow", "==", true).where("synced", "==", false).get(),
    ]);

    return NextResponse.json({
      membersInSecondary: membersSnap.size,
      votedUidsInSecondary: votedSnap.docs.map((doc) => doc.id),
      pendingOverflowVotes: overflowSnap.size,
      isSeeded: membersSnap.size > 0,
      isConfigured: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
