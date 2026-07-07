// app/api/election/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getSecondaryDb } from "@/lib/firebase-admin-secondary";
import { isQuotaError } from "@/lib/firebase-fallback";
import { DEPARTMENTS } from "@/lib/election-types";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const token = authHeader.substring(7);

  let decodedToken: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (authErr: any) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }

  const uid = decodedToken.uid;
  const { selections } = await req.json();

  if (!selections || typeof selections !== "object") {
    return NextResponse.json({ error: "Invalid selections structure" }, { status: 400 });
  }

  for (const dept of DEPARTMENTS) {
    if (!selections[dept] || !selections[dept].id) {
      return NextResponse.json({ error: `Missing selection for department: ${dept}` }, { status: 400 });
    }
  }

  // ── Try PRIMARY Firebase transaction ──────────────────────────────────────
  try {
    const memberRef = adminDb.collection("council_members").doc(uid);
    const statusRef = adminDb.collection("election_status").doc("status");
    const candidatesColl = adminDb.collection("candidates");

    await adminDb.runTransaction(async (transaction) => {
      const memberSnap = await transaction.get(memberRef);
      if (!memberSnap.exists) throw new Error("Voter profile not found in database.");

      const memberData = memberSnap.data();
      if (memberData?.hasVoted) throw new Error("You have already submitted a ballot. Double voting is prohibited.");

      const statusSnap = await transaction.get(statusRef);
      const isElectionOver = statusSnap.exists ? (statusSnap.data()?.isElectionOver ?? false) : false;
      if (isElectionOver) throw new Error("The election is officially closed. Ballot submissions are no longer accepted.");

      const candidatesSnap = await transaction.get(candidatesColl);
      const candidateMap = new Map<string, any>();
      candidatesSnap.docs.forEach((doc) => candidateMap.set(doc.id, doc.data()));

      const votesToWrite: any[] = [];
      for (const dept of DEPARTMENTS) {
        const selection = selections[dept];
        if (selection.id === "__none__") {
          votesToWrite.push({
            voterUid: uid,
            voterDepartment: memberData?.department || "Technical Team",
            candidateId: "__none__",
            candidateDepartment: dept,
            timestamp: FieldValue.serverTimestamp(),
          });
        } else {
          const candidateData = candidateMap.get(selection.id);
          if (!candidateData) throw new Error(`Candidate with ID ${selection.id} does not exist.`);
          if (candidateData.department !== dept) {
            throw new Error(`Candidate ${candidateData.name} is registered under ${candidateData.department}, but submitted under ${dept}.`);
          }
          votesToWrite.push({
            voterUid: uid,
            voterDepartment: memberData?.department || "Technical Team",
            candidateId: selection.id,
            candidateDepartment: dept,
            timestamp: FieldValue.serverTimestamp(),
          });
        }
      }

      votesToWrite.forEach((vote) => {
        transaction.set(adminDb.collection("votes").doc(), vote);
      });

      transaction.update(memberRef, {
        hasVoted: true,
        currentDepartmentIndex: DEPARTMENTS.length,
        tempSelections: FieldValue.delete(),
      });
    });

    return NextResponse.json({ success: true, overflow: false });

  } catch (primaryErr: any) {
    if (!isQuotaError(primaryErr)) {
      // Not a quota error — return the real error to the voter
      console.error("[vote API] Transaction error:", primaryErr.message);
      return NextResponse.json(
        { error: primaryErr.message || "Failed to securely record ballot." },
        { status: 400 }
      );
    }

    // ── PRIMARY QUOTA EXCEEDED — fall back to secondary Firebase ──────────
    console.warn("[vote API] Primary quota exceeded — writing vote to secondary Firebase");
    try {
      const secondaryDb = getSecondaryDb();

      // Verify voter in secondary DB
      const memberSnap = await secondaryDb.collection("council_members").doc(uid).get();
      if (!memberSnap.exists) {
        return NextResponse.json(
          { error: "System is temporarily busy. Secondary DB does not have your voter profile. Please contact the admin." },
          { status: 503 }
        );
      }

      const memberData = memberSnap.data();
      if (memberData?.hasVoted) {
        return NextResponse.json({ error: "You have already submitted a ballot. Double voting is prohibited." }, { status: 400 });
      }

      // Verify election is still open in secondary
      const statusSnap = await secondaryDb.collection("election_status").doc("status").get();
      const isElectionOver = statusSnap.exists ? (statusSnap.data()?.isElectionOver ?? false) : false;
      if (isElectionOver) {
        return NextResponse.json({ error: "The election is officially closed." }, { status: 400 });
      }

      // Verify candidates in secondary
      const candidatesSnap = await secondaryDb.collection("candidates").get();
      const candidateMap = new Map<string, any>();
      candidatesSnap.docs.forEach((doc) => candidateMap.set(doc.id, doc.data()));

      const batch = secondaryDb.batch();

      for (const dept of DEPARTMENTS) {
        const selection = selections[dept];
        if (selection.id !== "__none__") {
          const candidateData = candidateMap.get(selection.id);
          if (!candidateData) {
            return NextResponse.json({ error: `Candidate with ID ${selection.id} does not exist.` }, { status: 400 });
          }
          if (candidateData.department !== dept) {
            return NextResponse.json({ error: `Candidate ${candidateData.name} is registered under ${candidateData.department}, not ${dept}.` }, { status: 400 });
          }
        }

        // Write to secondary with overflow markers for later sync
        const voteRef = secondaryDb.collection("votes").doc();
        batch.set(voteRef, {
          voterUid: uid,
          voterDepartment: memberData?.department || "Technical Team",
          candidateId: selection.id,
          candidateDepartment: dept,
          timestamp: FieldValue.serverTimestamp(),
          overflow: true,   // Marks this as overflow — needs sync to primary
          synced: false,
        });
      }

      // Mark voter as voted in secondary DB
      batch.update(secondaryDb.collection("council_members").doc(uid), {
        hasVoted: true,
        currentDepartmentIndex: DEPARTMENTS.length,
        tempSelections: FieldValue.delete(),
      });

      await batch.commit();

      console.log(`[vote API] Vote stored in secondary Firebase for voter ${uid}`);

      return NextResponse.json({
        success: true,
        overflow: true,
        message: "Your ballot was recorded in the backup system. It will be transferred to the main database automatically.",
      });
    } catch (secondaryErr: any) {
      console.error("[vote API] Secondary Firebase error:", secondaryErr.message);
      return NextResponse.json(
        { error: "Both databases are currently unavailable. Please try again in a few minutes." },
        { status: 503 }
      );
    }
  }
}
