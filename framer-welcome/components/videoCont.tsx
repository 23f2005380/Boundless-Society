"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";

export default function VideoContainer() {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // 1. Defer video loading until browser is idle and settled
    if (typeof window !== "undefined") {
      const loadVideo = () => {
        setShouldLoadVideo(true);
      };

      if ((window as any).requestIdleCallback) {
        (window as any).requestIdleCallback(() => {
          loadVideo();
        });
      } else {
        if (document.readyState === "complete") {
          loadVideo();
        } else {
          window.addEventListener("load", loadVideo, { once: true });
        }
      }
    }

    // 2. Smart Scroll Detector
    let scrollTimeout: NodeJS.Timeout | number | undefined;

    const disablePointerOnScroll = () => {
      if (videoWrapperRef.current) {
        videoWrapperRef.current.style.pointerEvents = 'none';
      }

      if (scrollTimeout) clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        if (videoWrapperRef.current) {
          videoWrapperRef.current.style.pointerEvents = 'auto';
        }
      }, 150);
    };

    window.addEventListener("scroll", disablePointerOnScroll, { passive: true });

    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", disablePointerOnScroll);
    };
  }, []);

  // Monitor YouTube player state to only fade in when the video starts PLAYING (state 1)
  useEffect(() => {
    if (!shouldLoadVideo || !iframeRef.current) return;

    let player: any;

    // Safety timeout: if player doesn't start within 3s (e.g. slow connection or autoplay blocked), force fade-in
    const safetyTimer = setTimeout(() => {
      setVideoLoaded(true);
    }, 3000);

    const initPlayer = () => {
      if (!(window as any).YT || !(window as any).YT.Player) return;

      player = new (window as any).YT.Player(iframeRef.current, {
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING === 1
            if (event.data === 1) {
              setVideoLoaded(true);
              clearTimeout(safetyTimer);
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      // Load YouTube IFrame API script dynamically
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }

      const prevCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }

    return () => {
      clearTimeout(safetyTimer);
      if (player && typeof player.destroy === "function") {
        player.destroy();
      }
    };
  }, [shouldLoadVideo]);

  const circles = [];
  for (let i = 15; i > 5; i--) {
    const size = i * 10;
    if (i === 6) {
      circles.push(
        <div
          key={i}
          ref={videoWrapperRef}
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
            pointerEvents: "auto",
          }}
        >
          {/* Static placeholder is always at the bottom layer */}
          <div style={{ position: "absolute", inset: 0, zIndex: 1, width: "100%", height: "100%" }}>
            <Image
              src="/placeholder.jpg"
              alt="Boundless Society Video Thumbnail"
              fill
              priority
              sizes="(max-width: 768px) 60vw, 70vw"
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />
          </div>

          {/* Iframe is placed on top and fades in ONLY when video starts actively playing */}
          {shouldLoadVideo && (
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/6tDnTV1wHKI?autoplay=1&controls=1&loop=10&mute=1&playlist=6tDnTV1wHKI&modestbranding=1&showinfo=0&rel=0&playsinline=1&enablejsapi=1"
              title="YouTube video player"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                borderRadius: "50%",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: videoLoaded ? 1 : 0,
                transition: "opacity 0.8s ease-in-out",
              }}
            ></iframe>
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
            pointerEvents: "none",
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