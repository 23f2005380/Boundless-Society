"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { 
  MapPin, 
  Filter, 
  X, 
  Info, 
  Map, 
  Grid, 
  Sparkles,
  Search,
  MapPinOff,
  ChevronRight,
  TrendingUp
} from "lucide-react"
import IndiaMap from "@/components/IndiaMap"
import MeetupSection from "@/components/MeetupSection"

// Types
interface Meetup {
  id: string
  mainSection: string
  subSection: string
  cityName: string
  color: string
  img: string
  createdAt?: any
}

interface CityGroup {
  cityName: string
  x: number
  y: number
  meetups: Meetup[]
}

// Coordinates mapping for major Indian cities on the viewBox="0 0 612 696" SVG scale
const CITY_COORDINATES: Record<string, { x: number; y: number }> = {
  "delhi": { x: 210, y: 205 },
  "ncr": { x: 210, y: 205 },
  "new delhi": { x: 210, y: 205 },
  "mumbai": { x: 120, y: 435 },
  "bombay": { x: 120, y: 435 },
  "bangalore": { x: 205, y: 555 },
  "bengaluru": { x: 205, y: 555 },
  "chennai": { x: 245, y: 580 },
  "madras": { x: 245, y: 580 },
  "kolkata": { x: 420, y: 340 },
  "calcutta": { x: 420, y: 340 },
  "jaipur": { x: 175, y: 250 },
  "indore": { x: 200, y: 345 },
  "nagpur": { x: 260, y: 375 },
  "patna": { x: 380, y: 260 },
  "gorakhpur": { x: 335, y: 240 },
  "bhubaneswar": { x: 390, y: 410 },
  "jamshedpur": { x: 395, y: 325 },
  "madurai": { x: 215, y: 635 },
  "bhopal": { x: 225, y: 340 },
  "udaipur": { x: 130, y: 290 },
  "gwalior": { x: 215, y: 275 },
  "gaya": { x: 375, y: 270 },
  "tezpur": { x: 525, y: 230 },
  "lucknow": { x: 280, y: 240 },
  "jodhpur": { x: 120, y: 250 },
  "salem": { x: 220, y: 600 },
  "hyderabad": { x: 235, y: 480 },
  "pune": { x: 130, y: 455 },
  "ahmedabad": { x: 110, y: 335 },
  "goa": { x: 125, y: 515 },
  "coimbatore": { x: 195, y: 615 },
  "guwahati": { x: 500, y: 240 },
  "ranchi": { x: 375, y: 320 },
  "dehradun": { x: 230, y: 170 },
  "shimla": { x: 215, y: 150 },
  "srinagar": { x: 170, y: 90 },
  "jammu": { x: 170, y: 110 },
  "trivandrum": { x: 190, y: 670 },
  "thiruvananthapuram": { x: 190, y: 670 },
  "kochi": { x: 185, y: 640 },
  "cochin": { x: 185, y: 640 },
  "visakhapatnam": { x: 305, y: 470 },
  "vizag": { x: 305, y: 470 },
  "vijayawada": { x: 265, y: 500 },
  "chandigarh": { x: 205, y: 170 },
  "amritsar": { x: 180, y: 155 },
  "varanasi": { x: 330, y: 270 },
  "prayagraj": { x: 310, y: 275 },
  "allahabad": { x: 310, y: 275 },
  "kanpur": { x: 280, y: 260 },
  "surat": { x: 105, y: 390 },
  "vadodara": { x: 115, y: 365 },
  "baroda": { x: 115, y: 365 },
  "nashik": { x: 135, y: 415 },
  "nasik": { x: 135, y: 415 },
  "aurangabad": { x: 170, y: 420 },
  "rajkot": { x: 75, y: 350 },
  "jabalpur": { x: 265, y: 340 },
  "raipur": { x: 310, y: 385 },
  "gandhinagar": { x: 110, y: 325 },
  "kano": { x: 250, y: 350 }
}

function getCityCoordinates(cityName: string): { x: number; y: number } {
  const cleanName = cityName.trim().toLowerCase()
  if (CITY_COORDINATES[cleanName]) {
    return CITY_COORDINATES[cleanName]
  }

  // Try substring matching
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return coords
    }
  }

  // Generate a reproducible pseudo-random coordinate in Central India for unmapped cities
  const hash = cleanName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const offsetX = (hash % 60) - 30
  const offsetY = ((hash >> 2) % 60) - 30
  return { x: 250 + offsetX, y: 350 + offsetY }
}

export default function CityMeetupsPage() {
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"map" | "grid">("map")
  const [activeFilter, setActiveFilter] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMeetups = async () => {
      try {
        const res = await fetch("/api/city-meetups")
        const data = await res.json()
        if (res.ok && data.meetups) {
          setMeetups(data.meetups)
        }
      } catch (error) {
        console.error("Failed to fetch meetups:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMeetups()
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter options are subSections (Events) from the database
  // We exclude general terms like "City Meetups" or "City Meetup" as filters since it represents the whole page
  const eventFilters = useMemo(() => {
    const subSections = meetups
      .map((m) => m.subSection)
      .filter((sub) => sub && !sub.toLowerCase().includes("city meetup"))
    return Array.from(new Set(subSections))
  }, [meetups])

  // Get top 5 recommended cities dynamically based on meetups frequency
  const recommendedCities = useMemo(() => {
    const counts: Record<string, number> = {}
    meetups.forEach((m) => {
      if (m.cityName) counts[m.cityName] = (counts[m.cityName] || 0) + 1
    })
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 5)
  }, [meetups])

  // Get top 4 popular subSection events as quick search options
  const popularEvents = useMemo(() => {
    const subSecs = meetups
      .map((m) => m.subSection)
      .filter((sub) => sub && !sub.toLowerCase().includes("city meetup"))
    return Array.from(new Set(subSecs)).slice(0, 4)
  }, [meetups])

  // Filter meetups
  const filteredMeetups = useMemo(() => {
    return meetups.filter((m) => {
      const matchesFilter = activeFilter === "All" || m.subSection === activeFilter
      const matchesSearch = 
        m.cityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subSection.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.mainSection.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [meetups, activeFilter, searchQuery])

  // Group filtered meetups by city to plot on map
  const cityGroups = useMemo<CityGroup[]>(() => {
    const groups: Record<string, Meetup[]> = {}
    filteredMeetups.forEach((meetup) => {
      const city = meetup.cityName || "Unknown City"
      if (!groups[city]) {
        groups[city] = []
      }
      groups[city].push(meetup)
    })

    return Object.keys(groups).map((city) => {
      const coords = getCityCoordinates(city)
      return {
        cityName: city,
        x: coords.x,
        y: coords.y,
        meetups: groups[city],
      }
    })
  }, [filteredMeetups])

  // Get details for currently selected city
  const selectedCity = useMemo(() => {
    if (!selectedCityName) return null
    return cityGroups.find((g) => g.cityName === selectedCityName) || null
  }, [selectedCityName, cityGroups])

  // Map data to the classic MeetupSection structure for standard grid view
  const groupedSectionsForGrid = useMemo(() => {
    const grouped = filteredMeetups.reduce((acc: any, meetup) => {
      const heading = meetup.subSection || "Other Meetups"
      if (!acc[heading]) {
        acc[heading] = []
      }
      acc[heading].push({
        city: meetup.cityName || "Unknown City",
        img: meetup.img,
        caption: meetup.cityName || "",
        color: meetup.color || "#FEFAE7",
        galleryLink: "#",
      })
      return acc
    }, {})

    return Object.keys(grouped).map((key) => ({
      sectionTitle: key,
      cards: grouped[key],
    }))
  }, [filteredMeetups])

  // Click on a filter toggles it (if already active, deselected back to "All")
  const handleFilterClick = (filter: string) => {
    if (activeFilter === filter) {
      setActiveFilter("All")
    } else {
      setActiveFilter(filter)
      setSelectedCityName(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FEFAE7] flex flex-col items-center justify-center gap-4 text-lg font-medium text-amber-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-900"></div>
        Loading meetups map...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FEFAE7] py-6 px-4 md:px-8 relative overflow-hidden">
      {/* Dynamic Keyframe Styles */}
      <style jsx global>{`
        @keyframes pulse-glow {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.8;
          }
        }
        .pulse-effect {
          animation: pulse-glow 2s infinite ease-in-out;
          transform-origin: center;
        }
      `}</style>

      {/* Decorative patterns */}
      <div className="absolute inset-0 pointer-events-none opacity-40" 
           style={{
             backgroundImage: "repeating-radial-gradient(circle at center, #fae2e3 0px, #fcefe6 40px, #fae2e3 42px)",
             maskImage: "linear-gradient(to top, black 30%, transparent)",
             WebkitMaskImage: "linear-gradient(to top, black 30%, transparent)"
           }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 border-b-2 border-amber-900/10 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-amber-950 tracking-tight flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-amber-800 animate-pulse" />
              City Meetups
            </h1>
            <p className="text-amber-800 font-medium text-sm md:text-base mt-2">
              Explore events and city timelines mapped dynamically across India.
            </p>
          </div>

          {/* Toggle View Mode */}
          <div className="flex bg-amber-900/5 p-1 rounded-xl border border-amber-950/10 self-start md:self-center">
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "map" 
                  ? "bg-amber-900 text-white shadow-md" 
                  : "text-amber-900 hover:bg-amber-900/10"
              }`}
            >
              <Map className="w-4 h-4" />
              Interactive Map
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "grid" 
                  ? "bg-amber-900 text-white shadow-md" 
                  : "text-amber-900 hover:bg-amber-900/10"
              }`}
            >
              <Grid className="w-4 h-4" />
              Classic Cards
            </button>
          </div>
        </header>

        {/* Filters and Search Dashboard */}
        <div className="relative z-50 flex flex-col gap-4 mb-8 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-amber-900/10 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider mr-2">
                <Filter className="w-3.5 h-3.5" />
                Select Event:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {eventFilters.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleFilterClick(option)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      activeFilter === option
                        ? "bg-amber-900 text-white border-amber-900 shadow-sm"
                        : "bg-white text-amber-900 border-amber-900/20 hover:bg-amber-100"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {activeFilter !== "All" && (
                <button 
                  onClick={() => setActiveFilter("All")}
                  className="text-xs font-bold text-amber-900 underline hover:text-amber-700 ml-2"
                >
                  Show All
                </button>
              )}
            </div>

            {/* Search Input with Recommended Dropdown */}
            <div className="relative w-full lg:max-w-xs" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-900/40" />
                <input
                  type="text"
                  placeholder="Search city or event..."
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedCityName(null)
                  }}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-amber-900/20 focus:outline-none focus:border-amber-900 bg-white/80 placeholder-amber-900/30 text-amber-950 font-medium shadow-inner transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCityName(null)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-900/40 hover:text-amber-900 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Recommended searches dropdown */}
              <AnimatePresence>
                {isSearchFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-amber-900/10 shadow-2xl p-4 z-30 max-h-[350px] overflow-y-auto"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900/50 uppercase tracking-widest mb-2 border-b border-amber-900/5 pb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Recommended Cities
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {recommendedCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setSearchQuery(city)
                            setSelectedCityName(city) // Select city directly on map
                            setIsSearchFocused(false)
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-900/5 text-amber-900 hover:bg-amber-900/10 border border-amber-900/10 transition-colors cursor-pointer"
                        >
                          <MapPin className="w-3 h-3" />
                          {city}
                        </button>
                      ))}
                    </div>

                    {popularEvents.length > 0 && (
                      <>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900/50 uppercase tracking-widest mb-2 border-b border-amber-900/5 pb-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Events
                        </div>
                        <div className="flex flex-col gap-1">
                          {popularEvents.map((event) => (
                            <button
                              key={event}
                              onClick={() => {
                                setSearchQuery("")
                                setActiveFilter(event)
                                setSelectedCityName(null)
                                setIsSearchFocused(false)
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-amber-950 hover:bg-amber-900/5 transition-colors cursor-pointer flex items-center justify-between"
                            >
                              <span>{event}</span>
                              <ChevronRight className="w-3 h-3 text-amber-900/30" />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Dashboard Area */}
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <motion.div
              key="map-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Interactive Map */}
              <div className="col-span-1 lg:col-span-7 bg-white/50 backdrop-blur-md rounded-3xl p-4 md:p-6 border border-amber-900/10 shadow-xl flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4 border-b border-amber-900/5 pb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
                    <Map className="w-4 h-4 text-amber-800" />
                    <span>Meetup Map of India</span>
                  </div>
                  <div className="text-xs text-amber-800/80 font-semibold bg-amber-900/5 px-2.5 py-1 rounded-full">
                    {cityGroups.length} Active Cities
                  </div>
                </div>

                <div className="w-full max-w-[550px] relative">
                  <IndiaMap 
                    selectedState={undefined} 
                    onStateClick={undefined}
                    className="transition-opacity duration-300"
                  >
                    {/* Render City Pins */}
                    {cityGroups.map((group) => {
                      const isSelected = selectedCityName === group.cityName
                      const hasMultiple = group.meetups.length > 1
                      return (
                        <g 
                          key={group.cityName}
                          className="cursor-pointer"
                          onClick={() => setSelectedCityName(group.cityName)}
                        >
                          {/* Pulsing glow under selected or active pins */}
                          <circle
                            cx={group.x}
                            cy={group.y}
                            r={isSelected ? 18 : 12}
                            fill={isSelected ? "#4b0f1e" : "#FE6B64"}
                            opacity={isSelected ? 0.3 : 0.4}
                            className="pulse-effect"
                          />
                          
                          {/* Inner Circle Pin */}
                          <circle
                            cx={group.x}
                            cy={group.y}
                            r={isSelected ? 6 : 4.5}
                            fill={isSelected ? "#3B001B" : "#4b0f1e"}
                            stroke="#fff"
                            strokeWidth={isSelected ? 2 : 1.5}
                            className="transition-all duration-300 hover:scale-125"
                          />

                          {/* Quick Text Label */}
                          <text
                            x={group.x}
                            y={group.y - 10}
                            textAnchor="middle"
                            className={`text-[8px] font-black select-none pointer-events-none fill-amber-950 drop-shadow-md transition-all duration-300 ${
                              isSelected ? "text-[10px] font-black scale-105" : "opacity-80"
                            }`}
                          >
                            {group.cityName}
                            {hasMultiple && ` (${group.meetups.length})`}
                          </text>
                        </g>
                      )
                    })}
                  </IndiaMap>
                </div>
              </div>

              {/* Right Column: Desktop Detail Timeline (Hidden on Mobile) */}
              <div className="hidden lg:block lg:col-span-5 h-full">
                <AnimatePresence mode="wait">
                  {selectedCity ? (
                    <motion.div
                      key={`timeline-desktop-${selectedCity.cityName}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-white rounded-3xl p-6 border border-amber-900/10 shadow-xl flex flex-col gap-6"
                    >
                      {/* Selected City Header */}
                      <div className="flex items-center justify-between border-b border-amber-900/15 pb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-amber-900/10 p-2.5 rounded-2xl text-amber-900">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-amber-950">{selectedCity.cityName}</h2>
                            <p className="text-xs text-amber-800 font-semibold mt-0.5">
                              {selectedCity.meetups.length} Event{selectedCity.meetups.length > 1 ? "s" : ""} Hosted
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedCityName(null)}
                          className="text-amber-900/50 hover:text-amber-900 hover:bg-amber-900/5 p-2 rounded-full transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Meetup Timeline Track */}
                      <div className="flex flex-col gap-6 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin scrollbar-thumb-amber-900/10">
                        {selectedCity.meetups.map((meetup, idx) => (
                          <div key={meetup.id} className="relative flex gap-4">
                            {/* Vertical Line Connector */}
                            {idx < selectedCity.meetups.length - 1 && (
                              <div className="absolute left-[17px] top-[34px] bottom-[-24px] w-0.5 bg-amber-900/20" />
                            )}

                            {/* Node Dot */}
                            <div className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-amber-900/10 border-2 border-amber-900 text-amber-950 font-bold text-sm shrink-0">
                              {idx + 1}
                            </div>

                            {/* Timeline Card */}
                            <div 
                              className="flex-1 rounded-2xl border border-amber-900/10 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                              style={{ backgroundColor: meetup.color + "15" }}
                            >
                              <div className="relative h-44 w-full bg-amber-100">
                                <Image
                                  src={meetup.img}
                                  alt={meetup.cityName}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                  className="object-cover"
                                />
                              </div>

                              <div className="p-4 border-t border-amber-900/5 bg-white/90">
                                <span className="inline-block text-[10px] uppercase tracking-wider font-extrabold text-amber-900 bg-amber-900/10 px-2 py-0.5 rounded-full mb-1">
                                  {meetup.cityName}
                                </span>
                                <h3 className="font-bold text-lg text-amber-950 leading-snug">
                                  {meetup.subSection}
                                </h3>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-selection"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white/40 backdrop-blur-md rounded-3xl p-8 border-2 border-dashed border-amber-900/20 shadow-inner h-[500px] flex flex-col items-center justify-center text-center gap-4"
                    >
                      <div className="bg-amber-900/5 p-4 rounded-full text-amber-900/40 animate-bounce">
                        <MapPin className="w-12 h-12" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-amber-950">Select a Location</h3>
                        <p className="text-amber-850 text-sm max-w-xs mx-auto mt-2 leading-relaxed">
                          Click on any pulsing city pin on the map to display its event timeline and photographs.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Drawer (Responsive bottom sheet for selected city) */}
              <AnimatePresence>
                {selectedCity && (
                  <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
                    {/* Dark glass backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedCityName(null)}
                      className="absolute inset-0 bg-amber-950/40 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Bottom Drawer Sheet */}
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 250 }}
                      className="relative w-full max-h-[85vh] bg-white rounded-t-[32px] border-t border-amber-900/10 shadow-2xl p-6 flex flex-col gap-4 pointer-events-auto z-10"
                    >
                      {/* Drag Handle Bar */}
                      <div className="w-12 h-1.5 bg-amber-900/10 rounded-full mx-auto mb-2" />

                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-amber-900" />
                          <div>
                            <h2 className="text-xl font-bold text-amber-950">{selectedCity.cityName}</h2>
                            <p className="text-xs text-amber-800 font-semibold">
                              {selectedCity.meetups.length} Event{selectedCity.meetups.length > 1 ? "s" : ""} Hosted
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCityName(null)}
                          className="bg-amber-900/5 p-1.5 rounded-full text-amber-900/60 hover:text-amber-900 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Timeline content */}
                      <div className="flex flex-col gap-6 overflow-y-auto pr-1 py-2 max-h-[55vh]">
                        {selectedCity.meetups.map((meetup, idx) => (
                          <div key={meetup.id} className="relative flex gap-3">
                            {/* Vertical connector line */}
                            {idx < selectedCity.meetups.length - 1 && (
                              <div className="absolute left-[15px] top-[30px] bottom-[-24px] w-0.5 bg-amber-900/20" />
                            )}

                            {/* Node Dot */}
                            <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-amber-900/10 border-2 border-amber-900 text-amber-950 font-bold text-xs shrink-0">
                              {idx + 1}
                            </div>

                            {/* Card Content */}
                            <div 
                              className="flex-1 rounded-2xl border border-amber-900/10 overflow-hidden shadow-sm"
                              style={{ backgroundColor: meetup.color + "15" }}
                            >
                              <div className="relative h-36 w-full bg-amber-100">
                                <Image
                                  src={meetup.img}
                                  alt={meetup.cityName}
                                  fill
                                  sizes="100vw"
                                  className="object-cover"
                                />
                              </div>
                              <div className="p-3 bg-white/95 border-t border-amber-900/5">
                                <span className="inline-block text-[9px] uppercase tracking-wider font-extrabold text-amber-900 bg-amber-900/10 px-2 py-0.5 rounded-full mb-1">
                                  {meetup.cityName}
                                </span>
                                <h3 className="font-bold text-sm text-amber-950">
                                  {meetup.subSection}
                                </h3>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            // Classic Cards Grid View
            <motion.div
              key="grid-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {groupedSectionsForGrid.length === 0 ? (
                <div className="bg-white/40 backdrop-blur-md rounded-3xl p-12 border-2 border-dashed border-amber-900/20 text-center flex flex-col items-center justify-center gap-4">
                  <MapPinOff className="w-12 h-12 text-amber-900/30" />
                  <p className="text-lg font-bold text-amber-950">No meetups match your search or filter</p>
                  <p className="text-sm text-amber-800">Try modifying your filter or clear the search criteria.</p>
                </div>
              ) : (
                groupedSectionsForGrid.map((section, idx) => (
                  <MeetupSection
                    key={idx}
                    title={section.sectionTitle}
                    cards={section.cards}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}