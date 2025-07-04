import React, { useEffect, useRef } from "react";

export default function VideoContainer() {
    const embedRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if ((window as any).instgrm) {
            (window as any).instgrm.Embeds.process();
        } else {
            const script = document.createElement("script");
            script.src = "https://www.instagram.com/embed.js";
            script.async = true;
            script.onload = () => (window as any).instgrm.Embeds.process();
            document.body.appendChild(script);
        }
    }, []);

    const circles = [];
    for (let i = 15; i > 5; i--) {
        const size = i * 10; // Use 6vw per step for better scaling
        if (i === 6) {
            circles.push(
                <div
                    key={i}
                    ref={embedRef}
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
                    <blockquote
                        className="instagram-media"
                        data-instgrm-permalink="https://www.instagram.com/reel/DEaHtzKTBcY/"
                        data-instgrm-version="14"
                        style={{
                            width: "100%",
                            minWidth: "200px",
                            borderRadius: "50%",
                            overflow: "hidden",
                        }}
                    ></blockquote>
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
