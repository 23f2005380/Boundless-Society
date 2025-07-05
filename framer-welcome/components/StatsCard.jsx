import React, { useEffect, useRef, useState } from "react";

import { stats } from "@/data/stats";

const StatItem = ({ end, label, isVisible }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 1500; // 1.5s
    const stepTime = 15;
    const steps = Math.ceil(duration / stepTime);
    const increment = end / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newCount = Math.min(Math.round(increment * currentStep), end);
      setCount(newCount);
      if (newCount >= end) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
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
          observer.disconnect();
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
          end={stat.value}
          label={stat.label}
          isVisible={visible}
        />
      ))}
    </div>
  );
}
