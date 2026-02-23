"use client";
import React, { useEffect, useRef, useState } from "react";
import { stats } from "@/data/stats";

const StatItem = ({ end, label, isVisible }) => {
  // 1. Replace useState with useRef
  const numberRef = useRef(null);

  useEffect(() => {
    if (!isVisible || !numberRef.current) return;
    
    let startTime;
    const duration = 1500; // 1.5 seconds

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      const percentage = Math.min(progress / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - percentage, 3);
      const currentCount = Math.round(end * easeOutProgress);
      
      // 2. Directly update the DOM node's text. 
      // This happens instantly in the browser and completely skips the React render cycle!
      if (numberRef.current) {
        numberRef.current.innerText = currentCount.toLocaleString() + "+";
      }

      if (progress < duration) {
        requestAnimationFrame(updateCount);
      } else {
        // Ensure final number is exact
        if (numberRef.current) {
          numberRef.current.innerText = end.toLocaleString() + "+";
        }
      }
    };

    requestAnimationFrame(updateCount);

  }, [isVisible, end]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* 3. Attach the ref to the div and set the initial visible state to 0+ */}
      <div 
        ref={numberRef}
        className="sm:text-5xl text-4xl lg:text-7xl md:text-5xl font-oswald text-brown font-bold"
        style={{ willChange: "contents" }} // Hints the browser that this text will change rapidly
      >
        0+
      </div>
      <div className="mt-1 text-base font-oswald text-brown text-center">
        {label}
      </div>
    </div>
  );
};

export default function StatsCard() {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); 
        }
      },
      // Lowered threshold slightly so the animation triggers right as it enters view
      { threshold: 0.1 } 
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-[#80A6FF] rounded-3xl p-4 md:p-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-[80vw] mx-auto mt-10"
    >
      {stats.map((stat) => (
        <StatItem
          key={stat.label}
          end={stat.number}
          label={stat.label}
          isVisible={visible}
        />
      ))}
    </div>
  );
}