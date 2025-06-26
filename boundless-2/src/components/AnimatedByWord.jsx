"use client";
import React from "react";
import { motion } from "framer-motion";

const AnimatedByChar = ({ text }) => {
  const characters = text.split("");

  const container = {
    hidden: { opacity: 1 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.04 * i,
      },
    }),
  };

  const child = {
    hidden: {
      opacity: 0,
      scale: 0.3,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 8,
        stiffness: 260,
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
        <motion.span
          key={index}
          variants={child}
          className="inline-block whitespace-pre"
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default AnimatedByChar;
