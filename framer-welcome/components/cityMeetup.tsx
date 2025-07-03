"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const meetups = [
  {
    city: "DELHI",
    img: "https://i.imgur.com/6n6bQGk.jpg", // Replace with your actual image
    title: "DELHI",
    description: (
      <>
        <span className="font-bold">BS students rocked CP Central Park, Delhi, with an unforgettable meetup!</span> Huge thanks to IIT Madras for sponsoring through the BS Student Activity Fee. The day unfolded with warm intros, a hilarious photo shoot, and an electrifying jam session that brought everyone together!
      </>
    ),
    badge: "MEET 09",
    logo: "https://i.imgur.com/0y8Ftya.png", // Replace with your logo if needed
  },
  {
    city: "MUMBAI",
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    title: "MUMBAI",
    description: (
      <>
        <span className="font-bold">Mumbai meetup was a blast!</span> Students enjoyed games, networking, and a memorable sunset at Marine Drive.
      </>
    ),
    badge: "MEET 08",
    logo: "",
  },
  {
    city: "CHENNAI",
    img: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
    title: "CHENNAI",
    description: (
      <>
        <span className="font-bold">Chennai students gathered at Marina Beach</span> for fun, food, and friendship. Thanks to all who joined!
      </>
    ),
    badge: "MEET 07",
    logo: "",
  },
  {
    city: "BANGALORE",
    img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
    title: "BANGALORE",
    description: (
      <>
        <span className="font-bold">Bangalore meetup brought together techies</span> for a day of learning and laughter at Cubbon Park.
      </>
    ),
    badge: "MEET 06",
    logo: "",
  },
  {
    city: "KOLKATA",
    img: "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80",
    title: "KOLKATA",
    description: (
      <>
        <span className="font-bold">Kolkata’s meetup was full of culture and cuisine</span> at Victoria Memorial. See you next time!
      </>
    ),
    badge: "MEET 05",
    logo: "",
  },
]

const variants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

export default function CityMeetup() {
  const [active, setActive] = useState(0)

  return (
    <section className="px-2 md:px-6 mb-8 md:mb-12   py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-amber-900 mb-6 md:mb-8 text-center">
          City Meetups
        </h2>
        <div className="bg-white shadow-xl rounded-2xl p-4 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Left: Steps & Content */}
            <div className="flex-1 w-full">
              {/* Steps */}
              <div className="flex space-x-2 mb-4 justify-center md:justify-start">
                {meetups.map((m, idx) => (
                  <button
                    key={m.city}
                    onClick={() => setActive(idx)}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition-all
                      ${active === idx
                        ? "bg-black text-white border-black scale-110 shadow"
                        : "bg-white text-black border-gray-400 hover:bg-amber-100"}
                    `}
                    aria-label={m.city}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              {/* Animated Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.4, type: "spring" }}
                  className="min-h-[160px] mt-2"
                >
                  <h3 className="text-xl md:text-2xl font-black text-amber-900 mb-2">{meetups[active].title}</h3>
                  <p className="text-amber-800 text-sm md:text-base leading-relaxed mb-2">
                    {meetups[active].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Right: Image */}
            <div className="flex-1 w-full flex justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={meetups[active].img}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.4, type: "spring" }}
                  className="relative w-48 h-48 md:w-64 md:h-64 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center"
                >
                  {/* Optional logo and badge */}
                  {meetups[active].logo && (
                    <img
                      src={meetups[active].logo}
                      alt="Logo"
                      className="absolute top-2 left-2 w-10 h-10 object-contain z-10"
                    />
                  )}
                  <img
                    src={meetups[active].img}
                    alt={meetups[active].city}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 bg-white/80 text-xs font-bold px-2 py-1 rounded">{meetups[active].badge}</span>
                  <span className="absolute bottom-2 left-2 text-white font-bold text-lg drop-shadow">{meetups[active].city} Meetup</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}