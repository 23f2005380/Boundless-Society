"use client";

import { Registration } from "./page";

type Props = {
  submissions: Registration[];
};

export default function SubmissionsTable({ submissions }: Props) {
  // Collect all unique formData keys across all submissions, filtering out document uploads
  const skipKeys = new Set([
    "Student ID Card Copy",
    "Aadhaar Card Copy",
    "Completed Consent Form",
  ]);
  const formDataKeys = Array.from(
    new Set(submissions.flatMap((s) => Object.keys(s.formData || {})))
  ).filter((k) => !skipKeys.has(k) && !k.startsWith("Completed Consent -"));

  const columns = ["#", "Email", "UID", "Submitted At", ...formDataKeys];

  return (
    <div
      className="w-full rounded-xl border border-black shadow-2xl overflow-x-scroll"
    >
      <table className="w-full text-sm">
        {/* Sticky header */}
        <thead className="sticky top-0 z-10 bg-gray-500 text-black uppercase text-xs tracking-widest">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-5 py-4 text-left font-semibold whitespace-nowrap border-b border-black first:sticky first:left-0 first:z-20 first:bg-gray-500 "
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="">
          {submissions.map((row, idx) => (
            <tr
              key={row.id}
              className="border-b border-black bg-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-100 group"
            >
              {/* Row number — sticky left */}
              <td className="px-5 py-3 sticky left-0 bg-gray-500 group-hover:bg-gray-800 z-10 whitespace-nowrap transition-colors duration-100">
                {idx + 1}
              </td>

              {/* Email */}
              <td className="px-5 py-3 text-blue-700 whitespace-nowrap">
                {row.email}
              </td>

              {/* UID */}
              <td className="px-5 py-3  whitespace-nowrap  text-xs">
                {row.uid}
              </td>

              {/* Submitted At */}
              <td className="px-5 py-3 whitespace-nowrap">
                {formatDate(row.submittedAt)}
              </td>

              {/* Dynamic formData columns */}
              {formDataKeys.map((key) => (
                <td
                  key={key}
                  className="px-5 py-3 whitespace-nowrap max-w-[240px] truncate"
                  title={row.formData[key] ?? "—"}
                >
                  {row.formData[key] ?? (
                    <span>—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value: string): string {
  if (!value) return "—";
  // Handle Firestore Timestamp-like objects (already converted to string)
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}