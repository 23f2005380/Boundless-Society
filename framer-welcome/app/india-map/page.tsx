"use client";

import dynamic from "next/dynamic";

const IndiaMap = dynamic(() => import("@/components/IndiaMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center text-amber-900">Loading Map...</div>
});

export default function IndiaMapPage() {
    return (
        <div className="w-full min-h-screen bg-amber-50 flex items-center justify-center pt-20">
            <div className="w-[80%] max-w-6xl h-[80vh] relative">
                <h1 className="text-4xl md:text-5xl font-black text-[#3B001B] text-center mb-8"
                    style={{ fontFamily: "Oswald, Bebas Neue, Impact, Arial Black, sans-serif" }}>
                    Explore India
                </h1>
                <div className="w-full h-full">
                    <IndiaMap className="w-full h-full" />
                </div>
            </div>
        </div>
    );
}
