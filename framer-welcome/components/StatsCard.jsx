import React, { useEffect, useRef, useState } from "react";
import { stats } from "@/data/stats";

const StatItem = ({ end, label, isVisible }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    
    let startTime;
    const duration = 1500; // 1.5 seconds

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      // Calculate how far along the animation is (between 0 and 1)
      const percentage = Math.min(progress / duration, 1);
      
      // Use easeOut logic so the numbers slow down as they reach the end
      const easeOutProgress = 1 - Math.pow(1 - percentage, 3);
      
      const currentCount = Math.round(end * easeOutProgress);
      setCount(currentCount);

      if (progress < duration) {
        requestAnimationFrame(updateCount); // Syncs perfectly with 60FPS monitor
      } else {
        setCount(end); // Ensure it finishes exactly on the target number
      }
    };

    // Start the animation
    requestAnimationFrame(updateCount);

  }, [isVisible, end]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="sm:text-5xl text-4xl lg:text-7xl md:text-5xl font-oswald text-brown font-bold">
        {count.toLocaleString()}+
      </div>
      <div className="mt-1 text-base font-oswald text-brown text-center">
        {label}
      </div>
    </div>
  );
};

export default function StatsCard() {
  const containerRef = useRef();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // Correctly stops observing once triggered!
        }
      },
      { threshold: 0.3 }
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
