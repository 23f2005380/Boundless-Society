import React from "react";
import Section from "@/components/Section";
import TripCard from "@/components/TripCard";
import { previousTrips } from "@/data/previousTrips";

function PrevTrips() {
  return (
    <Section
      svgFill="#fffbeb"
      sectionHeading="Previous Trips"
      headingStyle="text-black"
    >
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `
      repeating-radial-gradient(circle at center 60%, #fae2e3 0px, #fcefe6 35px, #fae2e3 38px)`,
            maskImage: `
      linear-gradient(to top, black 40%, transparent 98%)
    `,
            WebkitMaskImage: `
      linear-gradient(to top, black 40%, transparent 98%)
    `,
          }}
        ></div>

        <div className="relative z-10 w-fit mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 pb-15 place-items-center">
          {previousTrips.map((trip, idx) => (
            <TripCard key={idx} trip={trip} />
          ))}
        </div>
      </div>
    </Section>
  );
}

export default PrevTrips;
