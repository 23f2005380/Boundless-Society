import React from "react";
import Section from "./Section";
import AnimatedByChar from "./AnimatedByChar";

function About() {
  return (
    <>
      <Section
        svgFill="#fffbeb"
        sectionHeading="ABOUT US"
        headingStyle="text-brown"
      />
      <div className="bg-bgWhite px-8 pb-16 text-center">
        <AnimatedByChar>
          <p>
            We believe in learning that goes beyond textbooks – a journey shaped
            not just by lectures, but by laughter, shared dreams, and unshakable
            friendship.
          </p>
          <p>
            Even though our classes are online, what we've built together is{" "}
            <em className="font-semibold">real</em> – connections that cross
            screens and sink deep into our hearts.
          </p>
          <p>
            Because like our adventurous bunny, we{" "}
            <em className="font-semibold">don't</em> just stay in our comfort
            zones – we hop across them.
          </p>
          <p>
            With ears tuned to curiosity and hearts full of wonder, we leap
            beyond the ordinary, explore fearlessly, and chase every horizon
            that calls our name. 🌍🎯
          </p>
          <p className="text-gray-700">Why roar for attention...</p>
          <p className="font-medium">
            when you can hop into leadership with charm, cheer, and a little
            chaos – the bunny way!
          </p>
        </AnimatedByChar>
      </div>
    </>
  );
}

export default About;
