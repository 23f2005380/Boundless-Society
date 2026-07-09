"use client";
import React, { useMemo, useRef, useEffect } from "react";

// Recursive character renderer using standard JS Array.from instead of heavy grapheme-splitter
const renderChars = (node, keyPrefix, counter, textAccumulator) => {
  if (typeof node === "string") {
    textAccumulator.push(node); 
    const words = node.split(/(\s+)/);

    return words.map((word, wordIndex) => {
      // Use Array.from to correctly split standard string characters and emojis
      const chars = Array.from(word);
      return (
        <span 
          className="inline-flex" 
          key={`${keyPrefix}-w-${wordIndex}`}
          aria-hidden="true" 
        >
          {chars.map((char, i) => {
            // OPTIMIZATION: Do not animate or assign class names to empty space characters.
            // This reduces the number of active animation triggers by ~20% and prevents empty paints!
            if (char === " " || char === "\u00A0") {
              return (
                <span key={`${keyPrefix}-${wordIndex}-${i}`} aria-hidden="true">
                  &nbsp;
                </span>
              );
            }

            const delay = counter.value * 0.015; // slightly faster 15ms delay for crisper spring transition
            counter.value += 1;

            return (
              <span
                key={`${keyPrefix}-${wordIndex}-${i}`}
                className="char-node"
                style={{ animationDelay: `${delay}s` }}
              >
                {char}
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

  const { elements, rawText } = useMemo(() => {
    const counter = { value: 0 };
    const textAccumulator = [];
    const elements = React.Children.toArray(children).map((el, i) => 
      renderChars(el, `el-${i}`, counter, textAccumulator)
    );
    return { elements, rawText: textAccumulator.join("") };
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timeoutId;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Trigger the animation transition
          timeoutId = setTimeout(() => {
            el.classList.add("is-visible");
          }, 300);
        } else {
          // Reset the animation if you scroll away
          if (timeoutId) clearTimeout(timeoutId);
          el.classList.remove("is-visible");
        }
      },
      { threshold: 0.1 } 
    );

    observer.observe(el);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-label={rawText} 
      className="text-lg md:text-xl text-gray-800 leading-relaxed max-w-3xl mx-auto"
    >
      {elements}
    </div>
  );
};

export default AnimatedByChar;