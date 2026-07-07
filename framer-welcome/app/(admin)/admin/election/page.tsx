"use client";

// app/(admin)/admin/election/page.tsx
// Admin HOD Election Dashboard
// Tabs: Election Controls | Candidate Management | Results

import { useEffect, useState, useCallback, useRef } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
} from "firebase/firestore";
import { db, isFirebaseEnabled, auth } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import type {
  ElectionResults,
  DepartmentResult,
  CandidateResult,
  Candidate,
  CouncilMember,
  VoteAudit,
} from "@/lib/election-types";
import { DEPARTMENTS } from "@/lib/election-types";
import {
  Trophy,
  Users,
  Vote,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Crown,
  Medal,
  UserPlus,
  Pencil,
  Trash2,
  X,
  Save,
  Image as ImageIcon,
  FileText,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingVoter {
  uid: string;
  name: string;
  email: string;
  department: string;
}

type Tab = "controls" | "voters" | "candidates" | "results";

// ─── Two-Step Confirm Modal ───────────────────────────────────────────────────

function ConfirmToggleModal({
  isReopening,
  onConfirm,
  onCancel,
}: {
  isReopening: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState("");
  const keyword = "CONFIRM";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 rounded-t-2xl ${isReopening ? "bg-red-50 dark:bg-red-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${isReopening ? "bg-red-100 dark:bg-red-800" : "bg-amber-100 dark:bg-amber-800"}`}>
              <AlertCircle className={`h-6 w-6 ${isReopening ? "text-red-600 dark:text-red-300" : "text-amber-600 dark:text-amber-300"}`} />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isReopening ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
                {step === 1
                  ? isReopening
                    ? "Reopen Election?"
                    : "Close Election?"
                  : "Final Confirmation"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              {isReopening ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    You are about to <strong>reopen the election</strong>. This will:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                      <span>Keep existing voter progress and cast votes intact</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Vote className="h-4 w-4 mt-0.5 shrink-0 text-indigo-500" />
                      <span>Allow voting to resume from where it left off</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                      <span>Allow results to be edited or published/unpublished later</span>
                    </li>
                  </ul>
                  <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 px-4 py-3 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    ⚠️ Existing votes are preserved. To permanently delete votes, use the "Wipe & Reset All Votes" button in the Results section instead.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    You are about to <strong>close the election</strong>. This will:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <ToggleLeft className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>Stop accepting new votes from council members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Trophy className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>Make the weighted results available in the Results tab</span>
                    </li>
                  </ul>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
                    Existing votes are preserved. You can reopen the election later to resume voting without losing data.
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onCancel}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl py-2.5 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${isReopening
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-amber-600 hover:bg-amber-700"
                    }`}
                >
                  Continue →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Type <span className="font-mono font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{keyword}</span> below to proceed.
              </p>
              <input
                autoFocus
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value.toUpperCase())}
                placeholder={keyword}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setStep(1); setTyped(""); }}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl py-2.5 text-sm font-medium transition-colors"
                >
                  ← Back
                </button>
                <button
                  disabled={typed !== keyword}
                  onClick={onConfirm}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isReopening
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-amber-600 hover:bg-amber-700"
                    }`}
                >
                  {isReopening ? "Reopen Election" : "Close Election"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ isOver }: { isOver: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${isOver
        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${isOver ? "bg-red-500" : "bg-green-500 animate-pulse"}`}
      />
      {isOver ? "Election Closed" : "Election Active"}
    </span>
  );
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

function CandidateResultCard({
  candidate,
  rank,
  maxScore,
}: {
  candidate: CandidateResult;
  rank: number;
  maxScore: number;
}) {
  const isWinner = rank === 1;
  return (
    <div
      className={`rounded-xl border p-4 transition-all ${isWinner
        ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600"
        : "border-gray-200 bg-white dark:bg-gray-800/50 dark:border-gray-700"
        }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isWinner ? (
            <Crown className="h-5 w-5 text-yellow-500" />
          ) : rank === 2 ? (
            <Medal className="h-5 w-5 text-gray-400" />
          ) : (
            <span className="h-5 w-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300">
              {rank}
            </span>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {candidate.name}
            </p>
            {isWinner && (
              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                ✦ Winner
              </span>
            )}
          </div>
        </div>
        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {candidate.score}
          <span className="text-xs font-normal text-gray-400 ml-1">pts</span>
        </span>
      </div>
      <ScoreBar score={candidate.score} max={maxScore} />
      <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-500 dark:text-gray-400">
        <span>🏆 Same-dept HOD: +{candidate.voteBreakdown.sameHODVotes * 5}</span>
        <span>🎖️ Other HOD: +{candidate.voteBreakdown.otherHODVotes * 3}</span>
        <span>👥 Own dept: +{candidate.voteBreakdown.sameDeptVotes * 2}</span>
        <span>🌐 Other dept: +{candidate.voteBreakdown.otherDeptVotes * 1}</span>
      </div>
    </div>
  );
}

function DepartmentResultCard({
  dept,
  resultsOverrides,
  onOverride,
}: {
  dept: DepartmentResult;
  resultsOverrides: Record<string, string>;
  onOverride: (deptName: string, candidateId: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const maxScore = dept.candidates[0]?.score ?? 1;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer gap-4"
      >
        <div className="flex items-center gap-3">
          {dept.winner?.photoUrl ? (
            <img src={dept.winner.photoUrl} alt="" className="h-11 w-11 rounded-full object-cover border border-indigo-200 shrink-0" />
          ) : (
            <div className="h-11 w-11 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
              {dept.winner?.name.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
          <div className="text-left">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {dept.department}
            </p>
            {dept.winner && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Winner: <strong className="text-indigo-600 dark:text-indigo-400">{dept.winner.name}</strong>
                {dept.winner.candidateId !== "__none__" && ` — ${dept.winner.score} pts`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 ml-14 sm:ml-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Override Winner:</label>
            <select
              value={resultsOverrides[dept.department] ?? ""}
              onChange={(e) => onOverride(dept.department, e.target.value)}
              className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Default (Top Score)</option>
              {dept.candidates.map((c) => (
                <option key={c.candidateId} value={c.candidateId}>
                  {c.name} ({c.score} pts)
                </option>
              ))}
              <option value="__none__">Nominee Unopposed</option>
            </select>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-4 grid gap-3 sm:grid-cols-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          {dept.candidates.map((c, i) => (
            <CandidateResultCard
              key={c.candidateId}
              candidate={c}
              rank={i + 1}
              maxScore={maxScore}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Candidate Form Modal ─────────────────────────────────────────────────────

interface CandidateFormData {
  name: string;
  email: string;
  department: string;
  manifesto: string;
  photoUrl: string;
}

const EMPTY_FORM: CandidateFormData = {
  name: "",
  email: "",
  department: DEPARTMENTS[0],
  manifesto: "",
  photoUrl: "",
};

function CandidateModal({
  mode,
  initial,
  onSave,
  onClose,
}: {
  mode: "add" | "edit";
  initial?: CandidateFormData & { id?: string };
  onSave: (data: CandidateFormData & { id?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CandidateFormData>(
    initial ?? EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [voters, setVoters] = useState<{ email: string; name: string }[]>([]);

  // Load voters list to select linked candidate email
  useEffect(() => {
    if (!isFirebaseEnabled || !db) return;
    const unsub = onSnapshot(collection(db, "council_members"), (snap) => {
      setVoters(
        snap.docs.map((d) => ({
          email: d.data().email ?? "",
          name: d.data().name ?? "",
        })).sort((a, b) => a.email.localeCompare(b.email))
      );
    });
    return unsub;
  }, []);

  const set = (field: keyof CandidateFormData, val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.manifesto.trim()) {
      setErr("Name, linked email and manifesto are required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave({ ...form, id: initial?.id });
      onClose();
    } catch (error: any) {
      setErr(error.message ?? "Failed to save candidate.");
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = (selectedEmail: string) => {
    setForm((f) => {
      const matchedVoter = voters.find((v) => v.email === selectedEmail);
      return {
        ...f,
        email: selectedEmail,
        // Auto populate name from voter profile if candidate name is currently empty or matches a previous voter name
        name: f.name === "" || voters.some(v => v.name === f.name) ? (matchedVoter?.name ?? f.name) : f.name
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {mode === "add" ? "Add Candidate" : "Edit Candidate"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Linked Email Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Linked Voter Email <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Select linked voter email...</option>
              {voters.map((v) => (
                <option key={v.email} value={v.email}>
                  {v.email} ({v.name})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Linking a voter automatically flags them as contesting in this election.
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Candidate full name"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-gray-400" />
              Photo URL <span className="text-gray-400 text-xs font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={form.photoUrl}
              onChange={(e) => set("photoUrl", e.target.value)}
              placeholder="https://drive.google.com/... or any public image link"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {form.photoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={form.photoUrl}
                  alt="Preview"
                  className="h-14 w-14 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="text-xs text-gray-400">Photo preview</span>
              </div>
            )}
          </div>

          {/* Manifesto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-gray-400" />
              Manifesto <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={form.manifesto}
              onChange={(e) => set("manifesto", e.target.value)}
              placeholder="Candidate's vision, goals, and plan for the department..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{form.manifesto.length} characters</p>
          </div>

          {err && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-700 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {err}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl py-2.5 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mode === "add" ? "Add Candidate" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Candidate Management Tab ─────────────────────────────────────────────────

function CandidatesTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; candidate?: Candidate } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  // Real-time candidates from Firestore
  useEffect(() => {
    if (!isFirebaseEnabled || !db) return;
    const unsub = onSnapshot(collection(db, "candidates"), (snap) => {
      setCandidates(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Candidate, "id">) }))
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSave = async (data: CandidateFormData & { id?: string }) => {
    if (data.id) {
      // Update existing
      const res = await fetch("/api/election/candidates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Update failed");
      }
    } else {
      // Create new
      const res = await fetch("/api/election/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Create failed");
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete candidate "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/election/candidates?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Delete failed");
      }
    } catch {
      setError("Network error during delete.");
    } finally {
      setDeleting(null);
    }
  };

  // Group by department
  const byDept = DEPARTMENTS.reduce<Record<string, Candidate[]>>((acc, dept) => {
    acc[dept] = candidates.filter((c) => c.department === dept);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Candidates</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} registered across {DEPARTMENTS.length} departments
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Add Candidate
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading candidates…
        </div>
      ) : (
        <div className="space-y-3">
          {DEPARTMENTS.map((dept) => {
            const deptCandidates = byDept[dept] ?? [];
            const isOpen = expandedDept === dept;
            return (
              <div
                key={dept}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Dept header */}
                <button
                  onClick={() => setExpandedDept(isOpen ? null : dept)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{dept}</span>
                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 text-xs font-semibold">
                      {deptCandidates.length} candidates
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                {/* Candidate list */}
                {isOpen && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {deptCandidates.length === 0 ? (
                      <div className="px-5 py-6 text-center text-sm text-gray-400">
                        No candidates yet for this department.{" "}
                        <button
                          onClick={() => setModal({ mode: "add" })}
                          className="text-indigo-500 hover:underline"
                        >
                          Add one →
                        </button>
                      </div>
                    ) : (
                      deptCandidates.map((c) => (
                        <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                          {/* Photo */}
                          {c.photoUrl ? (
                            <img
                              src={c.photoUrl}
                              alt={c.name}
                              className="h-11 w-11 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-base">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                              {c.name}
                            </p>
                            {c.email && (
                              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 truncate">
                                {c.email}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {c.manifesto
                                ? c.manifesto.slice(0, 80) + (c.manifesto.length > 80 ? "…" : "")
                                : "No manifesto"}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setModal({ mode: "edit", candidate: c })}
                              className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                              title="Edit candidate"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, c.name)}
                              disabled={deleting === c.id}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                              title="Delete candidate"
                            >
                              {deleting === c.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CandidateModal
          mode={modal.mode}
          initial={
            modal.candidate
              ? {
                id: modal.candidate.id,
                name: modal.candidate.name,
                email: modal.candidate.email ?? "",
                department: modal.candidate.department,
                manifesto: modal.candidate.manifesto,
                photoUrl: modal.candidate.photoUrl ?? "",
              }
              : undefined
          }
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Voter Form Modal ─────────────────────────────────────────────────────────

interface VoterFormData {
  name: string;
  email: string;
  department: string;
  isPreviousHOD: boolean;
  isContestingAgain: boolean;
  hasVoted: boolean;
}

const EMPTY_VOTER_FORM: VoterFormData = {
  name: "",
  email: "",
  department: DEPARTMENTS[0],
  isPreviousHOD: false,
  isContestingAgain: false,
  hasVoted: false,
};

function VoterModal({
  mode,
  initial,
  onSave,
  onClose,
}: {
  mode: "add" | "edit";
  initial?: VoterFormData & { uid?: string };
  onSave: (data: VoterFormData & { uid?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<VoterFormData>(initial ?? EMPTY_VOTER_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (field: keyof VoterFormData, val: any) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setErr("Name and email are required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave({ ...form, uid: initial?.uid });
      onClose();
    } catch (error: any) {
      setErr(error.message ?? "Failed to save voter.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {mode === "add" ? "Add Voter" : "Edit Voter"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Voter full name"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="e.g. voter@ds.study.iitm.ac.in"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Is Previous HOD?</label>
                <p className="text-xs text-gray-500">Gives +5 or +3 weighted voting power</p>
              </div>
              <input
                type="checkbox"
                checked={form.isPreviousHOD}
                onChange={(e) => set("isPreviousHOD", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Is Contesting Again?</label>
                <p className="text-xs text-gray-500">Flags this member as a candidate in this election</p>
              </div>
              <input
                type="checkbox"
                checked={form.isContestingAgain}
                onChange={(e) => set("isContestingAgain", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Has Voted?</label>
                <p className="text-xs text-gray-500">Manually override/reset vote status</p>
              </div>
              <input
                type="checkbox"
                checked={form.hasVoted}
                onChange={(e) => set("hasVoted", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-700 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {err}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl py-2.5 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mode === "add" ? "Add Voter" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Voters Management Tab ───────────────────────────────────────────────────

function VotersTab({ secondaryInfo }: {
  secondaryInfo?: {
    membersInSecondary: number;
    pendingOverflowVotes: number;
    isSeeded: boolean;
    isConfigured?: boolean;
    votedUidsInSecondary?: string[];
  } | null;
}) {
  const [voters, setVoters] = useState<CouncilMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; voter?: CouncilMember } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Voted, Pending
  const [roleFilter, setRoleFilter] = useState("All"); // All, Previous HOD, Contesting Again

  // Real-time voters from Firestore
  useEffect(() => {
    if (!isFirebaseEnabled || !db) return;
    const unsub = onSnapshot(collection(db, "council_members"), (snap) => {
      setVoters(
        snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<CouncilMember, "uid">) }))
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSave = async (data: VoterFormData & { uid?: string }) => {
    const res = await fetch("/api/election/voters", {
      method: data.uid ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Failed to save voter");
    }
  };

  const handleDelete = async (uid: string, name: string) => {
    if (!confirm(`Delete voter "${name}"? This will also remove their Firebase Auth account.`)) return;
    setDeleting(uid);
    setError(null);
    try {
      const res = await fetch(`/api/election/voters?uid=${uid}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Delete failed");
      }
    } catch {
      setError("Network error during delete.");
    } finally {
      setDeleting(null);
    }
  };

  // Filter logic
  const filtered = voters.filter((v) => {
    const nameStr = v.name ?? "";
    const emailStr = v.email ?? "";
    const matchesSearch =
      nameStr.toLowerCase().includes(search.toLowerCase()) ||
      emailStr.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === "All" || v.department === deptFilter;

    const hasVoted = v.hasVoted || !!(secondaryInfo?.votedUidsInSecondary?.includes(v.uid));

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Voted" && hasVoted) ||
      (statusFilter === "Pending" && !hasVoted);

    const matchesRole =
      roleFilter === "All" ||
      (roleFilter === "Previous HOD" && v.isPreviousHOD) ||
      (roleFilter === "Contesting Again" && v.isContestingAgain);

    return matchesSearch && matchesDept && matchesStatus && matchesRole;
  });

  const totalVotedCount = voters.filter(v => v.hasVoted || !!(secondaryInfo?.votedUidsInSecondary?.includes(v.uid))).length;
  const totalPendingCount = voters.length - totalVotedCount;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Council Members & Voters</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {voters.length} total members ({totalVotedCount} voted, {totalPendingCount} pending)
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Add Member / Voter
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Voting Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Voted">Voted</option>
            <option value="Pending">Pending (Not Voted)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Role / Filter</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Roles</option>
            <option value="Previous HOD">Previous HODs Only</option>
            <option value="Contesting Again">Contesting Candidates Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading voters list…
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-3">Member Details</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3 text-center">Status Flags</th>
                  <th className="px-6 py-3 text-center">Vote Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No voters matching current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => (
                    <tr key={v.uid} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{v.name}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{v.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full px-2.5 py-1">
                          {v.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {v.isPreviousHOD && (
                            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase font-sans">
                              Prev HOD
                            </span>
                          )}
                          {v.isContestingAgain && (
                            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase font-sans">
                              Contesting
                            </span>
                          )}
                          {!v.isPreviousHOD && !v.isContestingAgain && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {v.hasVoted || !!(secondaryInfo?.votedUidsInSecondary?.includes(v.uid)) ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2.5 py-1 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Voted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModal({ mode: "edit", voter: v })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="Edit voter"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.uid, v.name)}
                            disabled={deleting === v.uid}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                            title="Delete voter"
                          >
                            {deleting === v.uid ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <VoterModal
          mode={modal.mode}
          initial={
            modal.voter
              ? {
                uid: modal.voter.uid,
                name: modal.voter.name,
                email: modal.voter.email,
                department: modal.voter.department,
                isPreviousHOD: modal.voter.isPreviousHOD ?? false,
                isContestingAgain: modal.voter.isContestingAgain ?? false,
                hasVoted: modal.voter.hasVoted ?? false,
              }
              : undefined
          }
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ElectionAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("controls");
  const [isElectionOver, setIsElectionOver] = useState<boolean | null>(null);
  const [pendingVoters, setPendingVoters] = useState<PendingVoter[]>([]);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [toggling, setToggling] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [toggleMessage, setToggleMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Secondary DB overflow states
  const [secondaryInfo, setSecondaryInfo] = useState<{
    membersInSecondary: number;
    pendingOverflowVotes: number;
    isSeeded: boolean;
    isConfigured?: boolean;
    votedUidsInSecondary?: string[];
  } | null>(null);
  const [loadingSecondary, setLoadingSecondary] = useState(false);
  const [seedingSecondary, setSeedingSecondary] = useState(false);
  const [syncingSecondary, setSyncingSecondary] = useState(false);
  const [secondaryMessage, setSecondaryMessage] = useState<string | null>(null);
  const [secondaryError, setSecondaryError] = useState<string | null>(null);

  // Client-side cache to bypass primary quota when seeding
  const [allVotersForSeed, setAllVotersForSeed] = useState<any[]>([]);
  const [allCandidatesForSeed, setAllCandidatesForSeed] = useState<any[]>([]);

  // Firebase auth state for results restriction
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const ALLOWED_RESULT_EMAILS = (process.env.NEXT_PUBLIC_ALLOWED_RESULT_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  // Results sub-tabs & search filters
  const [resultsSubTab, setResultsSubTab] = useState<"summary" | "audit">("summary");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditDeptFilter, setAuditDeptFilter] = useState("All");

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleGoogleLogin = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google Sign-In failed:", err);
    }
  };

  const handleGoogleLogout = async () => {
    if (auth) await fbSignOut(auth);
  };

  // ── 1. Real-time election status from Firestore ────────────────────────────
  useEffect(() => {
    if (!isFirebaseEnabled || !db) return;
    const statusRef = doc(db, "election_status", "status");
    const unsub = onSnapshot(statusRef, (snap) => {
      setIsElectionOver(snap.exists() ? (snap.data()?.isElectionOver ?? false) : false);
    });
    return unsub;
  }, []);

  // ── 2. Real-time pending voters list ──────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseEnabled || !db) return;
    const q = query(
      collection(db, "council_members"),
      where("hasVoted", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      const voters: PendingVoter[] = snap.docs.map((d) => ({
        uid: d.id,
        name: d.data().name ?? "Unknown",
        email: d.data().email ?? "",
        department: d.data().department ?? "",
      }));
      setPendingVoters(voters);
    });
    return unsub;
  }, []);

  // Real-time complete voters list for seeding fallback (read from client cache)
  useEffect(() => {
    if (!isFirebaseEnabled || !db) return;
    const unsub = onSnapshot(collection(db, "council_members"), (snap) => {
      setAllVotersForSeed(
        snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
      );
    });
    return unsub;
  }, []);

  // Real-time complete candidates list for seeding fallback (read from client cache)
  useEffect(() => {
    if (!isFirebaseEnabled || !db) return;
    const unsub = onSnapshot(collection(db, "candidates"), (snap) => {
      setAllCandidatesForSeed(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
    return unsub;
  }, []);

  // ── 3. Fetch results when election is over ─────────────────────────────────
  const fetchResults = useCallback(async () => {
    setLoadingResults(true);
    setError(null);
    try {
      const res = await fetch("/api/election/results");
      const json = await res.json();

      if (!res.ok) {
        // Display friendly, specific error messages based on error type
        if (json.error === "quota_exceeded" || res.status === 429) {
          setError(
            "⚠️ Firestore daily read quota exceeded.\n\n" +
            `Technical detail: ${json.details ?? json.message}`
          );
        } else if (json.error === "permission_denied") {
          setError("🔒 Permission denied. The Firebase service account doesn't have access to read from Firestore. Check IAM roles in Google Cloud Console.");
        } else if (json.error === "service_unavailable") {
          setError("🌐 Firebase is temporarily unreachable. Please wait a few seconds and try again.");
        } else {
          setError(json.message ?? json.error ?? "Failed to fetch results.");
        }
        return;
      }

      const data: ElectionResults = json;
      setResults(data);
    } catch {
      setError("Network error while fetching results. Make sure the server is running.");
    } finally {
      setLoadingResults(false);
    }
  }, []);

  const fetchSecondaryStatus = useCallback(async () => {
    if (!firebaseUser) return;
    setLoadingSecondary(true);
    setSecondaryError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/election/seed-secondary", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) {
        setSecondaryError(json.error ?? "Failed to fetch backup DB status.");
      } else {
        setSecondaryInfo(json);
      }
    } catch {
      setSecondaryError("Network error while getting backup DB status.");
    } finally {
      setLoadingSecondary(false);
    }
  }, [firebaseUser]);

  const handleSeedSecondary = async () => {
    if (!firebaseUser) return;
    setSeedingSecondary(true);
    setSecondaryError(null);
    setSecondaryMessage(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/election/seed-secondary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          voters: allVotersForSeed,
          candidates: allCandidatesForSeed,
          electionStatus: { isElectionOver, isResultsPublished: false }
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setSecondaryError(json.error ?? "Failed to seed backup DB.");
      } else {
        setSecondaryMessage(json.message ?? "Backup DB successfully seeded!");
        fetchSecondaryStatus();
      }
    } catch {
      setSecondaryError("Network error while seeding backup DB.");
    } finally {
      setSeedingSecondary(false);
    }
  };

  const handleSyncSecondary = async () => {
    if (!firebaseUser) return;
    setSyncingSecondary(true);
    setSecondaryError(null);
    setSecondaryMessage(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/election/sync-overflow", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) {
        setSecondaryError(json.error ?? "Failed to sync backup votes.");
      } else {
        setSecondaryMessage(json.message ?? "Sync completed successfully!");
        fetchSecondaryStatus();
        fetchResults(); // Re-fetch results now that main DB has the votes
      }
    } catch {
      setSecondaryError("Network error while syncing backup votes.");
    } finally {
      setSyncingSecondary(false);
    }
  };

  // Poll secondary status when active tab is controls, results, or voters
  useEffect(() => {
    if (activeTab === "controls" || activeTab === "results" || activeTab === "voters") {
      fetchSecondaryStatus();
    }
  }, [activeTab, fetchSecondaryStatus]);

  useEffect(() => {
    fetchResults();
  }, [isElectionOver, fetchResults]);

  const handleWipeVotes = async () => {
    const confirm1 = confirm("⚠️ DANGER: This will delete ALL cast votes and reset the voter logs completely.\n\nAre you sure you want to proceed?");
    if (!confirm1) return;
    const confirm2 = prompt("To confirm vote deletion, please type DELETE below:");
    if (confirm2 !== "DELETE") {
      alert("Wipe aborted. Confirmation typed incorrectly.");
      return;
    }

    setLoadingResults(true);
    try {
      const res = await fetch("/api/election/wipe-votes", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to wipe database.");
      } else {
        alert(json.message);
        setResults(null);
        fetchResults();
      }
    } catch {
      setError("Network error while trying to wipe database.");
    } finally {
      setLoadingResults(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!results) return;
    const nextPublishState = !results.isResultsPublished;
    setLoadingResults(true);
    try {
      const res = await fetch("/api/election/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResultsPublished: nextPublishState }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to update publish status.");
      } else {
        fetchResults();
      }
    } catch {
      setError("Network error while updating publish status.");
    } finally {
      setLoadingResults(false);
    }
  };

  const handleOverrideWinner = async (deptName: string, candidateId: string) => {
    if (!results) return;
    const nextOverrides = {
      ...(results.resultsOverrides ?? {}),
      [deptName]: candidateId
    };

    setLoadingResults(true);
    try {
      const res = await fetch("/api/election/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultsOverrides: nextOverrides }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to save winner override.");
      } else {
        fetchResults();
      }
    } catch {
      setError("Network error while saving winner override.");
    } finally {
      setLoadingResults(false);
    }
  };

  // ── 4. Toggle election status (fires after modal confirms) ───────────────
  const handleToggleConfirmed = async () => {
    setShowConfirm(false);
    setToggling(true);
    setToggleMessage(null);
    try {
      const res = await fetch("/api/election/toggle", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setToggleMessage(`Error: ${json.error}`);
      } else {
        setToggleMessage(json.message);
        if (json.isElectionOver !== undefined) {
          setIsElectionOver(json.isElectionOver);
        }
        // If we just reopened, clear cached results
        if (json.isReopening) setResults(null);
      }
    } catch {
      setToggleMessage("Network error. Please try again.");
    } finally {
      setToggling(false);
      setTimeout(() => setToggleMessage(null), 6000);
    }
  };

  const isLoading = isElectionOver === null;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "controls", label: "Election Controls", icon: <Vote className="h-4 w-4" /> },
    { key: "voters", label: "Voters", icon: <Users className="h-4 w-4" /> },
    { key: "candidates", label: "Candidates", icon: <Users className="h-4 w-4" /> },
    { key: "results", label: "Results", icon: <Trophy className="h-4 w-4" /> },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm font-medium">Verifying Google session status…</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 px-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 shadow-sm text-center max-w-lg w-full">
          <AlertCircle className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">HOD Election Portal Locked</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Access to the HOD election controls, candidates list, voters list, and results is restricted. Please sign in with an authorized Google account to unlock this section.
          </p>
          <button
            onClick={handleGoogleLogin}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors shadow-md w-full"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A5.71 5.71 0 0 1 8.24 11.8a5.71 5.71 0 0 1 5.75-5.73c2.47 0 4.12 1.055 5.067 1.968l2.42-2.354C19.983 4.29 17.24 3 13.99 3A8.99 8.99 0 0 0 5 11.99a8.99 8.99 0 0 0 8.99 9c5 0 8.22-3.47 8.22-8.25a8.2 8.2 0 0 0-.16-1.75H12.24Z" />
            </svg>
            Authenticate with Google
          </button>
        </div>
      </div>
    );
  }

  const userEmailLower = firebaseUser.email?.toLowerCase().trim() || "";
  if (!ALLOWED_RESULT_EMAILS.includes(userEmailLower)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 px-4">
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-8 shadow-sm text-center max-w-lg w-full">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">Access Denied</h3>
          <p className="text-sm text-red-600 dark:text-red-400 mb-2 font-medium">
            {firebaseUser.email} is not authorized to view the HOD Election section.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Only authorized officer accounts can manage this section.
          </p>
          <button
            onClick={handleGoogleLogout}
            className="inline-flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors w-full"
          >
            Sign Out &amp; Try Another Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6 px-4 lg:px-6">

          {/* ── Auth Success Header ── */}
          <div className="flex items-center justify-between gap-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              <span>Authenticated as: <strong>{firebaseUser.email}</strong> (HOD Election Officer)</span>
            </div>
            <button
              onClick={handleGoogleLogout}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Sign Out
            </button>
          </div>

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Vote className="h-7 w-7 text-indigo-600" />
                HOD Election Control
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage candidates, election status, and view weighted results.
              </p>
            </div>
            {!isLoading && <StatusBadge isOver={isElectionOver!} />}
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Two-Step Confirm Modal ── */}
          {showConfirm && isElectionOver !== null && (
            <ConfirmToggleModal
              isReopening={isElectionOver === true}
              onConfirm={handleToggleConfirmed}
              onCancel={() => setShowConfirm(false)}
            />
          )}

          {/* ── Election Status Card ── */}
          {activeTab === "controls" && (
            <div className="flex flex-col gap-6">
              {/* Status card */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Election Status
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {isLoading
                        ? "Loading..."
                        : isElectionOver
                          ? "Voting is closed. Results are now accessible."
                          : "Voting is currently open. Council members can cast their votes."}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={toggling || isLoading}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${isElectionOver
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                  >
                    {toggling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isElectionOver ? (
                      <ToggleLeft className="h-4 w-4" />
                    ) : (
                      <ToggleRight className="h-4 w-4" />
                    )}
                    {isElectionOver ? "Reopen Election" : "Close Election"}
                  </button>
                </div>

                {toggleMessage && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-4 py-2.5 text-sm text-blue-700 dark:text-blue-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {toggleMessage}
                  </div>
                )}
              </div>

              {/* Pending voters */}
              {(() => {
                const displayedPendingVoters = pendingVoters.filter(
                  (v) => !(secondaryInfo?.votedUidsInSecondary?.includes(v.uid))
                );

                return (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                      <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        Pending Voters
                      </h2>
                      <span className="rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2.5 py-0.5 text-sm font-semibold">
                        {displayedPendingVoters.length} remaining
                      </span>
                    </div>

                    {displayedPendingVoters.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-400 mb-3" />
                        <p className="font-medium text-gray-700 dark:text-gray-300">All members have voted!</p>
                        <p className="text-sm text-gray-400">100% participation achieved.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
                        {displayedPendingVoters.map((v) => (
                          <div key={v.uid} className="flex items-center justify-between px-6 py-3">
                            <div>
                              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{v.name}</p>
                              <p className="text-xs text-gray-400">{v.email}</p>
                            </div>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2.5 py-0.5">
                              {v.department}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Secondary Backup Database Controls */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-500" />
                      Overflow & Backup Database
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Voters automatically vote through the backup database if the main database exceeds its quota.
                    </p>
                  </div>
                  <button
                    onClick={fetchSecondaryStatus}
                    disabled={loadingSecondary}
                    className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 font-semibold"
                  >
                    {loadingSecondary ? "Refreshing..." : "Refresh Status"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-400 font-medium">Backup Database Seeding</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 flex items-center gap-1.5">
                      {secondaryInfo?.isSeeded ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          Seeded ({secondaryInfo.membersInSecondary} voters)
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />
                          Not Seeded
                        </>
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-400 font-medium">Pending Sync (Overflow Votes)</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 flex items-center gap-1.5">
                      {secondaryInfo?.pendingOverflowVotes && secondaryInfo.pendingOverflowVotes > 0 ? (
                        <>
                          <AlertCircle className="h-5 w-5 text-amber-500 animate-bounce" />
                          {secondaryInfo.pendingOverflowVotes} votes pending sync
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          All synced (0 pending)
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {secondaryInfo && 'isConfigured' in secondaryInfo && !(secondaryInfo as any).isConfigured && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-300 font-medium mb-4">
                    ⚠️ Backup Database is not configured. Please set the secondary database credentials in your Vercel/environment variables to enable overflow protection.
                  </div>
                )}

                {secondaryInfo?.pendingOverflowVotes && secondaryInfo.pendingOverflowVotes > 0 ? (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-300 font-medium mb-4">
                    ⚠️ There are {secondaryInfo.pendingOverflowVotes} votes recorded in the backup database that need to be synced back to the main database. This should be done once the main database daily quota resets.
                  </div>
                ) : null}

                {secondaryError && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-3 text-xs text-red-700 dark:text-red-300 font-medium mb-4">
                    ❌ {secondaryError}
                  </div>
                )}

                {secondaryMessage && (
                  <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-3 text-xs text-green-700 dark:text-green-300 font-medium mb-4">
                    {secondaryMessage}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSeedSecondary}
                    disabled={seedingSecondary}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-60"
                  >
                    {seedingSecondary && <Loader2 className="h-4 w-4 animate-spin" />}
                    Seed Backup Database
                  </button>

                  <button
                    onClick={handleSyncSecondary}
                    disabled={syncingSecondary || !secondaryInfo?.pendingOverflowVotes}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-60"
                  >
                    {syncingSecondary && <Loader2 className="h-4 w-4 animate-spin" />}
                    Sync Overflow → Main Database
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* ── Tab: Voters ── */}
          {activeTab === "voters" && <VotersTab secondaryInfo={secondaryInfo} />}

          {/* ── Tab: Candidates ── */}
          {activeTab === "candidates" && <CandidatesTab />}

          {/* ── Tab: Results ── */}
          {activeTab === "results" && (
            <div>
              {/* Header and Refresh Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Election Tally
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isElectionOver
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                    {isElectionOver ? "Final Results" : "Live Results"}
                  </span>
                </div>
                <button
                  onClick={fetchResults}
                  disabled={loadingResults}
                  className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors"
                >
                  {loadingResults ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  Refresh Results
                </button>
              </div>

              {/* Stats row */}
              {results && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-blue-500 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-1.5" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{results.totalVoters}</p>
                        <p className="text-xs text-gray-500">Total Eligible Voters</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-green-500 bg-green-50 dark:bg-green-900/30 rounded-lg p-1.5" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{results.totalVotesCast}</p>
                        <p className="text-xs text-gray-500">Ballots Cast</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-1.5" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {results.totalVoters > 0
                            ? `${Math.round((results.totalVotesCast / results.totalVoters) * 100)}%`
                            : "—"}
                        </p>
                        <p className="text-xs text-gray-500">Voter Turnout</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Controls Card */}
              {results && (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      Results Controls &amp; Publishing
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Publish winners to voters or reset the election data completely.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Publish status indicator & toggle */}
                    <div className="flex items-center gap-2 mr-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${results.isResultsPublished
                        ? "text-green-700 bg-green-50 dark:bg-green-950/20"
                        : "text-amber-700 bg-amber-50 dark:bg-amber-950/20"
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${results.isResultsPublished ? "bg-green-500" : "bg-amber-500"
                          }`} />
                        {results.isResultsPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <button
                      onClick={handlePublishToggle}
                      disabled={loadingResults}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all disabled:opacity-60 ${results.isResultsPublished
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                    >
                      {results.isResultsPublished ? (
                        <>
                          <ToggleLeft className="h-4 w-4" />
                          Unpublish Results
                        </>
                      ) : (
                        <>
                          <ToggleRight className="h-4 w-4" />
                          Publish Results to Voters
                        </>
                      )}
                    </button>

                    {/* Dedicated Wipe Votes */}
                    <button
                      onClick={handleWipeVotes}
                      disabled={loadingResults}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Wipe &amp; Reset All Votes
                    </button>
                  </div>
                </div>
              )}

              {/* Results Section Sub-Tabs */}
              {results && (
                <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 gap-6">
                  <button
                    onClick={() => setResultsSubTab("summary")}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all ${resultsSubTab === "summary"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Summary Results
                  </button>
                  <button
                    onClick={() => setResultsSubTab("audit")}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all ${resultsSubTab === "audit"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Detailed Votes Log (Who Voted Whom)
                  </button>
                </div>
              )}

              {resultsSubTab === "summary" ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    Weighted Election Results
                  </h2>

                  {loadingResults && (
                    <div className="flex items-center gap-3 text-gray-500 py-8">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Computing weighted scores…
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {results && !loadingResults && (
                    <div className="flex flex-col gap-4">
                      {results.departments.map((dept) => (
                        <DepartmentResultCard
                          key={dept.department}
                          dept={dept}
                          resultsOverrides={results.resultsOverrides ?? {}}
                          onOverride={handleOverrideWinner}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <FileText className="h-6 w-6 text-indigo-500" />
                    Detailed Ballots Audit Log
                  </h2>

                  {/* Audit Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Search Audit</label>
                      <input
                        type="text"
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        placeholder="Search voter or candidate name..."
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Department</label>
                      <select
                        value={auditDeptFilter}
                        onChange={(e) => setAuditDeptFilter(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="All">All Departments</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {results && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                              <th className="px-6 py-3">Voter Details</th>
                              <th className="px-6 py-3">Department Ballot</th>
                              <th className="px-6 py-3">Candidate Voted For</th>
                              <th className="px-6 py-3 text-center">Weight Applied</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {(() => {
                              const audits = (results.voterAudits ?? []).filter((item) => {
                                const searchLower = auditSearch.toLowerCase().trim();
                                const matchesSearch =
                                  !searchLower ||
                                  item.voterName.toLowerCase().includes(searchLower) ||
                                  item.voterEmail.toLowerCase().includes(searchLower) ||
                                  item.candidateName.toLowerCase().includes(searchLower);
                                const matchesDept =
                                  auditDeptFilter === "All" || item.candidateDepartment === auditDeptFilter;
                                return matchesSearch && matchesDept;
                              });

                              if (audits.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                      No audit logs found matching the filters.
                                    </td>
                                  </tr>
                                );
                              }

                              return audits.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="font-semibold text-gray-900 dark:text-gray-100">{a.voterName}</p>
                                      <p className="text-xs text-gray-400 font-mono mt-0.5">{a.voterEmail}</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full px-2.5 py-1">
                                      {a.candidateDepartment}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    {a.candidateName === "Nominee Unopposed" ? (
                                      <span className="text-gray-400 italic text-sm">{a.candidateName}</span>
                                    ) : (
                                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{a.candidateName}</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${a.weight >= 5
                                      ? "text-red-700 bg-red-50 dark:bg-red-950/20"
                                      : a.weight >= 3
                                        ? "text-amber-700 bg-amber-50 dark:bg-amber-950/20"
                                        : a.weight >= 2
                                          ? "text-blue-700 bg-blue-50 dark:bg-blue-950/20"
                                          : a.weight >= 1
                                            ? "text-gray-700 bg-gray-50 dark:bg-gray-800"
                                            : "text-gray-400 bg-gray-100 dark:bg-gray-800/40"
                                      }`}>
                                      +{a.weight} pts
                                    </span>
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
