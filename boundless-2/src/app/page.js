import Gallery from "@/components/Gallery";
import React from "react";
import About from "@/components/About";
import Prev from "@/components/Prev";
import UpcomingTrips from "@/components/UpcomingTrips";

function page() {
  return (
    <>
      <div className="h-15 bg-black"></div>
      <UpcomingTrips />
      <Gallery />
      <Prev />
      <About />
    </>
  );
}

export default page;
