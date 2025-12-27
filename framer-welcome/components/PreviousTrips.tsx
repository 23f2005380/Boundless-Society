"use client";

import "./previous.css";
import { previousTrips } from "@/data/previousTrips";
import { CldImage } from "next-cloudinary";

export default function PreviousTrip() {
  function showEffect(id: any) {
    let ele = document.getElementById(id);
    if (ele) {
      // @ts-ignore
      ele.children[0].style.opacity = 1;
      // @ts-ignore
      ele.children[1].children[1].style.display = "block";
    }
  }

  return (
    <section className=" px-4 md:px-6 mb-8 md:mb-12 bg-gradient-to-b from-pink-100 to-purple-100 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-amber-900 mb-6 md:mb-8 text-center">
          Previous Trips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {previousTrips.map((trip, i) => (
            <div
              key={i}
              id={String(i)}
              className="card relative rounded-[2rem] overflow-hidden group shadow-lg"
              style={{ minHeight: 420 }}
            >
              <CldImage
                src={trip.img}
                alt={trip.heading}
                width={1035}
                height={492}
                className="cardImage w-full h-full object-cover"
                style={{ minHeight: 420 }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                crop="fill"
              />
              {/* Frosted glass overlay, visible on hover */}
              <div className="absolute bottom-0 left-0 w-full p-6 bg-white/60  rounded-b-[2rem] ">
                <h3 className="font-[500] text-2xl md:text-2xl mb-2 text-gray-900 font-serif">
                  {trip.heading}
                </h3>
                {trip.subHeading && (
                  <p className="hidden caption text-base md:text-lg text-gray-700 font-serif">
                    {trip.subHeading}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}