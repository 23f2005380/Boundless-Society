"use client";
import React from "react";
import { motion } from "framer-motion";
import GroupCard from "@/components/GroupCard";
import {officialGroups, girlsGroups,regionalGroups,} from "@/data/whatsapp";
import "./page.css";

const cardAnimation = {
  initial: {
    rotate: 0,
    scale: 0.95,
    opacity: 0,
  },
  even: {
    rotate: 5,
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
    rotate: -5,
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

const GroupSection = ({ title, groups, startIndex = 0 }) => {
  return (
    <section className="mb-12">
      <h2 className="section-title">{title}</h2>

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

function Page() {
  return (
    <main className="bg-amber-50 relative overflow-hidden min-h-screen">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none background-pattern"
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 md:py-16">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="page-title">WhatsApp Communities</h1>

          <p className="page-subtitle">
            Join regional groups and official channels for updates and support.
          </p>
        </header>

        <GroupSection
          title="Official Boundless Channel Spaces"
          groups={officialGroups}
          startIndex={0}
        />

        <GroupSection
          title="Boundless Girls Community"
          groups={girlsGroups}
          startIndex={officialGroups.length}
        />

        <GroupSection
          title="Regional Space"
          groups={regionalGroups}
          startIndex={officialGroups.length + girlsGroups.length}
        />
      </div>
    </main>
  );
}

export default Page;
