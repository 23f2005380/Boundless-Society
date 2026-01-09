"use client";

import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="relative z-10 flex flex-col items-center justify-center bg-cream min-h-screen px-4 text-center">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
      repeating-radial-gradient(circle at center 60%, #fae2e3 0px, #fcefe6 35px, #fae2e3 38px)`,
          maskImage: `
      linear-gradient(to top, black 40%, transparent 98%)
    `,
          WebkitMaskImage: `
      linear-gradient(to top, black 40%, transparent 98%)
    `,
        }}
      ></div>
      <div className="w-[300px] h-[300px] z-10 md:w-[400px] md:h-[400px]">
        <DotLottieReact
          src="https://lottie.host/3f1bda9b-14c4-4f28-ab37-90816b55fb72/KXSk6VmD5W.lottie"
          loop
          autoplay
        />
      </div>

      <h1 className="text-6xl md:text-7xl z-10 font-semibold mt-3 text-brown font-oswald">
        Hey! Traveller,
        <div className="text-4xl mt-3 md:mt-6">looks like you're lost!!!</div>
      </h1>

      <button
        className="w-[150px] rotate-[-2deg] origin-center text-[15px] font-gochi text-black cursor-pointer rounded-[5px] shadow-md transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] bg-[#5cdb95] border-none pb-[3px] active:translate-y-[5px] active:pb-0 mt-10"
        onClick={() => router.push("/")}
      >
        <span className="block px-4 py-2 bg-[#f1f5f8] rounded-[5px] border-2 border-[#494a4b]">
          Go To home
        </span>
      </button>
    </div>
  );
}
