import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    id: 'Kerela trip',
    title: 'Kerela trip',
    status: '',
    description: 'Spirituality at its peak',
    image: '/KERELA.jpg',
    from: "Reach SMET (Shivamogga Town Railway Station) before 6:00 AM on 5th September to kick off the adventure",
    to: "Book your return from UD (Udupi Railway Station) after 9:00 PM on 7th September",
    backgroundColor: 'bg-yellow-200',
    textColor: 'text-gray-800',
    formLink: 'https://forms.gle/kn8N7e6ufwwTLq3b6',
    details: 'https://drive.google.com/file/d/10vfAGX_TbaHeyQU2tp236axnT5cdiViS/view',
    included: [],
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
    from: "",
    to: "",
    formLink: "",
    included: []
  }
];
let currentStep = 0; // This should be managed by your component state

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
      <div className="max-w-4xl mx-auto p-6 mb-20">
        <div className="space-y-4">
          {trips.map((trip) => (
            <motion.div
              key={trip.id}
              layout
              className={`${trip.backgroundColor} rounded-3xl overflow-hidden shadow-lg`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div layout="position" className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <motion.h2
                      layout="position"
                      className={`text-2xl md:text-3xl font-bold ${trip.textColor} mb-2`}
                    >
                      {trip.title}
                    </motion.h2>

                    <motion.p
                      layout="position"
                      className={`${trip.textColor} opacity-80`}
                    >
                      {trip.status}
                    </motion.p>
                  </div>

                  <motion.button
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
                  </motion.button>
                </div>
              </motion.div>

              <AnimatePresence>
                {expandedCard === trip.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      {trip.image && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                          className="mb-6 overflow-hidden rounded-2xl"
                        >
                          <img
                            src={trip.image}
                            alt={trip.title}
                            className="w-full h-auto shadow-lg"
                          />
                        </motion.div>
                      )}

                      {/* <div className="mt-4">
                      <h3 className={`${trip.textColor} font-bold text-xl mb-2`}>
                        Arrival
                      </h3>
                      <p className={`${trip.textColor} text-lg mb-4 text-[#0f5027]`}>
                        {trip.from}
                      </p>
                      <h3 className={`${trip.textColor} font-bold text-xl mb-2`}>
                        Depat
                      </h3>
                      <p className={`${trip.textColor} text-lg mb-4 text-[#0f5027]`}>
                        {trip.to}
                      </p>
                    </div> */}
                      {/* <div className="mt-4">
                      <h3 className={`${trip.textColor} font-bold text-xl mb-2`}>
                        Included
                      </h3>
                      <ul className={`${trip.textColor} text-lg list-disc pl-6`}>
                        {trip.included.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div> */}
                      {/* <h2 className='text-2xl font-bold text-[#3B001B] mb-2'>
                      Shimoga Trip
                    </h2>
                    <h4>
                      Sept 5 - Sept 7
                    </h4> */}
                      {trip.formLink ? (
                        <div className="flex grid-cols-2 gap-4">
                          <div className="mt-4">
                            <a
                              href={trip.formLink}
                              className={`text-lg font-semibold ${trip.textColor} hover:underline`}
                            >
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center gap-2 px-6 py-3 bg-[#ff5722] rounded-full text-white shadow-md hover:shadow-lg transition-shadow ${trip.textColor}`}
                              >
                                Register
                              </motion.button>
                            </a>
                          </div>

                          <div className="mt-4">
                            <a
                              href={trip.details}
                              className={`text-lg font-semibold ${trip.textColor} hover:underline`}
                            >
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center gap-2 px-6 py-3 bg-[#ff5722] rounded-full text-white shadow-md hover:shadow-lg transition-shadow ${trip.textColor}`}
                              >
                                More details
                              </motion.button>
                            </a>
                          </div>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div >
    </Section >
  );
};

export default tripsPlanned;
