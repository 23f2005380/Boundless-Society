import React from "react";
import Section from "./Section";

function About() {
  return (
    <>
      <Section
        svgFill="#fffbeb"
        sectionHeading="ABOUT US"
        headingStyle="text-black"
      ></Section>{" "}
      <div className="bg-amber-50 px-8 pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg md:text-xl text-gray-800 leading-relaxed mb-8 max-w-3xl mx-auto">
            We believe in learning that goes beyond textbooks – a journey shaped
            not just by lectures, but by laughter, shared dreams, and unshakable
            friendship.
          </p>

          <p className="text-lg md:text-xl text-gray-800 leading-relaxed mb-12 max-w-3xl mx-auto">
            Even though our classes are online, what we've built together is{" "}
            <em className="font-semibold">real</em> – connections that cross
            screens and sink deep into our hearts.
          </p>

          {/* Second Paragraph with Adventure Theme */}
          <p className="text-lg md:text-xl text-gray-800 leading-relaxed mb-4 max-w-3xl mx-auto">
            Because like our adventurous bunny, we{" "}
            <em className="font-semibold">don't</em> just stay in our comfort
            zones – we hop across them.
          </p>

          <p className="text-lg md:text-xl text-gray-800 leading-relaxed mb-6 max-w-3xl mx-auto">
            With ears tuned to curiosity and hearts full of wonder, we leap
            beyond the ordinary, explore fearlessly, and chase every horizon
            that calls our name. 🌍🎯
          </p>

          <p className="text-lg md:text-xl text-gray-700 mb-2">
            Why roar for attention...
          </p>

          <p className="text-lg md:text-xl text-gray-800 font-medium">
            when you can hop into leadership with charm, cheer, and a little
            chaos – the bunny way!
          </p>
        </div>
      </div>
    </>
  );
}

export default About;
