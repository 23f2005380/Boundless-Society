"use client";
import React from "react";
import { motion } from "framer-motion";
import GraphemeSplitter from "grapheme-splitter";

const splitter = new GraphemeSplitter();

const container = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.06 * i,
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

// Recursive character renderer preserving tags
const renderChars = (node, keyPrefix = "") => {
  if (typeof node === "string") {
    const words = node.split(/(\s+)/); // preserve spaces

    return words.map((word, wordIndex) => {
      const chars = splitter.splitGraphemes(word);
      return (
        <span className="inline-flex" key={`${keyPrefix}-word-${wordIndex}`}>
          {chars.map((char, i) => (
            <motion.span
              key={`${keyPrefix}-${wordIndex}-${i}`}
              variants={child}
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </span>
      );
    });
  }

  if (React.isValidElement(node)) {
    const children = React.Children.toArray(node.props.children);
    return React.createElement(
      node.type,
      { ...node.props, key: keyPrefix },
      children.flatMap((child, i) => renderChars(child, `${keyPrefix}-${i}`))
    );
  }

  return null;
};

const AnimatedByChar = ({ children }) => {
  const elements = React.Children.toArray(children);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      custom={1}
      className="text-lg md:text-xl text-gray-800 leading-relaxed max-w-3xl mx-auto"
    >
      {elements.map((el, i) => renderChars(el, `el-${i}`))}
    </motion.div>
  );
};

export default AnimatedByChar;
