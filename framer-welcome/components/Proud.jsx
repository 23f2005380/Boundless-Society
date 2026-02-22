import React from "react";
import DottedSection from "./DottedSection";
import CurvedMarquee from "./CurvedMarque";
import StatsCard from "./StatsCard";

function Proud() {
  return (
    <DottedSection
      headingStyle="text-brown text-nowrap"
      svgFill="#C0ECBF"
      sectionHeading="We proud to have"
      dotColor="#c4b5fd"
    >
      {/* Wrap this container in a div that utilizes hardware acceleration */}
      <div style={{ willChange: 'transform', transform: 'translate3d(0, 0, 0)' }}>
        <CurvedMarquee />
      </div>
      <div style={{ willChange: 'transform', transform: 'translate3d(0, 0, 0)' }}>
        <StatsCard />
      </div>
    </DottedSection>
  );
}

export default React.memo(Proud);