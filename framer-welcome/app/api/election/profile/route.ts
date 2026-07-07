// app/api/election/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getSecondaryDb } from "@/lib/firebase-admin-secondary";
import { isQuotaError } from "@/lib/firebase-fallback";

async function getMemberData(db: FirebaseFirestore.Firestore, uid: string, email: string) {
  const memberRef = db.collection("council_members").doc(uid);
  let memberSnap = await memberRef.get();
  let memberData = memberSnap.exists ? memberSnap.data() : null;

  if (!memberData && email) {
    const q = await db
      .collection("council_members")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!q.empty) {
      const oldDoc = q.docs[0];
      const oldUid = oldDoc.id;
      const oldData = oldDoc.data();

      // Migrate to new Google UID
      const batch = db.batch();
      batch.set(db.collection("council_members").doc(uid), oldData);
      batch.delete(db.collection("council_members").doc(oldUid));
      await batch.commit();

      memberData = oldData;
      console.log(`[getMemberData] Migrated voter ${email} from UID ${oldUid} to ${uid}`);
    }
  }

  return memberData ?? null;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const token = authHeader.substring(7);

  // Step 1: Verify Firebase ID token — auth only, no Firestore reads
  let decodedToken: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (authErr: any) {
    console.error("[profile API] Token verification failed:", authErr.message);
    return NextResponse.json({ error: "Invalid or expired token. Please sign in again." }, { status: 401 });
  }

  const uid = decodedToken.uid;
  const email = decodedToken.email?.toLowerCase().trim() || "";
  let usedOverflow = false;

  // Step 2: Read from Firestore — with overflow fallback
  try {
    let memberData: any = null;
    let isElectionOver = false;
    let isResultsPublished = false;

    // Try primary Firebase first
    try {
      memberData = await getMemberData(adminDb, uid, email);

      const statusSnap = await adminDb.collection("election_status").doc("status").get();
      const statusData = statusSnap.exists ? statusSnap.data() : {};
      isElectionOver = statusData?.isElectionOver ?? false;
      isResultsPublished = statusData?.isResultsPublished ?? false;

    } catch (primaryErr: any) {
      if (!isQuotaError(primaryErr)) throw primaryErr;

      // Primary quota exceeded — fall back to secondary Firebase
      console.warn("[profile API] Primary quota exceeded, switching to secondary Firebase");
      usedOverflow = true;

      const secondaryDb = getSecondaryDb();
      memberData = await getMemberData(secondaryDb, uid, email);

      const statusSnap = await secondaryDb.collection("election_status").doc("status").get();
      const statusData = statusSnap.exists ? statusSnap.data() : {};
      isElectionOver = statusData?.isElectionOver ?? false;
      isResultsPublished = statusData?.isResultsPublished ?? false;
    }

    if (!memberData) {
      return NextResponse.json({ whitelisted: false }, { status: 200 });
    }

    return NextResponse.json({
      whitelisted: true,
      overflow: usedOverflow,
      member: {
        uid,
        email: memberData.email,
        name: memberData.name,
        department: memberData.department,
        isPreviousHOD: memberData.isPreviousHOD ?? false,
        isContestingAgain: memberData.isContestingAgain ?? false,
        hasVoted: memberData.hasVoted ?? false,
        currentDepartmentIndex: memberData.currentDepartmentIndex ?? 0,
        tempSelections: memberData.tempSelections ?? {},
      },
      isElectionOver,
      isResultsPublished,
    });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("[profile API] Firestore error:", msg);

    if (isQuotaError(err)) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          message: "The voting system is temporarily unavailable — both databases are at capacity. Please try again in a few minutes.",
        },
        { status: 429 }
      );
    }

    if (msg.includes("UNAVAILABLE") || msg.includes("ECONNRESET")) {
      return NextResponse.json(
        { error: "service_unavailable", message: "Firebase is temporarily unreachable. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "server_error", message: "An unexpected error occurred." }, { status: 500 });
  }
}
