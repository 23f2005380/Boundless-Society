"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

import meetups from "@/data/city"

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
        {/* <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-amber-900 mb-6 md:mb-8 text-center">
          City Meetups
        </h2> */}
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
                  {/* <span className="absolute top-2 right-2 bg-white/80 text-xs font-bold px-2 py-1 rounded">{meetups[active].badge}</span> */}
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