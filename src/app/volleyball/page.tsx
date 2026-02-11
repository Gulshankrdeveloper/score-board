"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, RotateCcw, Monitor, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function VolleyballPage() {
    // Team A
    const [setsA, setSetsA] = useState(0);
    const [pointsA, setPointsA] = useState(0);

    // Team B
    const [setsB, setSetsB] = useState(0);
    const [pointsB, setPointsB] = useState(0);

    const [currentSet, setCurrentSet] = useState(1);
    const [isAdmin, setIsAdmin] = useState(true);

    const addPointA = () => {
        setPointsA(pointsA + 1);
    };

    const addPointB = () => {
        setPointsB(pointsB + 1);
    };

    const winSetA = () => {
        setSetsA(setsA + 1);
        setPointsA(0);
        setPointsB(0);
        setCurrentSet(currentSet + 1);
    };

    const winSetB = () => {
        setSetsB(setsB + 1);
        setPointsA(0);
        setPointsB(0);
        setCurrentSet(currentSet + 1);
    };

    const resetGame = () => {
        setSetsA(0);
        setSetsB(0);
        setPointsA(0);
        setPointsB(0);
        setCurrentSet(1);
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center">
            <div className="w-full p-4 flex justify-between items-center bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50 border-b border-neutral-800">
                <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                    &larr; SportsBoard
                </Link>
                <button onClick={() => setIsAdmin(!isAdmin)} className="p-2 rounded-full hover:bg-neutral-800 transition-colors">
                    {isAdmin ? <Monitor size={20} className="text-orange-400" /> : <Settings size={20} className="text-neutral-400" />}
                </button>
            </div>

            <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center p-4 gap-8">
                <div className="bg-neutral-900/50 px-6 py-2 rounded-full border border-neutral-800 text-neutral-400 font-mono">
                    SET {currentSet}
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 items-center justify-center max-w-4xl">
                    {/* Team A */}
                    <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-orange-900/20 to-neutral-900 border border-orange-500/20 p-8 rounded-3xl relative overflow-hidden">
                        <h2 className="text-2xl font-bold text-orange-400 z-10">HOME</h2>
                        <div className="flex items-baseline gap-4 z-10">
                            <span className="text-8xl font-black text-white">{pointsA}</span>
                        </div>
                        <div className="text-sm text-neutral-500 uppercase tracking-widest z-10">Sets: <span className="text-white text-xl font-bold">{setsA}</span></div>

                        {isAdmin && (
                            <div className="flex gap-4 mt-4 z-10">
                                <button onClick={addPointA} className="px-8 py-4 bg-orange-600 hover:bg-orange-500 rounded-xl font-bold text-2xl shadow-lg transition-transform active:scale-95">
                                    +1
                                </button>
                                <button onClick={winSetA} className="px-4 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-bold text-sm text-orange-200">
                                    WIN SET
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-red-900/20 to-neutral-900 border border-red-500/20 p-8 rounded-3xl relative overflow-hidden">
                        <h2 className="text-2xl font-bold text-red-400 z-10">AWAY</h2>
                        <div className="flex items-baseline gap-4 z-10">
                            <span className="text-8xl font-black text-white">{pointsB}</span>
                        </div>
                        <div className="text-sm text-neutral-500 uppercase tracking-widest z-10">Sets: <span className="text-white text-xl font-bold">{setsB}</span></div>

                        {isAdmin && (
                            <div className="flex gap-4 mt-4 z-10">
                                <button onClick={addPointB} className="px-8 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-2xl shadow-lg transition-transform active:scale-95">
                                    +1
                                </button>
                                <button onClick={winSetB} className="px-4 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-bold text-sm text-red-200">
                                    WIN SET
                                </button>
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
