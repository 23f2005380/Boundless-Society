'use client';

import { useState, useEffect } from 'react';

import dynamic from 'next/dynamic';
import BackgroundVideo from '@/components/BackgroundVideo';
// import TriColorMap from '@/components/TriColorMap';
import CityModal from '@/components/CityModal';
import './tri-color.css';
const TriColorMap = dynamic(
  () => import("../../components/TriColorMap"),
  { ssr: false }
);

export default function TriColor() {
    const [selectedCity, setSelectedCity] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCityClick = (city) => {
        setSelectedCity(city);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCity(null);
    };

    return (
        <div className="h-screen bg-[#FEFAE7] flex flex-col relative">
            {/* Background video */}
            <BackgroundVideo videoId="-AjvG-qlz-c" />
     
            <div className="flex-1 w-full h-full relative overflow-hidden z-10">
                <TriColorMap onCityClick={handleCityClick} />
                {selectedCity && (
                    <CityModal
                        city={selectedCity}
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        </div>
    );
}