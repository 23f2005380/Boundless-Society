import React from "react";

export default function VideoContainer() {
    const circles = [];
    const baseSize = 400; // base size in px

    for (let i = 15; i > 5; i--) {
        const size = i * 10;
        circles.push(
            <div
                key={i}
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: `${size}%`,
                    height: `${size}%`,
                    transform: "translate(-50%, -50%)",
                    borderRadius: "50%",
                    background: "#fffae9",
                    boxShadow: "0 4px 24px rgba(84,63,63,1)",
                }}
            />
        );
    }

    return (
        <div className="relative" style={{ width: "120vw" , height : "100vw", overflowY : "clip"}}>
            <div className="h-8 w-full absolute top-[0]"></div>
            {circles}
        </div>
    );
}