import { useState } from "react"
import { Plus, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const trips = [
  {
    title: "Mewar Trip",
    color: "bg-[#FAE8A2] ",
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    details: (
      <>
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
          alt="Mewar"
          className="rounded-xl w-full h-48 object-cover mb-4"
        />
        <h4 className="font-bold text-lg mb-2 text-amber-900">What's Included:</h4>
        <ul className="list-disc pl-5 text-amber-800 mb-2">
          <li>Stay</li>
          <li>Food</li>
          <li>Guided Tours</li>
        </ul>
      </>
    ),
  },
  {
    title: "Uttarakhand Trip",
    color: "bg-[#FFDBFF]",
    img: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
    details: (
      <>
        <img
          src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80"
          alt="Uttarakhand"
          className="rounded-xl w-full h-48 object-cover mb-4"
        />
        <h4 className="font-bold text-lg mb-2 text-amber-900">What's Included:</h4>
        <ul className="list-disc pl-5 text-amber-800 mb-2">
          <li>Stay</li>
          <li>Food</li>
          <li>Adventure Activities</li>
        </ul>
      </>
    ),
  },
  {
    title: "Revealing Soon",
    color: "bg-[#E6FFE6] ",
    soon: true,
    details: (
      <p className="text-sm text-amber-800 mb-3 md:mb-4">Stay Tuned for more details</p>
    ),
  },
]

export default function TripsPlanned() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <section className="px-4 md:px-6 mb-8 md:mb-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-4 gap-4 md:gap-6">
          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-1 space-y-3">
            <div className="text-amber-800 font-semibold space-y-2">
              {trips.map((trip, i) => (
                <div key={i} className="p-3 hover:bg-amber-200 rounded cursor-pointer transition-colors">
                  {trip.title}
                </div>
              ))}
            </div>
          </div>
          {/* Trip Cards */}
          <div className="lg:col-span-3 space-y-3 md:space-y-4">
            {trips.map((trip, i) => (
  <motion.div
    key={i}
    layout
    className={`border shadow-lg overflow-hidden ${trip.color} transition-all`}
    style={{ borderRadius: "34px" }}
    transition={{ layout: { duration: 0.5, type: "spring" } }}
  >
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h3 className="text-lg md:text-xl font-bold text-amber-900">{trip.title}</h3>
        {!trip.soon && (
          <motion.button
            layout
            className={`ml-2 flex items-center justify-center ${
              openIdx === i
                ? "bg-amber-950 text-amber-100"
                : "bg-white hover:bg-gray-50 text-sm md:text-base border border-gray-300"
            } px-3 py-1 transition font-semibold text-xs md:text-sm`}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            style={{ borderRadius: "20px" }}
            aria-expanded={openIdx === i}
          >
            {openIdx === i ? (
              <>
                Hide <X className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Details <Plus className="w-3 h-3 ml-1" />
              </>
            )}
          </motion.button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {openIdx === i && !trip.soon && (
          <motion.div
            key="details"
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20, pointerEvents: "none" }}
            transition={{ duration: 0.35, type: "spring" }}
            className="mb-4"
          >
            {trip.details}
          </motion.div>
        )}
      </AnimatePresence>
      {trip.soon && (
        <p className="text-sm text-amber-800 mb-3 md:mb-4">Stay Tuned for more details</p>
      )}
    </div>
  </motion.div>
))}

          </div>
        </div>
      </div>
    </section>
  )
}