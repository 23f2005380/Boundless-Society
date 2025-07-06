"use client"

import MeetupSection from "@/components/MeetupSection"
import meetupsData from "@/data/city-meetup.js";

export default function CityMeetupsPage() {
  return (
    <div className="min-h-screen bg-[#FEFAE7] py-8 px-2 md:px-8">
      {meetupsData.map((section, idx) => (
        <MeetupSection key={idx} title={section.sectionTitle} cards={section.cards} />
      ))}
    </div>
  )
}