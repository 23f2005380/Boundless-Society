"use client";

import { useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import Image from "next/image";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const menuItems = [
    { label: "Upcoming Trips", href: "#upcoming-trips" },
    { label: "Our Gallery", href: "#gallery" },
    { label: "Previous Trips", href: "#previous-trips" },
    { label: "Stats", href: "#stats" },
    { label: "About Us", href: "#about" },
    { label: "City Meetups", href: "/city-meetups" },
    { label: "Our Team", href: "/team-members" },
    { label: "Whatsapp groups", href: "/whatsapp-groups" },
    { label: "Verify Certificates", href: "/verify-certificate" },
    //{ label: "Trip Registration", href: "/trip-registration" },
  ];
  
  const { scrollY } = useScroll();

  // Framer Motion efficiently tracks scroll without causing layout thrashing
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    
    // Background color toggle
    setIsScrolled(latest > 100);

    // Hide/Show header logic
    if (latest > previous && latest > 300 && !menuOpen) {
      setHidden(true); // Scrolling down
    } else {
      setHidden(false); // Scrolling up
    }
  });

  const handleMenuClick = (href) => {
    setMenuOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 40;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    } else {
      window.location.href = href;
    }
  };

  return (
    <>
      <AnimatePresence>
        {menuOpen && (
          <motion.button
            type="button"
            aria-label="Close menu overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 bg-black/30 z-[10000]"
          />
        )}
      </AnimatePresence>

      <motion.header
        variants={{
          visible: { y: "0%" },
          hidden: { y: "-110%" }
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        // Use standard Tailwind classes for the background transition
        className={`flex justify-between items-center p-4 md:p-6 fixed w-full top-0 z-[9999] transition-colors duration-300 ${
          isScrolled ? "bg-amber-50 shadow-md" : "bg-transparent"
        }`}
      >
        <div className="w-15 h-15 bg-[#3B001B] rounded-full flex items-center justify-center overflow-hidden">
          <Image src="/Logo Bound.png" alt="Logo" width={56} height={56} className="object-contain" />
        </div>

        <div className="relative">
          <button
            className="bg-[#3B001B] text-white border-none px-6 py-2 rounded-2xl text-lg font-bold hover:opacity-90 active:scale-95 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            MENU
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            className="fixed right-4 md:right-6 top-20 md:top-24 bg-[#FFE878] rounded-[40px] shadow-2xl px-8 py-7 min-w-[280px] z-[10001]"
          >
            {menuItems.map((item) => (
              <div key={item.label}>
                <button
                  onClick={() => handleMenuClick(item.href)}
                  className="font-black text-xl leading-none text-[#3B001B] py-0.5 px-2 transition-all duration-200 hover:pl-5 hover:text-[#9c1352] hover:scale-105 text-left w-full"
                  style={{
                    fontFamily:
                      "Oswald, Bebas Neue, Impact, Arial Black, sans-serif",
                    letterSpacing: "0.02em",
                  }}
                >
                  {item.label}
                </button>
                <div className="relative h-[1px] bg-[#3B001B] overflow-visible" />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
