"use client";

import React from "react";
import { ReactLenis } from "lenis/react";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      autoRaf={true} // The library handles the animation frame perfectly
      options={{
        lerp: 0.1, 
        duration: 1.2, 
        smoothWheel: true, 
        syncTouch: true,
        wheelMultiplier: 1, 
        touchMultiplier: 2, // Optional: Improves trackpad/mobile feel
      }}
    >
      {children}
    </ReactLenis>
  );
}