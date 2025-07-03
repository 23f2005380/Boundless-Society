import React from "react";
import Section from "./Section";
import TripCard from "./TripCard";
import { previousTrips } from "@/data/previousTrips";

function Prev() {
  return (
    <>
      <Section
        svgFill="#fffbeb"
        sectionHeading="Previous Trips"
        headingStyle="text-brown"
      >
        <div className="w-fit mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 pb-16 place-items-center">
          {previousTrips.slice(0, 6).map((trip, idx) => (
            <TripCard key={idx} trip={trip} />
          ))}
        </div>
      </Section>
    </>
  );
}

export default Prev;
