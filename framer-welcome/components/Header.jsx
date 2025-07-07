"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isTop, setIsTop] = useState(true);

  // Hide/show on scroll
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 300) {
      setHidden(true);
    } else {
      setHidden(false);
    }

    if (latest < 100) {
      setIsTop(true);
    } else {
      setIsTop(false);
    }
  });

  const menuItems = [
    { label: "About Us", href: "#about" },
    { label: "Upcoming Trips", href: "#upcoming-trips" },
    { label: "Our Gallery", href: "#gallery" },
    { label: "Previous Trips", href: "#previous-trips" },
    { label: "City Meetups", href: "#city-meetups" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Our Team", href: "#team" },
    { label: "Whatsapp groups", href: "/whatsapp-groups" },
    { label: "Verify Certificates", href: "verify-certificate" },
  ];

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={menuOpen || !hidden ? { y: 0 } : { y: "-120%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`flex justify-between items-center p-4 md:p-6 fixed w-full top-0 z-[9999] transition-colors duration-300 ${
        isTop ? "bg-transparent" : "bg-amber-50"
      }`}
    >
      {/* Logo */}
      <div className="w-15 h-15 bg-[#3B001B] rounded-full flex items-center justify-center">
        <img
          src="/Logo Bound.png"
          alt="Logo"
          className="w-14 h-14 object-contain rounded-full"
        />
      </div>

      {/* Menu Button */}
      <div className="relative z-[1000]">
        <button
          className="bg-[#3B001B] text-white border-none hover:bg-[#3B001B] px-6 py-2 rounded-2xl text-lg font-bold flex items-center transition"
          onClick={() => setMenuOpen((v) => !v)}
        >
          MENU
        </button>

        {/* Overlay */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-[999]"
              onClick={() => setMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.25, type: "spring" }}
              className="absolute right-0 mt-4 bg-[#FFE878] rounded-[48px] shadow-2xl px-10 py-8 flex flex-col gap-2 min-w-[300px] z-[1001]"
            >
              {menuItems.map((item, i) => (
                <div key={i}>
                  <a
                    href={item.href}
                    className="font-black text-2xl text-[#3B001B] py-1 px-2 transition-all duration-200 hover:pl-6 hover:text-[#9c1352] hover:scale-105"
                    style={{
                      fontFamily:
                        "Oswald, Bebas Neue, Impact, Arial Black, sans-serif",
                      letterSpacing: "0.02em",
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                  <div className="relative h-[2px] bg-[#3B001B]" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
