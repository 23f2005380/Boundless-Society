"use client";

// app/(vote)/vote/page.tsx
// Standalone HOD Election Voting Portal with Custom Premium Theme
// Flow: Google Login → Eligibility Check → Consent (scroll-to-unlock) → 7-Dept Wizard → Submit Ballot → Success Receipt

import { useState, useEffect, useRef, useCallback } from "react";
import { signOut, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db, isFirebaseEnabled } from "@/lib/firebase";
import type { CouncilMember, Candidate } from "@/lib/election-types";
import { DEPARTMENTS } from "@/lib/election-types";
import { AlertCircle, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

// ─── Election Rules ────────────────────────────────────────────────────────────
const ELECTION_RULES = `BOUNDLESS TRAVEL SOCIETY — HEAD OF DEPARTMENT ELECTION RULES

1. ELIGIBILITY
   Each registered council member is entitled to exactly one ballot covering all 7 departments. Voting is mandatory for every department on the ballot.

2. ONE-TIME VOTE
   Once you submit your ballot, your choices are final and cannot be modified. No revisions, re-submissions, or partial submissions are accepted.

3. CONFIDENTIALITY
   Your individual vote selections are confidential and are not revealed to any other member or candidate. Aggregate weighted scores are only visible to administrators after the election has officially closed.

4. WEIGHTED VOTING
   Votes carry different point values based on the voter's history:
   • Immediate Previous HOD (same department): +5 points
   • Previous HOD of a different department: +3 points
   • Council member of the candidate's own department: +2 points
   • Council member of a different department: +1 point
   Note: If a Previous HOD is themselves contesting again, their vote weight is reduced (+2 same dept / +1 other dept).

5. MANDATORY SELECTION
   You must select exactly one candidate per department. You may not skip any department or submit a partial ballot.

6. NO BACK NAVIGATION
   Once you proceed to the next department, you cannot return to change your previous selection. Review your choice carefully before advancing.

7. CONFIRMATION STEP
   A final confirmation modal will appear before submission. Read it carefully. Clicking "Submit Final Ballot" is irreversible.

8. ELECTION CLOSURE
   Voting closes when the administrator marks the election as complete. Ballots submitted after closure will be rejected by the system.

9. CODE OF CONDUCT
   Any attempt to manipulate, bypass, or exploit the voting system will result in immediate disqualification and disciplinary action.

10. RESULTS
    Results are computed by the administration using a weighted scoring algorithm and will be announced through official channels after verification.

By clicking "Proceed to Ballot" below, you confirm that you have read and agree to abide by all rules stated above.`;

// ─── CSS Theme ─────────────────────────────────────────────────────────────────
const CSS_THEME = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@500;600;700&display=swap');

  :root {
    --ink: #141A29;
    --ink-2: #232C42;
    --evm-body: #2B3653;
    --paper: #EEF1F6;
    --paper-2: #E3E8F1;
    --text-ink: #1F2733;
    --text-ink-muted: #5B6472;
    --text-light: #EAEDF4;
    --text-light-muted: #8B93A8;
    --seal: #9E2B32;
    --seal-dark: #7E2027;
    --brass: #B8935A;
    --success: #3F8F5F;
    --font-serif: 'IBM Plex Serif', Georgia, serif;
    --font-sans: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono: 'IBM Plex Mono', 'Courier New', monospace;
  }

  .vote-body {
    min-height: 100vh;
    background: radial-gradient(ellipse at 50% -10%, var(--ink-2) 0%, var(--ink) 55%, #0D111C 100%);
    font-family: var(--font-sans);
    color: var(--text-light);
    padding: 48px 20px 64px;
  }

  .app { max-width: 840px; margin: 0 auto; }

  /* Masthead */
  .masthead { text-align: center; margin-bottom: 26px; }
  .masthead-rules { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 8px; }
  .masthead-rule { width: 56px; height: 1px; background: linear-gradient(90deg, transparent, var(--brass), transparent); }
  .masthead-seal { width: 28px; height: 28px; color: var(--brass); flex-shrink: 0; }
  .masthead-eyebrow { font-family: var(--font-mono); font-size: .68rem; letter-spacing: .22em; color: var(--brass); font-weight: 500; text-transform: uppercase; }
  .masthead-title { font-family: var(--font-serif); font-size: 1.3rem; font-weight: 600; color: var(--text-light); margin-top: 3px; }

  /* Stepper */
  .stepper-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; font-family: var(--font-mono); }
  .stepper-label { font-size: .72rem; letter-spacing: .1em; color: var(--text-light-muted); text-transform: uppercase; }
  .stepper-percent { font-size: .72rem; color: var(--brass); font-weight: 600; }
  .stepper-ticks { display: flex; gap: 5px; margin-bottom: 34px; }
  .tick { flex: 1; height: 5px; background: rgba(255,255,255,0.12); border-radius: 2px; }
  .tick.filled { background: var(--brass); }
  .tick.current { background: var(--seal); }

  /* Ballot card */
  .ballot { background: var(--paper); border-radius: 10px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset; border: 1px solid rgba(0,0,0,0.06); }
  .letterhead { padding: 26px 32px 20px; border-bottom: 1px solid rgba(31,39,51,0.1); background-image: repeating-linear-gradient(115deg, rgba(31,39,51,0.025) 0px, rgba(31,39,51,0.025) 1px, transparent 1px, transparent 14px); }
  .eyebrow { font-family: var(--font-mono); font-size: .7rem; letter-spacing: .16em; color: var(--seal); font-weight: 600; text-transform: uppercase; }
  .dept-title { font-family: var(--font-serif); font-size: 1.7rem; font-weight: 700; color: var(--text-ink); margin-top: 4px; }

  .candidates-area { padding: 30px 32px 8px; }
  .candidates-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 240px)); gap: 22px; justify-content: center; align-items: start; }

  .candidate { background: #fff; border: 1px solid rgba(31,39,51,0.1); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease; }
  .candidate:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(20,26,41,0.15); }
  .candidate.disabled { opacity: .45; }
  .candidate.disabled:hover { transform: none; box-shadow: none; }
  .candidate.voted { border-color: var(--success); border-width: 2px; }

  .photo-frame { position: relative; width: 100%; aspect-ratio: 4/5; background: var(--paper-2); border-bottom: 1px solid rgba(31,39,51,0.1); }
  .photo-frame img { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(15%); }
  .candidate.disabled .photo-frame img { filter: grayscale(85%); }
  .ballot-no { position: absolute; top: 8px; left: 8px; width: 22px; height: 22px; border-radius: 50%; background: rgba(20,26,41,0.75); color: #fff; font-family: var(--font-mono); font-size: .68rem; display: flex; align-items: center; justify-content: center; font-weight: 600; }
  .voted-mark { position: absolute; bottom: 8px; right: 8px; width: 26px; height: 26px; border-radius: 50%; background: var(--success); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,.3); }
  .voted-mark svg { width: 14px; height: 14px; }

  .candidate-body { padding: 14px 14px 16px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .candidate-name { font-weight: 600; font-size: .95rem; color: var(--text-ink); text-align: center; line-height: 1.3; }
  .manifesto-btn { background: none; border: none; padding: 0; display: flex; align-items: center; justify-content: center; gap: 5px; font-size: .78rem; font-weight: 600; color: var(--seal); cursor: pointer; }
  .manifesto-btn svg { width: 13px; height: 13px; flex-shrink: 0; }
  .manifesto-btn:hover { text-decoration: underline; }

  .evm { margin-top: auto; display: flex; align-items: center; justify-content: center; gap: 9px; background: var(--evm-body); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 9px 12px; cursor: pointer; }
  .evm-light { width: 9px; height: 9px; border-radius: 50%; background: #5B6478; flex-shrink: 0; transition: background .2s, box-shadow .2s; }
  .evm:hover:not(:disabled) .evm-light { background: #8B95AB; }
  .evm.voted .evm-light { background: var(--success); box-shadow: 0 0 8px 2px rgba(63,143,95,.65); }
  .evm.locked .evm-light { background: #454E64; }
  .evm-label { font-family: var(--font-mono); font-size: .72rem; letter-spacing: .08em; color: var(--text-light); font-weight: 600; text-transform: uppercase; }
  .evm:disabled { opacity: .55; cursor: not-allowed; }
  .evm.voted { opacity: 1; cursor: default; }
  .evm:active:not(:disabled) { transform: scale(0.97); }

  .footer-note { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 18px 32px 4px; font-family: var(--font-mono); font-size: .72rem; color: var(--seal); text-align: center; }
  .footer-note svg { width: 14px; height: 14px; flex-shrink: 0; }

  .next-row { padding: 20px 32px 30px; text-align: center; }
  .btn-primary { background: var(--seal); color: #fff; border: none; padding: 12px 26px; border-radius: 6px; font-weight: 600; font-size: .9rem; cursor: pointer; transition: background .2s; }
  .btn-primary:hover { background: var(--seal-dark); }

  /* Overlays / modals */
  .overlay { position: fixed; inset: 0; background: rgba(12,15,24,0.68); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 60; opacity: 0; pointer-events: none; transition: opacity .18s ease; }
  .overlay.show { opacity: 1; pointer-events: auto; }
  .modal { background: var(--paper); border-radius: 10px; max-width: 420px; width: 100%; overflow: hidden; transform: translateY(12px) scale(.98); transition: transform .18s ease; box-shadow: 0 30px 70px rgba(0,0,0,0.5); }
  .overlay.show .modal { transform: translateY(0) scale(1); }
  .modal-top { height: 4px; background: var(--seal); }
  .modal-head { display: flex; gap: 14px; padding: 22px 22px 14px; position: relative; align-items: flex-start; }
  .modal-avatar-wrap { position: relative; flex-shrink: 0; }
  .modal-avatar { width: 56px; height: 56px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(31,39,51,.15); display: block; }
  .modal-badge { position: absolute; top: -6px; left: -6px; width: 20px; height: 20px; border-radius: 50%; background: var(--seal); color: #fff; font-family: var(--font-mono); font-size: .62rem; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .modal-name { font-family: var(--font-serif); font-weight: 600; font-size: 1.1rem; color: var(--text-ink); }
  .modal-dept { font-family: var(--font-mono); font-size: .72rem; color: var(--seal); letter-spacing: .06em; margin-top: 3px; text-transform: uppercase; }
  .modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.2rem; line-height: 1; color: var(--text-ink-muted); cursor: pointer; padding: 4px; }
  .modal-manifesto { margin: 0 22px 20px; background: #fff; border: 1px solid rgba(31,39,51,.12); border-radius: 6px; padding: 16px; max-height: 220px; overflow-y: auto; }
  .modal.modal-lg { max-width: 680px; }
  .modal.modal-lg .modal-manifesto { max-height: 440px; }
  
  .markdown-body h1, .markdown-body h2, .markdown-body h3 {
    font-family: var(--font-serif);
    font-weight: 700;
    color: var(--text-ink);
    margin-top: 16px;
    margin-bottom: 8px;
  }
  .markdown-body h1 { font-size: 1.4rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 4px; }
  .markdown-body h2 { font-size: 1.2rem; }
  .markdown-body h3 { font-size: 1rem; }
  .markdown-body p { margin-bottom: 12px; }
  .markdown-body ul, .markdown-body ol { margin-left: 20px; margin-bottom: 12px; list-style-type: disc; }
  .markdown-body li { margin-bottom: 4px; }
  .markdown-body strong { font-weight: 700; color: var(--text-ink); }
  .modal-manifesto-label { font-family: var(--font-mono); font-size: .65rem; letter-spacing: .12em; color: var(--text-ink-muted); text-transform: uppercase; margin-bottom: 8px; }
  .modal-manifesto p { font-family: var(--font-mono); font-size: .82rem; line-height: 1.75; color: var(--text-ink); margin: 0; }
  .modal-actions { padding: 0 22px 22px; }
  .btn-block { width: 100%; padding: 11px; border-radius: 6px; font-weight: 600; font-size: .85rem; cursor: pointer; border: 1px solid rgba(31,39,51,.15); background: #fff; color: var(--text-ink); }
  .btn-block:hover { background: var(--paper-2); }

  .confirm-body { padding: 26px 24px 10px; text-align: center; }
  .confirm-body img { width: 64px; height: 64px; border-radius: 6px; object-fit: cover; margin-bottom: 14px; border: 1px solid rgba(31,39,51,.15); }
  .confirm-body h3 { font-family: var(--font-serif); margin: 0 0 8px; font-size: 1.15rem; color: var(--text-ink); }
  .confirm-body p { font-size: .85rem; color: var(--text-ink-muted); margin: 0 0 4px; line-height: 1.55; }
  .confirm-warn { display: flex; align-items: center; justify-content: center; gap: 6px; font-family: var(--font-mono); font-size: .72rem; color: var(--seal) !important; margin-top: 14px !important; }
  .confirm-warn svg { width: 13px; height: 13px; flex-shrink: 0; }
  .confirm-actions { display: flex; gap: 10px; padding: 18px 24px 24px; }
  .confirm-actions .btn-block { flex: 1; }
  .confirm-actions .btn-confirm { background: var(--seal); color: #fff; border-color: var(--seal); }
  .confirm-actions .btn-confirm:hover { background: var(--seal-dark); }

  .completion { padding: 44px 32px 40px; text-align: center; }
  .completion-mark { width: 56px; height: 56px; border-radius: 50%; background: var(--success); color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
  .completion-mark svg { width: 28px; height: 28px; }
  .completion h2 { font-family: var(--font-serif); font-size: 1.5rem; color: var(--text-ink); margin: 0 0 8px; }
  .completion p { font-size: .88rem; color: var(--text-ink-muted); margin: 0 0 26px; }
  .receipt { text-align: left; max-width: 400px; margin: 0 auto; border: 1px dashed rgba(31,39,51,.3); border-radius: 6px; padding: 18px 20px; background: #fff; }
  .receipt-title { font-family: var(--font-mono); font-size: .68rem; letter-spacing: .14em; color: var(--text-ink-muted); text-transform: uppercase; margin-bottom: 12px; text-align: center; }
  .receipt-row { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid rgba(31,39,51,.08); font-family: var(--font-mono); font-size: .78rem; color: var(--text-ink); }
  .receipt-row:last-child { border-bottom: none; }
  .receipt-row span:first-child { color: var(--text-ink-muted); }
  .receipt-row span:last-child { font-weight: 600; text-align: right; }
`;

type PageState =
  | "loading"
  | "login"
  | "checking"
  | "not_whitelisted"
  | "already_voted"
  | "election_closed"
  | "results_published"
  | "consent"
  | "voting"
  | "review"
  | "submitting"
  | "success"
  | "error";

export default function VotingPortalPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [member, setMember] = useState<CouncilMember | null>(null);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [departmentIndex, setDepartmentIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, Candidate>>({});
  const [readCandidates, setReadCandidates] = useState<Record<string, boolean>>({});
  const [publishedResults, setPublishedResults] = useState<any | null>(null);

  // Overlays / Modals
  const [manifestoCandidate, setManifestoCandidate] = useState<Candidate | null>(null);
  const [confirmCandidate, setConfirmCandidate] = useState<Candidate | null>(null);
  const [manifestoIdx, setManifestoIdx] = useState<number>(0);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Consent scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseEnabled || !auth) {
      setPageState("login");
      return;
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setPageState("login");
        return;
      }
      setFirebaseUser(user);
      setPageState("checking");
      await checkMembership(user);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Membership & election status check ────────────────────────────────────
  const checkMembership = async (user: User) => {
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/election/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setPageState("login");
        } else {
          setPageState("error");
        }
        return;
      }

      const data = await res.json();
      if (!data.whitelisted) {
        setPageState("not_whitelisted");
        return;
      }

      setMember(data.member);

      if (data.isElectionOver && data.isResultsPublished) {
        try {
          const resultsRes = await fetch("/api/election/results");
          if (resultsRes.ok) {
            const resultsData = await resultsRes.json();
            setPublishedResults(resultsData);
            setPageState("results_published");
            return;
          }
        } catch (err) {
          console.error("Failed to fetch published results:", err);
        }
      }

      if (data.member.hasVoted) {
        setPageState("already_voted");
        return;
      }

      if (data.isElectionOver) {
        setPageState("election_closed");
        return;
      }

      // Restore progress if it exists
      setDepartmentIndex(data.member.currentDepartmentIndex ?? 0);
      setSelections(data.member.tempSelections ?? {});

      // Load all candidates from Firestore (read-only list, public permission rules apply)
      if (db) {
        const snap = await getDocs(collection(db, "candidates"));
        setAllCandidates(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Candidate, "id">) }))
        );
      }
      setPageState("consent");
    } catch (err) {
      console.error("Failed to verify membership securely:", err);
      setPageState("error");
    }
  };

  // ── Auth Handlers ─────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (auth) await signOut(auth);
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      const msg = err.message ?? "";
      setLoginError(
        msg.includes("auth/popup-closed-by-user")
          ? "Google Sign-In popup closed before completion."
          : "Google Sign-In failed. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Scroll detection for consent ──────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setScrolledToBottom(true);
    }
  }, []);

  // ── Progress Tracker Db Helper ─────────────────────────────────────────────
  const saveProgressToDb = async (newIndex: number, newSelections: Record<string, Candidate>) => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const serialized: Record<string, any> = {};
      Object.keys(newSelections).forEach((dept) => {
        const c = newSelections[dept];
        serialized[dept] = {
          id: c.id,
          name: c.name,
          department: c.department,
          manifesto: c.manifesto,
          photoUrl: c.photoUrl ?? ""
        };
      });

      const res = await fetch("/api/election/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentDepartmentIndex: newIndex,
          tempSelections: serialized,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save progress to server.");
      }
      console.log("Progress saved securely:", newIndex);
    } catch (err) {
      console.error("Failed to save progress secure API:", err);
    }
  };

  // ── Vote selection (triggered on modal confirmation) ─────────────────────
  const handleConfirmVote = () => {
    if (!confirmCandidate) return;
    const dept = DEPARTMENTS[departmentIndex];
    const nextSelections = { ...selections, [dept]: confirmCandidate };
    setSelections(nextSelections);
    setConfirmCandidate(null);
    saveProgressToDb(departmentIndex, nextSelections);
  };

  // ── Submit ballot ──────────────────────────────────────────────────────────
  const handleSubmitBallot = async () => {
    if (!firebaseUser || !member) return;
    setPageState("submitting");
    try {
      const token = await firebaseUser.getIdToken();
      const serialized: Record<string, any> = {};
      for (const dept of DEPARTMENTS) {
        const c = selections[dept];
        if (!c) throw new Error(`Missing selection for ${dept}`);
        serialized[dept] = {
          id: c.id,
          name: c.name,
          department: c.department,
          manifesto: c.manifesto,
          photoUrl: c.photoUrl ?? "",
        };
      }

      const res = await fetch("/api/election/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ selections: serialized }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to submit ballot securely.");
      }

      setPageState("success");
    } catch (err: any) {
      setSubmitError(err.message ?? "Submission failed.");
      setPageState("error");
    }
  };

  const currentDept = DEPARTMENTS[departmentIndex];
  const currentDeptCandidates = allCandidates.filter((c) => c.department === currentDept);

  // ── Renders ────────────────────────────────────────────────────────────────

  // Loading Screen
  if (pageState === "loading" || pageState === "checking") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0D111C" }}>
        <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-3" />
        <p style={{ color: "#8B93A8", fontSize: "0.85rem", fontFamily: "monospace" }}>
          {pageState === "checking" ? "Verifying secure ballot status…" : "Initializing Secure Ballot Portal…"}
        </p>
      </div>
    );
  }

  return (
    <div className="vote-body">
      <style dangerouslySetInnerHTML={{ __html: CSS_THEME }} />

      {/* ── LOGIN STATE ── */}
      {pageState === "login" && (
        <div className="app">
          <div className="masthead">
            <div className="masthead-rules">
              <span className="masthead-rule"></span>
              <svg className="masthead-seal" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.3">
                <circle cx="20" cy="20" r="17" />
                <circle cx="20" cy="20" r="12.5" />
                <path strokeLinejoin="round" d="M20 11l2.5 5.2 5.7.6-4.2 4 1.1 5.7L20 23.8l-5.1 2.7 1.1-5.7-4.2-4 5.7-.6z" />
              </svg>
              <span className="masthead-rule"></span>
            </div>
            <div className="masthead-eyebrow">Sign In</div>
            <div className="masthead-title">Committee Elections 2026</div>
          </div>

          <div className="ballot" style={{ maxWidth: "440px", margin: "0 auto" }}>
            <div className="letterhead" style={{ textAlign: "center" }}>
              <div className="eyebrow" style={{ color: "var(--seal)" }}>Voter Validation</div>
              <div className="dept-title" style={{ fontSize: "1.4rem" }}>Access Ballot</div>
            </div>

            <div style={{ padding: "30px 32px", color: "var(--text-ink)", textAlign: "center" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-ink-muted)", marginBottom: "24px", lineHeight: "1.6" }}>
                Only registered and whitelisted council members can access the ballot. Log in with your authorized Google Account.
              </p>

              {loginError && (
                <div style={{
                  textAlign: "left",
                  fontSize: "0.8rem",
                  color: "var(--seal)",
                  background: "rgba(158, 43, 50, 0.08)",
                  border: "1px solid rgba(158, 43, 50, 0.18)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  marginBottom: "20px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center"
                }}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={loginLoading}
                className="btn-primary"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "13px",
                  borderRadius: "8px",
                  fontSize: "0.95rem"
                }}
              >
                {loginLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="currentColor" />
                  </svg>
                )}
                <span>Sign In with Google</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOT WHITELISTED STATE ── */}
      {pageState === "not_whitelisted" && (
        <div className="app">
          <div className="masthead">
            <div className="masthead-rules">
              <span className="masthead-rule"></span>
              <svg className="masthead-seal" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3">
                <circle cx="20" cy="20" r="17" />
                <path d="M20 11l2.5 5.2 5.7.6-4.2 4 1.1 5.7L20 23.8l-5.1 2.7" />
              </svg>
              <span className="masthead-rule"></span>
            </div>
            <div className="masthead-eyebrow">Access Denied</div>
            <div className="masthead-title">Committee Elections 2026</div>
          </div>

          <div className="ballot" style={{ maxWidth: "440px", margin: "0 auto" }}>
            <div className="letterhead" style={{ textAlign: "center" }}>
              <div className="eyebrow" style={{ color: "var(--seal)" }}>Unauthorized Email</div>
              <div className="dept-title" style={{ fontSize: "1.4rem" }}>Not Registered</div>
            </div>
            <div style={{ padding: "30px 32px", color: "var(--text-ink)", textAlign: "center" }}>
              <p style={{ fontSize: "0.9rem", margin: "0 0 10px" }}>
                <strong>{firebaseUser?.email}</strong> is not listed as a registered council member.
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-ink-muted)", marginBottom: "24px" }}>
                Please sign in with your whitelisted email, or contact the coordinator to resolve this.
              </p>
              <button onClick={handleLogout} className="btn-primary" style={{ width: "100%" }}>
                Sign Out / Try Another Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ALREADY VOTED STATE ── */}
      {pageState === "already_voted" && (
        <div className="app">
          <div className="masthead">
            <div className="masthead-rules">
              <span className="masthead-rule"></span>
              <svg className="masthead-seal" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3">
                <circle cx="20" cy="20" r="17" />
                <circle cx="20" cy="20" r="12.5" />
                <path strokeLinejoin="round" d="M20 11l2.5 5.2 5.7.6-4.2 4 1.1 5.7L20 23.8l-5.1 2.7 1.1-5.7-4.2-4 5.7-.6z" />
              </svg>
              <span className="masthead-rule"></span>
            </div>
            <div className="masthead-eyebrow">Verification</div>
            <div className="masthead-title">Committee Elections 2026</div>
          </div>

          <div className="ballot" style={{ maxWidth: "440px", margin: "0 auto" }}>
            <div className="letterhead" style={{ textAlign: "center" }}>
              <div className="eyebrow" style={{ color: "var(--success)" }}>Ballot Recorded</div>
              <div className="dept-title" style={{ fontSize: "1.4rem" }}>Already Voted</div>
            </div>
            <div style={{ padding: "30px 32px", color: "var(--text-ink)", textAlign: "center" }}>
              <p style={{ fontSize: "0.9rem", margin: "0 0 10px" }}>Hi <strong>{member?.name}</strong>,</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-ink-muted)", marginBottom: "26px", lineHeight: "1.5" }}>
                You have already cast your official ballot. Multiple submissions are strictly barred by the ledger.
              </p>
              <button onClick={handleLogout} className="btn-primary" style={{ width: "100%" }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ELECTION CLOSED STATE ── */}
      {pageState === "election_closed" && (
        <div className="app">
          <div className="masthead">
            <div className="masthead-rules">
              <span className="masthead-rule"></span>
              <svg className="masthead-seal" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3">
                <circle cx="20" cy="20" r="17" />
                <circle cx="20" cy="20" r="12.5" />
              </svg>
              <span className="masthead-rule"></span>
            </div>
            <div className="masthead-eyebrow">Status</div>
            <div className="masthead-title">Committee Elections 2026</div>
          </div>

          <div className="ballot" style={{ maxWidth: "440px", margin: "0 auto" }}>
            <div className="letterhead" style={{ textAlign: "center" }}>
              <div className="eyebrow" style={{ color: "var(--seal)" }}>Closed Ballot</div>
              <div className="dept-title" style={{ fontSize: "1.4rem" }}>Election Closed</div>
            </div>
            <div style={{ padding: "30px 32px", color: "var(--text-ink)", textAlign: "center" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-ink-muted)", marginBottom: "26px", lineHeight: "1.6" }}>
                The HOD election has concluded or is temporarily suspended. No further ballots are being accepted.
              </p>
              <button onClick={handleLogout} className="btn-primary" style={{ width: "100%" }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONSENT STATE ── */}
      {pageState === "consent" && (
        <div className="app">
          <div className="masthead">
            <div className="masthead-rules">
              <span className="masthead-rule"></span>
              <svg className="masthead-seal" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3">
                <circle cx="20" cy="20" r="17" />
                <circle cx="20" cy="20" r="12.5" />
                <path strokeLinejoin="round" d="M20 11l2.5 5.2 5.7.6-4.2 4 1.1 5.7L20 23.8l-5.1 2.7 1.1-5.7-4.2-4 5.7-.6z" />
              </svg>
              <span className="masthead-rule"></span>
            </div>
            <div className="masthead-eyebrow">Consent Form</div>
            <div className="masthead-title">Committee Elections 2026</div>
          </div>

          <div className="ballot">
            <div className="letterhead">
              <div className="eyebrow" style={{ color: "var(--seal)" }}>VOTING AGREEMENT</div>
              <div className="dept-title" style={{ color: "var(--text-ink)" }}>Terms &amp; Conditions</div>
            </div>

            <div style={{ padding: "30px 32px 10px", color: "var(--text-ink)", fontSize: "0.85rem", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 16px" }}>Hi <strong>{member?.name}</strong>,</p>
              <p style={{ margin: "0 0 20px" }}>Please review the official election guidelines below. Scroll to the bottom of the ledger to unlock your ballot.</p>

              <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                  height: "220px",
                  overflowY: "auto",
                  borderRadius: "8px",
                  border: "1px solid rgba(31,39,51,0.15)",
                  background: "#fff",
                  padding: "16px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  lineHeight: "1.6",
                  color: "var(--text-ink)",
                  whiteSpace: "pre-line",
                }}
              >
                {ELECTION_RULES}
              </div>
              {!scrolledToBottom && (
                <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--seal)", marginTop: "8px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>
                  ↓ Keep scrolling to enable the button below
                </p>
              )}
            </div>

            <div className="next-row" style={{ paddingTop: "10px" }}>
              <button
                onClick={() => setPageState("voting")}
                disabled={!scrolledToBottom}
                className="btn-primary"
                style={{ width: "100%", opacity: scrolledToBottom ? 1 : 0.5, cursor: scrolledToBottom ? "pointer" : "not-allowed" }}
              >
                Accept &amp; Proceed to Ballot
              </button>

              <button
                onClick={handleLogout}
                className="manifesto-btn"
                style={{ margin: "16px auto 0" }}
              >
                Cancel &amp; Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VOTING WIZARD ── */}
      {pageState === "voting" && (
        <div className="app">
          {/* Masthead */}
          <div className="masthead">
            <div className="masthead-rules">
              <span className="masthead-rule"></span>
              <svg className="masthead-seal" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3">
                <circle cx="20" cy="20" r="17" />
                <circle cx="20" cy="20" r="12.5" />
                <path strokeLinejoin="round" d="M20 11l2.5 5.2 5.7.6-4.2 4 1.1 5.7L20 23.8l-5.1 2.7 1.1-5.7-4.2-4 5.7-.6z" />
              </svg>
              <span className="masthead-rule"></span>
            </div>
            <div className="masthead-eyebrow">Official Ballot</div>
            <div className="masthead-title">Committee Elections 2026</div>
          </div>

          {/* Stepper progress */}
          <div className="stepper-row">
            <span className="stepper-label">Department {departmentIndex + 1} of {DEPARTMENTS.length}</span>
            <span className="stepper-percent">{Math.round(((departmentIndex + 1) / DEPARTMENTS.length) * 100)}%</span>
          </div>
          <div className="stepper-ticks">
            {DEPARTMENTS.map((_, i) => {
              let tickClass = "tick";
              if (i < departmentIndex) tickClass += " filled";
              else if (i === departmentIndex) tickClass += " current";
              return <div key={i} className={tickClass} />;
            })}
          </div>

          {/* Ballot Card */}
          <div className="ballot">
            <div className="letterhead">
              <div className="eyebrow">Vote for HOD</div>
              <div className="dept-title">{currentDept}</div>
            </div>

            <div className="candidates-area">
              {currentDeptCandidates.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-ink-muted)", fontFamily: "var(--font-mono)" }}>
                  <p style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--seal)", marginBottom: "8px" }}>Nominee Unopposed</p>
                  <button
                    type="button"
                    onClick={async () => {
                      const noCand: Candidate = { id: "__none__", name: "Nominee Unopposed", email: "", department: currentDept, manifesto: "Nominee unopposed." };
                      const nextSelections = { ...selections, [currentDept]: noCand };
                      setSelections(nextSelections);

                      const nextIndex = departmentIndex + 1;
                      if (departmentIndex === DEPARTMENTS.length - 1) {
                        await saveProgressToDb(departmentIndex, nextSelections);
                        setPageState("review");
                      } else {
                        setDepartmentIndex(nextIndex);
                        await saveProgressToDb(nextIndex, nextSelections);
                      }
                    }}
                    className="btn-primary"
                    style={{ marginTop: "18px" }}
                  >
                    Confirm &amp; Continue
                  </button>
                </div>
              ) : (
                <>
                  <div className="candidates-grid">
                    {currentDeptCandidates.map((c, idx) => {
                      const isVoted = selections[currentDept]?.id === c.id;
                      const isLocked = selections[currentDept] !== undefined && selections[currentDept]?.id !== c.id;
                      const hasReadThis = readCandidates[c.id] === true;
                      const allRead = currentDeptCandidates.every((cand) => readCandidates[cand.id] === true);
                      const isDisabled = !allRead && !isVoted;

                      return (
                        <div key={c.id} className={`candidate ${isVoted ? "voted" : ""} ${isLocked ? "disabled" : ""}`}>
                          <div className="photo-frame">
                            {c.photoUrl ? (
                              <img src={c.photoUrl} alt={c.name} loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold text-3xl">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="ballot-no">{idx + 1}</div>
                            {isVoted && (
                              <div className="voted-mark">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 12l5 5L20 6" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="candidate-body">
                            <div className="candidate-name">{c.name}</div>
                            <button
                              type="button"
                              onClick={() => {
                                setManifestoCandidate(c);
                                setManifestoIdx(idx + 1);
                                setReadCandidates((prev) => ({ ...prev, [c.id]: true }));
                              }}
                              className="manifesto-btn"
                              style={{ color: hasReadThis ? "var(--success)" : "var(--seal)" }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                                <path d="M8 13h8M8 17h5" />
                              </svg>
                              <span>{hasReadThis ? "Manifesto Read ✓" : "Read Manifesto"}</span>
                            </button>

                            <button
                              type="button"
                              disabled={isDisabled || isLocked || isVoted}
                              onClick={() => setConfirmCandidate(c)}
                              className={`evm ${isVoted ? "voted" : ""} ${isLocked || isDisabled ? "locked" : ""}`}
                            >
                              <span className="evm-light" style={{ backgroundColor: isDisabled ? "#9E2B32" : undefined }}></span>
                              <span className="evm-label">{isVoted ? "Voted" : isDisabled ? "Locked" : "Vote"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!currentDeptCandidates.every((cand) => readCandidates[cand.id] === true) && (
                    <div style={{
                      textAlign: "center",
                      fontSize: "0.8rem",
                      color: "var(--seal)",
                      fontWeight: "600",
                      fontFamily: "var(--font-mono)",
                      marginTop: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}>
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Please read the manifesto statement for each candidate to unlock the voting system.</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="footer-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3.5 2.5 20h19L12 3.5z" />
                <path d="M12 9.5v5" />
                <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
              </svg>
              <span>Your selection is final — no back button once you continue</span>
            </div>

            {/* Next Action Button (appears only when voted) */}
            {selections[currentDept] !== undefined && (
              <div className="next-row">
                <button
                  type="button"
                  onClick={async () => {
                    const nextIndex = departmentIndex + 1;
                    if (departmentIndex === DEPARTMENTS.length - 1) {
                      setPageState("review");
                    } else {
                      setDepartmentIndex(nextIndex);
                      await saveProgressToDb(nextIndex, selections);
                    }
                  }}
                  className="btn-primary"
                >
                  {departmentIndex === DEPARTMENTS.length - 1 ? "View Voting Receipt →" : "Continue to Next Department →"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REVIEW RECEIPT STATE ── */}
      {pageState === "review" && (
        <div className="app">
          <div className="masthead">
            <div className="masthead-rules">
              <span className="masthead-rule"></span>
              <svg className="masthead-seal" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3">
                <circle cx="20" cy="20" r="17" />
                <circle cx="20" cy="20" r="12.5" />
                <path strokeLinejoin="round" d="M20 11l2.5 5.2 5.7.6-4.2 4 1.1 5.7L20 23.8l-5.1 2.7 1.1-5.7-4.2-4 5.7-.6z" />
              </svg>
              <span className="masthead-rule"></span>
            </div>
            <div className="masthead-eyebrow">Receipt Review</div>
            <div className="masthead-title">Committee Elections 2026</div>
          </div>

          <div className="ballot" style={{ maxWidth: "520px", margin: "0 auto" }}>
            <div className="letterhead" style={{ textAlign: "center" }}>
              <div className="eyebrow" style={{ color: "var(--seal)" }}>Unsubmitted Ballot</div>
              <div className="dept-title" style={{ fontSize: "1.45rem" }}>Review Choices</div>
            </div>

            <div style={{ padding: "26px 32px 10px" }}>
              <div className="receipt">
                <div className="receipt-title">Vote Receipt Summary</div>
                {DEPARTMENTS.map((dept) => (
                  <div key={dept} className="receipt-row">
                    <span>{dept}</span>
                    <span>{selections[dept]?.name ?? "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="next-row" style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={async () => {
                  setDepartmentIndex(0);
                  setSelections({});
                  setPageState("voting");
                  await saveProgressToDb(0, {});
                }}
                className="btn-block"
                style={{ flex: 1, padding: "12px" }}
              >
                Reset &amp; Vote Again
              </button>
              <button
                type="button"
                onClick={handleSubmitBallot}
                className="btn-primary"
                style={{ flex: 1, padding: "12px", background: "var(--success)" }}
              >
                Submit Final Ballot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULTS PUBLISHED STATE ── */}
      {pageState === "results_published" && (
        <div className="app">
          <div className="masthead">
            <div className="masthead-rules">
              <span className="masthead-rule"></span>
              <svg className="masthead-seal" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3">
                <circle cx="20" cy="20" r="17" />
                <circle cx="20" cy="20" r="12.5" />
                <path strokeLinejoin="round" d="M20 11l2.5 5.2 5.7.6-4.2 4 1.1 5.7L20 23.8l-5.1 2.7 1.1-5.7-4.2-4 5.7-.6z" />
              </svg>
              <span className="masthead-rule"></span>
            </div>
            <div className="masthead-eyebrow">Official Results</div>
            <div className="masthead-title">Committee HOD Elections 2026</div>
          </div>

          <div className="ballot" style={{ maxWidth: "600px", margin: "0 auto 40px" }}>
            <div className="letterhead" style={{ textAlign: "center", borderBottom: "1px solid rgba(31,39,51,0.1)" }}>
              <div className="eyebrow" style={{ color: "var(--success)" }}>Election Concluded</div>
              <div className="dept-title" style={{ fontSize: "1.45rem", color: "var(--text-ink)" }}>HOD Election Winners</div>
            </div>

            <div style={{ padding: "24px 32px 30px" }}>
              <p style={{ fontSize: "0.88rem", color: "var(--text-ink-muted)", textAlign: "center", marginBottom: "24px", lineHeight: "1.6" }}>
                Voter turnout: <strong>{publishedResults?.totalVotesCast ?? 0}</strong> out of <strong>{publishedResults?.totalVoters ?? 0}</strong> (
                {publishedResults?.totalVoters > 0 ? Math.round((publishedResults.totalVotesCast / publishedResults.totalVoters) * 100) : 0}%)
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {publishedResults?.departments.map((dept: any) => (
                  <div
                    key={dept.department}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px",
                      background: "#fff",
                      borderRadius: "8px",
                      border: "1px solid rgba(31,39,51,0.08)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                    }}
                  >
                    {dept.winner?.photoUrl ? (
                      <img
                        src={dept.winner.photoUrl}
                        alt=""
                        style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--paper-2)", flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: "var(--paper)",
                          color: "var(--text-ink)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "700",
                          fontSize: "1rem",
                          border: "1px solid var(--paper-2)",
                          flexShrink: 0
                        }}
                      >
                        {dept.winner?.name.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <p style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {dept.department}
                      </p>
                      <p style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-ink)", marginTop: "2px" }}>
                        {dept.winner?.name ?? "Nominee Unopposed"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleLogout} className="btn-primary" style={{ width: "100%", marginTop: "28px" }}>
                Sign Out Securely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBMITTING STATE ── */}
      {pageState === "submitting" && (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0D111C" }}>
          <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-3" />
          <p style={{ color: "#8B93A8", fontSize: "0.85rem", fontFamily: "monospace" }}>
            Securing ballot locks and committing to ledger…
          </p>
        </div>
      )}

      {/* ── SUCCESS LEDGER STATE ── */}
      {pageState === "success" && (
        <div className="app">
          <div className="masthead">
            <div className="masthead-rules">
              <span className="masthead-rule"></span>
              <svg className="masthead-seal" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3">
                <circle cx="20" cy="20" r="17" />
                <circle cx="20" cy="20" r="12.5" />
                <path strokeLinejoin="round" d="M20 11l2.5 5.2 5.7.6-4.2 4 1.1 5.7L20 23.8l-5.1 2.7 1.1-5.7-4.2-4 5.7-.6z" />
              </svg>
              <span className="masthead-rule"></span>
            </div>
            <div className="masthead-eyebrow">Committed</div>
            <div className="masthead-title">Committee Elections 2026</div>
          </div>

          <div className="ballot" style={{ maxWidth: "520px", margin: "0 auto" }}>
            <div className="completion">
              <div className="completion-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg>
              </div>
              <h2>Ballot Submitted</h2>
              <p>Your votes have been successfully committed to the database ledger.</p>

              <div className="receipt">
                <div className="receipt-title">Official Receipt</div>
                {DEPARTMENTS.map((dept) => (
                  <div key={dept} className="receipt-row">
                    <span>{dept}</span>
                    <span>{selections[dept]?.name ?? "—"}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleLogout}
                className="btn-primary"
                style={{ width: "100%", marginTop: "24px" }}
              >
                Sign Out Securely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {pageState === "error" && (
        <div className="app">
          <div className="masthead">
            <div className="masthead-title">System Error</div>
          </div>
          <div className="ballot" style={{ maxWidth: "440px", margin: "0 auto" }}>
            <div style={{ padding: "40px 32px", textAlign: "center", color: "var(--text-ink)" }}>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3>Submission Error</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-ink-muted)", marginBottom: "20px" }}>
                {submitError ?? "Failed to commit selections. Please contact the elections officer."}
              </p>
              <button onClick={handleLogout} className="btn-primary" style={{ width: "100%" }}>
                Sign Out &amp; Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANIFESTO OVERLAY MODAL ── */}
      <div className={`overlay ${manifestoCandidate ? "show" : ""}`}>
        <div className="modal modal-lg">
          <div className="modal-top"></div>
          <div className="modal-head">
            <div className="modal-avatar-wrap">
              {manifestoCandidate?.photoUrl ? (
                <img className="modal-avatar" src={manifestoCandidate.photoUrl} alt="" />
              ) : (
                <div className="modal-avatar flex items-center justify-center bg-gray-300 text-gray-700 font-bold text-lg">
                  {manifestoCandidate?.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="modal-badge">{manifestoIdx}</div>
            </div>
            <div className="text-left">
              <div className="modal-name">{manifestoCandidate?.name}</div>
              <div className="modal-dept">{manifestoCandidate?.department}</div>
            </div>
            <button className="modal-close" onClick={() => setManifestoCandidate(null)} aria-label="Close">&times;</button>
          </div>
          <div className="modal-manifesto">
            <div className="modal-manifesto-label">Candidate Statement</div>
            <div className="markdown-body text-left" style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--text-ink)", lineHeight: "1.7" }}>
              <ReactMarkdown>{manifestoCandidate?.manifesto}</ReactMarkdown>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-block" onClick={() => setManifestoCandidate(null)}>Close</button>
          </div>
        </div>
      </div>

      {/* ── CONFIRM VOTE OVERLAY MODAL ── */}
      <div className={`overlay ${confirmCandidate ? "show" : ""}`}>
        <div className="modal">
          <div className="modal-top"></div>
          <div className="confirm-body">
            {confirmCandidate?.photoUrl ? (
              <img src={confirmCandidate.photoUrl} alt="" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-2xl mx-auto mb-3">
                {confirmCandidate?.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h3>Confirm your vote</h3>
            <p>You are voting for <strong>{confirmCandidate?.name}</strong></p>
            <p style={{ fontSize: "0.78rem" }}>{confirmCandidate?.department} — Head of Department</p>
            <p className="confirm-warn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3.5 2.5 20h19L12 3.5z" />
                <path d="M12 9.5v5" />
                <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
              </svg>
              <span>This can be changed until you continue to the next department</span>
            </p>
          </div>
          <div className="confirm-actions">
            <button className="btn-block" onClick={() => setConfirmCandidate(null)}>Cancel</button>
            <button className="btn-block btn-confirm" onClick={handleConfirmVote}>Confirm Vote</button>
          </div>
        </div>
      </div>
    </div>
  );
}
