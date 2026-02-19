"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Section from "@/components/Section";
import Image from "next/image";

function Gallery() {

  const [gallery, setGallery] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  // Validate and normalize image URL
  const getValidImageUrl = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return url;
    return "/placeholder.jpg";
  };

  const handleImageError = (idx) => {
    setImageErrors(prev => ({ ...prev, [idx]: true }));
  };

  /* Fetch from API */
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch("/api/gallery");

        const data = await res.json();

        setGallery(data || []);
      } catch (err) {
        console.error("Gallery fetch error:", err);
      }
    };

    fetchGallery();
  }, []);

  if (!gallery.length) {
  return (
    <div className="text-center py-20 text-red-600">
      Gallery Loaded But No Data
    </div>
  );
}


  return (
    <div>
      <Section
        headingStyle="text-white"
        svgFill="black"
        sectionHeading="OUR GALLERY"
      >
        <div className="overflow-hidden py-20 pt-36 max-sm:py-8 max-md:py-10 -ml-20">
          <div
            className="w-[120vw] text-white"
            style={{
              transform: "perspective(1200px) rotateX(20deg) rotateY(20deg)",
            }}
          >
            <motion.div
              className="flex gap-3 whitespace-nowrap"
              animate={{
                x: [0, -((480 + 12) * gallery.length)],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 40,
                  ease: "linear",
                },
              }}
            >
              {[...gallery, ...gallery].map((data, idx) => {
                const imageSrc = imageErrors[idx] ? "/placeholder.jpg" : getValidImageUrl(data.img);

                return (
                  <div
                    key={idx}
                    className="aspect-[3/4.5] bg-amber-200 w-[430px] flex-none inline-block relative overflow-hidden group cursor-pointer"
                  >
                    <Image
                      src={imageSrc}
                      alt={data.name}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(idx)}
                    />

                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity duration-300 z-10 flex items-center justify-center text-white font-semibold text-2xl">
                      {data.name}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default Gallery;
