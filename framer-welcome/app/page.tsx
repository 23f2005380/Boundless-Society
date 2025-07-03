"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Menu, Mail, Linkedin, Instagram, Youtube, X as XIcon } from "lucide-react"

import Hero from "@/components/Hero1"
import PreviousTrip from "@/components/PreviousTrips"
import Team from "@/components/Team"
import TripsPlanned from "@/components/tripsPlanned"
import CityMeetup from "@/components/cityMeetup"
import Section from "@/components/Section"
import  Header from "@/components/Header"

export default function BoundlessTravelSociety() {
  

  function borderBetweenPages(col: string) {
    let elem = []
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
      )
    }
    return elem
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      {/* Header */}
    <Header />

      {/* Hero Section */}
      <Hero />

      {/* Decorative Wave */}
      <div className="w-full">
        <Section
          svgFill="#FEFAE7"
          sectionHeading="Upcoming Trips"
          headingStyle={{ color: "#3B001B" }}
        >
          <TripsPlanned />
        </Section>
      </div>

      {/* Upcoming Trips Section */}
      
     
      {/* Decorative Wave */}
      <div className="w-full h-8 md:h-16 bg-gradient-to-r from-green-200 to-blue-200 rounded-t-full mb-6 md:mb-8"></div>

      {/* Statistics Section */}
      <section className="px-4 md:px-6 mb-8 md:mb-12 bg-gradient-to-b from-green-100 to-blue-100 py-8 md:py-12">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-amber-900 mb-6 md:mb-8">We proud to have</h2>
          {/* Decorative Banner with Logos */}
          <div className="mb-6 md:mb-8 flex justify-center">
            <div className="bg-gradient-to-r from-yellow-200 via-white to-yellow-200 p-3 md:p-4 rounded-full shadow-lg overflow-hidden">
              <div className="flex space-x-2 md:space-x-4 items-center">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <span className="text-white font-bold text-xs">L{i}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Statistics */}
          <div className="bg-blue-300 border border-blue-400 max-w-5xl mx-auto shadow-xl rounded-lg">
            <div className="p-4 md:p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-center">
                <div>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-black text-amber-900">
                    1,000<span className="text-lg md:text-2xl">+</span>
                  </div>
                  <div className="text-amber-800 font-semibold text-sm md:text-base">Members</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-black text-amber-900">600</div>
                  <div className="text-amber-800 font-semibold text-sm md:text-base">Female Members</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-black text-amber-900">60</div>
                  <div className="text-amber-800 font-semibold text-sm md:text-base">Core Members</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-black text-amber-900">10</div>
                  <div className="text-amber-800 font-semibold text-sm md:text-base">Trips</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Wave */}
      <div className="w-full h-8 md:h-16 bg-black rounded-t-full mb-6 md:mb-8"></div>

      {/* Gallery Section */}
      <section className="px-4 md:px-6 pb-8 md:pb-12 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 md:mb-8 text-center">
            OUR GALLERY
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { title: "GOA VIBES", color: "from-yellow-400 to-orange-400" },
              { title: "DARJEELING", color: "from-blue-400 to-green-400" },
              { title: "AGRA TRIP", color: "from-red-400 to-pink-400" },
              { title: "MEETUPS", color: "from-purple-400 to-blue-400" },
              { title: "PANAJI", color: "from-green-400 to-teal-400" },
              { title: "CITY TOUR", color: "from-orange-400 to-red-400" },
              { title: "ADVENTURE", color: "from-indigo-400 to-purple-400" },
              { title: "MEMORIES", color: "from-pink-400 to-rose-400" },
            ].map((item, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${item.color} aspect-square hover:scale-105 transition-transform cursor-pointer rounded-lg`}
              >
                <div className="p-3 md:p-4 h-full flex items-center justify-center">
                  <div className="text-white font-bold text-center">
                    <div className="text-xl md:text-2xl mb-2">📸</div>
                    <div className="text-xs md:text-sm">{item.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decorative Wave */}
      <div className="w-full h-8 md:h-16 bg-gradient-to-r from-amber-200 to-pink-200 rounded-t-full mb-6 md:mb-8"></div>

      {/* Previous Trips Section */}
      <PreviousTrip />

      {/* City Meetups Section */}
            <Section
          svgFill="#FAE0BE"
          sectionHeading="City Meetups"
          headingStyle={{ color: "#3B001B" }}
        >
      <CityMeetup />
      </Section>
{/* About Us Section */}
<section className="px-4 md:px-6 mb-8 md:mb-12 bg-yellow-50 py-8 md:py-12 relative">
        {/* Scalloped edge decoration */}
        <div className="absolute -top-8 left-0 w-full flex z-20">
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} className="w-12 h-8 rounded-t-full bg-yellow-50 border-t-2 border-dotted border-yellow-200" />
          ))}
        </div>
        
        <div className="max-w-4xl mx-auto p-8 md:p-12">
          {/* Section Title */}
          <div className="text-center mb-8">
            {/* Top decorative line */}
            <div className="w-24 h-0.5 bg-blue-500 mx-auto mb-4"></div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#4B003D] mb-4 tracking-widest" style={{ fontFamily: 'Bebas Neue, Impact, Arial Black, sans-serif', fontWeight: '900', letterSpacing: '0.2em', fontStretch: 'condensed', transform: 'scaleY(1.5)' }}>
              ABOUT US
            </h2>
            
            {/* Bottom decorative line */}
            <div className="w-24 h-0.5 bg-blue-500 mx-auto"></div>
          </div>

          {/* Content */}
          <div className="space-y-6 text-center">
            {/* Paragraph 1: Core Belief */}
            <p className="text-lg md:text-xl font-bold text-black leading-relaxed" style={{ fontFamily: 'Georgia, Merriweather, serif' }}>
              We believe in learning that goes beyond textbooks – a journey shaped not just by lectures, but by laughter, shared dreams, and unshakable friendship.
            </p>

            {/* Paragraph 2: Online Connection */}
            <p className="text-base md:text-lg text-[#333] leading-relaxed" style={{ fontFamily: 'Georgia, Merriweather, serif' }}>
              Even though our classes are online, what we've built together is real – connections that cross screens and sink deep into our hearts.
            </p>

            {/* Paragraph 3: Bunny Metaphor */}
            <p className="text-lg md:text-xl font-bold text-black leading-relaxed" style={{ fontFamily: 'Georgia, Merriweather, serif' }}>
              Because like our adventurous bunny, we don't just stay in our comfort zones – we hop across them.
            </p>

            {/* Paragraph 4: Description of Bunny Traits */}
            <p className="text-base md:text-lg text-[#333] leading-relaxed" style={{ fontFamily: 'Georgia, Merriweather, serif' }}>
              With ears tuned to curiosity and hearts full of wonder, we leap beyond the ordinary, explore fearlessly, and chase every horizon that calls our name.
            </p>

            {/* Final Line: Closing with Charm */}
            <p className="text-base md:text-lg italic text-[#333] leading-relaxed" style={{ fontFamily: 'Georgia, Merriweather, serif' }}>
              Why roar for attention...<br />
              when you can hop into leadership with charm, cheer, and a little chaos – the bunny way! 🐰✨
            </p>
          </div>
        </div>
      </section>


      {/* Get to Know Us Section */}
      <section className="relative px-6 md:px-6 mb-8 md:mb-12 bg-[#FFE066] py-8 md:py-12 overflow-visible">
        {/* Scalloped border at the very top */}
        <div className="absolute -top-8 left-0 w-full flex z-20">
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} className="w-12 h-8 rounded-t-full bg-[#FFE066] border-t-2 border-dotted border-[#B8860B]" />
          ))}
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-block bg-[#3B001B] text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 tracking-wide shadow">OUR AMAZING TEAM</div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#6B1B1B]">
              Get to Know <span className="italic text-[#3B001B]">Us</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            {[
              { name: "Ritu Sahani", role: "President 2024" },
              { name: "Chetan Chavan", role: "Organizing" },
              { name: "Jannavi Bansal", role: "Secretary" },
              { name: "Janny Jain", role: "Secretary" },
              { name: "Jai Vithani", role: "Treasurer" },
              { name: "Lali Maan", role: "Member" },
            ].map((member, i) => (
              <div key={i} className="bg-black text-white hover:scale-105 transition-transform cursor-pointer rounded-lg w-full h-40 flex items-center px-4">
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
        </div>
      </section>

      {/* Footer/Contact Section */}
      <footer className="px-0 md:px-0 pb-0 md:pb-0 w-full -mt-10">
        <div className="w-full flex justify-center">
          <div className="w-[90%] min-h-[500px] bg-[#46001D] text-[#FFF9C7] shadow-2xl rounded-3xl border-0 flex flex-col p-6 md:p-10">
            <div className="flex flex-row justify-between items-start w-full mb-6">
              {/* Email Left */}
              <div className="flex flex-col items-start">
                <p className="text-xl md:text-2xl font-bold mb-2">Email</p>
                <p className="text-base md:text-lg font-semibold break-all">boundless.club@study.iitm.ac.in</p>
              </div>
              {/* Socials Right */}
              <div className="flex flex-col items-end gap-2">
                <a href="#" className="text-xl md:text-2xl font-bold hover:underline">Youtube</a>
                <a href="#" className="text-xl md:text-2xl font-bold hover:underline">Instagram</a>
                <a href="#" className="text-xl md:text-2xl font-bold hover:underline">Linkedin</a>
              </div>
            </div>
            <h1
              className="w-full font-black opacity-30 leading-none select-none tracking-normal bg-gradient-to-b from-[#FFFFFF] to-[#46001D] bg-clip-text text-transparent text-center mt-16"
              style={{ fontSize: 'clamp(2rem, 12vw, 10rem)', transform: 'scaleY(2.4)' }}
            >
              BOUNDLESS
            </h1>
          </div>
        </div>
      </footer>
    </div>
  )
}
