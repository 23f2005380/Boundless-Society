"use client"

import React, { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export default function VerifyCertificate() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState(null); // null | "verified" | "not-verified" | "checking"

  async function handleVerify() {
    if (!input) return;
    setStatus("checking");
    const ref = doc(db, "certificates", input.trim());
    const snap = await getDoc(ref);
    setStatus(snap.exists() ? "verified" : "not-verified");
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
              ✅ Certificate Verified!
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
