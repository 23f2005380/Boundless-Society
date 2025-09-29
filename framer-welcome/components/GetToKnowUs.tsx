import {
  Plus,
  Menu,
  Mail,
  Linkedin,
  Instagram,
  Youtube,
  X as XIcon,
} from "lucide-react";
import Image from "next/image";

export default function GetToKnowUs(){
    return (
        <section className="relative px-6 md:px-6 mb-8 md:mb-12 bg-[#FFE066] py-8 md:py-12 overflow-visible">
        {/* Scalloped border at the very top */}
        <div className="absolute -top-8 left-0 w-full flex z-20">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="w-12 h-8 rounded-t-full bg-[#FFE066] border-t-2 border-dotted border-[#B8860B]"
            />
          ))}
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-block bg-[#3B001B] text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 tracking-wide shadow">
              OUR AMAZING TEAM
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#6B1B1B]">
              Get to Know <span className="italic text-[#3B001B]">Us</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            {[
              { name: "Ritu Sahani", role: "President 2024" },
              { name: "Chetan Chavan", role: "Organizing" },
              { name: "Jannavi Bansal", role: "Secretary" },
              { name: "Janny Jain", role: "Secretary" },
              { name: "Jai Vithani", role: "Treasurer" },
              { name: "Lali Maan", role: "Member" },
            ].map((member, i) => (
              <div
                key={i}
                className="bg-black text-white hover:scale-105 transition-transform cursor-pointer rounded-lg w-full h-40 flex items-center px-4"
              >
                <div className="flex-1 flex flex-col justify-center items-start h-full py-1">
                  <h3 className="font-bold text-base mb-1">{member.name}</h3>
                  <p className="text-xs text-gray-300 mb-2">{member.role}</p>
                  <div className="flex space-x-3 mt-2">
                    <XIcon className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                    <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                    <Linkedin className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                  </div>
                </div>
                <Image
                  src={`https://randomuser.me/api/portraits/men/${i + 10}.jpg`}
                  alt={member.name}
                  width={120}   // w-30 ≈ 120px
                  height={120}  // h-30 ≈ 120px
                  className="object-cover rounded-lg ml-4 shadow"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
}