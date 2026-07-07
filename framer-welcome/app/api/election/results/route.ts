// app/api/election/results/route.ts
// Protected: requires NextAuth admin session.
// GET  — Fetches all votes, applies weighted scoring, and returns results + audits.
// POST — Updates isResultsPublished and resultsOverrides in status document.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminDb } from "@/lib/firebase-admin";
import type {
  CouncilMember,
  Candidate,
  Vote,
  CandidateResult,
  DepartmentResult,
  ElectionResults,
  VoteAudit,
} from "@/lib/election-types";
import { DEPARTMENTS } from "@/lib/election-types";

// ---------------------------------------------------------------------------
// Weighted Voting Logic
// ---------------------------------------------------------------------------
function calculateWeight(
  voter: CouncilMember,
  candidateDepartment: string
): number {
  const sameDept = voter.department === candidateDepartment;
  const voterIsContestingHOD = voter.isPreviousHOD && voter.isContestingAgain;

  if (voterIsContestingHOD) {
    // Special rule: outgoing HOD who is contesting again gets reduced weight
    return sameDept ? 2 : 1;
  }

  if (voter.isPreviousHOD) {
    // Regular previous HOD — +5 for own dept, +3 for different dept
    return sameDept ? 5 : 3;
  }

  // Regular council member — +2 for own dept, +1 for different dept
  return sameDept ? 2 : 1;
}

// ---------------------------------------------------------------------------
// In-memory cache — works on both Vercel serverless (per-instance) and local dev
// Vercel warm instances reuse the cache; cold starts re-fetch once.
// 5 minutes TTL reduces reads by ~90% in production.
// ---------------------------------------------------------------------------
interface ResultsCache {
  data: ElectionResults;
  fetchedAt: number;
}
let resultsCache: ResultsCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid() {
  return !!resultsCache && Date.now() - resultsCache.fetchedAt < CACHE_TTL_MS;
}

export function invalidateResultsCache() {
  resultsCache = null;
}

// ---------------------------------------------------------------------------
// GET: Fetch results
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest) {
  try {
    // ── 1. Auth check FIRST — before spending any Firestore reads ──────────
    const session = await getServerSession();
    const isAdmin = !!session;

    // Serve from cache immediately for admins if available
    if (isAdmin && isCacheValid()) {
      return NextResponse.json(resultsCache!.data);
    }

    // ── 2. Read election status (1 read) ───────────────────────────────────
    const statusSnap = await adminDb.collection("election_status").doc("status").get();
    const statusData = statusSnap.exists ? statusSnap.data() : {};
    const isElectionOver = statusData?.isElectionOver ?? false;
    const isResultsPublished = statusData?.isResultsPublished ?? false;
    const resultsOverrides = statusData?.resultsOverrides ?? {};

    const canAccess = isAdmin || (isElectionOver && isResultsPublished);
    if (!canAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin && !isElectionOver) {
      return NextResponse.json(
        { error: "Results are not available yet. Election is still ongoing." },
        { status: 403 }
      );
    }

    // Non-admin voters: also serve from cache if warm
    if (!isAdmin && isCacheValid()) {
      return NextResponse.json(resultsCache!.data);
    }

    // ── 3. Read the 3 collections (most expensive step) ────────────────────
    const [votesSnap, membersSnap, candidatesSnap] = await Promise.all([
      adminDb.collection("votes").get(),
      adminDb.collection("council_members").get(),
      adminDb.collection("candidates").get(),
    ]);

    // Build lookup maps
    const voterMap = new Map<string, CouncilMember>();
    membersSnap.forEach((doc) => {
      voterMap.set(doc.id, { uid: doc.id, ...(doc.data() as Omit<CouncilMember, "uid">) });
    });

    const candidateMap = new Map<string, Candidate>();
    candidatesSnap.forEach((doc) => {
      candidateMap.set(doc.id, { id: doc.id, ...(doc.data() as Omit<Candidate, "id">) });
    });

    // Count unique voters who actually cast a ballot
    const uniqueVoters = new Set<string>();
    votesSnap.forEach((doc) => {
      const vote = doc.data() as Vote;
      if (vote.voterUid) uniqueVoters.add(vote.voterUid);
    });
    const totalVotesCast = uniqueVoters.size;

    // Accumulate scores per candidate
    const scoreMap = new Map<
      string,
      { score: number; sameHODVotes: number; otherHODVotes: number; sameDeptVotes: number; otherDeptVotes: number; }
    >();
    candidateMap.forEach((_, id) => {
      scoreMap.set(id, { score: 0, sameHODVotes: 0, otherHODVotes: 0, sameDeptVotes: 0, otherDeptVotes: 0 });
    });

    const voterAudits: VoteAudit[] = [];

    votesSnap.forEach((doc) => {
      const vote = doc.data() as Vote;
      const voter = voterMap.get(vote.voterUid);
      const candidate = candidateMap.get(vote.candidateId);

      let candidateName = "";
      if (vote.candidateId === "__none__") {
        candidateName = "Nominee Unopposed";
      } else if (candidate) {
        candidateName = candidate.name;
      }

      if (!voter) return;

      let weight = 0;
      if (candidate) weight = calculateWeight(voter, candidate.department);

      voterAudits.push({
        id: doc.id,
        voterName: voter.name,
        voterEmail: voter.email,
        voterDepartment: voter.department,
        candidateName: candidateName || "Nominee Unopposed",
        candidateDepartment: vote.candidateDepartment,
        weight,
      });

      if (!candidate) return;

      const entry = scoreMap.get(vote.candidateId) ?? { score: 0, sameHODVotes: 0, otherHODVotes: 0, sameDeptVotes: 0, otherDeptVotes: 0 };
      entry.score += weight;

      const sameDept = voter.department === candidate.department;
      const contesting = voter.isPreviousHOD && voter.isContestingAgain;

      if (!contesting && voter.isPreviousHOD && sameDept) entry.sameHODVotes++;
      else if (!contesting && voter.isPreviousHOD && !sameDept) entry.otherHODVotes++;
      else if (sameDept) entry.sameDeptVotes++;
      else entry.otherDeptVotes++;

      scoreMap.set(vote.candidateId, entry);
    });

    // Build per-department results
    const departmentResults: DepartmentResult[] = DEPARTMENTS.map((dept) => {
      const deptCandidates: CandidateResult[] = [];

      candidateMap.forEach((candidate, id) => {
        if (candidate.department !== dept) return;
        const s = scoreMap.get(id)!;
        deptCandidates.push({
          candidateId: id,
          name: candidate.name,
          department: candidate.department,
          score: s.score,
          voteBreakdown: {
            sameHODVotes: s.sameHODVotes,
            otherHODVotes: s.otherHODVotes,
            sameDeptVotes: s.sameDeptVotes,
            otherDeptVotes: s.otherDeptVotes,
          },
          photoUrl: candidate.photoUrl ?? "",
        });
      });

      deptCandidates.sort((a, b) => b.score - a.score);

      let winner: CandidateResult | null = null;
      const overrideId = resultsOverrides[dept];

      if (overrideId) {
        const matched = deptCandidates.find((c) => c.candidateId === overrideId);
        if (matched) {
          winner = matched;
        } else if (overrideId === "__none__") {
          winner = {
            candidateId: "__none__",
            name: "Nominee Unopposed",
            department: dept,
            score: 0,
            voteBreakdown: { sameHODVotes: 0, otherHODVotes: 0, sameDeptVotes: 0, otherDeptVotes: 0 },
          };
        }
      }

      if (!winner && deptCandidates.length > 0) winner = deptCandidates[0];

      return { department: dept, winner, candidates: deptCandidates };
    });

    const results: ElectionResults = {
      isElectionOver,
      totalVoters: voterMap.size,
      totalVotesCast,
      departments: departmentResults,
      voterAudits,
      isResultsPublished,
      resultsOverrides,
    };

    // Store in cache
    resultsCache = { data: results, fetchedAt: Date.now() };

    return NextResponse.json(results);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("[results GET] Error:", msg);

    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded")) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          message: "Firestore daily read quota exceeded. Results will be available after midnight Pacific Time (quota resets daily). Other tabs still work because they read smaller collections.",
          details: msg,
        },
        { status: 429 }
      );
    }
    if (msg.includes("PERMISSION_DENIED")) {
      return NextResponse.json({ error: "permission_denied", message: "Service account lacks Firestore read permission." }, { status: 403 });
    }
    if (msg.includes("UNAVAILABLE") || msg.includes("ECONNRESET")) {
      return NextResponse.json({ error: "service_unavailable", message: "Firebase temporarily unreachable. Try again in a few seconds." }, { status: 503 });
    }

    return NextResponse.json({ error: "internal_error", message: msg }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST: Update results publishing & overrides
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { isResultsPublished, resultsOverrides } = body;

    const statusRef = adminDb.collection("election_status").doc("status");
    
    await statusRef.set({
      ...(isResultsPublished !== undefined && { isResultsPublished }),
      ...(resultsOverrides !== undefined && { resultsOverrides })
    }, { merge: true });

    // Invalidate cache so next GET fetches fresh data
    invalidateResultsCache();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[results POST] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
