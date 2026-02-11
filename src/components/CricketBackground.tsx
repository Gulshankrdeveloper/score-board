"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function CricketBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Generate random particles for "stadium dust"
    const particles = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        duration: Math.random() * 20 + 10,
    }));

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-neutral-950 pointer-events-none">
            {/* Base Gradient - Night Stadium Feel */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a365d_0%,_#000000_70%)] opacity-80" />

            {/* Moving Spotlights */}
            <motion.div
                animate={{
                    rotate: [0, 45, 0, -45, 0],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-0 left-1/4 w-[200px] h-[800px] bg-gradient-to-b from-blue-500/20 to-transparent blur-3xl origin-top"
            />
            <motion.div
                animate={{
                    rotate: [0, -45, 0, 45, 0],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
                className="absolute top-0 right-1/4 w-[200px] h-[800px] bg-gradient-to-b from-blue-500/20 to-transparent blur-3xl origin-top"
            />

            {/* Animated Particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ x: `${p.x}vw`, y: `${p.y}vh`, opacity: 0 }}
                    animate={{
                        y: [`${p.y}vh`, `${p.y - 20}vh`],
                        opacity: [0, 0.5, 0],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute bg-white rounded-full blur-[1px]"
                    style={{ width: p.size, height: p.size }}
                />
            ))}

            {/* Cricket Elements - Moving Ball */}
            <motion.div
                initial={{ x: "-10vw", y: "60vh", scale: 0.5, rotate: 0 }}
                animate={{
                    x: ["-10vw", "110vw"],
                    y: ["60vh", "30vh"], // Parabolic arc
                    scale: [0.5, 1.2, 0.8],
                    rotate: 720,
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 5,
                    ease: "easeOut",
                }}
                className="absolute w-8 h-8 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] z-10"
            >
                {/* Seam */}
                <div className="absolute inset-0 border-2 border-white/50 rounded-full animate-spin-slow" style={{ transform: "rotate(45deg)" }} />
            </motion.div>

            {/* Silhouette: Batsman (Abstract Shapes) */}
            <motion.div
                initial={{ opacity: 0, x: "80vw" }}
                animate={{ opacity: 0.1, x: "75vw" }}
                className="absolute bottom-0 right-10 w-64 h-96 z-0"
            >
                <svg viewBox="0 0 100 200" className="w-full h-full fill-white">
                    {/* Simplified Batsman Stance */}
                    <path d="M50,20 C60,20 60,30 50,30 C40,30 40,20 50,20 M45,30 L30,80 L20,150 L30,190 M55,30 L70,80 L80,150 L70,190 M30,80 L70,80 L80,110 L20,110 Z" opacity="0.8" />
                    {/* Bat */}
                    <rect x="70" y="80" width="10" height="80" transform="rotate(-15 75 120)" />
                </svg>
            </motion.div>

            {/* Silhouette: Wickets */}
            <div className="absolute bottom-10 right-[25vw] opacity-10 flex gap-1">
                <div className="w-1 h-24 bg-white rounded-t" />
                <div className="w-1 h-24 bg-white rounded-t" />
                <div className="w-1 h-24 bg-white rounded-t" />
            </div>

        </div>
    );
}
