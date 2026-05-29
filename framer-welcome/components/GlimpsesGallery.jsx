"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { getTripPhotos, getTripVideos } from "@/lib/previous-trip-media";

export default function GlimpsesGallery({ trip }) {
  const photos = getTripPhotos(trip);
  const videos = getTripVideos(trip);
  const [lightbox, setLightbox] = useState(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const items = lightbox?.type === "photo" ? photos : videos;
  const currentIndex = lightbox?.index ?? 0;
  const currentItem = lightbox ? items[currentIndex] : null;
  const hasMultiple = items.length > 1;

  const goPrev = useCallback(() => {
    setLightbox((prev) => {
      if (!prev) return prev;
      const list = prev.type === "photo" ? photos : videos;
      return { ...prev, index: (prev.index - 1 + list.length) % list.length };
    });
  }, [photos, videos]);

  const goNext = useCallback(() => {
    setLightbox((prev) => {
      if (!prev) return prev;
      const list = prev.type === "photo" ? photos : videos;
      return { ...prev, index: (prev.index + 1) % list.length };
    });
  }, [photos, videos]);

  useEffect(() => {
    if (!lightbox) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft" && hasMultiple) goPrev();
      if (e.key === "ArrowRight" && hasMultiple) goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox, closeLightbox, goPrev, goNext, hasMultiple]);

  if (!photos.length && !videos.length) return null;

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm border border-amber-100 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-amber-900 uppercase tracking-widest">Glimpses</h3>

        {photos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Photos</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((url, index) => (
                <button
                  key={`photo-${index}-${url}`}
                  type="button"
                  onClick={() => setLightbox({ type: "photo", index })}
                  className="relative aspect-square overflow-hidden rounded-xl border border-amber-200 bg-amber-50 shadow-sm hover:scale-[1.02] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <img
                    src={url}
                    alt={`Trip photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {videos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Videos</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {videos.map((url, index) => (
                <button
                  key={`video-${index}-${url}`}
                  type="button"
                  onClick={() => setLightbox({ type: "video", index })}
                  className="relative aspect-square overflow-hidden rounded-xl border border-amber-200 bg-amber-950/80 shadow-sm hover:scale-[1.02] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <video
                    src={url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-amber-900 shadow">
                      <Play className="size-4 fill-current ml-0.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {lightbox && currentItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-amber-950/90 backdrop-blur-md p-4 overscroll-none"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.type === "photo" ? "Photo viewer" : "Video player"}
        >
          <div
            className="relative flex w-full max-w-5xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-2 right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition sm:right-2"
              aria-label="Close"
            >
              <X className="size-6" />
            </button>

            {hasMultiple && (
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition sm:-left-14"
                aria-label="Previous"
              >
                <ChevronLeft className="size-7" />
              </button>
            )}

            {lightbox.type === "photo" ? (
              <img
                src={currentItem}
                alt={`Trip photo ${currentIndex + 1}`}
                className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
              />
            ) : (
              <video
                key={currentItem}
                src={currentItem}
                controls
                autoPlay
                playsInline
                className="max-h-[85vh] w-full max-w-full rounded-xl bg-black shadow-2xl"
              />
            )}

            {hasMultiple && (
              <button
                type="button"
                onClick={goNext}
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition sm:-right-14"
                aria-label="Next"
              >
                <ChevronRight className="size-7" />
              </button>
            )}

            {hasMultiple && (
              <p className="mt-4 text-sm font-medium text-amber-100/90">
                {currentIndex + 1} / {items.length}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
