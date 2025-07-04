"use client";
import { useEffect, useRef } from "react";
import { X as XIcon, Instagram, Linkedin } from "lucide-react";

const councilMembers = [
  { name: "Sachin Kumar", role: "Secretary", image: "/bunny.png" },
  { name: "Anushka Singh", role: "Deputy Secretary", image: "/bunny.png" },
];
const departmentHeads = [
  { name: "Prateek Singh", role: "Events/Logistics Head", image: "/bunny.png" },
  { name: "Ishan raj", role: "Trip Coordinator", image: "/bunny.png" },
  { name: "Sakshi Verma", role: "Finance Chair", image: "/bunny.png" },
  { name: "Rishitesh Gupta", role: "Public Relations", image: "/bunny.png" },
  { name: "Greesmma Suresh", role: "Newsletter", image: "/bunny.png" },
  { name: "Harshit Mishra", role: "Newsletter", image: "/bunny.png" },
  { name: "Vivel Subramani", role: "Media", image: "/bunny.png" },
  { name: "Kanika Chauhan", role: "Documentation and Graphic Designing", image: "/bunny.png" },
  { name: "Sahil Kamble", role: "City Operation", image: "/bunny.png" },
];

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
      {/* Background waves */}
      <div
        className="absolute inset-0 w-full h-full z-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(255,249,237,0.7) 0%, rgba(155, 100, 60, 0.25) 100%), url(/waves.svg)`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1,
          pointerEvents: 'none',
        }}
      />
      {/* Foreground content */}
      <div className="relative z-10">
        <h2
          ref={el => { headingRefs.current[0] = el; }}
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
        <div className="flex flex-row flex-wrap justify-center gap-x-14 gap-y-5">
          {councilMembers.map((member, i) => (
            <div
              key={i}
              ref={el => { councilRefs.current[i] = el; }}
              className="bg-black text-white hover:scale-110 transition-transform cursor-pointer rounded-3xl w-96 h-48 flex items-center px-6 py-4 mb-2 shadow-2xl border border-purple-200"
            >
              <div className="flex-1 flex flex-col justify-center items-start h-full py-1">
                <h3 className="font-bold text-2xl mb-1">{member.name}</h3>
                <p className="text-lg text-gray-300 mb-2">{member.role}</p>
                <div className="flex space-x-2 mt-1">
                  <div className="bg-black rounded-xl p-3 shadow-[0_0_8px_2px_rgba(255,255,255,0.5)] transition">
                    <XIcon className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
                  </div>
                  <div className="bg-black rounded-xl p-3 shadow-[0_0_8px_2px_rgba(255,255,255,0.5)] transition">
                    <Instagram className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
                  </div>
                  <div className="bg-black rounded-xl p-3 shadow-[0_0_8px_2px_rgba(255,255,255,0.5)] transition">
                    <Linkedin className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
                  </div>
                </div>
              </div>
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 object-cover rounded-2xl ml-4 shadow"
              />
            </div>
          ))}
        </div>
        <h2
          ref={el => { deptGroupRefs.current[0] = el; }}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-0 gap-y-12 justify-items-center">
          {departmentHeads.map((member, i) => (
            <div
              key={i}
              ref={el => { deptGroupRefs.current[i + 1] = el; }}
              className="bg-black text-white hover:scale-110 transition-transform cursor-pointer rounded-3xl w-96 h-48 flex items-center px-6 py-4 mb-2 shadow-2xl border border-purple-200"
            >
              <div className="flex-1 flex flex-col justify-center items-start h-full py-1">
                <h3 className="font-bold text-2xl mb-1">{member.name}</h3>
                <p className="text-lg text-gray-300 mb-2">{member.role}</p>
                <div className="flex space-x-3 mt-2">
                  <div className="bg-black rounded-xl p-3 shadow-[0_0_8px_2px_rgba(255,255,255,0.5)] transition">
                    <XIcon className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
                  </div>
                  <div className="bg-black rounded-xl p-3 shadow-[0_0_8px_2px_rgba(255,255,255,0.5)] transition">
                    <Instagram className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
                  </div>
                  <div className="bg-black rounded-xl p-3 shadow-[0_0_8px_2px_rgba(255,255,255,0.5)] transition">
                    <Linkedin className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
                  </div>
                </div>
              </div>
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 object-cover rounded-2xl ml-4 shadow"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
