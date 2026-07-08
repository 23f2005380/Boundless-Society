import dynamic from 'next/dynamic';

// 1. Keep Hero static so it loads instantly
import Hero from "@/components/Hero1";
import Section from "@/components/Section";

// 2. Lazy load the rest as Server Components!
const TripsPlanned = dynamic(() => import("@/components/tripsPlanned"));
const Gallery = dynamic(() => import("@/components/Gallery"));
const Prev = dynamic(() => import("@/components/Prev"));
const CityMeetup = dynamic(() => import("@/components/cityMeetup"));
const Proud = dynamic(() => import("@/components/Proud"));
const About = dynamic(() => import("@/components/About"));
const AmazingTeam = dynamic(() => import("@/components/AmazingTeam"));

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