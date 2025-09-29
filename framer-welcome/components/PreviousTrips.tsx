"use client"

import { parse } from "path";
import "./previous.css"
import Image from "next/image";

export default function PreviousTrip() {
  const trips = [
    {
      title: "Trip to Goa - Unleashed each laughter",
      subtitle: "From Chaos to chain everything linked and cool",
      image: "/goa.jpg", // Replace with your actual image path
    },
    {
      title: "Trip to Ooty- Greenary and peace",
      subtitle: "",
      image: "/ooty.jpg",
    },
    {
      title: "Trip to Vrindavan,Agra,Mathura",
      subtitle: "",
      image: "/vrindavan.jpg",
    },
    // Add more trips as needed
  ];
  function showEffect(id){
    let ele = document.getElementById(id)
    ele.children[0].style.opacity = 1;
    ele.children[1].children[1].computedStyleMap.display = "block"
  }

  return (
    <section className=" px-4 md:px-6 mb-8 md:mb-12 bg-gradient-to-b from-pink-100 to-purple-100 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-amber-900 mb-6 md:mb-8 text-center">
          Previous Trips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {trips.map((trip, i) => (
            <div
              key={i}
              id={String(i)}
              className="card relative rounded-[2rem] overflow-hidden group shadow-lg"
              style={{ minHeight: 420 }}>
              <Image
                src="/2ebc04de16bdc5368e930b89cf6186d1ba21de6c_2_1035x492.jpeg"
                alt={trip.title}
                width={1035}
                height={492}
                className="cardImage w-full h-full object-cover"
                style={{ minHeight: 420 }}
              />
              {/* Frosted glass overlay, visible on hover */}
              <div className="absolute bottom-0 left-0 w-full p-6 bg-white/60  rounded-b-[2rem] ">
                <h3 className="font-[500] text-2xl md:text-2xl mb-2 text-gray-900 font-serif">
                  {trip.title}
                </h3>
                {trip.subtitle && (
                  <p className="hidden caption text-base md:text-lg text-gray-700 font-serif">{trip.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}