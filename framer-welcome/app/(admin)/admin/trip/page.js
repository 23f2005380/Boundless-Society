import React from "react";
import { TripCardAdmin } from "@/components/TripsCardAdmin";

function page() {
  return (
    <>
      <div className="w-full h-full py-4 grid grid-cols-2 gap-4">
        <TripCardAdmin />
        <TripCardAdmin />
        <TripCardAdmin />
        <TripCardAdmin />
        <TripCardAdmin />
        <TripCardAdmin />
        <TripCardAdmin />
        <TripCardAdmin />
        <TripCardAdmin />
        <TripCardAdmin />
      </div>
    </>
  );
}

export default page;
