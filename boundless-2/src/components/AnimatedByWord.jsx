"use client";
import React from "react";
import { motion } from "framer-motion";

const AnimatedByChar = ({ text }) => {
  const characters = text.split("");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.15 * i,
      },
    }),
  };

  const child = {
    hidden: {
      opacity: 0,
      scale: 0.1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 400,
      },
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 400,
      },
    },
  };

  return (
    <motion.div
      className="overflow-hidden flex flex-wrap justify-center"
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={1}
    >
      {characters.map((char, index) => (
        <motion.span key={index} variants={child} className="inline-block">
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default AnimatedByChar;
