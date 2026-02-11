"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Clock, RotateCcw, Monitor, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FootballPage() {
    const [scoreA, setScoreA] = useState(0);
    const [scoreB, setScoreB] = useState(0);
    const [time, setTime] = useState(0); // in seconds
    const [isRunning, setIsRunning] = useState(false);
    const [isAdmin, setIsAdmin] = useState(true);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const resetGame = () => {
        setScoreA(0);
        setScoreB(0);
        setTime(0);
        setIsRunning(false);
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center">
            {/* Navbar */}
            <div className="w-full p-4 flex justify-between items-center bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50 border-b border-neutral-800">
                <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
                    &larr; SportsBoard
                </Link>
                <button onClick={() => setIsAdmin(!isAdmin)} className="p-2 rounded-full hover:bg-neutral-800 transition-colors">
                    {isAdmin ? <Monitor size={20} className="text-green-400" /> : <Settings size={20} className="text-neutral-400" />}
                </button>
            </div>

            <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center p-4 gap-8">
                {/* Score Board */}
                <div className="w-full grid grid-cols-3 gap-4 items-center justify-center">
                    {/* Team A */}
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-3xl font-bold text-green-400">HOME</h2>
                        <div className="text-9xl font-black bg-neutral-900/50 p-8 rounded-3xl border border-neutral-800 shadow-[0_0_30px_rgba(74,222,128,0.2)]">
                            {scoreA}
                        </div>
                        {isAdmin && (
                            <div className="flex gap-2">
                                <button onClick={() => setScoreA(Math.max(0, scoreA - 1))} className="w-12 h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 font-bold text-xl">-</button>
                                <button onClick={() => setScoreA(scoreA + 1)} className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 font-bold text-xl">+</button>
                            </div>
                        )}
                    </div>

                    {/* Timer & Divider */}
                    <div className="flex flex-col items-center justify-center gap-2">
                        <div className="text-4xl font-mono font-bold text-neutral-500 mb-4">VS</div>
                        <div className="bg-neutral-900 px-6 py-3 rounded-lg border border-neutral-800 font-mono text-4xl font-bold text-white tabular-nums tracking-widest shadow-inner">
                            {formatTime(time)}
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => setIsRunning(!isRunning)}
                                className={cn("px-6 py-2 rounded-full font-bold text-sm transition-all", isRunning ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-green-500/20 text-green-400 hover:bg-green-500/30")}
                            >
                                {isRunning ? "PAUSE" : "START"}
                            </button>
                        )}
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-3xl font-bold text-red-400">AWAY</h2>
                        <div className="text-9xl font-black bg-neutral-900/50 p-8 rounded-3xl border border-neutral-800 shadow-[0_0_30px_rgba(248,113,113,0.2)]">
                            {scoreB}
                        </div>
                        {isAdmin && (
                            <div className="flex gap-2">
                                <button onClick={() => setScoreB(Math.max(0, scoreB - 1))} className="w-12 h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 font-bold text-xl">-</button>
                                <button onClick={() => setScoreB(scoreB + 1)} className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 font-bold text-xl">+</button>
                            </div>
                        )}
                    </div>
                </div>

                {isAdmin && (
                    <button onClick={resetGame} className="mt-8 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors">
                        <RotateCcw size={16} /> RESET MATCH
                    </button>
                )}
            </main>
        </div>
    );
}
