"use client";

import dynamic from 'next/dynamic';

// 1. Keep Hero static so it loads instantly
import Hero from "@/components/Hero1";
import Section from "@/components/Section";

// 2. Lazy load the rest!
const TripsPlanned = dynamic(() => import("@/components/tripsPlanned"), { ssr: true });
const Gallery = dynamic(() => import("@/components/Gallery"), { ssr: true });
const Prev = dynamic(() => import("@/components/Prev"), { ssr: true });
const CityMeetup = dynamic(() => import("@/components/cityMeetup"), { ssr: true });
const Proud = dynamic(() => import("@/components/Proud"), { ssr: true });
const About = dynamic(() => import("@/components/About"), { ssr: true });
const AmazingTeam = dynamic(() => import("@/components/AmazingTeam"), { ssr: true });

export default function BoundlessTravelSociety() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      {/* Hero Section */}
      <Hero />

      <div id="upcoming-trips">
        <TripsPlanned />
      </div>
      
      <div id="gallery">
        <Gallery />
      </div>
      
      <div id="previous-trips">
        <Prev />
      </div>
      
      <div id="city-meetups">
        <Section
          svgFill="#FAE0BE"
          sectionHeading="City Meetups"
          headingStyle="text-brown"
        >
          <CityMeetup />
        </Section>
      </div>
      
      <div id="stats">
        <Proud />
      </div>
      
      <div id="about">
        <About />
      </div>
      
      <div id="team">
        <AmazingTeam />
      </div>
    </div>
  );
}