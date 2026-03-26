"use client"

import React, { useEffect, useState } from "react"
import MeetupSection from "@/components/MeetupSection"



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
  const [meetupsData, setMeetupsData] = useState<MeetupSectionType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMeetups = async () => {
      try {
        const res = await fetch("/api/city-meetups");
        const data = await res.json();
        
        if (res.ok && data.meetups) {
          // Group the flat database array into sections based on `subSection`
          const grouped = data.meetups.reduce((acc: any, meetup: any) => {
            // Use subSection as the heading
            const heading = meetup.subSection || "Other Meetups";
            
            if (!acc[heading]) {
              acc[heading] = [];
            }
            
            // Map the database fields to the props your card expects
            acc[heading].push({
              city: meetup.cityName || "Unknown City",
              img: meetup.img,
              caption: meetup.cityName || "", // Using city name as caption 
              color: meetup.color || "#FEFAE7",// Default generic color (Change if your component requires specific ones)
              galleryLink: "#", // Placeholder since we aren't saving a link in DB yet
            });
            
            return acc;
          }, {});

          // Convert the grouped object into the array format needed for rendering
          const formattedData: MeetupSectionType[] = Object.keys(grouped).map((key) => ({
            sectionTitle: key,
            cards: grouped[key],
          }));

          setMeetupsData(formattedData);
        }
      } catch (error) {
        console.error("Failed to fetch meetups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetups();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FEFAE7] flex items-center justify-center text-lg font-medium">
        Loading meetups...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFAE7] py-8 px-2 md:px-8">
      {meetupsData.length === 0 ? (
        <p className="text-center mt-10 text-muted-foreground">No city meetups found.</p>
      ) : (
        meetupsData.map((section: MeetupSectionType, idx: number) => (
          <MeetupSection
            key={idx}
            title={section.sectionTitle}
            cards={section.cards}
          />
        ))
      )}
    </div>
  )
}