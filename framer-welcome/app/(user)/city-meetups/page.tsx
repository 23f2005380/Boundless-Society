"use client"

import MeetupSection from "@/components/MeetupSection"
import meetupsData from "@/data/city-meetup.js"



type MeetupCard = {
  city: string
  img: string
  caption: string
  color: string
  galleryLink: string
}

type MeetupSectionType = {
  sectionTitle: string
  cards: MeetupCard[]
}

export default function CityMeetupsPage() {
  return (
    <div className="min-h-screen bg-[#FEFAE7] py-8 px-2 md:px-8">
      {meetupsData.map((section: MeetupSectionType, idx: number) => (
        <MeetupSection
          key={idx}
          title={section.sectionTitle}
          cards={section.cards}
        />
      ))}
    </div>
  )
}
