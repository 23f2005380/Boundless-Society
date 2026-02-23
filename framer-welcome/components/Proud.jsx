import React from "react";
import DottedSection from "./DottedSection";
import CurvedMarquee from "./CurvedMarque";
import StatsCard from "./StatsCard";

function Proud() {
  return (
    // Wrapping the entire heavy Marquee & Stats section to defer rendering
    <div style={{ contentVisibility: "auto", contain: "paint" }}>
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
          {/* Ensure your StatsCard is also wrapped in React.memo inside its own file! */}
          <StatsCard />
        </div>
      </DottedSection>
    </div>
  );
}

export default React.memo(Proud);