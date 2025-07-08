"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode } from "react";

const easing = (t: number) => 1 - Math.pow(1 - t, 3);

export default function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.5,
        easing,
        touchMultiplier: 1.5,
      }}
    >
      {children}
    </ReactLenis>
  );
}
