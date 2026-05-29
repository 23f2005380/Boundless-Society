"use client";

import React, { useEffect, useState } from "react";
import Section from "@/components/Section";
import TripCard from "@/components/TripCard";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import Image from "next/image";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Instagram, 
  Compass, 
  ExternalLink,
} from "lucide-react";
import GlimpsesGallery from "@/components/GlimpsesGallery";

function PrevTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);



  // Fetch data from API when the page loads
  useEffect(() => {
    async function fetchTrips() {
      try {
        const response = await fetch("/api/previous-trips");
        if (response.ok) {
          const data = await response.json();
          setTrips(data.trips || []);
        } else {
          console.error("Failed to fetch trips");
        }
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrips();
  }, []);

  return (
    <>
      <Section
        svgFill="#fffbeb"
        sectionHeading="Previous Trips"
        headingStyle="text-black"
      >
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-radial-gradient(circle at center 60%, #fae2e3 0px, #fcefe6 35px, #fae2e3 38px)`,
              maskImage: `linear-gradient(to top, black 40%, transparent 98%)`,
              WebkitMaskImage: `linear-gradient(to top, black 40%, transparent 98%)`,
            }}
          ></div>

          <div className="relative z-10 w-fit mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 pb-15 place-items-center">
            {loading ? (
              <div className="col-span-full text-center text-xl text-gray-500 py-20">
                Loading trips...
              </div>
            ) : trips.length > 0 ? (
              trips.map((trip) => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  onOpen={(selected) => setSelectedTrip(selected)}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-xl text-gray-500 py-20">
                No previous trips found.
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Dynamic Summary Bottom Sheet */}
      <Sheet open={!!selectedTrip} onOpenChange={(open) => !open && setSelectedTrip(null)}>
        <SheetContent
          side="bottom"
          className="h-[90vh] sm:h-[85vh] w-full gap-0 p-0 flex flex-col overflow-hidden rounded-t-[32px] border-none bg-amber-50/95 backdrop-blur-md text-gray-800 shadow-2xl transition duration-500 focus:outline-none"
        >
          {selectedTrip && (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                
                {/* Hero Image Section */}
                <div className="relative w-full h-[220px] sm:h-[320px] flex-shrink-0">
                  <Image
                    src={selectedTrip.img || "/placeholder.jpg"}
                    alt={selectedTrip.title || selectedTrip.heading || "Trip Image"}
                    fill
                    priority
                    className="object-cover"
                  />
                  {/* Elegant overlay to guarantee readability of title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-950 via-black/25 to-transparent" />
                  
                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex flex-col justify-end">
                    {(selectedTrip.title || selectedTrip.heading) && (
                      <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                        {selectedTrip.title || selectedTrip.heading}
                      </h2>
                    )}
                  </div>
                </div>

                <div className="p-6 sm:p-8 pb-12">
                  <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    
                    {/* Left Column: Info Grid & Glimpses */}
                    <div className="space-y-6">
                      
                      {/* Info Table / Key-Value Grid */}
                      {(selectedTrip.date || selectedTrip.venue || selectedTrip.participants || selectedTrip.instagramHandle) && (
                        <div className="bg-white/80 backdrop-blur-sm border border-amber-100 rounded-2xl p-5 shadow-sm space-y-4">
                          <h3 className="text-lg font-bold text-amber-900 border-b border-amber-50 pb-2 flex items-center gap-2">
                            <Compass className="size-5" /> Trip Details
                          </h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Date */}
                            {selectedTrip.date && (
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100/80 text-amber-700 rounded-xl flex-shrink-0">
                                  <Calendar className="size-5" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Date</p>
                                  <p className="text-sm font-medium text-gray-800">{selectedTrip.date}</p>
                                </div>
                              </div>
                            )}

                            {/* Venue */}
                            {selectedTrip.venue && (
                              <div className="flex items-center gap-3 sm:col-span-2">
                                <div className="p-2 bg-amber-100/80 text-amber-700 rounded-xl flex-shrink-0">
                                  <MapPin className="size-5" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Venue / Route</p>
                                  <p className="text-sm font-medium text-gray-800">{selectedTrip.venue}</p>
                                </div>
                              </div>
                            )}

                            {/* Participants */}
                            {selectedTrip.participants && (
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100/80 text-amber-700 rounded-xl flex-shrink-0">
                                  <Users className="size-5" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Participants</p>
                                  <p className="text-sm font-bold text-gray-800">{selectedTrip.participants} explorers</p>
                                </div>
                              </div>
                            )}

                            {/* Instagram Handle */}
                            {selectedTrip.instagramHandle && (
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100/80 text-amber-700 rounded-xl flex-shrink-0">
                                  <Instagram className="size-5" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Instagram</p>
                                  <p className="text-sm font-medium text-gray-800">{selectedTrip.instagramHandle}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <GlimpsesGallery trip={selectedTrip} />
                    </div>

                    {/* Right Column: Recap Summary */}
                    {selectedTrip.summary && (
                      <div className="bg-white/80 backdrop-blur-sm border border-amber-100 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-amber-900 border-b border-amber-50 pb-2">
                          Trip Summary
                        </h3>
                        <div className="text-gray-700 text-sm leading-relaxed space-y-4 font-normal max-h-[350px] overflow-y-auto pr-1">
                          {selectedTrip.summary.split("\n").map((para, idx) => (
                            para.trim() && <p key={idx}>{para.trim()}</p>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-t border-amber-100 p-4 flex items-center justify-end gap-3 w-full shadow-md">
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Close
                </button>
                {selectedTrip.link && (
                  <a
                    href={selectedTrip.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition hover:scale-[1.02] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 cursor-pointer"
                  >
                    <Instagram className="size-4" /> View on Instagram <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export default PrevTrips;