"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const homeMenuItems = [
    { label: "Upcoming Trips", href: "#upcoming-trips" },
    { label: "Our Gallery", href: "#gallery" },
    { label: "Previous Trips", href: "#previous-trips" },
    { label: "Stats", href: "#stats" },
    { label: "About Us", href: "#about" },
    { label: "City Meetups", href: "/city-meetups" },
    { label: "Our Team", href: "/team-members" },
    { label: "Whatsapp groups", href: "/whatsapp-groups" },
    { label: "Verify Certificates", href: "/verify-certificate" },
    { label: "Trip Registration", href: "/trip-registration" },
  ];

  const otherMenuItems = [
    { label: "Home", href: "/" },
    { label: "Our Team", href: "/team-members" },
    { label: "Whatsapp groups", href: "/whatsapp-groups" },
    { label: "City Meetups", href: "/city-meetups" },
    { label: "Previous Trips", href: "/previous-trips" },
    { label: "Verify Certificates", href: "/verify-certificate" },
  ];

  const menuItems = pathname === "/" ? homeMenuItems : otherMenuItems;

  const handleMenuClick = (e: any, href: string) => {
    e.preventDefault();
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
    <header className="flex bg-transparent justify-between items-center p-4 md:p-6 relative z-10">
      <div className="w-15 h-15 bg-[#3B001B] rounded-full flex items-center justify-center overflow-hidden">
        <Image
          src="/Logo Bound.png"
          alt="Logo"
          width={56}
          height={56}
          className="object-contain"
        />
      </div>
      <div className="relative z-[1000]">
        <button
          className="bg-[#3B001B] text-white border-none px-6 py-2 rounded-2xl text-lg font-bold flex items-center hover:bg-[#3B001B] transition"
          onClick={() => setMenuOpen((v) => !v)}
        >
          MENU
        </button>
        {/* Dropdown Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-[999]"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.25, type: "spring" }}
              className="absolute right-0 mt-4 bg-[#FFE878] rounded-[48px] shadow-2xl px-10 py-8 flex flex-col gap-2 min-w-[300px] z-[1001]"
            >
              <div>
                {menuItems.map((item, i) => (
                  <div key={i}>
                    <a
                      href={item.href}
                      onClick={(e) => handleMenuClick(e, item.href)}
                      className="font-black text-2xl text-[#3B001B] py-1 px-2 transition-all duration-200 hover:pl-6 hover:text-[#9c1352] hover:scale-105 block"
                      style={{
                        fontFamily:
                          'Oswald, "Bebas Neue", Impact, "Arial Black", sans-serif',
                        letterSpacing: "0.02em",
                      }}
                    >
                      {item.label}
                    </a>
                    <div className="relative h-[2px] bg-[#3B001B]" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
