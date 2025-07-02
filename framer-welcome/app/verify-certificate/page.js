import React from "react";

export default function VerifyCertificate() {
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
            className="rounded-full px-4 py-3 text-center w-full max-w-xs mb-4 outline-none border border-black bg-amber-50"
          />
          <br />
          <button className="bg-[#4b0a1b] text-[#FFE252] mt-4 px-10 py-3 rounded-full text-lg font-medium hover:scale-105 transition">
            Click Here
          </button>
        </div>
      </div>
    </div>
  );
}
