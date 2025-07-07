import React, { useEffect, useRef } from "react";

export default function VideoContainer() {
    const videoRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (videoRef.current) {
                // Post message to the YouTube iframe to play the video
                videoRef.current.contentWindow?.postMessage(
                    JSON.stringify({
                        event: "command",
                        func: "playVideo",
                        args: [],
                    }),
                    "*"
                );
            }
        }, 1000);
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
                        transform: "translate(-50%, -50%)",
                        borderRadius: "50%",
                        background: "#fffae9",
                        boxShadow: "0 4px 24px rgba(84,63,63,1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }}
                >
                    <iframe
                        ref={videoRef}
                        width="100%"
                        height="100%"
                        
                        src="https://www.youtube.com/embed/Vma1Mpepc4A?autoplay=1&controls=0&loop=10&mute=1&modestbranding=1&showinfo=0&rel=0"
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
                        transform: "translate(-50%, -50%)",
                        borderRadius: "50%",
                        background: "#fffae9",
                        boxShadow: "0 4px 24px rgba(84,63,63,1)",
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
