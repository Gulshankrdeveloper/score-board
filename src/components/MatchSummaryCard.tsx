import React, { forwardRef } from 'react';
import { Share2, Download } from 'lucide-react';
import { cn } from "@/lib/utils";

// Define the props for the summary card
interface MatchSummaryCardProps {
    winnerTeam: string;
    teamA: { name: string; score: string; overs: string };
    teamB: { name: string; score: string; overs: string };
    result: string;
    manOfTheMatch?: { name: string; runs: number; wickets: number };
    manOfTheMatchImage?: string;
    date: string;
}

export const MatchSummaryCard = forwardRef<HTMLDivElement, MatchSummaryCardProps>(({ winnerTeam, teamA, teamB, result, manOfTheMatch, manOfTheMatchImage, date }, ref) => {
    return (
        <div ref={ref} className="w-[400px] h-[500px] bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white p-6 rounded-3xl shadow-2xl flex flex-col items-center justify-between border-4 border-blue-500/20 relative overflow-hidden font-sans">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <div className="text-center z-10">
                <h1 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    Match Summary
                </h1>
                <div className="text-xs text-neutral-400 mt-1 font-mono">{date}</div>
            </div>

            {/* Winner Badge */}
            <div className="bg-yellow-500/20 border border-yellow-500/50 px-6 py-2 rounded-full z-10 animate-pulse">
                <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                    👑 {winnerTeam} Won
                </span>
            </div>

            {/* Scores */}
            <div className="w-full space-y-4 z-10">
                {/* Team A */}
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="font-bold text-lg">{teamA.name}</div>
                    <div className="text-right">
                        <div className="text-2xl font-black leading-none">{teamA.score}</div>
                        <div className="text-xs text-neutral-400">{teamA.overs} Ov</div>
                    </div>
                </div>

                {/* VS */}
                <div className="flex justify-center -my-6 relative z-20">
                    <div className="bg-[#0f172a] border border-white/10 rounded-full px-3 py-1 text-xs font-bold text-neutral-500">
                        VS
                    </div>
                </div>

                {/* Team B */}
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="font-bold text-lg">{teamB.name}</div>
                    <div className="text-right">
                        <div className="text-2xl font-black leading-none">{teamB.score}</div>
                        <div className="text-xs text-neutral-400">{teamB.overs} Ov</div>
                    </div>
                </div>
            </div>

            {/* Man of the Match (Optional) */}
            {manOfTheMatch && (
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-3 rounded-xl w-full text-center border border-blue-500/20 z-10 flex items-center gap-4">
                    {manOfTheMatchImage && (
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-500 flex-shrink-0">
                            <img src={manOfTheMatchImage} alt={manOfTheMatch.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="text-[10px] uppercase text-blue-300 font-bold tracking-wider mb-1">Star Performer</div>
                        <div className="font-bold text-lg leading-none mb-1">{manOfTheMatch.name}</div>
                        <div className="text-xs text-neutral-300">
                            {manOfTheMatch.runs > 0 && `${manOfTheMatch.runs} Runs`}
                            {manOfTheMatch.runs > 0 && manOfTheMatch.wickets > 0 && " • "}
                            {manOfTheMatch.wickets > 0 && `${manOfTheMatch.wickets} Wickets`}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="text-center z-10 mt-4">
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest">
                    Powered by
                </div>
                <div className="font-bold text-xl italic">SportsBoard</div>
            </div>
        </div>
    );
});

MatchSummaryCard.displayName = "MatchSummaryCard";
