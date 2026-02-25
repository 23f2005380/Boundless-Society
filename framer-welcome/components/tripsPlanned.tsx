"use client";

import React, { useState } from "react";
import { m, LazyMotion, domAnimation, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import Section from "@/components/Section";
import { plannedTrips } from "@/data/plannedTrips";
import Image from "next/image";

interface Trip {
  id: string;
  title: string;
  status: string;
  description?: string;
  image?: string;
  details?: string;
  backgroundColor: string;
  textColor: string;
  from: string;
  to: string;
  formLink: string;
  included: string[];
  plan?: { title: string; description: string }[];
}

const steps = [
  { title: "Step One", description: "This is the first step." },
  { title: "Step Two", description: "This is the second step." },
  { title: "Step Three", description: "This is the third step." },
  { title: "Step Four", description: "This is the fourth step." },
  { title: "Step Five", description: "This is the fifth step." },
];
const trips: Trip[] = [
  {
    id: 'Himachal Trip',
    title: 'Himachal Trip',
    status: '',
    description: 'Spirituality at its peak',
    image: 'Solang-Valley-1024x576.jpg',
    from : "Reach SMET (Shivamogga Town Railway Station) before 6:00 AM on 5th September to kick off the adventure",
    to : "Book your return from UD (Udupi Railway Station) after 9:00 PM on 7th September",
    backgroundColor: 'bg-yellow-200',
    textColor: 'text-gray-800',
    formLink : 'https://forms.gle/faqHdaezZVicaxde6',
    details : 'https://drive.google.com/file/d/1suz8_BjCJf09Nk03VNf-L9uK74T4qyVb/view?usp=drivesdk',
    included : [],
    plan: [
      { title: 'Sept 5', description: 'Sakrebyle elephant camp, mandagadde bird sanctuary.' },
      { title: 'Day 2', description: 'Visit Jog Falls and nearby areas.' },
      { title: 'Day 3', description: 'Relax and return to Udupi.' }
    ]
  },
  {
    id: 'coming-soon',
    title: 'Coming Soon',
    status: 'Stay Tuned for more details',
    backgroundColor: 'bg-purple-200',
    textColor: 'text-gray-800',
    from : "",
    to : "",
    formLink : "",
   included : []
  }
];

const tripsPlanned = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (tripId: string) => {
    setExpandedCard(expandedCard === tripId ? null : tripId);
  };

  return (
    <Section
      headingStyle="text-brown"
      svgFill="#fffbea"
      sectionHeading="UPCOMING TRIPS"
    >
      <LazyMotion features={domAnimation}>
        <div className="max-w-4xl mx-auto p-6 mb-20">
          <div className="space-y-4">
            {trips.map((trip) => (
              <m.div
                key={trip.id}
                layout
                className={`${trip.backgroundColor} rounded-3xl overflow-hidden shadow-lg`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <m.div layout="position" className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <m.h2
                        layout="position"
                        className={`text-2xl md:text-3xl font-bold ${trip.textColor} mb-2`}
                      >
                        {trip.title}
                      </m.h2>

                      <m.p
                        layout="position"
                        className={`${trip.textColor} opacity-80`}
                      >
                        {trip.status}
                      </m.p>
                    </div>

                    <m.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCard(trip.id)}
                      className={`flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow ${trip.textColor}`}
                    >
                      {expandedCard === trip.id ? (
                        <>
                          <span className="font-semibold">Hide Details</span>
                          <X size={20} />
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">View Details</span>
                          <Plus size={20} />
                        </>
                      )}
                    </m.button>
                  </div>
                </m.div>

              <AnimatePresence>
                {expandedCard === trip.id && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      {trip.image && (
                        <m.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                          className="mb-6 overflow-hidden rounded-2xl"
                        >
                          <img
                            src={trip.image}
                            alt={trip.title}
                            className="w-full h-64 md:h-80 object-cover object-top shadow-lg"
                          />
                        </m.div>
                      )}
            
                        {trip.formLink ? (
                          <div className="flex grid-cols-2 gap-4">
                            <div className="mt-4">
                              <a
                                href={trip.formLink}
                                className={`text-lg font-semibold ${trip.textColor} hover:underline`}
                              >
                                <m.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`flex items-center gap-2 px-6 py-3 bg-[#ff5722] rounded-full text-white shadow-md hover:shadow-lg transition-shadow ${trip.textColor}`}
                                >
                                  Registration
                                </m.button>
                              </a>
                            </div>

                            <div className="mt-4">
                              <a
                                href={trip.details}
                                className={`text-lg font-semibold ${trip.textColor} hover:underline`}
                              >
                                <m.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`flex items-center gap-2 px-6 py-3 bg-[#ff5722] rounded-full text-white shadow-md hover:shadow-lg transition-shadow ${trip.textColor}`}
                                >
                                  More details
                                </m.button>
                              </a>
                            </div>
                          </div>
                        ) : (
                          ""
                        )}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            ))}
          </div>
        </div>
      </LazyMotion>
    </Section>
  );
};

export default tripsPlanned;
