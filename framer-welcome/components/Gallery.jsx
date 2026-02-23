import React from "react";
import Section from "@/components/Section";
import Image from "next/image";
import { gallery } from "@/data/gallery";


function Gallery() {
  return (
    <>
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
              <div className="flex gap-3 whitespace-nowrap w-max animate-gallery">
                {[...gallery, ...gallery].map((data, idx) => (
                  <div
                    key={idx}
                    className="aspect-[3/4.5] bg-amber-200 w-[430px] flex-none inline-block relative overflow-hidden group cursor-pointer"
                  >
                    <Image
                      src={data.img}
                      alt={data.name}
                      fill
                      // Changed to eager loading. Lazy loading moving elements kills the frame rate!
                      priority={idx < 4} 
                      decoding="async" 
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity duration-300 z-10 flex items-center justify-center text-white font-semibold text-2xl">
                      {data.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}

export default Gallery;