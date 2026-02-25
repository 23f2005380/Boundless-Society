"use client";

import React, { useEffect, useRef } from "react";
import { ReactLenis } from "lenis/react";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;

    // Direct browser loop ensures the scroll engine never stops
    function update(time: number) {
      lenis.raf(time);
      requestAnimationFrame(update);
    }

    const rafId = requestAnimationFrame(update);

    // Force a resize calculation to detect content height correctly
    lenis.resize();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      autoRaf={false} 
      options={{
        lerp: 0.1, 
        duration: 1.2, 
        smoothWheel: true, 
        syncTouch: true,
        wheelMultiplier: 1, 
      }}
    >
      {children}
    </ReactLenis>
  );
}