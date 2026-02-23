"use client";
import React, { useMemo, useRef, useEffect } from "react";
import GraphemeSplitter from "grapheme-splitter";

const splitter = new GraphemeSplitter();

// Recursive character renderer
const renderChars = (node, keyPrefix, counter, textAccumulator) => {
  if (typeof node === "string") {
    textAccumulator.push(node); // Save plain text for screen readers
    const words = node.split(/(\s+)/);

    return words.map((word, wordIndex) => {
      const chars = splitter.splitGraphemes(word);
      return (
        <span 
          className="inline-flex" 
          key={`${keyPrefix}-w-${wordIndex}`}
          aria-hidden="true" // Hide these fragmented spans from screen readers
        >
          {chars.map((char, i) => {
            const delay = counter.value * 0.02; 
            if (char !== " ") counter.value += 1;

            return (
              <span
                key={`${keyPrefix}-${wordIndex}-${i}`}
                className="char-node"
                style={{ animationDelay: `${delay}s` }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            );
          })}
        </span>
      );
    });
  }

  if (React.isValidElement(node)) {
    const children = React.Children.toArray(node.props.children);
    return React.createElement(
      node.type,
      { ...node.props, key: keyPrefix, "aria-hidden": "true" },
      children.flatMap((child, i) => renderChars(child, `${keyPrefix}-${i}`, counter, textAccumulator))
    );
  }

  return null;
};

const AnimatedByChar = ({ children }) => {
  const containerRef = useRef(null);

  // 1. Build the DOM nodes and accumulate plain text exactly once
  const { elements, rawText } = useMemo(() => {
    const counter = { value: 0 };
    const textAccumulator = [];
    const elements = React.Children.toArray(children).map((el, i) => 
      renderChars(el, `el-${i}`, counter, textAccumulator)
    );
    return { elements, rawText: textAccumulator.join("") };
  }, [children]);

  // 2. Native Vanilla JS Observer (Bypasses React entirely during scroll)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // We directly mutate the DOM classList. 
        // React doesn't know about this, meaning 0 re-renders!
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
        } else {
          el.classList.remove("is-visible");
        }
      },
      { threshold: 0.1 } // Triggers when 10% visible
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      // Added sr-only (Screen Reader Only) text so visually impaired users can read the paragraph seamlessly
      aria-label={rawText} 
      className="text-lg md:text-xl text-gray-800 leading-relaxed max-w-3xl mx-auto"
    >
      {elements}
    </div>
  );
};

export default AnimatedByChar;