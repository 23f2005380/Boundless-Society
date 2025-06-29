"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Menu, Mail, Linkedin, Instagram, Youtube } from "lucide-react"
import Hero from "@/components/Hero1"
import PreviousTrip from "@/components/PreviousTrips"
import Team from "@/components/Team"
import TripsPlanned from "@/components/tripsPlanned.tsx"
import CityMeetup from "@/components/cityMeetup"

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
      <header className="flex justify-between items-center p-4 md:p-6 relative z-10">
        <div className="w-12 h-12 bg-amber-800 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
            <span className="text-amber-800 font-bold text-xs">IIT</span>
          </div>
        </div>
        <button
          className="bg-amber-800 text-white border border-amber-800 hover:bg-amber-900 px-4 md:px-6 py-2 rounded-full text-sm md:text-base flex items-center"
        >
          <Menu className="w-4 h-4 mr-1 md:mr-2" />
          MENU
        </button>
      </header>

      {/* Hero Section */}
      <Hero />

      {/* Decorative Wave */}
      <div className="w-full h-8 md:h-16 flex">
        {borderBetweenPages("658987")}
      </div>

      {/* Upcoming Trips Section */}
      <TripsPlanned />
     
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
      <CityMeetup />
      {/* About Us Section */}
      <section className="px-4 md:px-6 mb-8 md:mb-12 bg-gradient-to-b from-pink-100 to-yellow-100 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-amber-900 mb-6 md:mb-8 text-center">
            ABOUT US
          </h2>
          <div className="bg-white shadow-xl rounded-lg">
            <div className="p-6 md:p-8">
              <div className="text-amber-800 text-sm md:text-base leading-relaxed space-y-4">
                <p>
                  We believe in learning that goes beyond textbooks – a journey shaped not just by lectures, but by
                  laughter, shared dreams, and unshakable friendship. Even though our classes are online, what we've
                  built together is real – connections that cross screens and dive deep into our hearts.
                </p>
                <p>
                  Because like our adventurous bunny, we don't just stay in our comfort zones – we hop across them. With
                  every meetup, every trip, and every moment of wonder, we hop beyond the ordinary, explore fearlessly,
                  and chase every dream that calls our name. 🐰✨
                </p>
                <p>
                  Why not for adventure, when you can hop into leadership with them, cheer, and a little chaos – the
                  bunny way!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get to Know Us Section */}
     <Team />

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
              className="w-full font-black opacity-30 leading-none select-none tracking-normal bg-gradient-to-b from-[#FFE1EB] via-[#FFBCCF] to-[#46001D] bg-clip-text text-transparent text-center mt-16"
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
