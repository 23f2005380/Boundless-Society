"use client";
import React, { useEffect, useRef, useState } from "react";

const StatItem = ({ end, label, isVisible }) => {
  const numberRef = useRef(null);

  useEffect(() => {
    if (!isVisible || !numberRef.current) return;
    
    let startTime;
    let rafId; 
    let timeoutId; // Timeout to defer the start
    const duration = 1500; // 1.5 seconds

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      const percentage = Math.min(progress / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - percentage, 3);
      const currentCount = Math.round(end * easeOutProgress);
      
      if (numberRef.current) {
        numberRef.current.innerText = currentCount.toLocaleString() + "+";
      }

      if (progress < duration) {
        rafId = requestAnimationFrame(updateCount);
      } else {
        if (numberRef.current) {
          numberRef.current.innerText = end.toLocaleString() + "+";
        }
      }
    };

    // Wait 150ms before starting the heavy number crunching
    // This allows the scroll motion to complete smoothly first!
    timeoutId = setTimeout(() => {
      rafId = requestAnimationFrame(updateCount);
    }, 150);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };

  }, [isVisible, end]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div 
        ref={numberRef}
        className="sm:text-5xl text-4xl lg:text-7xl md:text-5xl font-oswald text-brown font-bold"
        style={{ 
          // Forces all numbers to be the exact same width.
          // This prevents the browser from recalculating layout 60x a second!
          fontVariantNumeric: "tabular-nums", 
        }} 
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
  const [statsData, setStatsData] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/proud-stats");
        if (res.ok) {
          const data = await res.json();
          setStatsData(data.stats || []);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); 
        }
      },
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
      {statsData.map((stat) => (
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