"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";

export default function VideoContainer() {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  // NEW: Ref to directly control the video container without React re-renders
  const videoWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Delayed video loading
    const timer = setTimeout(() => {
      setShouldLoadVideo(true);
    }, 50);

    // 2. Smart Scroll Detector
    let scrollTimeout: NodeJS.Timeout;

    const disablePointerOnScroll = () => {
      if (videoWrapperRef.current) {
        // Instantly lock the video the millisecond a scroll starts (stops jitter!)
        videoWrapperRef.current.style.pointerEvents = 'none';
      }

      clearTimeout(scrollTimeout);

      // Unlock it 150ms after the scrolling completely stops
      scrollTimeout = setTimeout(() => {
        if (videoWrapperRef.current) {
          videoWrapperRef.current.style.pointerEvents = 'auto';
        }
      }, 150);
    };

    // Add passive listener for maximum scroll performance
    window.addEventListener("scroll", disablePointerOnScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", disablePointerOnScroll);
    };
  }, []);

  const circles = [];
  for (let i = 15; i > 5; i--) {
    const size = i * 10;
    if (i === 6) {
      circles.push(
        <div
          key={i}
          ref={videoWrapperRef} // <-- Attach our ref here
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
            pointerEvents: "auto", // Clickable by default when not scrolling
          }}
        >
          {shouldLoadVideo ? (
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/3mlK6pDtP_0?autoplay=1&controls=1&loop=10&mute=1&modestbranding=1&showinfo=0&rel=0&playsinline=1"
              title="YouTube video player"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{
                borderRadius: "50%",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                // Notice: No pointer-events here. It inherits from the wrapper.
              }}
            ></iframe>
          ) : (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <Image
                src="/placeholder.jpg"
                alt="Boundless Society Video Thumbnail"
                fill
                priority
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
            WebkitBackfaceVisibility: "hidden",
            pointerEvents: "none", // Outer decorative circles ALWAYS remain locked
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
        contain: "paint layout",
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