"use client"

import { X as XIcon, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";
import Section from "@/components/Section"
import StatsShowcase from "./StatsShowcase";
import Footer from "./Footer";
import Image from "next/image";

export default function AmazingTeam() {
  return (
<Section
        svgFill="#FFE878"
        sectionHeading="Founding Members"
        headingStyle="text-brown text-3xl"
      >
    <section className="relative px-6 md:px-6 mb-8 md:mb-12 mb-5 py-8 md:py-12 overflow-visible">
        {/* Scalloped border at the very top */}
        {/* <h2 className="text-center text-4xl md:text-4xl font-black mb-2 tracking-wide">
            Get to Know <span className="italic font-serif text-[#6d1a2c]">Us</span>
          </h2> */}
        <div className="max-w-7xl mx-auto">
          <Link href="/team-members" className="block group" style={{ textDecoration: 'none' }}>
           
            <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
              {[
                { name: "Aditya Mohan Srivastava", role: "Founder" , src :"/founders/image3.png"},
                { name: "Abhishek Tripathi", role: "Founder" , src:"/founders/image1.png"},
                { name: "Sachin Kumar", role: "Founder/Secretary" , src: "/founders/image2.jpg"},
              ].map((member, i) => (
                <div
                  key={i}
                  className="bg-black text-white hover:scale-105 transition-transform cursor-pointer rounded-lg w-full h-40 flex items-center px-4"
                >
                  <div className="flex-1 flex flex-col justify-center items-start h-full py-1">
                    <h3 className="font-bold text-base mb-1">{member.name}</h3>
                    <p className="text-xs text-gray-300 mb-2">{member.role}</p>
                    {/* <div className="flex space-x-3 mt-2">
                      <XIcon className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                      <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                      <Linkedin className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                    </div> */}
                  </div>
                  <Image
                    src={member.src}
                    alt={member.name}
                    width={112} // 28 * 4 (Tailwind w-28) 
                    height={112} // 28 * 4 (Tailwind h-28)
                    className="object-cover rounded-lg ml-4 shadow mt-4 sm:mt-0 sm:ml-4"
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