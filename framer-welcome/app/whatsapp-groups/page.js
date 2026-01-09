"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

import GroupCard from "@/components/GroupCard";
import {
  officialGroups,
  girlsGroups,
  regionalGroups,
} from "@/data/whatsapp";

import "./page.css";

/* ---------------- Animations ---------------- */

const cardAnimation = {
  initial: {
    scale: 0.95,
    opacity: 0,
  },
  even: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 10,
      stiffness: 200,
      delay: 0.5,
    },
  },
  odd: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 10,
      stiffness: 200,
    },
    viewport: { once: true },
  },
};

/* ---------------- Reusable Section ---------------- */

const GroupSection = ({ title, groups, startIndex = 0 }) => {
  return (
    <section className="mb-12">
      {title && <h2 className="section-title">{title}</h2>}

      <div className="centered-flex-container">
        {groups.map((group, idx) => (
          <motion.div
            key={idx}
            variants={cardAnimation}
            initial="initial"
            whileInView={(startIndex + idx) % 2 === 0 ? "even" : "odd"}
            className="flex-item flex justify-center"
          >
            <div className="card-height-wrapper w-full">
              <GroupCard data={group} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

/* ---------------- Page ---------------- */

export default function Page() {
  const [regionalSearch, setRegionalSearch] = useState("");

  const filteredRegionalGroups = regionalGroups.filter((group) => {
    if (!regionalSearch.trim()) return true;

    const query = regionalSearch.toLowerCase();

    return (
      group.city.toLowerCase().includes(query) ||
      (group.keywords &&
        group.keywords.some((keyword) =>
          keyword.toLowerCase().includes(query)
        ))
    );
  });

  return (
    <main className="bg-amber-50 relative overflow-hidden min-h-screen">
     
      <div className="absolute inset-0 z-0 pointer-events-none background-pattern" />

     
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 md:py-16">
        
        <header className="text-center mb-8">
          <h1 className="page-title">WhatsApp Communities</h1>
          <p className="page-subtitle">
            Join regional groups and official channels for updates and support.
          </p>
        </header>

        <GroupSection
          title="Official Boundless Spaces"
          groups={officialGroups}
          startIndex={0}
        />


        <GroupSection
          title="Boundless Girls Community"
          groups={girlsGroups}
          startIndex={officialGroups.length}
        />

        <section className="mb-12">
          <h2 className="section-title">Regional Space</h2>

          {/*Search Bar */}
          <div className="flex justify-center mb-8">
  <div className="relative w-full max-w-md">

    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </span>

    {/* Input */}
    <input
      type="text"
      placeholder="Search state or city (e.g. Maharashtra, Nagpur)"
      value={regionalSearch}
      onChange={(e) => setRegionalSearch(e.target.value)}
      className="
        w-full
        pl-12
        pr-5
        py-3
        rounded-full
        border
        border-black
        bg-[#ffe680]
        text-center
        outline-none
        placeholder-gray-700
        focus:ring-2
        focus:ring-black
      "
    />
  </div>
</div>


          <GroupSection
            title=""
            groups={filteredRegionalGroups}
            startIndex={officialGroups.length + girlsGroups.length}
          />
        </section>
      </div>
    </main>
  );
}
