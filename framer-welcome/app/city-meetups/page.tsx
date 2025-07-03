"use client"

import MeetupSection from "@/components/MeetupSection"
let meetupsData = [
  {
    "sectionTitle": "Summer Meetups",
    "cards": [
      {
        "city": "Kolkata",
        "img": "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aW1hZ2V8ZW58MHx8MHx8fDA%3D",
        "caption": "IIT MADRAS BS STUDENTS MEET UP @ KOLKATA",
        "color": "bg-pink-100 border-pink-300",
        "galleryLink": "/gallery/kolkata"
      },
      {
        "city": "Udaipur",
        "img": "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aW1hZ2V8ZW58MHx8MHx8fDA%3D",
        "caption": "IIT MADRAS BS STUDENTS MEET UP @ UDAIPUR",
        "color": "bg-green-100 border-green-300",
        "galleryLink": "/gallery/udaipur"
      },
      {
        "city": "Kolkata",
        "img": "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aW1hZ2V8ZW58MHx8MHx8fDA%3D",
        "caption": "IIT MADRAS BS STUDENTS MEET UP @ KOLKATA",
        "color": "bg-pink-100 border-pink-300",
        "galleryLink": "/gallery/kolkata"
      },
      {
        "city": "Udaipur",
        "img": "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aW1hZ2V8ZW58MHx8MHx8fDA%3D",
        "caption": "IIT MADRAS BS STUDENTS MEET UP @ UDAIPUR",
        "color": "bg-green-100 border-green-300",
        "galleryLink": "/gallery/udaipur"
      },
      {
        "city": "Kolkata",
        "img": "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aW1hZ2V8ZW58MHx8MHx8fDA%3D",
        "caption": "IIT MADRAS BS STUDENTS MEET UP @ KOLKATA",
        "color": "bg-pink-100 border-pink-300",
        "galleryLink": "/gallery/kolkata"
      },
      {
        "city": "Udaipur",
        "img": "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aW1hZ2V8ZW58MHx8MHx8fDA%3D",
        "caption": "IIT MADRAS BS STUDENTS MEET UP @ UDAIPUR",
        "color": "bg-green-100 border-green-300",
        "galleryLink": "/gallery/udaipur"
      },
      // ...more cards
    ]
  },
  {
    "sectionTitle": "Winter Meetups",
    "cards": [
      // ...cards
    ]
  }
]

export default function CityMeetupsPage() {
  return (
    <div className="min-h-screen bg-[#FEFAE7] py-8 px-2 md:px-8">
      {meetupsData.map((section, idx) => (
        <MeetupSection key={idx} title={section.sectionTitle} cards={section.cards} />
      ))}
    </div>
  )
}