"use client";

import React, { useEffect, useState } from "react";
import Section from "@/components/Section";
import TripCard from "@/components/TripCard";

export default function PreviousTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrips() {
      try {
        const response = await fetch("/api/previous-trips");
        if (response.ok) {
          const data = await response.json();
          setTrips(data.trips || []);
        }
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrips();
  }, []);

  return (
    <Section
      svgFill="#fffbeb"
      sectionHeading="Previous Trips"
      headingStyle="text-black"
    >
      <div className="relative overflow-hidden">
        {/* Background Gradients */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-radial-gradient(circle at center 60%, #fae2e3 0px, #fcefe6 35px, #fae2e3 38px)`,
            maskImage: `linear-gradient(to top, black 40%, transparent 98%)`,
            WebkitMaskImage: `linear-gradient(to top, black 40%, transparent 98%)`,
          }}
        ></div>

        <div className="relative z-10 w-fit mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 pb-15 place-items-center">
          {loading ? (
            <div className="col-span-full text-center py-10">Loading...</div>
          ) : trips.length > 0 ? (
            trips.map((trip: any) => (
              <TripCard key={trip.id} trip={trip} />
            ))
          ) : (
            <div className="col-span-full text-center py-10">No trips found.</div>
          )}
        </div>
      </div>
    </Section>
  );
}