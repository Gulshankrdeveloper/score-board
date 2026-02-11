"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Activity, Target } from "lucide-react"; // Using available icons
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CricketBackground } from "@/components/CricketBackground";
import { SplashScreen } from "@/components/SplashScreen";
import { useState, useEffect } from "react";

const games = [
    {
        id: "cricket",
        name: "Cricket",
        icon: Target,
        color: "text-blue-400",
        gradient: "from-blue-500/20 to-blue-900/20",
        href: "/cricket",
    },
    {
        id: "football",
        name: "Football",
        icon: Trophy,
        color: "text-green-400",
        gradient: "from-green-500/20 to-green-900/20",
        href: "/football",
    },
    {
        id: "volleyball",
        name: "Volleyball",
        icon: Activity,
        color: "text-orange-400",
        gradient: "from-orange-500/20 to-orange-900/20",
        href: "/volleyball",
    },
    {
        id: "chess",
        name: "Chess",
        icon: Crown,
        color: "text-purple-400",
        gradient: "from-purple-500/20 to-purple-900/20",
        href: "/chess",
    },
];

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);

    if (isLoading) {
        return <SplashScreen onFinish={() => setIsLoading(false)} />;
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 relative overflow-hidden">
            <CricketBackground />

            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-12">
                <p className="fixed left-0 top-0 flex w-full justify-center border-b border-primary/10 bg-background/50 backdrop-blur-md pb-6 pt-8 dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-zinc-800/30 lg:p-4 lg:dark:bg-zinc-800/30">
                    Local Multiplayer Scoreboard
                </p>
            </div>

            <div className="z-10 text-center mb-16">
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-4">
                    Choose Your Game
                </h1>
                <p className="text-muted-foreground text-lg">
                    Select a sport to start tracking scores instantly.
                </p>
            </div>

            <div className="z-10 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left gap-4">
                {games.map((game, index) => (
                    <Link
                        key={game.id}
                        href={game.href}
                        className="group rounded-lg border border-transparent px-5 py-8 transition-all hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 relative overflow-hidden"
                    >
                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br", game.gradient)} />

                        <div className="relative z-10 flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 1 }}
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className={cn("mb-4 h-12 w-12", game.color)}
                            >
                                <game.icon className="w-full h-full" />
                            </motion.div>
                            <h2 className={`mb-3 text-2xl font-semibold`}>
                                {game.name}{" "}
                                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                                    -&gt;
                                </span>
                            </h2>
                            <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
                                Start a {game.name} match and track scores.
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </main>
    );
}
