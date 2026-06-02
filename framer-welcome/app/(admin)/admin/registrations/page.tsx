"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SubmissionsTable from "./SubmissionsTable";

export type Submission = {
  id: string;
  email: string;
  uid: string;
  submittedAt: string;
  formData: Record<string, string>;
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const q = query(
          collection(db, "user-registrations"),
          orderBy("submittedAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data: Submission[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            email: d.email ?? "",
            uid: d.uid ?? "",
            submittedAt: d["submitted at"] ?? "",
            formData: d.formData ?? {},
          };
        });
        console.log(data)
        setSubmissions(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load submissions. Check your Firestore config.");
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, []);

  return (
    <main className="h-dvh max-w-5xl bg-white text-black p-6 ">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          📋 Registrations
        </h1>
        <p className="text-sm mt-1">
          {loading ? "Loading..." : `${submissions.length} total entries`}
        </p>
      </div>

      {error && (
        <div className="border border-red-500 text-red-500 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          Fetching submissions...
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          No submissions found.
        </div>
      ) : (
        <SubmissionsTable submissions={submissions} />
      )}
    </main>
  );
}