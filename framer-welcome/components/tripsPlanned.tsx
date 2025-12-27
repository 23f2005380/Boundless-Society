import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import Section from "@/components/Section";
import { plannedTrips } from "@/data/plannedTrips";
import { CldImage } from "next-cloudinary";

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
          {plannedTrips.map((trip) => (
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
                          className="mb-6 overflow-hidden rounded-2xl relative h-64 md:h-80"
                        >
                           <CldImage
                            src={trip.image}
                            alt={trip.title}
                            fill
                            className="object-cover object-top shadow-lg"
                            sizes="(max-width: 768px) 100vw, 800px"
                          />
                        </motion.div>
                      )}

                      {/* Content logic remains (commented out sections preserved) */}
                      
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
                                Registration
                              </motion.button>
                            </a>
                          </div>

                          {trip.details && (
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
                          )}
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
      </div>
    </Section>
  );
};

export default tripsPlanned;