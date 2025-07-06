"use client"

import { X as XIcon, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";
import Section from "@/components/Section"
import StatsShowcase from "./StatsShowcase";


export default function AmazingTeam() {
  return (
<Section
        svgFill="#C0ECBF"
        sectionHeading="Our Team"
        headingStyle="text-brown"
      >
    <section className="relative px-6 md:px-6 mb-8 md:mb-12 mb-5 py-8 md:py-12 overflow-visible">
        {/* Scalloped border at the very top */}
        
        <div className="max-w-7xl mx-auto">
          <Link href="/team-members" className="block group" style={{ textDecoration: 'none' }}>
           
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              {[
                { name: "Aditya Mohan Srivastava", role: "Founder" },
                { name: "Abhishek Tripathi", role: "Founder" },
                { name: "Sachin Kumar", role: "Founder/Secretary" },
              ].map((member, i) => (
                <div
                  key={i}
                  className="bg-black text-white hover:scale-110 transition-transform cursor-pointer rounded-lg w-full h-40 flex items-center px-4"
                >
                  <div className="flex-1 flex flex-col justify-center items-start h-full py-1">
                    <h3 className="font-bold text-base mb-1">{member.name}</h3>
                    <p className="text-xs text-gray-300 mb-2">{member.role}</p>
                    <div className="flex space-x-3 mt-2">
                      <XIcon className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                      <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                      <Linkedin className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                    </div>
                  </div>
                  <img
                    src={`https://randomuser.me/api/portraits/men/${i + 10}.jpg`}
                    alt={member.name}
                    className="w-30 h-30 object-cover rounded-lg ml-4 shadow"
                  />
                </div>
              ))}
            </div>
          </Link>
        </div>
        <StatsShowcase />
      </section>
      </Section>
  );
} 