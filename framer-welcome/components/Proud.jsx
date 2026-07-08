import React from "react";
import DottedSection from "./DottedSection";
import CurvedMarquee from "./CurvedMarque";
import StatsCard from "./StatsCard";

function Proud() {
  return (
    <>
      <DottedSection
        headingStyle="text-brown text-nowrap"
        svgFill="#C0ECBF"
        sectionHeading="We proud to have"
        dotColor="#c4b5fd"
      >
        <div className="relative w-full overflow-hidden">
          <CurvedMarquee />
        </div>
        <div className="relative w-full">
          <StatsCard />
        </div>
      </DottedSection>
    </>
  );
}

export default Proud;