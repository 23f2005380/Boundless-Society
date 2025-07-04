import { motion } from "framer-motion"
import { forwardRef, useState } from "react"

// --- OVERRIDES ---
function randomColor() {
    const letters = "0123456789ABCDEF"
    let color = "#"
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}

function withRotate(Component: React.ComponentType<any>): React.ComponentType<any> {
    return forwardRef<any, any>((props, ref) => (
        <Component
            ref={ref}
            {...props}
            whileHover={{ rotate: 8, scale: 1.07 }}
            transition={{ duration: 0.3 }}
        />
    ))
}

function withHover(Component: React.ComponentType<any>): React.ComponentType<any> {
    return forwardRef<any, any>((props, ref) => (
        <Component
            ref={ref}
            {...props}
            whileHover={{ scale: 1.07 }}
            transition={{ duration: 0.25 }}
        />
    ))
}

function withRandomColor(Component: React.ComponentType<any>): React.ComponentType<any> {
    return forwardRef<any, any>((props, ref) => {
        const [background, setBackground] = useState("#A5C8FF")
        return (
            <Component
                ref={ref}
                {...props}
                animate={{ backgroundColor: background }}
                onClick={() => setBackground(randomColor())}
            />
        )
    })
}

// --- IMAGES & STATS ---
const images = [
    "/img1.jpg", "/img2.jpg", "/img3.jpg", "/img4.jpg", "/img5.jpg",
    "/img6.jpg", "/img7.jpg", "/img8.jpg", "/img9.jpg", "/img10.jpg"
]

const stats = [
    { number: "3,700+", label: "Members" },
    { number: "900+", label: "Female Members" },
    { number: "100+", label: "Core Members" },
    { number: "40+", label: "Meetups" },
    { number: "13+", label: "Trips" },
]

// --- COMPONENT ---
const Img = withRotate(withHover(motion.img))
const StatBox = withHover(withRandomColor(motion.div))

export default function StatsShowcase() {
    return (
        <div style={styles.wrapper}>
            {/* Top scallop */}
            <div style={styles.scallopTop} />

            {/* Main content */}
            <div style={styles.container}>
                <h1 style={styles.heading}>We proud to have</h1>

                <div style={styles.ribbon}>
                    {images.map((src, i) => (
                        <Img
                            key={i}
                            src={src}
                            alt=""
                            style={{
                                width: 90,
                                height: 60,
                                borderRadius: 12,
                                objectFit: "cover",
                                transform: `translateY(${Math.sin(i * 0.8) * 18}px)`,
                                margin: "0 6px",
                                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                                border: "5px solid white",
                            }}
                        />
                    ))}
                </div>

                <div style={styles.statsRow}>
                    {stats.map((stat, i) => (
                        <StatBox key={i} style={styles.statBox}>
                            <span style={styles.statNum}>{stat.number}</span>
                            <span style={styles.statLabel}>{stat.label}</span>
                        </StatBox>
                    ))}
                </div>
            </div>

            {/* Bottom scallop */}
            <div style={styles.scallopBottom} />
        </div>
    )
}

// --- Styles ---
const styles = {
    wrapper: {
        background: "linear-gradient(to bottom, #e5ffe4, #c0ddff)",
        overflow: "hidden",
        fontFamily: "'Oswald', sans-serif",
        textAlign: "center" as const,
    },
    container: {
        padding: "40px 20px 60px",
    },
    heading: {
        fontSize: "3rem",
        fontWeight: 900,
        color: "#5c1121",
        marginBottom: "30px",
    },
    ribbon: {
        display: "flex",
        justifyContent: "center",
        flexWrap: "nowrap" as const,
        overflowX: "auto" as const,
        marginBottom: "50px",
        paddingBottom: "10px",
    },
    statsRow: {
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap" as const,
        gap: "24px",
    },
    statBox: {
        minWidth: 140,
        padding: "18px 22px",
        borderRadius: 24,
        background: "#A5C8FF",
        color: "#400918",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
        cursor: "pointer",
        transition: "all 0.3s ease-in-out",
    },
    statNum: {
        fontSize: "24px",
        fontWeight: 800,
    },
    statLabel: {
        fontSize: "14px",
        marginTop: "4px",
    },
    scallopTop: {
        height: "30px",
        background: "radial-gradient(circle at top center, #FFF9ED 18px, transparent 19px)",
        backgroundSize: "40px 40px",
        backgroundRepeat: "repeat-x",
    },
    scallopBottom: {
        height: "30px",
        background: "radial-gradient(circle at bottom center, #000 18px, transparent 19px)",
        backgroundSize: "40px 40px",
        backgroundRepeat: "repeat-x",
    },
}
