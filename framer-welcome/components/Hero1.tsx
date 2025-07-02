import React from "react";
import VideoContainer from "@/components/videoCont"

export default function Hero() {
    return (
        <section className="px-4 md:px-6 sm:h-[150vh] overflow-hidden">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-[#3B001B] mb-4 md:mb-6 relative">
            BOUNDLESS
          </h1>
          <div className="p-3 md:p-4 rounded-lg max-w-xs md:max-w-2xl mx-auto mb-6 md:mb-8">
            <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-[#3B001B] mb-3 md:mb-4">
              IIT 'M BS TRAVEL SOCIETY
            </h2>
            <div>
             
            <button className="bg-[#FFE878] hover:translate-y-1 text-[#3B001B] transition:translate-y px-6 md:px-8 py-2 rounded-full font-semibold text-sm md:text-base" style={{boxShadow : "0px 5px 1px #9c1352"}}>
              Join Us
            </button>
            
            </div>
          </div>
        </div>
        {/* Decorative Circle */}
        <div className="flex justify-center mb-8 md:mb-12">
          <VideoContainer />
        </div>
      </section>
    )
}
