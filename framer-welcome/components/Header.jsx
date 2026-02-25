"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateHeader = () => {
      if (!headerRef.current) return;
      const currentScrollY = window.scrollY;

      // Toggle Background - Direct DOM is faster than React State for high-freq scroll
      if (currentScrollY < 100) {
        headerRef.current.classList.add("bg-transparent");
        headerRef.current.classList.remove("bg-amber-50", "shadow-md");
      } else {
        headerRef.current.classList.add("bg-amber-50", "shadow-md");
        headerRef.current.classList.remove("bg-transparent");
      }

      // Hide/Show Logic
      if (!headerRef.current.dataset.menuOpen) {
        if (currentScrollY > lastScrollY && currentScrollY > 300) {
          headerRef.current.style.transform = "translateY(-110%)";
        } else {
          headerRef.current.style.transform = "translateY(0%)";
        }
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      style={{ 
        willChange: "transform", // Forces GPU layer
        transform: "translateY(0%)",
        transition: "transform 0.3s ease-in-out, background-color 0.3s ease" 
      }}
      className="flex justify-between items-center p-4 md:p-6 fixed w-full top-0 z-[9999] bg-transparent"
    >
      <div className="w-15 h-15 bg-[#3B001B] rounded-full flex items-center justify-center">
        <Image src="/Logo Bound.png" alt="Logo" width={56} height={56} className="object-contain rounded-full" />
      </div>

      <div className="relative z-[1000]">
        <button
          className="bg-[#3B001B] text-white border-none px-6 py-2 rounded-2xl text-lg font-bold hover:opacity-90 active:scale-95 transition-all"
          onClick={() => {
            setMenuOpen(!menuOpen);
            if (headerRef.current) headerRef.current.dataset.menuOpen = !menuOpen ? "true" : "";
          }}
        >
          MENU
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute right-0 mt-4 bg-[#FFE878] rounded-[48px] shadow-2xl px-10 py-8 min-w-[300px]"
            >
              {/* Menu items here mapping from your data */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
