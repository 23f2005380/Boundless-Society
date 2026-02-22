"use client";

import dynamic from 'next/dynamic';
import {
  Plus,
  Menu,
  Mail,
  Linkedin,
  Instagram,
  Youtube,
  X as XIcon,
} from "lucide-react";


import Hero from "@/components/Hero1";
import Section from "@/components/Section";


const TripsPlanned = dynamic(() => import("@/components/tripsPlanned"), { ssr: true });
const Gallery = dynamic(() => import("@/components/Gallery"), { ssr: true });
const Prev = dynamic(() => import("@/components/Prev"), { ssr: true });
const CityMeetup = dynamic(() => import("@/components/cityMeetup"), { ssr: true });
const Proud = dynamic(() => import("@/components/Proud"), { ssr: true });
const About = dynamic(() => import("@/components/About"), { ssr: true });
const AmazingTeam = dynamic(() => import("@/components/AmazingTeam"), { ssr: true });

export default function BoundlessTravelSociety() {
  function borderBetweenPages(col: string) {
    let elem = [];
    for (let i = 0; i < 30; i++) {
      elem.push(
        <div
          key={i}
          className="rounded-t-lg"
          style={{
            width: "50px",
            height: "50px",
            background: "#" + col,
            borderTopRightRadius: "50px",
          }}
        ></div>
      );
    }
    return elem;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      {/* Hero Section (Loads instantly) */}
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
      
      {/* Heavy Section - Delay Layout Rendering */}
      <div id="stats" style={{ contentVisibility: "auto", containIntrinsicSize: "800px" }}>
        <Proud />
      </div>
      
      {/* Heavy Section - Delay Layout Rendering */}
      <div id="about" style={{ contentVisibility: "auto", containIntrinsicSize: "800px" }}>
        <About />
      </div>
      
      <div id="team">
        <AmazingTeam />
      </div>
    </div>
  );
}