import React from "react";
import Section from "@/components/Section";
import TripCard from "@/components/TripCard";
import { previousTrips } from "@/data/previousTrips";

function PrevTrips() {
  return (
    <>
      <Section
        svgFill="#fffbeb"
        sectionHeading="Previous Trips"
        headingStyle="text-black"
      >
        <div className="w-fit mx-auto grid grid-cols-3 gap-8 pb-15 pt-4">
          {previousTrips.map((trip, idx) => (
            <TripCard key={idx} trip={trip} />
          ))}
        </div>
      </Section>
    </>
  );
}

export default PrevTrips;
