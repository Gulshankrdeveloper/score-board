"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Crown, Activity } from "lucide-react";
import { useEffect, useState } from "react";

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(onFinish, 500); // Wait a bit after 100%
                    return 100;
                }
                return prev + 2;
            });
        }, 30); // ~1.5s total loading time
        return () => clearInterval(timer);
    }, [onFinish]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white overflow-hidden"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#000000_100%)]" />

            {/* Center Content */}
            <motion.div
                className="relative z-10 flex flex-col items-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
            >
                {/* Icons Orbiting */}
                <div className="relative w-32 h-32 mb-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0"
                    >
                        <Trophy className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500 fill-yellow-500/20" size={32} />
                        <Target className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-blue-500" size={32} />
                        <Activity className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500" size={32} />
                        <Crown className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 text-purple-500 fill-purple-500/20" size={32} />
                    </motion.div>

                    {/* Central Logo */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            <Trophy size={40} className="text-white" />
                        </div>
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-600 mb-2">
                    SPORTS ARENA
                </h1>
                <p className="text-gray-400 text-sm tracking-widest uppercase mb-4">Multiplayer Scoreboard</p>
                <div className="text-xs text-gray-500 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    Created by <span className="text-blue-400 font-bold">Gulshan</span>
                </div>
            </motion.div>

            {/* Loading Bar */}
            <div className="absolute bottom-20 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                />
            </div>
            <div className="absolute bottom-16 text-xs text-gray-500 font-mono">
                {progress}% Loaded
            </div>

        </motion.div>
    );
}
