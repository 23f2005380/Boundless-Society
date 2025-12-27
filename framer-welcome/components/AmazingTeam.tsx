"use client";

import { X as XIcon, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";
import Section from "@/components/Section";
import Footer from "./Footer";
import { founderDetails } from "@/data/founders";
import { CldImage } from "next-cloudinary";

export default function AmazingTeam() {
  return (
    <Section
      svgFill="#FFE878"
      sectionHeading="Founding Members"
      headingStyle="text-brown text-3xl"
    >
      <section className="relative px-6 md:px-6 mb-8 md:mb-12 py-8 md:py-12 overflow-visible">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/team-members"
            className="block group"
            style={{ textDecoration: "none" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
              {founderDetails.map((member, i) => (
                <div
                  key={i}
                  className="bg-black text-white hover:scale-105 transition-transform cursor-pointer rounded-lg w-full h-40 flex items-center px-4"
                >
                  <div className="flex-1 flex flex-col justify-center items-start h-full py-1">
                    <h3 className="font-bold text-base mb-1">{member.name}</h3>
                    <p className="text-xs text-gray-300 mb-2">{member.role}</p>
                  </div>
                  <CldImage
                    src={member.src}
                    alt={member.name}
                    width={112} 
                    height={112}
                    className="object-cover rounded-lg ml-4 shadow mt-4 sm:mt-0 sm:ml-4"
                    crop="fill"
                  />
                </div>
              ))}
            </div>
          </Link>
        </div>
        <Footer />
      </section>
    </Section>
  );
}