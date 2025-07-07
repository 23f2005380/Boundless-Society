
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import Section from "@/components/Section";

interface Trip {
  id: string;
  title: string;
  status: string;
  description?: string;
  image?: string;
  details?: string[];
  backgroundColor: string;
  textColor: string;
}

const trips: Trip[] = [
  {
    id: 'mewar',
    title: 'Mewar Trip',
    status: 'Coming Soon',
    description: 'Explore the royal heritage of Mewar',
    image: '/lovable-uploads/4b408953-21ba-4657-94ac-dabfacb3760c.png',
    details: [
      'Visit historic palaces and forts',
      'Traditional Rajasthani cuisine',
      'Guided heritage walks',
      'Cultural performances',
      '5 days, 4 nights accommodation'
    ],
    backgroundColor: 'bg-yellow-200',
    textColor: 'text-gray-800'
  },
  {
    id: 'coming-soon',
    title: 'Coming Soon',
    status: 'Stay Tuned for more details',
    backgroundColor: 'bg-purple-200',
    textColor: 'text-gray-800'
  }
];

const tripsPlanned = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (tripId: string) => {
    setExpandedCard(expandedCard === tripId ? null : tripId);
  };

  return (
    <Section headingStyle="text-brown"
          svgFill="#fffbea"
          sectionHeading="UPCOMING TRIPS">
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
            <motion.div 
              layout="position"
              className="p-6"
            >
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
                        className="mb-6"
                      >
                        <img
                          src={trip.image}
                          alt={trip.title}
                          className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-lg"
                        />
                      </motion.div>
                    )}
                    
                    {trip.description && (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className={`${trip.textColor} text-lg mb-4`}
                      >
                        {trip.description}
                      </motion.p>
                    )}
                    
                    {trip.details && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                      >
                        <h3 className={`${trip.textColor} font-bold text-xl mb-4`}>
                          What's Included:
                        </h3>
                        <ul className="space-y-2">
                          {trip.details.map((detail, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                              className={`${trip.textColor} flex items-center gap-2`}
                            >
                              <div className="w-2 h-2 bg-current rounded-full opacity-60" />
                              {detail}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
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
