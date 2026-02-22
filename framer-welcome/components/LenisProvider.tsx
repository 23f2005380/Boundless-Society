"use client";

import React, { useEffect, useRef } from "react";
// Import directly from the modern lenis package (which also includes built-in TypeScript types!)
import { ReactLenis } from "lenis/react";
import { frame } from "framer-motion";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<any>(null);

  // OPTIMIZATION: Sync Lenis with Framer Motion's animation loop
  useEffect(() => {
    // Framer Motion 11+ passes a FrameData object rather than a raw number
    function update(data: any) {
      // Extract the timestamp from the Framer Motion data object
      const time = data?.timestamp || performance.now();
      lenisRef.current?.lenis?.raf(time);
    }
    
    // Injects Lenis into the Framer Motion pipeline
    frame.update(update, true);

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      autoRaf={false} 
      options={{
        lerp: 0.08, 
        duration: 1.2, 
        smoothWheel: true, 
        syncTouch: false, 
        wheelMultiplier: 1, 
      }}
    >
      {children}
    </ReactLenis>
  );
}