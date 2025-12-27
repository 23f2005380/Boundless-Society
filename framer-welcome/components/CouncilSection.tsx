"use client";
import { useEffect, useRef } from "react";
import { CldImage } from "next-cloudinary";
// Updated import to use the new council data
import { councilMembers, departmentHeads } from "@/data/newCouncil";

function useFadeInOnScroll() {
  const refs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );
    refs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, []);
  return refs;
}

export default function CouncilSection() {
  const headingRefs = useFadeInOnScroll();
  const councilRefs = useFadeInOnScroll();
  const deptGroupRefs = useFadeInOnScroll();
  
  return (
    <section className="relative py-8 bg-[#FFF9ED] overflow-hidden">
      <div className="relative z-10">
        <h2
          ref={(el) => {
            headingRefs.current[0] = el;
          }}
          className="text-center mb-12 fade-in text-5xl"
          style={{
            fontFamily: "'Oswald', Arial, sans-serif",
            fontWeight: 900,
            fontStretch: "condensed",
            letterSpacing: "0.04em",
            color: "#6d1a2c",
          }}
        >
          COUNCIL (2024-2025)
        </h2>
        
        {/* Council Members Loop */}
        <div className="flex flex-row flex-wrap justify-center gap-x-14 gap-y-5">
          {councilMembers.map((member, i) => (
            <div
              key={i}
              ref={(el) => {
                councilRefs.current[i] = el;
              }}
              className="bg-black text-white hover:scale-110 transition-transform cursor-pointer rounded-3xl w-96 h-48 flex items-center px-6 py-4 mb-2 shadow-2xl border border-purple-200"
            >
              <div className="flex-1 flex flex-col justify-center items-start h-full py-1">
                <h3 className="font-bold text-2xl mb-1">{member.name}</h3>
                <p className="text-lg text-gray-300 mb-2">{member.role}</p>
              </div>
              
              {/* Updated to CldImage */}
              <CldImage
                src={member.image}
                alt={member.name}
                width={128} // 128px matches w-32
                height={128} // 128px matches h-32
                className="object-cover rounded-2xl ml-4 shadow"
                crop="fill"
              />
            </div>
          ))}
        </div>

        <h2
          ref={(el) => {
            deptGroupRefs.current[0] = el;
          }}
          className="text-center mt-16 mb-12 fade-in"
          style={{
            fontFamily: "'Oswald', Arial, sans-serif",
            fontWeight: 900,
            fontStretch: "condensed",
            fontSize: "2.8rem",
            letterSpacing: "0.04em",
            color: "#6d1a2c",
          }}
        >
          DEPARTMENT HEADS
        </h2>

        {/* Department Heads Loop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-0 gap-y-12 justify-items-center">
          {departmentHeads.map((member, i) => (
            <div
              key={i}
              ref={(el) => {
                deptGroupRefs.current[i + 1] = el;
              }}
              className="bg-black text-white hover:scale-110 transition-transform cursor-pointer rounded-3xl w-96 h-48 flex items-center px-6 py-4 mb-2 shadow-2xl border border-purple-200"
            >
              <div className="flex-1 flex flex-col justify-center items-start h-full py-1">
                <h3 className="font-bold text-2xl mb-1">{member.name}</h3>
                <p className="text-lg text-gray-300 mb-2">{member.role}</p>
              </div>
              
              {/* Updated to CldImage */}
              <CldImage
                src={member.image}
                alt={member.name}
                width={128}
                height={128}
                className="object-cover rounded-2xl ml-4 shadow"
                crop="fill"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}