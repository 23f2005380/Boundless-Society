import React from "react";
import AnimatedByChar from "@/components/AnimatedbyChar"

// 1. Move all static path generation OUTSIDE the component.
// The CPU now calculates this complex string exactly once instead of on every render.
const SCALLOP_COUNT = 15;
const RADIUS = 40;
const SVG_WIDTH = SCALLOP_COUNT * RADIUS * 2;
const SVG_HEIGHT = RADIUS + 20;
const SVG_FILL = "#fffbea";

const SCALLOPS = Array.from({ length: SCALLOP_COUNT }, () => {
  return `a${RADIUS},${RADIUS} 0 0,1 ${RADIUS},${RADIUS} a${RADIUS},${RADIUS} 0 0,1 ${RADIUS},-${RADIUS}`;
}).join(" ");

const PATH_DATA = `M0,0 ${SCALLOPS} L${SVG_WIDTH},${SVG_HEIGHT} L0,${SVG_HEIGHT} Z`;

// 2. Wrap in React.memo since this component has no dynamic props.
// This prevents it from re-rendering if a parent component updates.
const About2 = React.memo(function About2() {
  return (
    <section className="relative text-black -mt-12 max-sm:-mt-6">
      <div className="w-full overflow-hidden ">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
        >
          <path d={PATH_DATA} fill={SVG_FILL} />
        </svg>
      </div>
        {/* Scalloped edge decoration */}
        {/* <div className="absolute -top-8 left-0 w-full flex z-20">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="w-12 h-8 rounded-t-full bg-yellow-50 border-t-2 border-dotted border-yellow-200"
            />
          ))}
        </div> */}
      <div className="bg-[#fffbea]">
        <div className="max-w-4xl mx-auto p-8 md:p-12 bg-[#fffbea]">
          {/* Section Title */}
          <div className="text-center mb-8">
            {/* Top decorative line */}
            <div className="w-24 h-0.5 bg-blue-500 mx-auto mb-4"></div>

            <AnimatedByChar text={"About US"}>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-black text-[#4B003D] mb-4 tracking-widest"
                style={{
                  fontFamily: "Bebas Neue, Impact, Arial Black, sans-serif",
                  fontWeight: "900",
                  letterSpacing: "0.2em",
                  fontStretch: "condensed",
                  transform: "scaleY(1.5)",
                }}
              >
                About Us
              </h2>
            </AnimatedByChar>

            {/* Bottom decorative line */}
            <div className="w-24 h-0.5 bg-blue-500 mx-auto"></div>
          </div>

          {/* Content */}
          <div className="space-y-6 text-center">
            <AnimatedByChar>
              {/* Paragraph 1: Core Belief */}
              <p
                className="text-lg md:text-xl font-bold text-black leading-relaxed"
                style={{ fontFamily: "Georgia, Merriweather, serif" }}
              >
                We believe in learning that goes beyond textbooks – a journey
                shaped not just by lectures, but by laughter, shared dreams, and
                unshakable friendship.
              </p>

              {/* Paragraph 2: Online Connection */}
              <p
                className="text-base md:text-lg text-[#333] leading-relaxed"
                style={{ fontFamily: "Georgia, Merriweather, serif" }}
              >
                Even though our classes are online, what we've built together is
                real – connections that cross screens and sink deep into our
                hearts.
              </p>

              {/* Paragraph 3: Bunny Metaphor */}
              <p
                className="text-lg md:text-xl font-bold text-black leading-relaxed"
                style={{ fontFamily: "Georgia, Merriweather, serif" }}
              >
                Because like our adventurous bunny, we don't just stay in our
                comfort zones – we hop across them.
              </p>

              {/* Paragraph 4: Description of Bunny Traits */}
              <p
                className="text-base md:text-lg text-[#333] leading-relaxed"
                style={{ fontFamily: "Georgia, Merriweather, serif" }}
              >
                With ears tuned to curiosity and hearts full of wonder, we leap
                beyond the ordinary, explore fearlessly, and chase every horizon
                that calls our name.
              </p>

              {/* Final Line: Closing with Charm */}
              <p
                className="text-base md:text-lg italic text-[#333] leading-relaxed"
                style={{ fontFamily: "Georgia, Merriweather, serif" }}
              >
                Why roar for attention... 
                
              when you can hop into leadership with charm, cheer, and a little 
              chaos – the bunny way! 🐰✨
              </p>
            </AnimatedByChar>
          </div>
        </div>
      </div>
    </section>
  );
});

export default About2;