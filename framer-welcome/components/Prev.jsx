import React from "react";
import Section from "./Section";
import TripCard from "./TripCard";
import MainButton from "./MainButton";
import { previousTrips } from "@/data/previousTrips";
import { useRouter } from "next/navigation";

function Prev() {
  const route = useRouter();
  return (
    <>
      <Section
        svgFill="#fffbeb"
        sectionHeading="Previous Trips"
        headingStyle="text-brown"
      >
        <div className="w-fit mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 pb-6 place-items-center">
          {previousTrips.slice(0, 6).map((trip, idx) => (
            <TripCard key={idx} trip={trip} />
          ))}
        </div>
        <div className="flex items-center justify-center mb-16">
          <MainButton onClick={() => route.push("/previous-trips")}>
            View More
          </MainButton>
        </div>
      </Section>
    </>
  );
}

export default Prev;
