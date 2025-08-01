"use client";

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
import PreviousTrip from "@/components/PreviousTrips";
import Team from "@/components/Team";
import TripsPlanned from "@/components/tripsPlanned";
import CityMeetup from "@/components/cityMeetup";
import Section from "@/components/Section";
import Proud from "@/components/Proud";

import Gallery from "@/components/Gallery";
import About from "@/components/About";
import Prev from "@/components/Prev";
import AnimatedByChar from "@/components/AnimatedByWord";
import About2 from "@/components/About2";
import GetToKnowUs from "@/components/GetToKnowUs";
import AmazingTeam from "@/components/AmazingTeam";
import Footer from "@/components/Footer";
import StatsShowcase from "@/components/StatsShowcase";

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
      {/* Header */}

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
