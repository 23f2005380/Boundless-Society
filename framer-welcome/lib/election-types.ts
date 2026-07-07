// lib/election-types.ts
// Shared TypeScript interfaces for the HOD Elections feature

export interface CouncilMember {
  uid: string;
  email: string;
  name: string;
  department: string;
  isPreviousHOD: boolean;
  isContestingAgain: boolean;
  hasVoted: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  email: string; // Linked email address of the voter
  department: string;
  manifesto: string;
  photoUrl?: string; // Optional candidate photo (URL or base64)
}

export interface Vote {
  voterUid: string;
  voterDepartment: string;
  candidateId: string;
  candidateDepartment: string;
  timestamp: unknown; // Firestore Timestamp
}

export interface ElectionStatus {
  isElectionOver: boolean;
}

export interface CandidateResult {
  candidateId: string;
  name: string;
  department: string;
  score: number;
  voteBreakdown: {
    sameHODVotes: number;      // +5 points each
    otherHODVotes: number;     // +3 points each
    sameDeptVotes: number;     // +2 points each
    otherDeptVotes: number;    // +1 point each
  };
  photoUrl?: string;
}

export interface DepartmentResult {
  department: string;
  winner: CandidateResult | null;
  candidates: CandidateResult[];
}

export interface VoteAudit {
  id: string;
  voterName: string;
  voterEmail: string;
  voterDepartment: string;
  candidateName: string;
  candidateDepartment: string;
  weight: number;
}

export interface ElectionResults {
  isElectionOver: boolean;
  totalVoters: number;
  totalVotesCast: number;
  departments: DepartmentResult[];
  voterAudits?: VoteAudit[];
  isResultsPublished?: boolean;
  resultsOverrides?: Record<string, string>;
}

export const DEPARTMENTS = [
  "Trip Coordination",
  "City Operations",
  "Research & Outreach",
  "Technical Team",
  "Graphics Team",
  "Media Team",
  "Females Corner",
] as const;

export type Department = (typeof DEPARTMENTS)[number];
