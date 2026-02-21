"use client";

import React, { useEffect, useState } from "react";
import Section from "./Section";
import TripCard from "./TripCard";
import MainButton from "./MainButton";
import { useRouter } from "next/navigation";

function Prev() {
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch trips from the API when the component mounts
  useEffect(() => {
    async function fetchTrips() {
      try {
        // This calls the API route you created earlier
        const response = await fetch("/api/previous-trips");
        if (response.ok) {
          const data = await response.json();
          setTrips(data.trips || []);
        } else {
          console.error("Failed to fetch previous trips");
        }
      } catch (error) {
        console.error("Error fetching previous trips:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, []);

  return (
    <>
      <Section
        svgFill="#fffbeb"
        sectionHeading="Previous Trips"
        headingStyle="text-brown"
      >
        <div className="w-fit mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 pb-6 place-items-center">
          {loading ? (
            <div className="col-span-full text-center py-10 text-gray-500 text-lg">
              Loading trips...
            </div>
          ) : trips.length > 0 ? (
            // We slice(0, 6) to keep the layout clean on the homepage (max 6 items)
            trips.slice(0, 6).map((trip) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">
              No previous trips found.
            </div>
          )}
        </div>
        <div className="flex items-center justify-center mb-16">
          <MainButton onClick={() => router.push("/previous-trips")}>
            View More
          </MainButton>
        </div>
      </Section>
    </>
  );
}

export default Prev;