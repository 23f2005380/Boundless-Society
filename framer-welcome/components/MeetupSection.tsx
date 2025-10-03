import React from "react"
import { motion } from "framer-motion"
import Image from "next/image";

export default function MeetupSection({ title, cards }: { title: string, cards: any[] }) {
  // Split cards into rows of 3 (desktop/tablet) or 2 (mobile)
  const getRows = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      // Mobile: 2 per row
      const rows = []
      for (let i = 0; i < cards.length; i += 2) {
        rows.push(cards.slice(i, i + 2))
      }
      return rows
    } else {
      // Desktop/Tablet: 3 per row
      const rows = []
      for (let i = 0; i < cards.length; i += 3) {
        rows.push(cards.slice(i, i + 3))
      }
      return rows
    }
  }

  // For SSR, fallback to 3 per row
  const rows = typeof window === "undefined"
    ? Array.from({ length: Math.ceil(cards.length / 3) }, (_, i) => cards.slice(i * 3, i * 3 + 3))
    : getRows()

  return (
    <section className="mb-16">
      <h2 className="text-4xl md:text-5xl font-black text-[#3B001B] mb-10 text-center">{title}</h2>
      <div className="flex flex-col gap-8">
        {rows.map((row, rowIdx) => (
          <motion.div
            key={rowIdx}
            className="flex justify-center gap-6"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: rowIdx * 0.1, type: "spring" }}
          >
            {row.map((card, cardIdx) => (
              <motion.div
                key={cardIdx}
                className={`
                  flex flex-col w-full max-w-[340px] min-w-[180px]
                  rounded-[32px] border-2 shadow-xl
                  transition-transform duration-300
                  ${card.color}
                `}
                whileHover={{ scale: 1.04, boxShadow: "0 8px 32px #00000022" }}
              >
                <div className="relative">
                  <Image
                    src={card.img}
                    alt={card.city}
                    width={400}     // or whatever matches your layout
                    height={176}    // Tailwind h-44 → 176px
                    className="rounded-t-[32px] w-full object-cover"
                  />
                </div>
                <div className="flex flex-row items-center p-4">
                  <div className="font-bold text-lg text-[#3B001B]" style={{ width: "50%" }}>{card.city}</div>
                  <div className="justify-content-end" style={{ width: "50%" }}>
                  {/* <a
                    href={card.galleryLink}
                    className="rounded-full px-5 py-1 font-semibold text-sm hover:bg-amber-100 transition"
                  >
                   <img src="/arrow.png" width={"50px"} height={"50px"} alt="link" style={{transform : "rotate(140deg)"}}/>
                  </a> */}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
