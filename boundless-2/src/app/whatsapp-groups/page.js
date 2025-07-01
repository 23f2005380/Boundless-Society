"use client";
import GroupCard from "@/components/GroupCard";
import React from "react";
import { whatsappGroups } from "@/data/whatsapp";
import { delay, motion } from "framer-motion";

const cardAnimation = {
  initial: { rotate: 0, scale: 0.95, opacity: 0 },
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
function page() {
  return (
    <>
      <main className="bg-amber-50 relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `
      repeating-radial-gradient(circle at center 60%, #fae2e3 0px, #fcefe6 35px, #fae2e3 38px)`,
            maskImage: `
      linear-gradient(to top, black 40%, transparent 98%)
    `,
            WebkitMaskImage: `
      linear-gradient(to top, black 40%, transparent 98%)
    `,
          }}
        ></div>
        <div className="w-fit mx-auto p-10 flex flex-wrap justify-center gap-x-10 gap-y-10">
          {whatsappGroups.map((group, idx) => (
            <motion.div
              variants={cardAnimation}
              initial="initial"
              whileInView={`${idx % 2 == 0 ? "even" : "odd"}`}
              // className={`${idx % 2 == 0 ? "rotate-2" : "-rotate-2"}`}
              key={idx}
            >
              <GroupCard data={group} />
            </motion.div>
          ))}
        </div>
      </main>
    </>
  );
}

export default page;
