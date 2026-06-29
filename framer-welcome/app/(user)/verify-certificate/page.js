"use client";

import React, { useState } from "react";

// Firebase lookup disabled; verify via local CSV file instead.
// import { realtimeDb as db, isFirebaseEnabled } from "@/lib/firebase";
// import { ref, get } from "firebase/database";

const CSV_URL = "/Boundless Certificates.csv";

function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")))
    .filter((cols) => cols.length >= 3)
    .map(([name, email, certificateNumber]) => ({
      name,
      email,
      certificateNumber,
    }))
    .filter(
      (row) =>
        row.certificateNumber &&
        row.certificateNumber.toLowerCase() !== "certificate number"
    );
}

export default function VerifyCertificate() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState(null); // "verified", "not-verified", "checking", null
  const [name, setName] = useState("");

  function sanitizeKey(key) {
    return key.trim();
  }

  async function handleVerify() {
    if (!input) return;

    setStatus("checking");
    setName("");

    const sanitizedInput = sanitizeKey(input).toLowerCase();

    try {
      const response = await fetch(encodeURI(CSV_URL));
      if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.status}`);
      }

      const csvText = await response.text();
      const records = parseCsv(csvText);
      const match = records.find(
        (record) => record.certificateNumber.toLowerCase() === sanitizedInput
      );

      if (match) {
        setName(match.name || "");
        setStatus("verified");
      } else {
        setStatus("not-verified");
      }
    } catch (error) {
      console.error("Error reading certificate CSV:", error);
      setStatus("not-verified");
    }
  }

  return (
    <div className="bg-amber-50">
      <div className="w-full h-[100vh] flex justify-center items-center relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(#00000010 2px, transparent 1px),
              linear-gradient(to right, #00000010 2px, transparent 1px),
              linear-gradient(#00000010 3px, transparent 1px),
              linear-gradient(to right, #00000010 3px, transparent 1px)
            `,
            backgroundSize: `
              20px 20px,
              20px 20px,
              120px 120px,
              120px 120px
            `,
            backgroundColor: "#fffbeb",
            maskImage: `linear-gradient(to top, black 5%, transparent 100%)`,
            WebkitMaskImage: `linear-gradient(to top, black 5%, transparent 100%)`,
          }}
        ></div>

        <div className="z-10 bg-[#FFE252] rounded-[50px] px-8 py-20 border border-black text-center max-w-3xl w-full">
          <h2 className="text-3xl md:text-6xl font-bold mb-10 font-pacifico">
            Verify Your Certificates
          </h2>
          <input
            type="text"
            placeholder="Enter Certificate Number"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setStatus(null);
              setName("");
            }}
            className="rounded-full px-4 py-3 text-center w-full max-w-xs mb-4 outline-none border border-black bg-amber-50"
          />
          <br />
          <button
            className="bg-[#4b0a1b] text-[#FFE252] mt-4 px-10 py-3 rounded-full text-lg font-medium hover:scale-105 transition"
            onClick={handleVerify}
            disabled={status === "checking"}
          >
            {status === "checking" ? "Checking..." : "Click Here"}
          </button>

          {status === "verified" && (
            <div className="mt-6 text-green-700 text-xl font-bold">
              🎉 Congratulations {name}, your certificate is verified!
            </div>
          )}
          {status === "not-verified" && (
            <div className="mt-6 text-red-700 text-xl font-bold">
              ❌ Not Verified
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
