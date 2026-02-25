"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function VideoContainer() {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoadVideo(true);
    }, 50); 

    return () => clearTimeout(timer);
  }, []);

  const circles = [];
  for (let i = 15; i > 5; i--) {
    const size = i * 10;
    if (i === 6) {
      circles.push(
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: `${size}vw`,
            height: `${size}vw`,
            transform: "translate(-50%, -50%) translateZ(0)",
            borderRadius: "50%",
            background: "#fffae9",
            boxShadow: "0 4px 24px rgba(84,63,63,1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {shouldLoadVideo ? (
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/et-Th2dwGVA?autoplay=1&controls=0&loop=10&mute=1&modestbranding=1&showinfo=0&rel=0&playsinline=1"
              title="YouTube video player"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{
                borderRadius: "50%",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            ></iframe>
          ) : (
            /* High-priority placeholder image while the iframe is delayed */
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <Image 
                src="/placeholder.jpg" // <-- CHANGE THIS to your desired thumbnail image path
                alt="Boundless Society Video Thumbnail"
                fill
                priority // <-- Crucial: Forces the browser to preload this image
                sizes="(max-width: 768px) 60vw, 70vw"
                style={{ objectFit: "cover", borderRadius: "50%" }}
              />
            </div>
          )}
        </div>
      );
    } else {
      circles.push(
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: `${size}vw`,
            height: `${size}vw`,
            transform: "translate(-50%, -50%) translateZ(0)",
            borderRadius: "50%",
            background: "#fffae9",
            boxShadow: "0 4px 24px rgba(84,63,63,0.6)",
            willChange: "transform",
            WebkitBackfaceVisibility: "hidden",
          }}
        />
      );
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        maxWidth: "100vw",
        height: "100vw",
        maxHeight: "100vh",
        margin: "0 auto",
        overflow: "hidden",
      }}
    >
      {circles}
      <style>{`
        @media (min-width: 768px) {
            div[style*="position: relative"] {
                width: 70vw !important;
                height: 70vw !important;
                max-width: 900px;
                max-height: 900px;
            }
        }
      `}</style>
    </div>
  );
}