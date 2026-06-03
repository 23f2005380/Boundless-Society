"use client";

import React, { useEffect, useState } from "react";
import Section from "./Section";
import TripCard from "./TripCard";
import MainButton from "./MainButton";
import { useRouter } from "next/navigation";
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

function Prev() {
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Fetch trips from the API when the component mounts
  useEffect(() => {
    async function fetchTrips() {
      try {
        // This calls the API route you created earlier
        const response = await fetch("/api/previous-trips");
        if (response.ok) {
          const data = await response.json();
          setTrips(data.trips || []);
        } else {
          console.error("Failed to fetch previous trips");
        }
      } catch (error) {
        console.error("Error fetching previous trips:", error);
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
        headingStyle="text-brown"
      >
        <div className="w-fit mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 pb-6 place-items-center">
          {loading ? (
            <div className="col-span-full text-center py-10 text-gray-500 text-lg">
              Loading trips...
            </div>
          ) : trips.length > 0 ? (
            // We slice(0, 6) to keep the layout clean on the homepage (max 6 items)
            trips.slice(0, 6).map((trip) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                onOpen={(selected) => setSelectedTrip(selected)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">
              No previous trips found.
            </div>
          )}
        </div>
        <div className="flex items-center justify-center mb-16">
          <MainButton onClick={() => router.push("/previous-trips")}>
            View More
          </MainButton>
        </div>
      </Section>

      {/* Dynamic Summary Bottom Sheet */}
      <Sheet open={!!selectedTrip} onOpenChange={(open) => !open && setSelectedTrip(null)}>
        <SheetContent
          side="bottom"
            className="h-[90vh] sm:h-[85vh] w-full gap-0 p-0 flex flex-col overflow-hidden overscroll-contain rounded-t-[32px] border-none bg-amber-50/95 backdrop-blur-md text-gray-800 shadow-2xl transition duration-500 focus:outline-none"
        >
          {selectedTrip && (
            <>
                <div className="flex h-full min-h-0 flex-col">
                  <div
                    className="flex-1 min-h-0 overflow-y-scroll overscroll-contain"
                    data-lenis-prevent
                  >
                    <div className="flex flex-col">
                      <div className="relative w-full h-[220px] sm:h-[320px] flex-shrink-0">
                        <Image
                          src={selectedTrip.img || "/placeholder.jpg"}
                          alt={selectedTrip.title || selectedTrip.heading || "Trip Image"}
                          fill
                          priority
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-950 via-black/25 to-transparent" />
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
                          <div className="space-y-6">
                            {(selectedTrip.date || selectedTrip.venue || selectedTrip.participants || selectedTrip.instagramHandle) && (
                              <div className="bg-white/80 backdrop-blur-sm border border-amber-100 rounded-2xl p-5 shadow-sm space-y-4">
                                <h3 className="text-lg font-bold text-amber-900 border-b border-amber-50 pb-2 flex items-center gap-2">
                                  <Compass className="size-5" /> Trip Details
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                          {(selectedTrip.summary || selectedTrip.feedback) && (
                            <div className="space-y-6">
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

                              {selectedTrip.feedback && (
                                <div className="bg-white/80 backdrop-blur-sm border border-amber-100 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                                  <h3 className="text-lg font-bold text-amber-900 border-b border-amber-50 pb-2">
                                    Feedback
                                  </h3>
                                  <div className="text-gray-700 text-sm leading-relaxed space-y-4 font-normal max-h-[350px] overflow-y-auto pr-1">
                                    {selectedTrip.feedback.split("\n").map((para, idx) => (
                                      para.trim() && <p key={idx}>{para.trim()}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export default Prev;