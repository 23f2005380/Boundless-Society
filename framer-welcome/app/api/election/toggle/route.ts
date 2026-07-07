// app/api/election/toggle/route.ts
// Toggles the isElectionOver boolean in Firestore.
// Supports automatic fallback to the secondary database when primary quota is exceeded,
// and keeps both databases in sync.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminDb } from "@/lib/firebase-admin";
import { getSecondaryDb } from "@/lib/firebase-admin-secondary";
import { isQuotaError } from "@/lib/firebase-fallback";

export async function POST(_req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let nextState = false;
  let useSecondary = false;

  try {
    // 1. Try modifying primary Firestore
    const statusRef = adminDb.collection("election_status").doc("status");
    const snap = await statusRef.get();

    const current: boolean = snap.exists ? (snap.data()?.isElectionOver ?? false) : false;
    nextState = !current;

    await statusRef.set({ isElectionOver: nextState }, { merge: true });
    console.log(`[toggle] Primary database election status toggled to: isElectionOver = ${nextState}`);

  } catch (err: any) {
    if (!isQuotaError(err)) {
      console.error("[toggle] Primary database error:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // Primary database is exhausted — fall back to secondary
    console.warn("[toggle] Primary quota exceeded — toggling status in secondary database");
    useSecondary = true;
  }

  try {
    const isSecondaryConfigured = !!process.env.FIREBASE_SECONDARY_PROJECT_ID;

    if (useSecondary) {
      if (!isSecondaryConfigured) {
        return NextResponse.json(
          { error: "Primary quota is exceeded and secondary database is not configured. Cannot toggle election status." },
          { status: 503 }
        );
      }

      const secondaryDb = getSecondaryDb();
      const statusRef = secondaryDb.collection("election_status").doc("status");
      const snap = await statusRef.get();

      const current: boolean = snap.exists ? (snap.data()?.isElectionOver ?? false) : false;
      nextState = !current;

      await statusRef.set({ isElectionOver: nextState }, { merge: true });
      console.log(`[toggle] Secondary database election status toggled to: isElectionOver = ${nextState}`);
    } else {
      // Primary write succeeded: also replicate to secondary database if configured
      if (isSecondaryConfigured) {
        const secondaryDb = getSecondaryDb();
        await secondaryDb
          .collection("election_status")
          .doc("status")
          .set({ isElectionOver: nextState }, { merge: true });
        console.log(`[toggle] Replicated election status to secondary database: isElectionOver = ${nextState}`);
      }
    }

    const message = nextState
      ? `Election has been closed.${useSecondary ? " (Saved to backup database due to primary quota limits)" : ""} Results are now available.`
      : `Election has been reopened.${useSecondary ? " (Saved to backup database due to primary quota limits)" : ""} Existing votes are preserved.`;

    return NextResponse.json({
      success: true,
      isElectionOver: nextState,
      isReopening: !nextState,
      message,
    });

  } catch (err: any) {
    console.error("[toggle] Secondary database error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
