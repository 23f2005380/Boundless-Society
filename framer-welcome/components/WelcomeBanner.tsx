"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function WelcomeBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show banner after a short delay for better UX
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsVisible(false)}
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col items-center p-8 text-center"
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                    >
                        <X size={20} />
                    </button>

                    {/* Image Area */}
                    <div className="w-full h-48 relative mb-6 rounded-xl overflow-hidden bg-amber-50 flex items-center justify-center">
                        {/*  Using the Logo as a placeholder for the requested image style */}
                        <Image
                            src="/Logo Bound.png"
                            alt="Welcome"
                            width={150}
                            height={150}
                            className="object-contain"
                        />
                    </div>

                    {/* Text Content */}
                    <h2 className="text-3xl font-bold text-[#3B001B] mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
                        Welcome to Boundless!
                    </h2>
                    <p className="text-gray-600 mb-6 px-4">
                        Explore our new interactive India Map to see all our upcoming events and locations.
                    </p>

                    {/* Call to Action Button */}
                    <Link
                        href="/india-map"
                        onClick={() => setIsVisible(false)}
                        className="bg-[#3B001B] text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-[#5a0029] transition-transform hover:scale-105"
                    >
                        Explore India Map
                    </Link>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
