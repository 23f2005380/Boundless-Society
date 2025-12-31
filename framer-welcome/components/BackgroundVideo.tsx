'use client';

import { useEffect, useRef } from 'react';

interface BackgroundVideoProps {
    videoId: string;
    className?: string;
}

export default function BackgroundVideo({ videoId, className = '' }: BackgroundVideoProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // Ensure iframe loads properly
        if (iframeRef.current) {
            // The iframe will handle its own autoplay
        }
    }, []);

    return (
        <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
            {/* YouTube iframe for background video */}
            <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&playsinline=1&rel=0`}
                title="Background Video"
                className="absolute top-1/2 left-1/2 w-full h-full"
                style={{
                    transform: 'translate(-50%, -50%)',
                    minWidth: '100%',
                    minHeight: '100%',
                    border: 'none',
                    pointerEvents: 'none'
                }}
                allow="autoplay; encrypted-media"
                allowFullScreen={false}
            />
        </div>
    );
}
