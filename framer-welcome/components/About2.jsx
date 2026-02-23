import React from "react";
import AnimatedByChar from "@/components/AnimatedbyChar"

// 1. Static math calculated exactly once on the server
const SCALLOP_COUNT = 15;
const RADIUS = 40;
const SVG_WIDTH = SCALLOP_COUNT * RADIUS * 2;
const SVG_HEIGHT = RADIUS + 20;
const SVG_FILL = "#fffbea";

const SCALLOPS = Array.from({ length: SCALLOP_COUNT }, () => {
  return `a${RADIUS},${RADIUS} 0 0,1 ${RADIUS},${RADIUS} a${RADIUS},${RADIUS} 0 0,1 ${RADIUS},-${RADIUS}`;
}).join(" ");

const PATH_DATA = `M0,0 ${SCALLOPS} L${SVG_WIDTH},${SVG_HEIGHT} L0,${SVG_HEIGHT} Z`;

// 2. Removed React.memo to prevent Server Component Crash
const About2 = function About2() {
  return (
    // Removed the clipping styles from this section tag! Your design is safe.
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
      
      <div className="bg-[#fffbea]">
        <div className="max-w-4xl mx-auto p-8 md:p-12 bg-[#fffbea]">
          <div className="text-center mb-8">
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

            <div className="w-24 h-0.5 bg-blue-500 mx-auto"></div>
          </div>

          <div className="space-y-6 text-center">
            <AnimatedByChar>
              <p
                className="text-lg md:text-xl font-bold text-black leading-relaxed"
                style={{ fontFamily: "Georgia, Merriweather, serif" }}
              >
                We believe in learning that goes beyond textbooks – a journey
                shaped not just by lectures, but by laughter, shared dreams, and
                unshakable friendship.
              </p>

              <p
                className="text-base md:text-lg text-[#333] leading-relaxed"
                style={{ fontFamily: "Georgia, Merriweather, serif" }}
              >
                Even though our classes are online, what we've built together is
                real – connections that cross screens and sink deep into our
                hearts.
              </p>

              <p
                className="text-lg md:text-xl font-bold text-black leading-relaxed"
                style={{ fontFamily: "Georgia, Merriweather, serif" }}
              >
                Because like our adventurous bunny, we don't just stay in our
                comfort zones – we hop across them.
              </p>

              <p
                className="text-base md:text-lg text-[#333] leading-relaxed"
                style={{ fontFamily: "Georgia, Merriweather, serif" }}
              >
                With ears tuned to curiosity and hearts full of wonder, we leap
                beyond the ordinary, explore fearlessly, and chase every horizon
                that calls our name.
              </p>

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
};

export default About2;