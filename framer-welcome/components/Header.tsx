"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const menuItems = [
    
    { label: "Upcoming Trips", href: "#upcoming-trips" },
    { label: "Our Gallery", href: "#gallery" },
    { label: "Previous Trips", href: "#previous-trips" },
    { label: "About Us", href: "#about" },
    { label: "City Meetups", href: "/city-meetups" },
 
    { label: "Our Team", href: "/team-members" },
    { label: "Whatsapp groups", href: "/whatsapp-groups" },
    { label: "Verify Certificates", href: "/verify-certificates" }
  ];

  // Smooth scroll handler
  const handleMenuClick = (href: string) => {
    setMenuOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 40; // adjust offset if you have a fixed header
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    } else {
      window.location.href = href;
    }
  };

  return (
    <header className="flex bg-transparent justify-between items-center p-4 md:p-6 relative z-10">
      <div className="w-15 h-15 bg-[#3B001B] rounded-full flex items-center justify-center">
        <img
          src="/Logo Bound.png"
          alt="Logo"
          className="w-14 h-14 object-contain rounded-full"
        />
      </div>
      <div className="relative">
        <button
          className="bg-[#3B001B] text-white border-none hover:bg-[#3B001B] px-6 py-2 rounded-2xl text-lg font-bold flex items-center transition"
          onClick={() => setMenuOpen((v) => !v)}
        >
          MENU
        </button>
        {/* Dropdown Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.25, type: "spring" }}
              className="absolute right-0 mt-4 bg-[#FFE878] rounded-[48px] shadow-2xl px-10 py-8 flex flex-col gap-2 min-w-[300px] z-50000"
            >
              {menuItems.map((item, i) => (
                <div key={item.label}>
                  <button
                    onClick={() => handleMenuClick(item.href)}
                    className="font-black text-2xl text-[#3B001B] py-1 px-2 transition-all duration-200 hover:pl-6 hover:text-[#9c1352] hover:scale-105 text-left w-full"
                    style={{
                      fontFamily:
                        "Oswald, Bebas Neue, Impact, Arial Black, sans-serif",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {item.label}
                  </button>
                  <div className="relative h-[2px] bg-[#3B001B] overflow-visible"></div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
