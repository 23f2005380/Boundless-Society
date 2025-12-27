"use client";

import React, { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationFrame,
  easeOut,
  AnimatePresence,
} from "framer-motion";

import { curvedMarque } from "@/data/curvedMarquee";
import { CldImage } from "next-cloudinary";

const generatePath = (width) => {
  const w = width;

  let amplitude;
  if (width >= 1024) {
    amplitude = 150;
  } else if (width >= 768) {
    amplitude = 100;
  } else {
    amplitude = 75;
  }

  const midPoint = 150;
  const maxPoint = midPoint - amplitude;
  const minPoint = midPoint;

  return `M 0 ${midPoint} Q ${w / 4} ${maxPoint}, ${
    w / 2
  } ${midPoint} T ${w} ${midPoint}`;
};

const MarqueeItem = ({ src, index, baseProgress, totalItems, path, title }) => {
  const progress = useTransform(
    baseProgress,
    (v) => (v + index / totalItems) % 1
  );
  const offset = useTransform(progress, (p) => `${p * 100}%`);

  return (
    <motion.div
      className="absolute w-48  max-sm:w-32 aspect-[79/50] overflow-hidden"
      style={{
        offsetPath: `path("${path}")`,
        offsetDistance: offset,
        offsetRotate: "auto",
        opacity: 1,
      }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{
            opacity: 1,
            transition: { duration: 0.5, ease: "easeOut" },
          }}
          className="w-48 rounded-[50px] max-sm:w-32 aspect-[79/50] overflow-hidden shadow-md bg-white"
        >
          <motion.div
            initial="rest"
            whileHover="visible"
            animate="rest"
            className="relative h-full w-full"
          >
            <CldImage
              src={src}
              fill
              alt={title || "img"}
              className="w-full h-full object-cover"
              draggable={false}
              sizes="(max-width: 768px) 150px, 200px"
            />
            <motion.div
              variants={{
                rest: { y: -120 },
                visible: {
                  y: 0,
                  transition: { type: "spring", damping: 15, stiffness: 100 },
                },
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "#fbe26a",
                WebkitClipPath:
                  "polygon(100% 50%,91.69% 55.06%,98.55% 61.97%,89.27% 64.89%,94.27% 73.24%,84.57% 73.86%,87.43% 83.16%,77.85% 81.44%,78.4% 91.15%,69.52% 87.19%,67.73% 96.75%,60.05% 90.78%,56.03% 99.64%,50% 92%,43.97% 99.64%,39.95% 90.78%,32.27% 96.75%,30.48% 87.19%,21.6% 91.15%,22.15% 81.44%,12.57% 83.16%,15.43% 73.86%,5.73% 73.24%,10.73% 64.89%,1.45% 61.97%,8.31% 55.06%,0% 50%,8.31% 44.94%,1.45% 38.03%,10.73% 35.11%,5.73% 26.76%,15.43% 26.14%,12.57% 16.84%,22.15% 18.56%,21.6% 8.85%,30.48% 12.81%,32.27% 3.25%,39.95% 9.22%,43.97% 0.36%,50% 8%,56.03% 0.36%,60.05% 9.22%,67.73% 3.25%,69.52% 12.81%,78.4% 8.85%,77.85% 18.56%,87.43% 16.84%,84.57% 26.14%,94.27% 26.76%,89.27% 35.11%,98.55% 38.03%,91.69% 44.94%)",
                clipPath:
                  "polygon(100% 50%,91.69% 55.06%,98.55% 61.97%,89.27% 64.89%,94.27% 73.24%,84.57% 73.86%,87.43% 83.16%,77.85% 81.44%,78.4% 91.15%,69.52% 87.19%,67.73% 96.75%,60.05% 90.78%,56.03% 99.64%,50% 92%,43.97% 99.64%,39.95% 90.78%,32.27% 96.75%,30.48% 87.19%,21.6% 91.15%,22.15% 81.44%,12.57% 83.16%,15.43% 73.86%,5.73% 73.24%,10.73% 64.89%,1.45% 61.97%,8.31% 55.06%,0% 50%,8.31% 44.94%,1.45% 38.03%,10.73% 35.11%,5.73% 26.76%,15.43% 26.14%,12.57% 16.84%,22.15% 18.56%,21.6% 8.85%,30.48% 12.81%,32.27% 3.25%,39.95% 9.22%,43.97% 0.36%,50% 8%,56.03% 0.36%,60.05% 9.22%,67.73% 3.25%,69.52% 12.81%,78.4% 8.85%,77.85% 18.56%,87.43% 16.84%,84.57% 26.14%,94.27% 26.76%,89.27% 35.11%,98.55% 38.03%,91.69% 44.94%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5em",
                fontWeight: "bold",
                color: "#5c1f1f",
                zIndex: 10,
              }}
            >
              {title}
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default function CurvedMarquee() {
  const [path, setPath] = useState("");
  const [totalItems, setTotalItems] = useState(4);
  const baseProgress = useMotionValue(0);
  const speed = 0.00009;

  useEffect(() => {
    const updatePath = () => {
      setPath(generatePath(window.innerWidth));
    };

    const updateItemCount = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setTotalItems(8);
      } else if (width >= 768) {
        setTotalItems(5);
      } else {
        setTotalItems(4);
      }
    };

    updatePath();
    updateItemCount();

    window.addEventListener("resize", () => {
      updatePath();
      updateItemCount();
    });

    return () =>
      window.removeEventListener("resize", () => {
        updatePath();
        updateItemCount();
      });
  }, []);

  useAnimationFrame((_, delta) => {
    baseProgress.set((baseProgress.get() + delta * speed) % 1);
  });

  if (!path) return null;

  return (
    <div className="relative w-full h-[300px] overflow-hidden mt-16">
      {Array.from({ length: totalItems }).map((_, i) => (
        <MarqueeItem
          key={i}
          src={curvedMarque[i % curvedMarque.length].img}
          title={curvedMarque[i % curvedMarque.length].title}
          index={i}
          baseProgress={baseProgress}
          totalItems={totalItems}
          path={path}
        />
      ))}
    </div>
  );
}