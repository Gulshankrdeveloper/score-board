"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, RotateCcw, Monitor, Settings, Pause, Play } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ChessPage() {
    const INITIAL_TIME = 600; // 10 minutes in seconds
    const [timeWhite, setTimeWhite] = useState(INITIAL_TIME);
    const [timeBlack, setTimeBlack] = useState(INITIAL_TIME);
    const [activePlayer, setActivePlayer] = useState<"white" | "black" | null>(null); // null = paused/not started
    const [winner, setWinner] = useState<"white" | "black" | "draw" | null>(null);
    const [isAdmin, setIsAdmin] = useState(true);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activePlayer && !winner) {
            interval = setInterval(() => {
                if (activePlayer === "white") {
                    setTimeWhite((prev) => {
                        if (prev <= 0) {
                            setWinner("black");
                            setActivePlayer(null);
                            return 0;
                        }
                        return prev - 1;
                    });
                } else {
                    setTimeBlack((prev) => {
                        if (prev <= 0) {
                            setWinner("white");
                            setActivePlayer(null);
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activePlayer, winner]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const switchTurn = () => {
        if (winner) return;
        if (activePlayer === "white") setActivePlayer("black");
        else setActivePlayer("white");
    };

    const resetGame = () => {
        setTimeWhite(INITIAL_TIME);
        setTimeBlack(INITIAL_TIME);
        setActivePlayer(null);
        setWinner(null);
    };

    const togglePause = () => {
        if (activePlayer) {
            setActivePlayer(null); // Pause
        } else {
            // Resume? But whose turn? 
            // Need to track whose turn it was? 
            // Simplified: Start White if null? No, confusing.
            // Let's just have "Start Game" -> White starts.
            // If paused, maybe state needs "lastActive"?
            // For now, assume "Start" always sets White if fresh, or resumes if we knew?
            // To keep it simple: Click on User Clock to Activate them.
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center">
            <div className="w-full p-4 flex justify-between items-center bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50 border-b border-neutral-800">
                <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                    &larr; SportsBoard
                </Link>
                <button onClick={() => setIsAdmin(!isAdmin)} className="p-2 rounded-full hover:bg-neutral-800 transition-colors">
                    {isAdmin ? <Monitor size={20} className="text-purple-400" /> : <Settings size={20} className="text-neutral-400" />}
                </button>
            </div>

            <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center p-4 gap-8">

                {winner && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center"
                    >
                        <Crown size={80} className="text-yellow-400 mb-4" />
                        <h2 className="text-6xl font-black uppercase text-white mb-2">{winner === "draw" ? "DRAW" : `${winner} WINS`}</h2>
                        <button onClick={resetGame} className="px-8 py-3 bg-white text-black font-bold rounded-full mt-8 hover:scale-105 transition-transform">
                            New Game
                        </button>
                    </motion.div>
                )}

                <div className="w-full h-full flex flex-col md:flex-row gap-4 items-center justify-center max-w-5xl relative">
                    {/* White Player */}
                    <button
                        onClick={() => !winner && setActivePlayer("white")}
                        disabled={!isAdmin && activePlayer !== "white"}
                        className={cn(
                            "flex-1 w-full md:h-[60vh] flex flex-col items-center justify-center p-8 rounded-3xl border transition-all relative overflow-hidden group",
                            activePlayer === "white" ? "bg-white text-black border-white shadow-[0_0_50px_rgba(255,255,255,0.3)] scale-105 z-10" : "bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:bg-neutral-800"
                        )}
                    >
                        <div className="text-xl font-bold uppercase tracking-widest mb-4">White</div>
                        <div className="text-8xl md:text-9xl font-black tabular-nums font-mono">
                            {formatTime(timeWhite)}
                        </div>
                        {activePlayer === "white" && <div className="absolute inset-x-0 bottom-0 h-2 bg-green-500 animate-pulse" />}
                    </button>

                    {/* Controls / VS */}
                    <div className="flex flex-col items-center gap-4 z-10">
                        <div className="p-4 bg-neutral-900 rounded-full border border-neutral-800">
                            <Crown size={32} className={cn("transition-colors", activePlayer === "white" ? "text-white" : activePlayer === "black" ? "text-black fill-white" : "text-neutral-600")} />
                        </div>
                        {isAdmin && <button onClick={() => setActivePlayer(null)} className="p-3 bg-neutral-800 rounded-full hover:bg-neutral-700"><Pause size={20} /></button>}
                        {isAdmin && <button onClick={resetGame} className="p-3 bg-neutral-800 rounded-full hover:bg-red-900/50 text-red-400"><RotateCcw size={20} /></button>}
                    </div>

                    {/* Black Player */}
                    <button
                        onClick={() => !winner && setActivePlayer("black")}
                        disabled={!isAdmin && activePlayer !== "black"}
                        className={cn(
                            "flex-1 w-full md:h-[60vh] flex flex-col items-center justify-center p-8 rounded-3xl border transition-all relative overflow-hidden group",
                            activePlayer === "black" ? "bg-neutral-900 text-white border-white/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] scale-105 z-10" : "bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:bg-neutral-800"
                        )}
                    >
                        <div className="text-xl font-bold uppercase tracking-widest mb-4">Black</div>
                        <div className="text-8xl md:text-9xl font-black tabular-nums font-mono">
                            {formatTime(timeBlack)}
                        </div>
                        {activePlayer === "black" && <div className="absolute inset-x-0 bottom-0 h-2 bg-green-500 animate-pulse" />}
                    </button>
                </div>
            </main>
        </div>
    );
}
