"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, RotateCcw, Monitor, UserPlus, Users, ArrowLeftRight, Play, Trash2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";


// --- Types ---
type Player = {
    id: string;
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    out: boolean;
    bowling: {
        overs: number;
        maidens: number;
        runs: number;
        wickets: number;
    };
};

type Team = {
    name: string;
    players: Player[];
};

type MatchRecord = {
    id: string;
    date: string;
    teamA: Team;
    teamB: Team;
    battingTeamName: string;
    bowlingTeamName: string;
    runs: number;
    wickets: number;
    overs: string;
    result: string;
    extras: { w: number; nb: number; b: number; lb: number };
};

type TournamentTeam = {
    id: string;
    name: string;
    played: number;
    won: number;
    lost: number;
    points: number;
    nrr: number; // Net Run Rate (simplified or full)
    runsScored: number;
    oversFaced: number;
    runsConceded: number;
    oversBowled: number;
    group: string; // "A" or "B"
};

type TournamentMatch = {
    id: string;
    teamAId: string;
    teamBId: string;
    winnerId: string | null;
    completed: boolean;
    result: string;
    matchDate: string;
};

type CelebrationType = "4" | "6" | "W" | null;

type GameState = "setup" | "toss" | "playing" | "history" | "break" | "tournament-setup" | "tournament-dashboard";

// --- Components ---
const ActionButton = ({ onClick, label, color = "bg-blue-600", disabled = false }: { onClick: () => void; label: string | number | React.ReactNode; color?: string; disabled?: boolean }) => (
    <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "h-14 md:h-16 w-full rounded-xl text-xl md:text-2xl font-bold text-white shadow-lg transition-all hover:brightness-110 flex items-center justify-center",
            color,
            disabled && "opacity-50 cursor-not-allowed grayscale"
        )}
    >
        {label}
    </motion.button>
);

export default function CricketPage() {
    // --- Game Config State ---
    const [gameState, setGameState] = useState<GameState>("setup");
    const [isAdmin, setIsAdmin] = useState(true);

    // History State
    const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);

    // Celebration State
    const [celebration, setCelebration] = useState<CelebrationType>(null);

    // --- Tournament State ---
    const [tournamentTeams, setTournamentTeams] = useState<TournamentTeam[]>([]);
    const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>([]);
    const [activeTournamentMatchId, setActiveTournamentMatchId] = useState<string | null>(null);
    const [tournamentName, setTournamentName] = useState("My Tournament");
    const [tempTournamentTeamName, setTempTournamentTeamName] = useState("");
    const [tempTournamentGroup, setTempTournamentGroup] = useState("A");



    // --- Sync Effect ---


    useEffect(() => {
        if (celebration) {
            const timer = setTimeout(() => setCelebration(null), 2500);
            return () => clearTimeout(timer);
        }
    }, [celebration]);

    // --- Persistence ---
    useEffect(() => {
        const savedHistory = localStorage.getItem('cricket_history');
        if (savedHistory) setMatchHistory(JSON.parse(savedHistory));

        const savedTournTeams = localStorage.getItem('cricket_tournament_teams');
        if (savedTournTeams) setTournamentTeams(JSON.parse(savedTournTeams));

        const savedTournMatches = localStorage.getItem('cricket_tournament_matches');
        if (savedTournMatches) setTournamentMatches(JSON.parse(savedTournMatches));

        // Restore active match if any
        const savedActiveMatchId = localStorage.getItem('cricket_active_tournament_match');
        if (savedActiveMatchId) setActiveTournamentMatchId(savedActiveMatchId);
    }, []);

    useEffect(() => {
        localStorage.setItem('cricket_tournament_teams', JSON.stringify(tournamentTeams));
    }, [tournamentTeams]);

    useEffect(() => {
        localStorage.setItem('cricket_tournament_matches', JSON.stringify(tournamentMatches));
    }, [tournamentMatches]);

    useEffect(() => {
        if (activeTournamentMatchId) {
            localStorage.setItem('cricket_active_tournament_match', activeTournamentMatchId);
        } else {
            localStorage.removeItem('cricket_active_tournament_match');
        }
    }, [activeTournamentMatchId]);

    // --- Team Initial Setup State ---
    const [teamAName, setTeamAName] = useState("Team A");
    const [teamBName, setTeamBName] = useState("Team B");
    const [tempPlayerNameA, setTempPlayerNameA] = useState(""); // For input
    const [tempPlayerNameB, setTempPlayerNameB] = useState(""); // For input
    const [battingTeam, setBattingTeam] = useState<"A" | "B">("A");

    // --- Match State ---
    const [teamA, setTeamA] = useState<Team>({ name: "Team A", players: [] });
    const [teamB, setTeamB] = useState<Team>({ name: "Team B", players: [] });

    // Current Active Players
    const [strikerId, setStrikerId] = useState<string | null>(null);
    const [nonStrikerId, setNonStrikerId] = useState<string | null>(null);
    const [bowlerId, setBowlerId] = useState<string | null>(null);

    // Match Stats
    const [totalRuns, setTotalRuns] = useState(0);
    const [totalWickets, setTotalWickets] = useState(0);
    const [totalBalls, setTotalBalls] = useState(0); // Valid balls
    const [extras, setExtras] = useState({ w: 0, nb: 0, b: 0, lb: 0 });
    const [currentOver, setCurrentOver] = useState<string[]>([]);
    const [thisOverRuns, setThisOverRuns] = useState(0);

    // New Match Config & State
    const [totalOvers, setTotalOvers] = useState(5); // Default 5 overs
    const [innings, setInnings] = useState<1 | 2>(1);
    const [targetRuns, setTargetRuns] = useState<number | null>(null);
    const [breakTimeLeft, setBreakTimeLeft] = useState(120); // 120 seconds = 2 mins



    // --- Selectors ---
    const currentBattingTeam = battingTeam === "A" ? teamA : teamB;
    const currentBowlingTeam = battingTeam === "A" ? teamB : teamA;

    const striker = currentBattingTeam.players.find(p => p.id === strikerId);
    const nonStriker = currentBattingTeam.players.find(p => p.id === nonStrikerId);
    const bowler = currentBowlingTeam.players.find(p => p.id === bowlerId);

    const [lastOverBowlerId, setLastOverBowlerId] = useState<string | null>(null);


    // --- Logic Helpers ---
    const fillDummyTeams = () => {
        const createPlayer = (name: string) => ({
            id: Math.random().toString(36).substr(2, 9),
            name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false,
            bowling: { overs: 0, maidens: 0, runs: 0, wickets: 0 }
        });

        const newTeamA = Array.from({ length: 11 }, (_, i) => createPlayer(`Player A${i + 1}`));
        const newTeamB = Array.from({ length: 11 }, (_, i) => createPlayer(`Player B${i + 1}`));

        setTeamA(prev => ({ ...prev, players: newTeamA }));
        setTeamB(prev => ({ ...prev, players: newTeamB }));
    };

    const addPlayer = (team: "A" | "B", name: string) => {
        if (!name.trim()) return;
        const count = team === "A" ? teamA.players.length : teamB.players.length;
        if (count >= 11) {
            alert("Maximum 11 players allowed per team!");
            return;
        }

        const newPlayer: Player = {
            id: Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            runs: 0, balls: 0, fours: 0, sixes: 0, out: false,
            bowling: { overs: 0, maidens: 0, runs: 0, wickets: 0 }
        };

        if (team === "A") {
            setTeamA(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
            setTempPlayerNameA("");
        } else {
            setTeamB(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
            setTempPlayerNameB("");
        }
    };

    const startGame = () => {
        setGameState("toss");
    };

    const handleToss = (winner: "A" | "B", choice: "bat" | "bowl") => {
        let newBattingTeam: "A" | "B" = "A";
        if (winner === "A") {
            newBattingTeam = choice === "bat" ? "A" : "B";
        } else {
            newBattingTeam = choice === "bat" ? "B" : "A";
        }

        setBattingTeam(newBattingTeam);
        setGameState("playing");
    };

    const addTournamentTeam = () => {
        if (!tempTournamentTeamName.trim()) return;
        const newTeam: TournamentTeam = {
            id: Math.random().toString(36).substr(2, 9),
            name: tempTournamentTeamName.trim(),
            played: 0, won: 0, lost: 0, points: 0, nrr: 0,
            runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0,
            group: tempTournamentGroup // Add group assignment
        };
        setTournamentTeams([...tournamentTeams, newTeam]);
        setTempTournamentTeamName("");
    };

    const removeTournamentTeam = (id: string) => {
        setTournamentTeams(tournamentTeams.filter(t => t.id !== id));
    };

    const generateSchedule = () => {
        if (tournamentTeams.length < 2) {
            alert("Need at least 2 teams to generate a schedule.");
            return;
        }
        const matches: TournamentMatch[] = [];

        // Group teams by group
        const groups: { [key: string]: TournamentTeam[] } = {};
        tournamentTeams.forEach(t => {
            const g = t.group || "A";
            if (!groups[g]) groups[g] = [];
            groups[g].push(t);
        });

        // Generate Per-Group Round Robin
        Object.keys(groups).forEach(groupName => {
            const groupTeams = groups[groupName];
            for (let i = 0; i < groupTeams.length; i++) {
                for (let j = i + 1; j < groupTeams.length; j++) {
                    matches.push({
                        id: Math.random().toString(36).substr(2, 9),
                        teamAId: groupTeams[i].id,
                        teamBId: groupTeams[j].id,
                        winnerId: null,
                        completed: false,
                        result: "",
                        matchDate: `Group ${groupName} Match`
                    });
                }
            }
        });

        setTournamentMatches(matches);
        setGameState("tournament-dashboard");
    };

    const startTournamentMatch = (matchId: string) => {
        const match = tournamentMatches.find(m => m.id === matchId);
        if (!match) return;

        const teamAData = tournamentTeams.find(t => t.id === match.teamAId);
        const teamBData = tournamentTeams.find(t => t.id === match.teamBId);

        if (!teamAData || !teamBData) return;

        // Reset Game State for new match
        setTeamA({ name: teamAData.name, players: [] });
        setTeamB({ name: teamBData.name, players: [] });
        setTotalRuns(0);
        setTotalWickets(0);
        setTotalBalls(0);
        setExtras({ w: 0, nb: 0, b: 0, lb: 0 });
        setCurrentOver([]);
        setThisOverRuns(0);
        setStrikerId(null);
        setNonStrikerId(null);
        setBowlerId(null);
        setInnings(1);
        setTargetRuns(null);
        setActiveTournamentMatchId(matchId);

        // Auto fill players for smoother tournament flow (optional, but good for UX)
        // Or user adds them manually. Let's force manual or provide quick fill button in setup.
        // Go to Setup
        setGameState("setup");
    };

    const saveMatch = () => {
        const newRecord: MatchRecord = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            teamA: { ...teamA },
            teamB: { ...teamB },
            battingTeamName: currentBattingTeam.name,
            bowlingTeamName: currentBowlingTeam.name,
            runs: totalRuns,
            wickets: totalWickets,
            overs: `${overs}.${ballsInOver}`,
            result: `${currentBattingTeam.name} scored ${totalRuns}/${totalWickets} in ${overs}.${ballsInOver} overs`,
            extras: extras
        };
        const updatedHistory = [newRecord, ...matchHistory];
        setMatchHistory(updatedHistory);
        localStorage.setItem('cricket_history', JSON.stringify(updatedHistory));

        if (activeTournamentMatchId) {
            const matchIndex = tournamentMatches.findIndex(m => m.id === activeTournamentMatchId);
            if (matchIndex >= 0) {
                const updatedMatches = [...tournamentMatches];
                const match = updatedMatches[matchIndex];
                match.completed = true;
                match.result = `${currentBattingTeam.name} won`; // Simplified result text
                match.winnerId = currentBattingTeam.name === teamA.name ? match.teamAId : match.teamBId; // Verify logic: currentBattingTeam is winner?
                // Wait, logic check:
                // If innings 2 chased target -> Batting Team Wins.
                // If innings 2 fails -> Bowling Team Wins.
                // If innings 1 ends and we manual save?
                // Let's rely on whoever is "currentBattingTeam" winning? No.
                // We need a proper Winner determination logic in saveMatch.
                // For now, let's assume the user clicks "End Match" when it's done. 
                // If it's a chase win, batting team wins.
                // If it's a defend win, bowling team wins.
                // Simplified: Ask user who won? Or detect score.

                let winnerId = null;
                const batRuns = totalRuns;
                const bowlRuns = innings === 2 ? (targetRuns ? targetRuns - 1 : 0) : 0; // Rough logic

                // Better: Pass "winningTeam" to saveMatch?
                // Let's do simple logic: If target chased -> Batting wins. Else Bowling wins.
                if (innings === 2 && targetRuns && totalRuns >= targetRuns) {
                    winnerId = currentBattingTeam.name === teamA.name ? match.teamAId : match.teamBId;
                } else if (innings === 2) { // Defended
                    winnerId = currentBowlingTeam.name === teamA.name ? match.teamAId : match.teamBId;
                } else {
                    // Innings 1 end? Can't really determine winner unless D/L or forfeit.
                    // Assuming simple flow: Only save completed match.
                    // Determine winner based on scores if innings 1 and 2 done?
                    // Complexity: This `saveMatch` is called manually.
                    // Let's assume the USER ensures the match is over.
                    // We will assume current Batting team WON if they have more runs than target.
                    // Otherwise Bowling team won.
                    if (targetRuns && totalRuns >= targetRuns) {
                        winnerId = currentBattingTeam.name === teamA.name ? match.teamAId : match.teamBId;
                    } else {
                        winnerId = currentBowlingTeam.name === teamA.name ? match.teamAId : match.teamBId;
                    }
                }

                match.winnerId = winnerId;
                match.result = winnerId === match.teamAId ? `${teamA.name} Won` : `${teamB.name} Won`;
                setTournamentMatches(updatedMatches);

                // Update Stats
                const updatedTeams = tournamentTeams.map(t => {
                    if (t.id === match.teamAId || t.id === match.teamBId) {
                        const isWinner = t.id === winnerId;
                        return {
                            ...t,
                            played: t.played + 1,
                            won: t.won + (isWinner ? 1 : 0),
                            lost: t.lost + (isWinner ? 0 : 1),
                            points: t.points + (isWinner ? 2 : 0)
                            // NRR logic omitted for brevity in this step
                        };
                    }
                    return t;
                });
                setTournamentTeams(updatedTeams);
                setActiveTournamentMatchId(null);
                setGameState("tournament-dashboard");
                return; // Exit, don't go to setup
            }
        }

        // Reset and go to setup
        setGameState("setup");
        setTotalRuns(0);
        setTotalWickets(0);
        setTotalBalls(0);
        setExtras({ w: 0, nb: 0, b: 0, lb: 0 });
        setCurrentOver([]);
        setThisOverRuns(0);
        setStrikerId(null);
        setNonStrikerId(null);
        setBowlerId(null);
        setTeamA({ name: "Team A", players: [] });
        setTeamB({ name: "Team B", players: [] });
        setInnings(1);
        setTargetRuns(null);
    };

    const startInningsBreak = () => {
        setGameState("break");
        setBreakTimeLeft(120);
        setInnings(2);
        setTargetRuns(totalRuns + 1);

        // Reset necessary state for 2nd innings
        setTotalRuns(0);
        setTotalWickets(0);
        setTotalBalls(0);
        setExtras({ w: 0, nb: 0, b: 0, lb: 0 });
        setCurrentOver([]);
        setThisOverRuns(0);
        setStrikerId(null);
        setNonStrikerId(null);
        setBowlerId(null);

        // Swap Teams
        setBattingTeam(battingTeam === "A" ? "B" : "A");
    };

    useEffect(() => {
        if (gameState === "break" && breakTimeLeft > 0) {
            const timer = setInterval(() => setBreakTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (gameState === "break" && breakTimeLeft === 0) {
            setGameState("playing");
        }
    }, [gameState, breakTimeLeft]);

    const deleteMatch = (id: string) => {
        const updatedHistory = matchHistory.filter(m => m.id !== id);
        setMatchHistory(updatedHistory);
        localStorage.setItem('cricket_history', JSON.stringify(updatedHistory));
    };

    const updateBatsmanScore = (runs: number) => {
        if (!strikerId) return;
        const teamSetter = battingTeam === "A" ? setTeamA : setTeamB;

        teamSetter(prev => ({
            ...prev,
            players: prev.players.map(p => {
                if (p.id === strikerId) {
                    return {
                        ...p,
                        runs: p.runs + runs,
                        balls: p.balls + 1, // Start logic: wide/nb doesn't add ball to batsman usually, but simple game here
                        fours: runs === 4 ? p.fours + 1 : p.fours,
                        sixes: runs === 6 ? p.sixes + 1 : p.sixes
                    };
                }
                return p;
            })
        }));
    };

    const updateBowlerStats = (runsConceded: number, isWicket: boolean, isValidBall: boolean) => {
        if (!bowlerId) return;
        const teamSetter = battingTeam === "A" ? setTeamB : setTeamA; // Bowling team is opposite

        teamSetter(prev => ({
            ...prev,
            players: prev.players.map(p => {
                if (p.id === bowlerId) {
                    // Simplified: Just add runs/wickets.
                    return {
                        ...p,
                        bowling: {
                            ...p.bowling,
                            runs: p.bowling.runs + runsConceded,
                            wickets: isWicket ? p.bowling.wickets + 1 : p.bowling.wickets,
                            overs: isValidBall && (p.bowling.overs * 6 + 1) % 6 === 0 ? p.bowling.overs + 1 : p.bowling.overs + (isValidBall ? 0.1 : 0) // rough approx for display
                        }
                    };
                }
                return p;
            })
        }));
    };

    const handleBall = (runs: number | string) => {
        let runVal = 0;
        // let isExtra = false; // Unused in this simplified logic, but kept for context if needed later
        let isWicket = false;
        let isValidBall = true;
        let shouldEndInnings = false;

        if (typeof runs === 'number') {
            runVal = runs;
            updateBatsmanScore(runs);
            updateBowlerStats(runs, false, true);
            if (runs === 4) setCelebration("4");
            if (runs === 6) setCelebration("6");
        } else {
            // Specials
            if (runs === "W") { // Wicket
                isWicket = true;
                setCelebration("W");
                setTotalWickets(w => w + 1);
                updateBatsmanScore(0); // Ball faced, 0 runs
                updateBowlerStats(0, true, true);

                if (totalWickets + 1 >= 10) { // 10 wickets = All Out in 11 player team
                    shouldEndInnings = true;
                    if (innings === 1) {
                        setTimeout(startInningsBreak, 2000);
                    } else {
                        // End Match logic here if needed, currently manual "End Match"
                        alert("All Out! End of Match.");
                    }
                } else {
                    // Delay showing batsman selection until animation is done
                    setTimeout(() => {
                        setStrikerId(null);
                    }, 2500);
                }
            } else if (runs === "WD" || runs === "NB") {
                // isExtra = true;
                isValidBall = false;
                runVal = 1;
                setExtras(prev => ({ ...prev, [runs === "WD" ? "w" : "nb"]: prev[runs === "WD" ? "w" : "nb"] + 1 }));
                updateBowlerStats(1, false, false); // Extra run charged to bowler usually
            }
        }

        setTotalRuns(prev => prev + runVal);
        if (typeof runs === 'number') setThisOverRuns(prev => prev + runs);

        if (isValidBall) {
            // Calculate next state immediately for logic
            const nextTotalBalls = totalBalls + 1;
            setTotalBalls(nextTotalBalls);
            setCurrentOver(prev => [...prev, runs.toString()]);

            const nextOvers = Math.floor(nextTotalBalls / 6);
            const isOverComplete = nextTotalBalls % 6 === 0;

            // Target Chased Check (Innings 2)
            if (innings === 2 && targetRuns && (totalRuns + runVal) >= targetRuns) {
                alert(`Match Won by ${currentBattingTeam.name}!`);
                return;
            }

            if (isOverComplete && !shouldEndInnings) {
                // End of over logic

                // Check Max Overs
                if (nextOvers >= totalOvers) {
                    if (innings === 1) {
                        setTimeout(startInningsBreak, 2000);
                        return;
                    } else {
                        alert("Innings Complete! End of Match.");
                        // Could auto end match here
                    }
                }
                // 1. Swap if odd runs on last ball
                if (typeof runs === 'number' && runs % 2 !== 0) {
                    swapStriker();
                }

                // 2. Set timeout for over transition
                setTimeout(() => {
                    setCurrentOver([]);
                    setThisOverRuns(0);
                    setLastOverBowlerId(bowlerId);
                    setBowlerId(null);

                    // 3. ALWAYS swap ends at end of over (regardless of last ball run)
                    // But wait, if we swapped above (odd run), doing it again here cancels it out?
                    // Rule: Run taken (odd) -> Swap. Then End of over -> Ends change (Swap).
                    // So effectively, original striker is back at strike? Yes.
                    // Calling swapStriker() twice effectively does nothing if synchronous, but logic says:
                    // Odd run logic happens NOW. Over end logic happens usually immediately or after.
                    // Let's just call it again.
                    swapStriker();
                }, 2000);
            } else {
                // Not end of over
                if (typeof runs === 'number' && runs % 2 !== 0) {
                    swapStriker();
                }
            }
        } else {
            // Extra ball
            setCurrentOver(prev => [...prev, runs.toString()]);
            // if (typeof runs === 'number' && runs % 2 !== 0) { // e.g. NB + run? Simplified here runs is string for extras
            // runs is string for WD/NB so this check fails safely
            // }
        }
    };

    const swapStriker = () => {
        // Simple direct toggle using current state variables (which are closed over but stable enough for this event loop)
        // OR better: use functional update to Ensure we don't loose track
        // But since we need to swap TWO, functional update is tricky.
        // Let's rely on the fact that handleBall updates are batched.

        setStrikerId(prevStriker => {
            setNonStrikerId(prevNonStriker => prevStriker);
            return nonStrikerId; // Use the value from render scope or we need a Ref. 
            // Actually, if we use functional setNonStrikerId, we have access to current NonStriker.
            // But we can't return it to setStrikerId easily.
        });

        // Let's try the safer ref-like approach:
        const s = strikerId;
        const ns = nonStrikerId;
        if (s && ns) {
            setStrikerId(ns);
            setNonStrikerId(s);
        }
    };

    const selectBatsman = (id: string) => {
        if (!strikerId) setStrikerId(id);
        else if (!nonStrikerId) setNonStrikerId(id);
    };

    // UI calculations
    const overs = Math.floor(totalBalls / 6);
    const ballsInOver = totalBalls % 6;

    // --- Render ---

    if (gameState === "setup") {
        return (
            <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Match Setup</h1>

                {/* History Button */}
                <div className="w-full flex justify-between mb-4">
                    <Link href="/" className="text-neutral-400 hover:text-white flex items-center gap-2 text-sm border border-neutral-800 px-4 py-2 rounded-lg hover:bg-neutral-900 transition-colors">
                        <ChevronLeft size={16} /> Back to Home
                    </Link>
                    <button onClick={() => setGameState("history")} className="text-neutral-400 hover:text-white flex items-center gap-2 text-sm border border-neutral-800 px-4 py-2 rounded-lg hover:bg-neutral-900 transition-colors">
                        <RotateCcw size={16} /> View History
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    {/* Team A Setup */}
                    <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                        <input
                            className="w-full bg-transparent text-2xl font-bold mb-4 outline-none border-b border-neutral-700 focus:border-blue-500 transition-colors placeholder:text-neutral-600"
                            value={teamAName}
                            onChange={(e) => setTeamAName(e.target.value)}
                            placeholder="Enter Team A Name"
                        />
                        <div className="flex gap-2 mb-4">
                            <input
                                className="flex-1 bg-neutral-800 rounded-lg px-4 py-2 outline-none"
                                value={tempPlayerNameA}
                                onChange={(e) => setTempPlayerNameA(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addPlayer("A", tempPlayerNameA)}
                                placeholder="Add Player"
                            />
                            <button onClick={() => addPlayer("A", tempPlayerNameA)} className="bg-blue-600 p-2 rounded-lg"><UserPlus size={20} /></button>
                        </div>
                        <div className="md:hidden mb-4">
                            <button onClick={() => setGameState("tournament-setup")} className="w-full py-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg font-bold text-sm">
                                🏆 Tournament Mode
                            </button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {teamA.players.map(p => (
                                <div key={p.id} className="bg-neutral-800/50 p-3 rounded-lg flex justify-between items-center">
                                    <span>{p.name}</span>
                                </div>
                            ))}
                            {teamA.players.length === 0 && <p className="text-neutral-500 text-sm italic">No players added</p>}
                        </div>
                    </div>

                    {/* Team B Setup */}
                    <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                        <input
                            className="w-full bg-transparent text-2xl font-bold mb-4 outline-none border-b border-neutral-700 focus:border-green-500 transition-colors placeholder:text-neutral-600"
                            value={teamBName}
                            onChange={(e) => setTeamBName(e.target.value)}
                            placeholder="Enter Team B Name"
                        />
                        <div className="flex gap-2 mb-4">
                            <input
                                className="flex-1 bg-neutral-800 rounded-lg px-4 py-2 outline-none"
                                value={tempPlayerNameB}
                                onChange={(e) => setTempPlayerNameB(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addPlayer("B", tempPlayerNameB)}
                                placeholder="Add Player"
                            />
                            <button onClick={() => addPlayer("B", tempPlayerNameB)} className="bg-green-600 p-2 rounded-lg"><UserPlus size={20} /></button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {teamB.players.map(p => (
                                <div key={p.id} className="bg-neutral-800/50 p-3 rounded-lg flex justify-between items-center">
                                    <span>{p.name}</span>
                                </div>
                            ))}
                            {teamB.players.length === 0 && <p className="text-neutral-500 text-sm italic">No players added</p>}
                        </div>
                    </div>
                </div>

                {/* Match Settings */}
                <div className="w-full max-w-4xl mt-8 bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 relative">
                    {activeTournamentMatchId && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                            Tournament Match
                        </div>
                    )}
                    <h3 className="text-xl font-bold mb-4 text-neutral-300">Match Settings</h3>
                    <div className="flex flex-col gap-2">
                        <label className="text-neutral-400">Total Overs: <span className="text-blue-400 font-bold">{totalOvers}</span></label>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={totalOvers}
                            onChange={(e) => setTotalOvers(parseInt(e.target.value))}
                            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-neutral-500 mt-1">
                            <span>1 Over</span>
                            <span>10 Overs</span>
                            <span>20 Overs</span>
                        </div>
                    </div>

                    {isAdmin && (
                        <button onClick={fillDummyTeams} className="text-xs text-neutral-500 underline hover:text-white mt-4">
                            Quick Fill Teams (Dev)
                        </button>
                    )}
                </div>

                {!activeTournamentMatchId && (
                    <button onClick={() => setGameState("tournament-setup")} className="text-sm text-yellow-500 hover:text-yellow-400 font-bold flex items-center gap-2 mt-8 border border-yellow-500/30 px-4 py-2 rounded-full hover:bg-yellow-500/10 transition-colors">
                        🏆 Switch to Tournament Mode
                    </button>
                )}

                <div className="flex flex-col gap-4 items-center mt-8">
                    <button
                        onClick={startGame}
                        disabled={teamA.players.length !== 11 || teamB.players.length !== 11}
                        className="w-full md:w-auto px-12 py-4 bg-white text-neutral-900 font-bold text-xl rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2 justify-center"
                    >
                        <Play fill="currentColor" /> Start Match
                    </button>
                    {(teamA.players.length !== 11 || teamB.players.length !== 11) && (
                        <div className="text-red-400 text-sm">Both teams must have exactly 11 players.</div>
                    )}
                </div>
            </div>
        );
    }

    if (gameState === "tournament-setup") {
        return (
            <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto">
                <div className="w-full flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
                    <button onClick={() => setGameState("setup")} className="text-neutral-400 hover:text-white">&larr; Back</button>
                    <h1 className="text-2xl font-bold text-yellow-500">Tournament Setup</h1>
                    <div className="w-10"></div>
                </div>

                <div className="w-full bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 mb-8">
                    <h3 className="text-lg font-bold mb-4">Add Teams</h3>
                    <div className="flex gap-2 mb-4">
                        <select
                            className="bg-neutral-800 rounded-lg px-4 py-2 outline-none font-bold"
                            value={tempTournamentGroup}
                            onChange={(e) => setTempTournamentGroup(e.target.value)}
                        >
                            <option value="A">Group A</option>
                            <option value="B">Group B</option>
                        </select>
                        <input
                            className="flex-1 bg-neutral-800 rounded-lg px-4 py-2 outline-none"
                            placeholder="Team Name (e.g. Mumbai Indians)"
                            value={tempTournamentTeamName}
                            onChange={(e) => setTempTournamentTeamName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTournamentTeam()}
                        />
                        <button onClick={addTournamentTeam} className="bg-yellow-600 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-500">Add</button>
                    </div>

                    <div className="space-y-2">
                        {tournamentTeams.map(t => (
                            <div key={t.id} className="bg-neutral-800 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="font-bold">{t.name}</span>
                                    <span className="ml-2 text-xs bg-neutral-700 px-2 py-0.5 rounded text-neutral-300">Group {t.group}</span>
                                </div>
                                <button onClick={() => removeTournamentTeam(t.id)} className="text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                            </div>
                        ))}
                        {tournamentTeams.length === 0 && <p className="text-neutral-500 text-center italic py-4">No teams added yet.</p>}
                    </div>
                </div>

                <button
                    onClick={generateSchedule}
                    disabled={tournamentTeams.length < 2}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold text-xl disabled:opacity-50 hover:scale-[1.02] transition-transform"
                >
                    Generate Schedule & Start
                </button>
            </div>
        );
    }

    if (gameState === "tournament-dashboard") {
        return (
            <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto">
                <div className="w-full flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
                    <button onClick={() => setGameState("setup")} className="text-neutral-400 hover:text-white">&larr; Exit</button>
                    <h1 className="text-2xl font-bold text-yellow-500">Tournament Dashboard</h1>
                    <div className="w-10"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 w-full">
                    {/* Points Table */}
                    {/* Points Table - Grouped */}
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 max-h-[500px] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-blue-400">Points Tables</h3>
                        {Array.from(new Set(tournamentTeams.map(t => t.group || "A"))).sort().map(group => (
                            <div key={group} className="mb-8 last:mb-0">
                                <h4 className="text-md font-bold mb-2 text-yellow-500 bg-neutral-800 px-3 py-1 rounded inline-block">Group {group}</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-neutral-800 text-neutral-400">
                                            <tr>
                                                <th className="p-2">Team</th>
                                                <th className="p-2 text-center">P</th>
                                                <th className="p-2 text-center">W</th>
                                                <th className="p-2 text-center">L</th>
                                                <th className="p-2 text-center font-bold text-white">Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-800">
                                            {tournamentTeams
                                                .filter(t => (t.group || "A") === group)
                                                .sort((a, b) => b.points - a.points)
                                                .map((t, i) => (
                                                    <tr key={t.id} className="hover:bg-neutral-800/30">
                                                        <td className="p-2 font-medium flex items-center gap-2">
                                                            <span className="text-neutral-500 w-4">{i + 1}.</span> {t.name}
                                                        </td>
                                                        <td className="p-2 text-center text-neutral-400">{t.played}</td>
                                                        <td className="p-2 text-center text-green-400">{t.won}</td>
                                                        <td className="p-2 text-center text-red-400">{t.lost}</td>
                                                        <td className="p-2 text-center font-bold text-yellow-400">{t.points}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                    {tournamentTeams.filter(t => (t.group || "A") === group).length === 0 && (
                                        <div className="text-center text-neutral-500 italic py-2">No teams in this group.</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Schedule */}
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4 text-green-400">Match Schedule</h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {tournamentMatches.map((m, i) => {
                                const teamA = tournamentTeams.find(t => t.id === m.teamAId);
                                const teamB = tournamentTeams.find(t => t.id === m.teamBId);
                                return (
                                    <div key={m.id} className={`p-4 rounded-xl border ${m.completed ? 'bg-neutral-900 border-neutral-800 opacity-70' : 'bg-neutral-800 border-neutral-700'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-neutral-500 text-xs">Match {i + 1}</span>
                                            {m.completed && <span className="text-xs font-bold text-green-500">Completed</span>}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="font-bold">{teamA?.name} <span className="text-neutral-500 font-normal">vs</span> {teamB?.name}</div>
                                            {m.completed ? (
                                                <div className="text-xs text-yellow-400 font-bold">{m.result}</div>
                                            ) : (
                                                <button
                                                    onClick={() => startTournamentMatch(m.id)}
                                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-colors"
                                                >
                                                    Play
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    if (gameState === "history") {
        if (selectedMatch) {
            // Detailed Scorecard View
            // Detailed Scorecard View
            // No longer deriving 'battingTeam' and 'bowlingTeam' like before.
            // We now display full stats for selectedMatch.teamA and selectedMatch.teamB

            return (
                <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto">
                    <div className="w-full flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
                        <button onClick={() => setSelectedMatch(null)} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
                            &larr; Back to List
                        </button>
                        <h1 className="text-xl font-bold text-center">Match Details</h1>
                        <div className="w-20"></div> {/* Spacer */}
                    </div>

                    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6">
                        <div className="text-center mb-4">
                            <div className="text-sm text-neutral-500">{selectedMatch.date}</div>
                            <div className="text-2xl font-bold mt-2">{selectedMatch.teamA.name} vs {selectedMatch.teamB.name}</div>
                            <div className="text-blue-400 font-mono mt-1 text-lg">{selectedMatch.result}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center text-sm text-neutral-400 bg-neutral-950/50 p-4 rounded-xl">
                            <div>
                                <div className="font-bold text-white mb-1">Total Runs</div>
                                {selectedMatch.runs}/{selectedMatch.wickets}
                            </div>
                            <div>
                                <div className="font-bold text-white mb-1">Overs</div>
                                {selectedMatch.overs}
                            </div>
                            <div>
                                <div className="font-bold text-white mb-1">Extras</div>
                                {selectedMatch.extras ? (selectedMatch.extras.w + selectedMatch.extras.nb + selectedMatch.extras.lb + selectedMatch.extras.b) : 0}
                            </div>
                        </div>
                    </div>

                    {/* Team A Stats */}
                    <div className="w-full mb-8">
                        <h2 className="text-xl font-bold mb-4 text-blue-400 border-b border-blue-500/30 pb-2">{selectedMatch.teamA.name}</h2>

                        {/* Team A Batting */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wider">Batting</h3>
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-800 text-neutral-400">
                                        <tr>
                                            <th className="p-3">Batsman</th>
                                            <th className="p-3 text-right">R</th>
                                            <th className="p-3 text-right">B</th>
                                            <th className="p-3 text-right hidden md:table-cell">4s</th>
                                            <th className="p-3 text-right hidden md:table-cell">6s</th>
                                            <th className="p-3 text-right">SR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800">
                                        {selectedMatch.teamA.players.filter(p => p.balls > 0 || p.out).map(p => (
                                            <tr key={p.id} className="hover:bg-neutral-800/50">
                                                <td className="p-3 font-medium">{p.name} {p.out ? <span className="text-red-400 text-xs ml-1">(out)</span> : <span className="text-green-400 text-xs ml-1">*</span>}</td>
                                                <td className="p-3 text-right font-bold text-white">{p.runs}</td>
                                                <td className="p-3 text-right text-neutral-400">{p.balls}</td>
                                                <td className="p-3 text-right hidden md:table-cell text-neutral-500">{p.fours}</td>
                                                <td className="p-3 text-right hidden md:table-cell text-neutral-500">{p.sixes}</td>
                                                <td className="p-3 text-right text-neutral-500">{(p.balls > 0 ? (p.runs / p.balls * 100).toFixed(1) : "0.0")}</td>
                                            </tr>
                                        ))}
                                        {selectedMatch.teamA.players.every(p => p.balls === 0 && !p.out) && (
                                            <tr><td colSpan={6} className="p-4 text-center text-neutral-500 italic">No batting stats.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Team A Bowling */}
                        <div>
                            <h3 className="text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wider">Bowling</h3>
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-800 text-neutral-400">
                                        <tr>
                                            <th className="p-3">Bowler</th>
                                            <th className="p-3 text-right">O</th>
                                            <th className="p-3 text-right">M</th>
                                            <th className="p-3 text-right">R</th>
                                            <th className="p-3 text-right">W</th>
                                            <th className="p-3 text-right">Econ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800">
                                        {selectedMatch.teamA.players.filter(p => p.bowling.overs > 0).map(p => (
                                            <tr key={p.id} className="hover:bg-neutral-800/50">
                                                <td className="p-3 font-medium">{p.name}</td>
                                                <td className="p-3 text-right text-white">{p.bowling.overs.toFixed(1)}</td>
                                                <td className="p-3 text-right text-neutral-500">{p.bowling.maidens}</td>
                                                <td className="p-3 text-right text-neutral-400">{p.bowling.runs}</td>
                                                <td className="p-3 text-right font-bold text-white">{p.bowling.wickets}</td>
                                                <td className="p-3 text-right text-neutral-500">{(p.bowling.overs > 0 ? (p.bowling.runs / p.bowling.overs).toFixed(1) : "0.0")}</td>
                                            </tr>
                                        ))}
                                        {selectedMatch.teamA.players.every(p => p.bowling.overs === 0) && (
                                            <tr><td colSpan={6} className="p-4 text-center text-neutral-500 italic">No bowling stats.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Team B Stats */}
                    <div className="w-full">
                        <h2 className="text-xl font-bold mb-4 text-green-400 border-b border-green-500/30 pb-2">{selectedMatch.teamB.name}</h2>

                        {/* Team B Batting */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wider">Batting</h3>
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-800 text-neutral-400">
                                        <tr>
                                            <th className="p-3">Batsman</th>
                                            <th className="p-3 text-right">R</th>
                                            <th className="p-3 text-right">B</th>
                                            <th className="p-3 text-right hidden md:table-cell">4s</th>
                                            <th className="p-3 text-right hidden md:table-cell">6s</th>
                                            <th className="p-3 text-right">SR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800">
                                        {selectedMatch.teamB.players.filter(p => p.balls > 0 || p.out).map(p => (
                                            <tr key={p.id} className="hover:bg-neutral-800/50">
                                                <td className="p-3 font-medium">{p.name} {p.out ? <span className="text-red-400 text-xs ml-1">(out)</span> : <span className="text-green-400 text-xs ml-1">*</span>}</td>
                                                <td className="p-3 text-right font-bold text-white">{p.runs}</td>
                                                <td className="p-3 text-right text-neutral-400">{p.balls}</td>
                                                <td className="p-3 text-right hidden md:table-cell text-neutral-500">{p.fours}</td>
                                                <td className="p-3 text-right hidden md:table-cell text-neutral-500">{p.sixes}</td>
                                                <td className="p-3 text-right text-neutral-500">{(p.balls > 0 ? (p.runs / p.balls * 100).toFixed(1) : "0.0")}</td>
                                            </tr>
                                        ))}
                                        {selectedMatch.teamB.players.every(p => p.balls === 0 && !p.out) && (
                                            <tr><td colSpan={6} className="p-4 text-center text-neutral-500 italic">No batting stats.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Team B Bowling */}
                        <div>
                            <h3 className="text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wider">Bowling</h3>
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-800 text-neutral-400">
                                        <tr>
                                            <th className="p-3">Bowler</th>
                                            <th className="p-3 text-right">O</th>
                                            <th className="p-3 text-right">M</th>
                                            <th className="p-3 text-right">R</th>
                                            <th className="p-3 text-right">W</th>
                                            <th className="p-3 text-right">Econ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800">
                                        {selectedMatch.teamB.players.filter(p => p.bowling.overs > 0).map(p => (
                                            <tr key={p.id} className="hover:bg-neutral-800/50">
                                                <td className="p-3 font-medium">{p.name}</td>
                                                <td className="p-3 text-right text-white">{p.bowling.overs.toFixed(1)}</td>
                                                <td className="p-3 text-right text-neutral-500">{p.bowling.maidens}</td>
                                                <td className="p-3 text-right text-neutral-400">{p.bowling.runs}</td>
                                                <td className="p-3 text-right font-bold text-white">{p.bowling.wickets}</td>
                                                <td className="p-3 text-right text-neutral-500">{(p.bowling.overs > 0 ? (p.bowling.runs / p.bowling.overs).toFixed(1) : "0.0")}</td>
                                            </tr>
                                        ))}
                                        {selectedMatch.teamB.players.every(p => p.bowling.overs === 0) && (
                                            <tr><td colSpan={6} className="p-4 text-center text-neutral-500 italic">No bowling stats.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto">
                <div className="w-full flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Match History</h1>
                    <button onClick={() => setGameState("setup")} className="text-neutral-400 hover:text-white">Back to Setup</button>
                </div>

                <div className="w-full space-y-4">
                    {matchHistory.length === 0 ? (
                        <div className="text-neutral-600 text-center py-12">No match history yet.</div>
                    ) : (
                        matchHistory.map(match => (
                            <div key={match.id} onClick={() => setSelectedMatch(match)} className="cursor-pointer bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 flex justify-between items-center hover:bg-neutral-800 hover:border-neutral-700 transition-all group">
                                <div>
                                    <div className="text-xs text-neutral-500 mb-1">{match.date}</div>
                                    <div className="font-bold text-lg mb-1 group-hover:text-blue-300 transition-colors">{typeof match.teamA === 'string' ? match.teamA : match.teamA.name} vs {typeof match.teamB === 'string' ? match.teamB : match.teamB.name}</div>
                                    <div className="text-neutral-400 font-mono text-sm">{match.result}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-neutral-600 group-hover:text-neutral-400">Click for details</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteMatch(match.id); }}
                                        className="p-2 text-red-500/50 hover:text-red-500 hover:bg-neutral-700 rounded-lg transition-all"
                                        title="Delete Record"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    if (gameState === "toss") {
        // ... (Toss UI same) ...
        return (
            <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 relative">
                <div className="absolute top-4 left-4">
                    <Link href="/" className="text-neutral-400 hover:text-white flex items-center gap-2 text-sm border border-neutral-800 px-4 py-2 rounded-lg hover:bg-neutral-900 transition-colors">
                        <ChevronLeft size={16} /> Back to Home
                    </Link>
                </div>
                <h1 className="text-4xl font-bold mb-12 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                    Toss Time!
                </h1>

                <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-2xl w-full text-center">
                    <h2 className="text-2xl font-semibold mb-6">Who won the toss?</h2>

                    <div className="grid grid-cols-2 gap-4 mb-12">
                        <button onClick={() => handleToss("A", "bat")} className="group p-6 rounded-2xl bg-blue-900/20 border border-blue-500/50 hover:bg-blue-900/40 transition-all">
                            <div className="text-xl font-bold text-blue-400 mb-2">{teamAName}</div>
                            <div className="text-sm text-neutral-400 group-hover:text-white">Won & Chose to <span className="font-bold text-white">BAT</span></div>
                        </button>
                        <button onClick={() => handleToss("A", "bowl")} className="group p-6 rounded-2xl bg-blue-900/20 border border-blue-500/50 hover:bg-blue-900/40 transition-all">
                            <div className="text-xl font-bold text-blue-400 mb-2">{teamAName}</div>
                            <div className="text-sm text-neutral-400 group-hover:text-white">Won & Chose to <span className="font-bold text-white">BOWL</span></div>
                        </button>

                        <button onClick={() => handleToss("B", "bat")} className="group p-6 rounded-2xl bg-green-900/20 border border-green-500/50 hover:bg-green-900/40 transition-all">
                            <div className="text-xl font-bold text-green-400 mb-2">{teamBName}</div>
                            <div className="text-sm text-neutral-400 group-hover:text-white">Won & Chose to <span className="font-bold text-white">BAT</span></div>
                        </button>
                        <button onClick={() => handleToss("B", "bowl")} className="group p-6 rounded-2xl bg-green-900/20 border border-green-500/50 hover:bg-green-900/40 transition-all">
                            <div className="text-xl font-bold text-green-400 mb-2">{teamBName}</div>
                            <div className="text-sm text-neutral-400 group-hover:text-white">Won & Chose to <span className="font-bold text-white">BOWL</span></div>
                        </button>
                    </div>

                    <p className="text-neutral-500 text-sm">Tap the option corresponding to the toss result.</p>
                </div>
            </div>
        );
    }

    if (gameState === "break") {
        return (
            <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
                <div className="text-4xl font-bold text-yellow-400 mb-8 animate-pulse">Innings Break</div>
                <div className="text-2xl mb-4">Target: <span className="font-bold text-white">{targetRuns}</span></div>

                <div className="w-64 h-64 rounded-full border-4 border-blue-500 flex items-center justify-center mb-8 relative">
                    <div className="text-6xl font-black font-mono">
                        {Math.floor(breakTimeLeft / 60)}:{(breakTimeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="absolute inset-0 rounded-full border-t-4 border-transparent border-t-blue-300 animate-spin" style={{ animationDuration: '2s' }}></div>
                </div>

                <button
                    onClick={() => setGameState("playing")}
                    className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
                >
                    Start 2nd Innings Now
                </button>
            </div>
        );
    }

    // --- Playing View ---
    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center">
            {/* ... (Header same) ... */}
            <div className="w-full p-4 flex justify-between items-center bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50 border-b border-neutral-800">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 hover:text-white hover:opacity-80 transition-opacity">
                    <ChevronLeft size={20} className="text-blue-500" /> &larr; SportsBoard
                </Link>
                <div className="text-sm font-mono text-neutral-400">
                    {currentBattingTeam.name} Batting {innings === 2 && targetRuns && <span className="text-yellow-400 ml-2">(Target: {targetRuns})</span>}
                </div>
                <div className="flex gap-2">
                    <button onClick={saveMatch} className="px-3 py-1 bg-red-600/20 hover:bg-red-600 border border-red-500/50 text-red-200 hover:text-white rounded-lg text-xs font-bold transition-all">
                        End Match
                    </button>
                    <button onClick={() => setIsAdmin(!isAdmin)} className="p-2 rounded-full hover:bg-neutral-800 transition-colors">
                        {isAdmin ? <Monitor size={20} className="text-green-400" /> : <Settings size={20} className="text-neutral-400" />}
                    </button>
                </div>
            </div>

            <main className="flex-1 w-full max-w-lg flex flex-col p-4 gap-4 pb-24">
                {/* Celebration Overlay */}
                <AnimatePresence>
                    {celebration && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 2, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none"
                        >
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-center"
                            >
                                <div className={cn(
                                    "text-9xl font-black drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]",
                                    celebration === "4" ? "text-yellow-400" :
                                        celebration === "6" ? "text-purple-500" : "text-red-500"
                                )}>
                                    {celebration === "4" ? "FOUR!" : celebration === "6" ? "SIX!" : "WICKET!"}
                                </div>
                                <div className="text-3xl font-bold text-white mt-4 tracking-widest uppercase">
                                    {celebration === "4" ? "Outstanding Shot!" : celebration === "6" ? "Maximum!" : "Clean Bowled!"}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Score Card */}
                <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 p-6 rounded-3xl relative overflow-hidden text-center">
                    <div className="text-sm uppercase tracking-widest text-blue-300/60 mb-1">{currentBattingTeam.name}</div>
                    <div className="text-7xl font-black text-white leading-none mb-2">
                        {totalRuns}/{totalWickets}
                    </div>
                    <div className="text-2xl font-mono text-blue-200">
                        Overs: <span className="text-white">{overs}.{ballsInOver}</span>
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-xs text-neutral-400">
                        <span>CRR: {(totalBalls > 0 ? (totalRuns / (totalBalls / 6)) : 0).toFixed(2)}</span>
                        <span>Extras: {extras.w + extras.nb + extras.lb + extras.b}</span>
                    </div>
                </div>

                {/* Batting Card */}
                <div className="bg-neutral-900/50 rounded-2xl border border-neutral-800 p-4">
                    <div className="flex justify-between items-center mb-2 text-xs text-neutral-500 uppercase font-semibold">
                        <span>Batsman</span>
                        <span>R (B)</span>
                    </div>
                    {/* Striker */}
                    <div onClick={() => !strikerId && console.log("Select Striker")} className={cn("flex justify-between items-center p-3 rounded-xl mb-2 border transition-all cursor-pointer", strikerId ? "bg-blue-500/20 border-blue-500/50" : "bg-red-500/10 border-red-500/30 animate-pulse")}>
                        <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-black text-lg">*</span>
                            {strikerId ? (
                                <div>
                                    <div className="font-bold text-lg">{striker?.name}</div>
                                    <div className="text-xs text-blue-200">4s: {striker?.fours} | 6s: {striker?.sixes}</div>
                                </div>
                            ) : (
                                <div className="text-red-300 italic">Select Striker...</div>
                            )}
                        </div>
                        <div className="text-xl font-mono font-bold">{striker?.runs ?? 0} <span className="text-sm opacity-50">({striker?.balls ?? 0})</span></div>
                    </div>

                    {/* Non-Striker */}
                    <div className={cn("flex justify-between items-center p-3 rounded-xl border border-transparent", nonStrikerId ? "bg-neutral-800" : "bg-red-500/10 border-red-500/30 animate-pulse")}>
                        <div className="flex items-center gap-2">
                            {nonStrikerId ? (
                                <div className="font-bold text-neutral-300">{nonStriker?.name}</div>
                            ) : (
                                <div className="text-red-300 italic">Select Non-Striker...</div>
                            )}
                        </div>
                        <div className="text-xl font-mono text-neutral-500">{nonStriker?.runs ?? 0} <span className="text-sm opacity-50">({nonStriker?.balls ?? 0})</span></div>
                    </div>

                    {/* Swap Button */}
                    {isAdmin && (
                        <button onClick={swapStriker} className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-colors text-sm">
                            <ArrowLeftRight size={14} /> Swap Ends
                        </button>
                    )}
                </div>

                {/* Bowling Card */}
                <div className="bg-neutral-900/50 rounded-2xl border border-neutral-800 p-4">
                    <div className="flex justify-between items-center mb-2 text-xs text-neutral-500 uppercase font-semibold">
                        <span>Bowler</span>
                        <span>This Over: {thisOverRuns}</span>
                    </div>
                    <div className={cn("flex justify-between items-center p-3 rounded-xl border cursor-pointer", bowlerId ? "bg-neutral-800 border-neutral-700" : "bg-yellow-500/10 border-yellow-500/30 animate-pulse")}>
                        {bowlerId ? (
                            <>
                                <div className="font-bold text-neutral-200">{bowler?.name}</div>
                                <div className="text-sm font-mono text-neutral-400">
                                    {bowler?.bowling.wickets}-{bowler?.bowling.runs} <span className="text-xs ml-1">({(bowler?.bowling.overs || 0).toFixed(1)})</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-yellow-500 italic w-full text-center">Select New Bowler</div>
                        )}
                    </div>

                    {/* Bowler Selection List */}
                    {!bowlerId && (
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                            {currentBowlingTeam.players.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setBowlerId(p.id)}
                                    disabled={p.id === lastOverBowlerId}
                                    className={cn(
                                        "px-3 py-1 rounded-lg text-sm whitespace-nowrap border transition-colors",
                                        p.id === lastOverBowlerId
                                            ? "bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed opacity-50"
                                            : "bg-neutral-800 hover:bg-neutral-700 border-neutral-700"
                                    )}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Current Over Balls */}
                <div className="flex gap-2 justify-center py-2 h-12">
                    <AnimatePresence>
                        {currentOver.map((ball, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0, y: 10 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0 }}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shadow-lg",
                                    ball === "W" ? "bg-red-500 text-white border-red-400" :
                                        ball === "4" || ball === "6" ? "bg-green-500 text-white border-green-400" :
                                            "bg-neutral-800 border-neutral-700 text-neutral-300"
                                )}
                            >
                                {ball}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Controls */}
                {isAdmin && (
                    <div className="grid grid-cols-4 gap-3">
                        <ActionButton label="0" onClick={() => handleBall(0)} color="bg-neutral-800 text-neutral-400" disabled={!strikerId || !bowlerId} />
                        <ActionButton label="1" onClick={() => handleBall(1)} disabled={!strikerId || !bowlerId} />
                        <ActionButton label="2" onClick={() => handleBall(2)} disabled={!strikerId || !bowlerId} />
                        <ActionButton label="3" onClick={() => handleBall(3)} disabled={!strikerId || !bowlerId} />
                        <ActionButton label="4" onClick={() => handleBall(4)} color="bg-green-600" disabled={!strikerId || !bowlerId} />
                        <ActionButton label="6" onClick={() => handleBall(6)} color="bg-purple-600" disabled={!strikerId || !bowlerId} />
                        <ActionButton label="W" onClick={() => handleBall("W")} color="bg-red-600" disabled={!strikerId || !bowlerId} />
                        <div className="grid grid-rows-2 gap-2">
                            <button onClick={() => handleBall("WD")} disabled={!strikerId || !bowlerId} className="bg-orange-600/50 hover:bg-orange-600 rounded-lg font-bold text-white text-xs">WD</button>
                            <button onClick={() => handleBall("NB")} disabled={!strikerId || !bowlerId} className="bg-orange-600/50 hover:bg-orange-600 rounded-lg font-bold text-white text-xs">NB</button>
                        </div>
                    </div>
                )}

                {/* Missing Batsman Selection Overlay */}
                {(!strikerId || !nonStrikerId) && gameState === "playing" && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold mb-4">Select {strikerId ? "Non-Striker" : "Striker"}</h2>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md max-h-[60vh] overflow-y-auto">
                            {currentBattingTeam.players.filter(p => p.id !== strikerId && p.id !== nonStrikerId && !p.out).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => selectBatsman(p.id)}
                                    className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 hover:border-blue-500 hover:bg-neutral-700 text-left"
                                >
                                    <div className="font-bold text-lg">{p.name}</div>
                                    <div className="text-xs text-neutral-500">Runs: {p.runs}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
