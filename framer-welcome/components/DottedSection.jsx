import React from "react";
// RESTORED YOUR EXACT MASTER IMPORTS - This fixes the text size/design issue!
import AnimatedByChar from "./AnimatedByWord";
import AnimatedByWord from "./AnimatedByWord";

// 1. Static math calculated exactly once on the server (Performance Optimization)
const SCALLOP_COUNT = 15;
const RADIUS = 40;
const SVG_WIDTH = SCALLOP_COUNT * RADIUS * 2;
const SVG_HEIGHT = RADIUS + 20;

const SCALLOPS = Array.from({ length: SCALLOP_COUNT }, () => {
  return `a${RADIUS},${RADIUS} 0 0,1 ${RADIUS},${RADIUS} a${RADIUS},${RADIUS} 0 0,1 ${RADIUS},-${RADIUS}`;
}).join(" ");

const PATH_DATA = `M0,0 ${SCALLOPS} L${SVG_WIDTH},${SVG_HEIGHT} L0,${SVG_HEIGHT} Z`;

// 2. Static strings extracted to prevent memory re-allocation
const STAR_PATTERN_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Cpath d='M25 5 L30 20 L45 25 L30 30 L25 45 L20 30 L5 25 L20 20 Z' fill='%23a7f3d0'/%3E%3C/svg%3E")`;

const DottedSection = ({
  children,
  svgFill,
  sectionHeading,
  headingStyle,
  dotColor,
}) => {
  return (
    <div className={`relative text-black -mt-12 max-sm:-mt-6`}>
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
        >
          <path d={PATH_DATA} fill={svgFill} />
        </svg>
      </div>

      <div style={{ background: svgFill }} className={`pt-15 -mt-1`}>
        <div className="relative w-full overflow-hidden -pb-10">
          {/* Dotted background layer */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundColor: dotColor,
              backgroundImage: STAR_PATTERN_URL,
              backgroundSize: "15px 15px",
              backgroundRepeat: "repeat",
            }}
          />
          
          {/* Gradient overlay - replaces mask-image */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{
              background: `linear-gradient(to top, transparent 40%, ${svgFill} 98%)`
            }}
          />

          <div className="relative z-10 w-full pb-20">
            <h1
              className={`text-[9rem] max-md:text-8xl max-sm:text-6xl w-full font-[350] text-center font-oswald text-nowrap ${headingStyle}`}
            >
              {" "}
              <AnimatedByChar text={sectionHeading}>
                {sectionHeading}
              </AnimatedByChar>
            </h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DottedSection;