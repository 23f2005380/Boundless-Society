"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CldImage } from "next-cloudinary";

function GroupCard({ data }) {
  const route = useRouter();
  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: 1 }}
      whileHover={{
        scale: 1.05,
      }}
      transition={{
        type: "spring",
        damping: 10,
        stiffness: 200,
      }}
      className={`md:w-52 rounded-xl p-2 pb-4 border border-black transform`}
      style={{ backgroundColor: data.color }}
    >
      {/* Image Container */}
      <div className="relative mb-4 w-full aspect-[6/4] rounded-xl flex items-center justify-center border border-black overflow-hidden">
        <CldImage
          src={data.img}
          alt={data.city}
          fill
          className="object-cover rounded-xl"
          sizes="(max-width: 768px) 100vw, 300px"
        />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
        {data.city}
      </h2>

      {/* WhatsApp Link Button */}
      <div className="flex justify-center">
        <button
          onClick={() => route.push(data.link)}
          className="bg-white hover:bg-black hover:text-white text-black font-semibold py-3 px-8 rounded-full border-1 border-black transition-all duration-300 cursor-pointer"
        >
          WhatsApp Link
        </button>
      </div>
    </motion.div>
  );
}

export default GroupCard;