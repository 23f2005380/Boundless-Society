"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function TripCard({ trip }) {
  return (
    <Link href={trip.link}>
      <motion.div
        className="relative w-[345px] min-w-[280px] aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer shadow-lg"
        whileHover="hover"
        initial="initial"
      >
        <Image
          src={trip.img}
          alt={trip.heading}
          fill
          className="object-cover"
        />

        <motion.div
          className="absolute inset-0 bg-white/30 z-20"
          variants={{
            initial: { opacity: 1 },
            hover: { opacity: 0 },
          }}
          transition={{ duration: 0.3 }}
        />

        <motion.div
          className="absolute bottom-0 left-0 right-0 mx-2 mb-2 lg:blur-0 rounded-2xl overflow-hidden z-30"
          variants={{
            initial: {
              height: "auto",
              backdropFilter: "blur(5px)",
              backgroundColor: "rgba(255, 255, 255, 0.6)",
            },
            hover: {
              height: "auto",
              backdropFilter: "blur(0px)",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
            },
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {trip.heading}
            </h2>

            <motion.div
              variants={{
                initial: {
                  opacity: 0,
                  height: 0,
                  marginTop: 0,
                },
                hover: {
                  opacity: 1,
                  height: "auto",
                  marginTop: 16,
                },
              }}
              transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
            >
              <p className="text-gray-700 font-medium">{trip.subHeading}</p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="absolute top-6 right-6 w-6 h-6 bg-black rounded-full flex items-center justify-center z-40"
          variants={{
            initial: { opacity: 0 },
            hover: { opacity: 1 },
          }}
          transition={{ duration: 0.3 }}
        >
          <ArrowUpRight className="text-white w-4" />
        </motion.div>
      </motion.div>
    </Link>
  );
}
