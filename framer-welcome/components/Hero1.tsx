import React from "react";
import VideoContainer from "@/components/videoCont";
import AnimatedByChar from "./AnimatedByWord";

export default function Hero() {
  return (
    <section className="">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-[#3B001B] mb-4 md:mb-6 relative nosifer-regular">
          BOUNDLESS
        </h1>
        <div className="p-3 md:p-4 rounded-lg max-w-xs md:max-w-2xl mx-auto mb-6 md:mb-8">
          <h2
            className=" text-[#3B001B] mb-3 md:mb-4 oswald-subtitle"
            style={{ fontSize: "42px" }}
          >
            <AnimatedByChar
              text="IIT 'M BS TRAVEL SOCIETY"
              
            />
           
          </h2>
          <div>
            <button
              className="bg-[#FFE878] hover:translate-y-1 text-[#3B001B] transition-all px-6 md:px-8 py-2 rounded-full font-semibold text-sm md:text-base"
              style={{ boxShadow: "0px 5px 1px #9c1352" }}
            >
              <a href="https://forms.gle/3DKAWuaaeuLwyEhr6">Join Us</a>
            </button>
          </div>
        </div>
      </div>
      {/* Decorative Circle */}
      <div
        style={{
          maskImage: `
      linear-gradient(to top, black 50%, transparent 98%)
    `,
          WebkitMaskImage: `
      linear-gradient(to top, black 50%, transparent 98%)
    `,
        }}
        className="flex justify-center "
      >
        <VideoContainer />
      </div>
    </section>
  );
}
