"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // On route change complete → hide loader
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (loading) {
      setVisible(true);
    } else {
      // Fade out after a short delay to allow animation
      const timer = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Intercept link clicks to show loader
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Only trigger for internal navigation links
      const isInternal =
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !target.getAttribute("target");

      if (isInternal && href !== pathname) {
        setLoading(true);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg-white transition-opacity duration-[400ms] ${
        loading ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Outer counter-clockwise ring */}
      <div className="relative flex items-center justify-center mb-10">
        <div className="absolute h-24 w-24 rounded-full border-[5px] border-cream border-t-brown animate-spin-reverse" />
        {/* Inner clockwise spinner */}
        <div className="absolute h-14 w-14 rounded-full border-[3px] border-transparent border-t-brown/40 animate-spin" />
        <Loader2 className="h-8 w-8 text-brown/70 animate-spin" />
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-brown animate-pulse nosifer-regular tracking-wider">
        BOUNDLESS...
      </h1>
    </div>
  );
}
