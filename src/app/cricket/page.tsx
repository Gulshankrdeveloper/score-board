"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, RotateCcw, Monitor, UserPlus, Users, ArrowLeftRight, Play, Trash2, ChevronLeft, Bell, Calendar, Clock, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";



import { fetchLiveMatches, fetchMatchScorecard, ApiMatch, ApiMatchScorecard } from "@/services/cricket-api";
import { MatchSummaryCard } from "@/components/MatchSummaryCard";
import { useAudioCommentary } from "@/hooks/useAudioCommentary";
import { toPng } from 'html-to-image';
import { useRef } from "react";
import { Share2, Download, Volume2, VolumeX } from "lucide-react";

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
    nrr: number;
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

type GameStateSnapshot = {
    teamA: Team;
    teamB: Team;
    totalRuns: number;
    totalWickets: number;
    totalBalls: number;
    extras: { w: number; nb: number; b: number; lb: number };
    currentOver: string[];
    thisOverRuns: number;
    strikerId: string | null;
    nonStrikerId: string | null;
    bowlerId: string | null;
    lastOverBowlerId: string | null;
    battingTeam: "A" | "B";
    innings: 1 | 2;
    targetRuns: number | null;
    tournamentTeams: TournamentTeam[];
    matchHistory: MatchRecord[];
};

type CelebrationType = "4" | "6" | "W" | null;

type GameState = "setup" | "toss" | "playing" | "history" | "break" | "tournament-setup" | "tournament-dashboard";
type UserRole = "scorer" | "viewer" | null;
type ViewMode = "dashboard" | "match";

// --- Components ---
const ActionButton = ({ onClick, label, color = "bg-blue-600", disabled = false }: { onClick: () => void; label: string | number | React.ReactNode; color?: string; disabled?: boolean }) => (
    <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "h-10 w-full rounded-lg text-lg font-bold text-white shadow-lg transition-all hover:brightness-110 flex items-center justify-center", // Reduced height to h-10, rounded-lg
            color,
            disabled && "opacity-50 cursor-not-allowed grayscale"
        )}
    >
        {label}
    </motion.button>
);

import LoginModal from "@/components/LoginModal";

export default function CricketPage() {
    // --- Game Config State ---
    const [gameState, setGameState] = useState<GameState>("setup");

    // --- Role & Flow State ---
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

    const handleRoleSelect = (role: UserRole) => {
        if (role === 'scorer') {
            setShowLoginModal(true);
        } else {
            setUserRole('viewer');
            setIsAdmin(false);
            setViewMode('dashboard');
        }
    };

    const handleAdminLogin = () => {
        setUserRole('scorer');
        setIsAdmin(true);
        setViewMode('match');
        setShowLoginModal(false);
    };


    // History State
    const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);

    // Celebration State
    const [celebration, setCelebration] = useState<CelebrationType>(null);

    // Admin State
    const [isAdmin, setIsAdmin] = useState(true);

    // --- Tournament State ---
    const [tournamentTeams, setTournamentTeams] = useState<TournamentTeam[]>([]);
    const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>([]);
    const [activeTournamentMatchId, setActiveTournamentMatchId] = useState<string | null>(null);
    const [tournamentName, setTournamentName] = useState("My Tournament");
    const [tempTournamentTeamName, setTempTournamentTeamName] = useState("");
    const [tempTournamentGroup, setTempTournamentGroup] = useState("A");

    // --- API Integration State ---
    const [activeTab, setActiveTab] = useState<'local' | 'global'>('local');
    const [activeSubTab, setActiveSubTab] = useState<'live' | 'upcoming' | 'completed'>('live');
    const [globalMatches, setGlobalMatches] = useState<ApiMatch[]>([]);

    // Global Match Details State
    const [selectedGlobalMatch, setSelectedGlobalMatch] = useState<ApiMatch | null>(null);
    const [globalMatchDetails, setGlobalMatchDetails] = useState<ApiMatchScorecard | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        const loadGlobalMatches = async () => {
            const data = await fetchLiveMatches();
            setGlobalMatches(data);
        };
        loadGlobalMatches();
    }, []);



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

    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const summaryCardRef = useRef<HTMLDivElement>(null);
    const { speak, isMuted, toggleMute } = useAudioCommentary();

    // --- Match Conclusion State ---
    const [showMatchResultModal, setShowMatchResultModal] = useState(false);
    const [matchResultText, setMatchResultText] = useState("");

    const handleDownloadSummary = async () => {
        if (summaryCardRef.current === null) {
            return;
        }

        try {
            const dataUrl = await toPng(summaryCardRef.current, { cacheBust: true, });
            const link = document.createElement('a');
            link.download = `match-summary-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error(err);
        }
    };

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

    // Undo State
    const [undoStack, setUndoStack] = useState<GameStateSnapshot[]>([]);



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
                } else {
                    winnerId = currentBowlingTeam.name === teamA.name ? match.teamAId : match.teamBId;
                }

                match.winnerId = winnerId;
                match.result = winnerId === match.teamAId ? `${teamA.name} Won` : `${teamB.name} Won`;
                setTournamentMatches(updatedMatches);

                // Update Points Table
                const winner = winnerId === match.teamAId ? 'A' : 'B'; // Determine winner based on match.winnerId
                const winnerTeamName = winner === 'A' ? teamA.name : teamB.name; // Storing Name for simplicity in history, but ID for tourney
                // Note: In tourney mode, we need IDs. For now, assuming names map to IDs or we use names.
                // Better: Find team objects in tournamentTeams

                if (activeTournamentMatchId) { // If tournament is active
                    const teamAObj = tournamentTeams.find(t => t.id === match.teamAId);
                    const teamBObj = tournamentTeams.find(t => t.id === match.teamBId);

                    if (teamAObj && teamBObj) {
                        // Update Stats for NRR
                        // This is complex to track perfectly without full match state.
                        // Simplified: We update simply based on this match result if we had full 2nd innings score.
                        // For now, let's just update Runs Scored and Overs Faced for the Batting Team.
                        // And Runs Conceded and Overs Bowled for the Bowling Team.

                        // But wait, this is only ONE innings. A match has 2 innings.
                        // We need to handle this ONLY at the END of the match.
                        // Ideally, we persist specific match stats.
                        // Simplified NRR for this prototype:
                        // Just += points.
                    }

                    const updatedTeams = tournamentTeams.map(team => {
                        if (team.id === winnerId) {
                            return { ...team, played: team.played + 1, won: team.won + 1, points: team.points + 2 };
                        } else if (team.id === match.teamAId || team.id === match.teamBId) {
                            // This team played but didn't win
                            return { ...team, played: team.played + 1, lost: team.lost + 1 };
                        }
                        return team;
                    });

                    // Recalculate NRR if we had the data.
                    // For now, sticking to Points.
                    setTournamentTeams(updatedTeams);
                }
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

    const markStrikerOut = () => {
        if (!strikerId) return;
        const teamSetter = battingTeam === "A" ? setTeamA : setTeamB;
        teamSetter(prev => ({
            ...prev,
            players: prev.players.map(p => p.id === strikerId ? { ...p, out: true } : p)
        }));
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
                        balls: p.balls + 1,
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
        const teamSetter = battingTeam === "A" ? setTeamB : setTeamA;

        teamSetter(prev => ({
            ...prev,
            players: prev.players.map(p => {
                if (p.id === bowlerId) {
                    return {
                        ...p,
                        bowling: {
                            ...p.bowling,
                            runs: p.bowling.runs + runsConceded,
                            wickets: isWicket ? p.bowling.wickets + 1 : p.bowling.wickets,
                            overs: isValidBall && (p.bowling.overs * 6 + 1) % 6 === 0 ? p.bowling.overs + 1 : p.bowling.overs + (isValidBall ? 0.1 : 0)
                        }
                    };
                }
                return p;
            })
        }));
    };

    const saveState = () => {
        const snapshot: GameStateSnapshot = {
            teamA,
            teamB,
            totalRuns,
            totalWickets,
            totalBalls,
            extras,
            currentOver,
            thisOverRuns,
            strikerId,
            nonStrikerId,
            bowlerId,
            lastOverBowlerId,
            battingTeam,
            innings,
            targetRuns,
            tournamentTeams,
            matchHistory
        };
        setUndoStack(prev => [...prev, snapshot]);
    };

    const undoLastBall = () => {
        if (undoStack.length === 0) return;
        const previousState = undoStack[undoStack.length - 1];

        setTeamA(previousState.teamA);
        setTeamB(previousState.teamB);
        setTotalRuns(previousState.totalRuns);
        setTotalWickets(previousState.totalWickets);
        setTotalBalls(previousState.totalBalls);
        setExtras(previousState.extras);
        setCurrentOver(previousState.currentOver);
        setThisOverRuns(previousState.thisOverRuns);
        setStrikerId(previousState.strikerId);
        setNonStrikerId(previousState.nonStrikerId);
        setBowlerId(previousState.bowlerId);
        setLastOverBowlerId(previousState.lastOverBowlerId);
        setBattingTeam(previousState.battingTeam);
        setInnings(previousState.innings);
        setTargetRuns(previousState.targetRuns);
        setTournamentTeams(previousState.tournamentTeams);
        setMatchHistory(previousState.matchHistory);

        setUndoStack(prev => prev.slice(0, -1));
    };

    const handleBall = (runs: number | string) => {
        saveState(); // Save state before modifying
        let runVal = 0;
        // let isExtra = false; // Unused in this simplified logic, but kept for context if needed later
        let isWicket = false;
        let isValidBall = true;
        let shouldEndInnings = false;

        if (typeof runs === 'number') {
            runVal = runs;
            updateBatsmanScore(runs);
            updateBowlerStats(runs, false, true);
            if (runs === 4) {
                setCelebration("4");
                speak("Four runs! Magnificent shot!");
            }
            if (runs === 6) {
                setCelebration("6");
                speak("Six runs! That is huge!");
            }
            if (runs === 0) {
                speak("No run.");
            } else if (runs === 1) {
                speak("Single.");
            } else if (runs === 2) {
                speak("Two runs.");
            } else if (runs === 3) {
                speak("Three runs.");
            }
        } else {
            // Specials
            if (runs === "W") { // Wicket
                isWicket = true;
                setCelebration("W");
                speak("Wicket! What a delivery!");
                setTotalWickets(w => w + 1);
                updateBatsmanScore(0); // Ball faced, 0 runs
                markStrikerOut();
                updateBowlerStats(0, true, true);

                if (totalWickets + 1 >= 10) { // 10 wickets = All Out in 11 player team
                    shouldEndInnings = true;
                    if (innings === 1) {
                        setTimeout(startInningsBreak, 2000);
                        speak("All out! End of first innings.");
                    } else {
                        // End Match logic here if needed, currently manual "End Match"
                        alert("All Out! End of Match.");
                        speak("All out! End of match.");
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
                speak(runs === "WD" ? "Wide ball!" : "No ball!");
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
                const resultMsg = `Match Won by ${currentBattingTeam.name}!`;
                speak(`${currentBattingTeam.name} won the match!`);
                setMatchResultText(resultMsg);
                setShowMatchResultModal(true);
                return;
            }

            if (isOverComplete && !shouldEndInnings) {
                // End of over logic

                // Check Max Overs
                if (nextOvers >= totalOvers) {
                    if (innings === 1) {
                        setTimeout(startInningsBreak, 2000);
                        speak("End of first innings!");
                        return;
                    } else {
                        const resultMsg = "Innings Complete! End of Match.";
                        speak("End of match!");
                        setMatchResultText(resultMsg);
                        setShowMatchResultModal(true);
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

                    speak(`End of over. ${currentBattingTeam.name} score is ${totalRuns} for ${totalWickets}.`);

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

    // --- Role Selection View ---
    if (!userRole) {
        return (
            <div className="h-dvh bg-neutral-950 text-white flex flex-col items-center justify-center p-6 gap-6">
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">SportsBoard</h1>
                    <p className="text-neutral-400">Select your role to continue</p>
                </div>

                <div className="grid gap-4 w-full max-w-md">
                    <button
                        onClick={() => handleRoleSelect('viewer')}
                        className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex items-center gap-4 hover:bg-neutral-800 hover:border-blue-500/50 transition-all group text-left"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-900/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-lg text-white">I am a Viewer</div>
                            <div className="text-sm text-neutral-500">Check live scores, upcoming matches, and results.</div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleRoleSelect('scorer')}
                        className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex items-center gap-4 hover:bg-neutral-800 hover:border-green-500/50 transition-all group text-left"
                    >
                        <div className="w-12 h-12 rounded-full bg-green-900/20 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Settings size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-lg text-white">I am a Scorer</div>
                            <div className="text-sm text-neutral-500">Manage matches, update scores, and control the game.</div>
                        </div>
                    </button>
                </div>

                <LoginModal
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                    onLogin={handleAdminLogin}
                />
            </div>
        );
    }

    // --- Viewer Dashboard View ---
    if (userRole === 'viewer' && viewMode === 'dashboard') {
        return (
            <div className="h-dvh bg-neutral-950 text-white flex flex-col">
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="font-bold text-xl">Dashboard</div>
                    <button onClick={() => setUserRole(null)} className="text-xs text-neutral-500 hover:text-white">Switch Role</button>
                </div>

                {/* Main Tab Switcher */}
                <div className="px-4 pt-4 pb-2">
                    <div className="flex p-1 bg-neutral-900 rounded-xl border border-neutral-800">
                        <button
                            onClick={() => { setActiveTab('local'); setActiveSubTab('live'); }}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                activeTab === 'local' ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            Local Matches
                        </button>
                        <button
                            onClick={() => { setActiveTab('global'); setActiveSubTab('live'); }}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                activeTab === 'global' ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            International
                        </button>
                    </div>
                </div>

                {/* Sub-Tab Switcher (Live / Upcoming / Results) */}
                <div className="px-4 pb-4">
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-1">
                        {['live', 'upcoming', 'completed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveSubTab(tab as any)}
                                className={cn(
                                    "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all relative",
                                    activeSubTab === tab ? "text-blue-400" : "text-neutral-500 hover:text-neutral-300"
                                )}
                            >
                                {tab === 'completed' ? 'Results' : tab}
                                {activeSubTab === tab && (
                                    <motion.div
                                        layoutId="activeSubTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area with Sliding Animation */}
                <div className="flex-1 overflow-y-auto px-4 pb-20 overflow-x-hidden relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${activeTab}-${activeSubTab}`}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {/* --- GLOBAL (INTERNATIONAL) MATCHES --- */}
                            {activeTab === 'global' && (
                                <>
                                    {/* Demo Warning (Show only once at top if needed, or in Live tab) */}
                                    {activeSubTab === 'live' && globalMatches.some(m => m.isMock) && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 flex items-center justify-center gap-2 mb-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                                            <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest text-center">
                                                Demo Data • Add API Key for Real Matches
                                            </div>
                                        </div>
                                    )}

                                    {/* Filter Global Matches */}
                                    {(() => {
                                        const filteredMatches = globalMatches.filter(m => {
                                            if (activeSubTab === 'live') return m.status === 'Live';
                                            if (activeSubTab === 'upcoming') return m.status === 'Upcoming';
                                            if (activeSubTab === 'completed') return m.status === 'Completed' || m.status.includes('Result');
                                            return false;
                                        });

                                        if (filteredMatches.length === 0) {
                                            return (
                                                <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                                                    <div className="bg-neutral-900 p-4 rounded-full mb-4 opacity-50"><Calendar size={24} /></div>
                                                    <p className="text-sm">No {activeSubTab} international matches found.</p>
                                                </div>
                                            );
                                        }

                                        return filteredMatches.map(match => (
                                            <div
                                                key={match.id}
                                                onClick={async () => {
                                                    setSelectedGlobalMatch(match);
                                                    setIsLoadingDetails(true);
                                                    setGlobalMatchDetails(null);
                                                    const details = await fetchMatchScorecard(match.id);
                                                    setGlobalMatchDetails(details);
                                                    setIsLoadingDetails(false);
                                                }}
                                                className="bg-[#0f0f0f] border border-neutral-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group cursor-pointer hover:border-neutral-700 transition-colors"
                                            >
                                                {match.status === 'Live' && (
                                                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl -mr-5 -mt-5 pointer-events-none animate-pulse"></div>
                                                )}

                                                <div className="flex justify-between items-start mb-4 relative">
                                                    <div className="flex items-center gap-2">
                                                        {match.status === 'Live' ? (
                                                            <span className="bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> LIVE
                                                            </span>
                                                        ) : (
                                                            <span className="bg-neutral-800 text-neutral-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-neutral-700">
                                                                {match.status.toUpperCase()}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-neutral-500 truncate max-w-[150px]">{match.series}</span>
                                                    </div>
                                                    {match.startTime && <div className="text-xs text-blue-400 font-bold">{match.startTime.split('T')[0]}</div>}
                                                </div>

                                                <div className="flex flex-col gap-3 mb-4">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300 shadow-inner">
                                                                {match.teamA.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className="font-bold text-white">{match.teamA}</span>
                                                        </div>
                                                        <div className="text-sm text-neutral-400 font-mono">{match.scoreA}</div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300 shadow-inner">
                                                                {match.teamB.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className="font-bold text-white">{match.teamB}</span>
                                                        </div>
                                                        <div className="text-sm text-neutral-400 font-mono">{match.scoreB}</div>
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-neutral-800/50 flex justify-between items-center">
                                                    <div className="text-xs text-blue-300 font-medium truncate max-w-[200px]">
                                                        {match.textStatus}
                                                    </div>
                                                    <button className="text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                                        Details <ChevronLeft size={10} className="rotate-180" />
                                                    </button>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </>
                            )}

                            {/* --- LOCAL MATCHES --- */}
                            {activeTab === 'local' && (
                                <>
                                    {/* Local: LIVE */}
                                    {activeSubTab === 'live' && (
                                        gameState === 'setup' || gameState === 'tournament-setup' ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                                                <div className="bg-neutral-900 p-4 rounded-full mb-4 opacity-50"><Play size={24} /></div>
                                                <p className="text-sm">No match currently in progress.</p>
                                                <p className="text-xs mt-2">Start a new match as Scorer.</p>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => setViewMode('match')}
                                                className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 rounded-2xl p-5 active:scale-95 transition-transform cursor-pointer hover:border-red-500/30 shadow-lg relative overflow-hidden group"
                                            >
                                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <Play size={48} className="text-white transform rotate-12" />
                                                </div>
                                                <div className="flex justify-between items-start mb-6">
                                                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full border border-red-500/20 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> LIVE
                                                    </span>
                                                    <span className="text-xs text-neutral-400 font-medium">Local Match</span>
                                                </div>
                                                <div className="flex justify-between items-end mb-2">
                                                    <div>
                                                        <div className="text-sm text-neutral-400 mb-1">Batting</div>
                                                        <div className="font-bold text-2xl text-white leading-none">{currentBattingTeam.name}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-3xl font-black text-white leading-none">{totalRuns}/{totalWickets}</div>
                                                        <div className="text-xs text-neutral-400 mt-1">{overs}.{ballsInOver} Overs</div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                                                    <div className="text-xs text-neutral-400">
                                                        Target: <span className="text-white font-bold">{targetRuns || '-'}</span>
                                                    </div>
                                                    <div className="text-xs text-blue-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                        Watch <ChevronLeft className="rotate-180" size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}

                                    {/* Local: UPCOMING */}
                                    {activeSubTab === 'upcoming' && (
                                        tournamentMatches.filter(m => !m.completed && !m.winnerId).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                                                <div className="bg-neutral-900 p-4 rounded-full mb-4 opacity-50"><Calendar size={24} /></div>
                                                <p className="text-sm">No scheduled matches.</p>
                                                <p className="text-xs mt-2">Create a Tournament to schedule games.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-1">Tournament Schedule</h3>
                                                {tournamentMatches.filter(m => !m.completed).map((m, i) => {
                                                    const tTeamA = tournamentTeams.find(t => t.id === m.teamAId);
                                                    const tTeamB = tournamentTeams.find(t => t.id === m.teamBId);
                                                    return (
                                                        <div key={m.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex justify-between items-center">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="text-xs text-blue-400 font-bold">Match {i + 1}</div>
                                                                <div className="font-bold text-white">{tTeamA?.name} <span className="text-neutral-500">vs</span> {tTeamB?.name}</div>
                                                            </div>
                                                            <div className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
                                                                Scheduled
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                    )}

                                    {/* Local: COMPLETED */}
                                    {activeSubTab === 'completed' && (
                                        matchHistory.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                                                <div className="bg-neutral-900 p-4 rounded-full mb-4 opacity-50"><Clock size={24} /></div>
                                                <p className="text-sm">No completed matches yet.</p>
                                                <p className="text-xs mt-2">Finish a match to see results here.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {matchHistory.map(m => (
                                                    <div
                                                        key={m.id}
                                                        onClick={() => { setSelectedMatch(m); setGameState("history"); setViewMode("match"); }}
                                                        className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 cursor-pointer hover:bg-neutral-800 hover:border-neutral-700 transition-all group"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="text-[10px] font-bold text-neutral-500 uppercase">{m.date}</div>
                                                            <div className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">RESULT</div>
                                                        </div>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                                                                {typeof m.teamA === 'string' ? m.teamA : m.teamA.name} <span className="text-neutral-600 mx-1">vs</span> {typeof m.teamB === 'string' ? m.teamB : m.teamB.name}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-neutral-400 font-mono bg-black/20 p-2 rounded-lg truncate">
                                                            {m.result}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
                {/* Global Match Details Modal */}
                {selectedGlobalMatch && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                            {/* Header */}
                            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                                <div>
                                    <h3 className="font-bold text-white">{selectedGlobalMatch.series || 'Match Details'}</h3>
                                    <div className="text-xs text-neutral-400">{selectedGlobalMatch.status} • {selectedGlobalMatch.textStatus}</div>
                                </div>
                                <button
                                    onClick={() => setSelectedGlobalMatch(null)}
                                    className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-neutral-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {/* Score Header */}
                                <div className="flex justify-between items-center bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                                    <div className="text-center">
                                        <div className="font-bold text-2xl text-white">{selectedGlobalMatch.teamA.split(' ')[0]}</div>
                                        <div className="text-xs text-neutral-500 font-mono">
                                            {globalMatchDetails?.scorecard?.[0]?.r}/{globalMatchDetails?.scorecard?.[0]?.w} ({globalMatchDetails?.scorecard?.[0]?.o})
                                        </div>
                                    </div>
                                    <div className="text-neutral-600 font-bold text-xs">VS</div>
                                    <div className="text-center">
                                        <div className="font-bold text-2xl text-white">{selectedGlobalMatch.teamB.split(' ')[0]}</div>
                                        <div className="text-xs text-neutral-500 font-mono">
                                            {globalMatchDetails?.scorecard?.[1]?.r || 0}/{globalMatchDetails?.scorecard?.[1]?.w || 0} ({globalMatchDetails?.scorecard?.[1]?.o || 0})
                                        </div>
                                    </div>
                                </div>

                                {isLoadingDetails ? (
                                    <div className="flex justify-center p-8">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : globalMatchDetails?.scorecard ? (
                                    <div className="space-y-8">
                                        {globalMatchDetails.scorecard.map((inning, idx) => (
                                            <div key={idx} className="space-y-4">
                                                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 p-2 rounded flex justify-between items-center">
                                                    <span>{inning.inning}</span>
                                                    <span className="text-white">{inning.r}/{inning.w} <span className="text-neutral-500 text-xs">({inning.o} ov)</span></span>
                                                </h4>

                                                {/* Batting Table */}
                                                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                                                    <table className="w-full text-left text-[10px] md:text-xs">
                                                        <thead className="bg-neutral-800 text-neutral-400">
                                                            <tr>
                                                                <th className="p-2">Batsman</th>
                                                                <th className="p-2 text-right">R</th>
                                                                <th className="p-2 text-right">B</th>
                                                                <th className="p-2 text-right hidden sm:table-cell">4s</th>
                                                                <th className="p-2 text-right hidden sm:table-cell">6s</th>
                                                                <th className="p-2 text-right">SR</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-800">
                                                            {inning.batting.map((p, i) => (
                                                                <tr key={i} className="hover:bg-neutral-800/50">
                                                                    <td className="p-2 font-medium">
                                                                        <div className="text-white">{p.name}</div>
                                                                        <div className="text-[9px] text-neutral-500">{p.dismissal}</div>
                                                                    </td>
                                                                    <td className="p-2 text-right font-bold text-white">{p.runs}</td>
                                                                    <td className="p-2 text-right text-neutral-400">{p.balls}</td>
                                                                    <td className="p-2 text-right hidden sm:table-cell text-neutral-500">{p.fours}</td>
                                                                    <td className="p-2 text-right hidden sm:table-cell text-neutral-500">{p.sixes}</td>
                                                                    <td className="p-2 text-right text-neutral-500">{p.strikeRate}</td>
                                                                </tr>
                                                            ))}
                                                            {inning.batting.length === 0 && (
                                                                <tr><td colSpan={6} className="p-3 text-center text-neutral-500 italic">No batting data available.</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Bowling Table */}
                                                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                                                    <table className="w-full text-left text-[10px] md:text-xs">
                                                        <thead className="bg-neutral-800 text-neutral-400">
                                                            <tr>
                                                                <th className="p-2">Bowler</th>
                                                                <th className="p-2 text-right">O</th>
                                                                <th className="p-2 text-right">M</th>
                                                                <th className="p-2 text-right">R</th>
                                                                <th className="p-2 text-right">W</th>
                                                                <th className="p-2 text-right">Econ</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-800">
                                                            {inning.bowling.map((p, i) => (
                                                                <tr key={i} className="hover:bg-neutral-800/50">
                                                                    <td className="p-2 font-medium text-white">{p.name}</td>
                                                                    <td className="p-2 text-right text-white">{p.overs}</td>
                                                                    <td className="p-2 text-right text-neutral-500">{p.maidens}</td>
                                                                    <td className="p-2 text-right text-neutral-400">{p.runs}</td>
                                                                    <td className="p-2 text-right font-bold text-white">{p.wickets}</td>
                                                                    <td className="p-2 text-right text-neutral-500">{p.economy}</td>
                                                                </tr>
                                                            ))}
                                                            {inning.bowling.length === 0 && (
                                                                <tr><td colSpan={6} className="p-3 text-center text-neutral-500 italic">No bowling data available.</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                        {globalMatchDetails.scorecard.length === 0 && (
                                            <div className="text-center text-neutral-500 text-sm py-8">
                                                Detailed scorecard not available for this match type yet.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-neutral-500 text-sm py-8">
                                        Failed to load match details.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div >
        );
    }

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
                    <h3 className="text-lg font-bold mb-4">Tournament Name</h3>
                    <input
                        className="w-full bg-neutral-800 rounded-lg px-4 py-2 outline-none text-xl font-bold text-yellow-500 mb-6 placeholder-neutral-600"
                        value={tournamentName}
                        onChange={(e) => setTournamentName(e.target.value)}
                        placeholder="Enter Tournament Name"
                    />

                    <h3 className="text-lg font-bold mb-4">Add Teams</h3>
                    <div className="flex gap-2 mb-4">
                        <select
                            className="bg-neutral-800 rounded-lg px-4 py-2 outline-none font-bold"
                            value={tempTournamentGroup}
                            onChange={(e) => setTempTournamentGroup(e.target.value)}
                        >
                            <option value="A">Group A</option>
                            <option value="B">Group B</option>
                            <option value="C">Group C</option>
                            <option value="D">Group D</option>
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
        const [activeGroup, setActiveGroup] = useState('All'); // State for active group filter

        const allGroups = Array.from(new Set(tournamentTeams.map(t => t.group || "A"))).sort();
        const teamsInActiveGroup = tournamentTeams.filter(t => activeGroup === 'All' || (t.group || "A") === activeGroup);

        return (
            <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto">
                <div className="w-full flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
                    <button onClick={() => setGameState("setup")} className="text-neutral-400 hover:text-white">&larr; Exit</button>
                    <h1 className="text-2xl font-bold text-yellow-500">{tournamentName} Dashboard</h1>
                    <div className="w-10"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 w-full">
                    {/* Points Table */}
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 max-h-[500px] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-blue-400">Points Table</h3>

                        {/* Group Filter */}
                        {allGroups.length > 1 && (
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setActiveGroup('All')}
                                    className={cn("px-3 py-1 rounded-full text-xs font-bold", activeGroup === 'All' ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700")}
                                >
                                    All Groups
                                </button>
                                {allGroups.map(group => (
                                    <button
                                        key={group}
                                        onClick={() => setActiveGroup(group)}
                                        className={cn("px-3 py-1 rounded-full text-xs font-bold", activeGroup === group ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700")}
                                    >
                                        Group {group}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-neutral-800 text-neutral-400">
                                    <tr>
                                        <th className="p-3">#</th>
                                        <th className="p-3">Team</th>
                                        <th className="p-3 text-right">P</th>
                                        <th className="p-3 text-right hidden sm:table-cell">W</th>
                                        <th className="p-3 text-right hidden sm:table-cell">L</th>
                                        <th className="p-3 text-right hidden sm:table-cell">NRR</th>
                                        <th className="p-3 text-right">Pts</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {teamsInActiveGroup
                                        .sort((a, b) => b.points - a.points || b.nrr - a.nrr)
                                        .map((team, index) => (
                                            <tr key={team.id} className="border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                                                <td className="p-3 font-mono text-neutral-500">{(index + 1).toString().padStart(2, '0')}</td>
                                                <td className="p-3 font-bold text-white flex items-center gap-2">
                                                    {team.name}
                                                    {index < 2 && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Q</span>}
                                                </td>
                                                <td className="p-3 text-right font-mono text-neutral-300">{team.played}</td>
                                                <td className="p-3 text-right font-mono text-green-400 hidden sm:table-cell">{team.won}</td>
                                                <td className="p-3 text-right font-mono text-red-400 hidden sm:table-cell">{team.lost}</td>
                                                <td className="p-3 text-right font-mono text-neutral-400 hidden sm:table-cell">{team.nrr ? team.nrr.toFixed(3) : "0.000"}</td>
                                                <td className="p-3 text-right font-bold text-blue-400">{team.points}</td>
                                            </tr>
                                        ))}
                                    {teamsInActiveGroup.length === 0 && (
                                        <tr><td colSpan={7} className="p-4 text-center text-neutral-500 italic">No teams in this group.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
            // No longer deriving 'battingTeam' and 'bowlingTeam' like before.
            // We now display full stats for selectedMatch.teamA and selectedMatch.teamB

            const winner = selectedMatch.result.includes(selectedMatch.teamA.name) ? 'A' : 'B';
            const currentMatchRecord = selectedMatch; // For summary card

            return (
                <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto">
                    <div className="w-full flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
                        <button onClick={() => {
                            if (userRole === 'viewer') {
                                setViewMode('dashboard');
                                setSelectedMatch(null);
                            } else {
                                setSelectedMatch(null);
                            }
                        }} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
                            <ChevronLeft size={16} /> {userRole === 'viewer' ? 'Back to Dashboard' : 'Back to List'}
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
                    <div className="w-full flex gap-3 mt-6">
                        <button onClick={() => { setMatchHistory([...matchHistory, currentMatchRecord!]); setGameState("setup"); }} className="flex-1 bg-neutral-800 hover:bg-neutral-700 py-3 rounded-xl font-bold transition-all">
                            New Match
                        </button>
                        <button onClick={() => setShowSummaryModal(true)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                            <Share2 size={18} /> Share Summary
                        </button>
                    </div>

                    {/* Share Summary Modal */}
                    {showSummaryModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4">
                                <MatchSummaryCard
                                    ref={summaryCardRef}
                                    winnerTeam={winner === 'A' ? teamA.name : teamB.name}
                                    teamA={{ name: selectedMatch.teamA.name, score: `${selectedMatch.teamA.players.reduce((acc, p) => acc + p.runs, 0)}/${selectedMatch.teamA.players.filter(p => p.out).length}`, overs: `${selectedMatch.overs}` }} // Using current state as snapshot
                                    teamB={{ name: selectedMatch.teamB.name, score: `${selectedMatch.teamB.players.reduce((acc, p) => acc + p.runs, 0)}/${selectedMatch.teamB.players.filter(p => p.out).length}`, overs: `${selectedMatch.overs}` }} // Placeholder, ideally we have full match state
                                    result={selectedMatch.result}
                                    date={selectedMatch.date}
                                />
                                <div className="flex gap-4">
                                    <button onClick={handleDownloadSummary} className="px-6 py-3 bg-green-600 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                                        <Download size={20} /> Download Image
                                    </button>
                                    <button onClick={() => setShowSummaryModal(false)} className="px-6 py-3 bg-neutral-800 rounded-full font-bold hover:bg-neutral-700 transition-colors">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto">
                <div className="w-full flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Match History</h1>
                    <button onClick={() => userRole === 'viewer' ? setViewMode('dashboard') : setGameState("setup")} className="text-neutral-400 hover:text-white">{userRole === 'viewer' ? 'Back to Dashboard' : 'Back to Setup'}</button>
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


    // --- Playing View (Professional UI) ---
    return (
        <div className="h-dvh bg-[#1e1e1e] text-white flex flex-col items-center overflow-hidden font-sans">
            {/* Header - Fixed Top */}
            <div className="w-full bg-[#111] border-b border-[#333] shadow-md z-20 shrink-0">
                {/* Top Bar: Nav */}
                <div className="flex justify-between items-center px-4 py-2 border-b border-[#222]">
                    <button
                        onClick={() => {
                            if (userRole === 'viewer') {
                                setViewMode('dashboard');
                            } else {
                                // Scorer Exit Logic
                                const confirmExit = window.confirm("Do you want to end this match and return to setup?");
                                if (confirmExit) {
                                    setGameState("setup");
                                    setUserRole(null);
                                }
                            }
                        }}
                        className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        <ChevronLeft size={16} /> {userRole === 'viewer' ? 'Dashboard' : 'Exit'}
                    </button>
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                        Match • {innings === 1 ? "1st Innings" : "2nd Innings"}
                    </div>
                    <div className="flex bg-neutral-800 rounded-lg p-0.5 items-center gap-1">
                        <button onClick={toggleMute} className="p-1.5 rounded-md hover:bg-neutral-700 transition-colors">
                            {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-green-400" />}
                        </button>
                        {isAdmin && (
                            <button onClick={() => setIsAdmin(!isAdmin)} className="p-1.5 rounded-md hover:bg-neutral-700 transition-colors">
                                <Settings size={14} className="text-neutral-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Score Display */}
                <div className="px-4 py-4 flex justify-between items-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                    <div>
                        <div className="flex items-baseline gap-2 mb-1">
                            <h1 className="text-4xl font-black text-white leading-none tracking-tight">
                                {totalRuns}<span className="text-neutral-500">/</span>{totalWickets}
                            </h1>
                            <span className="text-lg text-neutral-400 font-bold">
                                {overs}.{ballsInOver} <span className="text-xs font-normal text-neutral-500">Ov</span>
                            </span>
                        </div>
                        <div className="text-sm font-bold text-blue-400 flex items-center gap-2">
                            {currentBattingTeam.name} <span className="text-xs font-normal text-neutral-500">Batting</span>
                        </div>
                    </div>

                    <div className="text-right space-y-1 z-10">
                        <div className="text-xs font-mono text-neutral-400 bg-neutral-800/50 px-2 py-1 rounded inline-block">
                            CRR: <span className="text-white font-bold">{(totalBalls > 0 ? (totalRuns / (totalBalls / 6)) : 0).toFixed(2)}</span>
                        </div>
                        {innings === 2 && targetRuns && (
                            <div className="text-xs font-mono text-neutral-400 bg-neutral-800/50 px-2 py-1 rounded inline-block mt-1 block">
                                Need <span className="text-yellow-400 font-bold">{targetRuns - totalRuns}</span> in <span className="text-white font-bold">{(totalOvers * 6) - totalBalls}</span>
                            </div>
                        )}
                        <div className="text-[10px] text-neutral-500 mt-1">
                            Target: {targetRuns || '-'}
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-1 w-full max-w-2xl flex flex-col overflow-hidden bg-[#121212] relative">
                {/* Celebration Overlay */}
                <AnimatePresence>
                    {celebration && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 2, opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none"
                        >
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                                className="text-center"
                            >
                                <div className={cn(
                                    "text-8xl font-black drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]",
                                    celebration === "4" ? "text-yellow-400" :
                                        celebration === "6" ? "text-purple-500" : "text-red-500"
                                )}>
                                    {celebration === "4" ? "FOUR!" : celebration === "6" ? "SIX!" : "WICKET!"}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Batsman Table */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="bg-[#1a1a1a] mb-1">
                        <div className="flex bg-[#252525] text-[#888] text-[10px] uppercase font-bold px-3 py-2">
                            <div className="flex-1">Batter</div>
                            <div className="w-8 text-right">R</div>
                            <div className="w-8 text-right">B</div>
                            <div className="w-8 text-right hidden sm:block">4s</div>
                            <div className="w-8 text-right hidden sm:block">6s</div>
                            <div className="w-10 text-right">SR</div>
                        </div>
                        {/* Striker */}
                        <div
                            onClick={() => !strikerId && console.log("Trigger Select")}
                            className={cn("flex px-3 py-3 border-b border-[#222] items-center relative", strikerId ? "" : "animate-pulse bg-red-900/10")}
                        >
                            {strikerId && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                    {striker?.name || <span className="text-red-400 italic font-normal">Select Striker</span>}
                                    <span className="text-blue-500 text-xs">★</span>
                                </div>
                            </div>
                            <div className="w-8 text-right font-bold text-white text-sm">{striker?.runs ?? 0}</div>
                            <div className="w-8 text-right text-neutral-400 text-xs">{striker?.balls ?? 0}</div>
                            <div className="w-8 text-right text-neutral-500 text-xs hidden sm:block">{striker?.fours ?? 0}</div>
                            <div className="w-8 text-right text-neutral-500 text-xs hidden sm:block">{striker?.sixes ?? 0}</div>
                            <div className="w-10 text-right text-neutral-400 text-xs">{striker?.balls ? ((striker.runs / striker.balls) * 100).toFixed(0) : "0"}</div>
                        </div>

                        {/* Non Striker */}
                        <div
                            onClick={() => !nonStrikerId && console.log("Trigger Select")}
                            className={cn("flex px-3 py-3 border-b border-[#222] items-center", nonStrikerId ? "" : "animate-pulse bg-red-900/10")}
                        >
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                    {nonStriker?.name || <span className="text-red-400 italic font-normal">Select Non-Striker</span>}
                                </div>
                            </div>
                            <div className="w-8 text-right font-bold text-white text-sm">{nonStriker?.runs ?? 0}</div>
                            <div className="w-8 text-right text-neutral-400 text-xs">{nonStriker?.balls ?? 0}</div>
                            <div className="w-8 text-right text-neutral-500 text-xs hidden sm:block">{nonStriker?.fours ?? 0}</div>
                            <div className="w-8 text-right text-neutral-500 text-xs hidden sm:block">{nonStriker?.sixes ?? 0}</div>
                            <div className="w-10 text-right text-neutral-400 text-xs">{nonStriker?.balls ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(0) : "0"}</div>
                        </div>

                        {/* Swap Button (Admin) */}
                        {isAdmin && strikerId && nonStrikerId && (
                            <button onClick={swapStriker} className="w-full py-2 flex items-center justify-center gap-1 text-[#666] hover:text-white bg-[#222] hover:bg-[#333] transition-colors text-xs border-b border-[#333]">
                                <ArrowLeftRight size={12} /> Swap Ends
                            </button>
                        )}
                    </div>

                    {/* Bowler Table */}
                    <div className="bg-[#1a1a1a] mb-1">
                        <div className="flex bg-[#252525] text-[#888] text-[10px] uppercase font-bold px-3 py-2">
                            <div className="flex-1">Bowler</div>
                            <div className="w-8 text-right">O</div>
                            <div className="w-8 text-right">M</div>
                            <div className="w-8 text-right">R</div>
                            <div className="w-8 text-right">W</div>
                            <div className="w-10 text-right">Eco</div>
                        </div>
                        <div
                            className={cn("flex px-3 py-3 border-b border-[#222] items-center relative", bowlerId ? "" : "animate-pulse bg-yellow-900/10")}
                        >
                            {bowlerId && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>}
                            <div className="flex-1">
                                <div className="text-white font-bold text-sm">
                                    {bowler?.name || <span className="text-yellow-500 italic font-normal">Select Bowler</span>}
                                </div>
                            </div>
                            <div className="w-8 text-right text-white text-sm">{(bowler?.bowling.overs || 0).toFixed(1)}</div>
                            <div className="w-8 text-right text-neutral-400 text-xs">{bowler?.bowling.maidens || 0}</div>
                            <div className="w-8 text-right text-white font-bold text-sm">{bowler?.bowling.runs || 0}</div>
                            <div className="w-8 text-right text-blue-400 font-bold text-sm">{bowler?.bowling.wickets || 0}</div>
                            <div className="w-10 text-right text-neutral-400 text-xs font-mono">{((bowler?.bowling.overs || 0) > 0 ? ((bowler?.bowling.runs || 0) / (bowler?.bowling.overs || 1)).toFixed(1) : "0.0")}</div>
                        </div>

                        {/* Bowler Selection (If none selected) */}
                        {!bowlerId && (
                            <div className="p-2 gap-2 flex overflow-x-auto">
                                {currentBowlingTeam.players.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setBowlerId(p.id)}
                                        className={cn("px-3 py-1.5 rounded text-xs border whitespace-nowrap", p.id === lastOverBowlerId ? "bg-neutral-900 text-neutral-600 border-neutral-800" : "bg-neutral-800 text-white border-neutral-700 hover:border-blue-500")}
                                        disabled={p.id === lastOverBowlerId}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* This Over & Extras */}
                    <div className="px-3 py-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">This Over</span>
                            <div className="h-px bg-[#333] flex-1"></div>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                Ex: {extras.w + extras.nb + extras.lb + extras.b}
                            </span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-800">
                            {currentOver.map((ball, i) => (
                                <div key={i} className={cn(
                                    "w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold border shadow-sm",
                                    ball === "W" ? "bg-red-500 text-white border-red-400" :
                                        ball === "4" || ball === "6" ? "bg-green-600 text-white border-green-500" :
                                            "bg-[#222] text-white border-[#333]"
                                )}>
                                    {ball}
                                </div>
                            ))}
                            {currentOver.length === 0 && <div className="text-xs text-neutral-600 italic pl-1">No balls bowled</div>}
                        </div>
                    </div>
                </div>

                {/* Control Pad (Fixed Bottom) */}
                {isAdmin && (
                    <div className="bg-[#111] border-t border-[#333] p-3 pb-safe z-30">
                        {/* Primary Runs */}
                        <div className="grid grid-cols-5 gap-2 mb-2">
                            {[0, 1, 2, 3, 4].map(run => (
                                <button
                                    key={run}
                                    onClick={() => handleBall(run)}
                                    disabled={!strikerId || !bowlerId}
                                    className={cn(
                                        "h-12 rounded-lg font-bold text-xl transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed",
                                        run === 4 ? "bg-green-500 text-white hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]" :
                                            "bg-[#222] text-white hover:bg-[#333] border border-[#333]"
                                    )}
                                >
                                    {run}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            <button
                                onClick={() => handleBall(6)}
                                disabled={!strikerId || !bowlerId}
                                className="h-10 rounded-lg font-bold text-lg bg-purple-600 text-white hover:bg-purple-500 active:scale-95 disabled:opacity-20 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                            >
                                6
                            </button>
                            <button
                                onClick={() => handleBall("WD")}
                                disabled={!strikerId || !bowlerId}
                                className="h-10 rounded-lg font-bold text-sm bg-orange-900/20 text-orange-500 border border-orange-500/30 hover:bg-orange-900/40 disabled:opacity-20"
                            >
                                WD
                            </button>
                            <button
                                onClick={() => handleBall("NB")}
                                disabled={!strikerId || !bowlerId}
                                className="h-10 rounded-lg font-bold text-sm bg-orange-900/20 text-orange-500 border border-orange-500/30 hover:bg-orange-900/40 disabled:opacity-20"
                            >
                                NB
                            </button>
                            <button
                                onClick={() => handleBall("W")}
                                disabled={!strikerId || !bowlerId}
                                className="h-10 rounded-lg font-bold text-lg bg-red-600 text-white hover:bg-red-500 active:scale-95 disabled:opacity-20 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                            >
                                OUT
                            </button>
                            <button
                                onClick={undoLastBall}
                                disabled={undoStack.length === 0}
                                className="h-10 rounded-lg flex items-center justify-center text-neutral-400 bg-[#222] hover:bg-[#2a2a2a] disabled:opacity-20 hover:text-white transition-colors"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Batsman Selection Overlay */}
                {(!strikerId || !nonStrikerId) && gameState === "playing" && (
                    <div className="absolute inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                            <div className="bg-[#222] p-4 border-b border-[#333]">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Users size={20} className="text-blue-500" /> Select {strikerId ? "Non-Striker" : "Striker"}
                                </h2>
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto p-2">
                                {currentBattingTeam.players.filter(p => p.id !== strikerId && p.id !== nonStrikerId && !p.out).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => selectBatsman(p.id)}
                                        className="w-full flex justify-between items-center p-4 hover:bg-[#252525] rounded-xl transition-colors group border-b border-[#222] last:border-0"
                                    >
                                        <span className="font-bold text-neutral-200 group-hover:text-white transition-colors">{p.name}</span>
                                        <div className="text-xs text-neutral-500 bg-[#111] px-2 py-1 rounded">Avg: {p.runs}</div>
                                    </button>
                                ))}
                                {currentBattingTeam.players.filter(p => !p.out).length === 2 && ( // Only 2 players left (already selected)
                                    <div className="p-4 text-center text-neutral-500 italic">No more players available</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Match Result Modal */}
                {showMatchResultModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl relative overflow-hidden">
                            {/* Confetti Effect (Simple CSS or just visual) */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                            <div className="mb-4 flex justify-center">
                                <div className="p-3 bg-yellow-500/20 rounded-full animate-bounce">
                                    <span className="text-4xl">🏆</span>
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-white mb-2">Match Finished!</h2>
                            <p className="text-lg text-blue-400 font-bold mb-6">{matchResultText}</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        saveMatch();
                                        setShowMatchResultModal(false);
                                        // Reset State or go to History? 
                                        // Creating a "Post Match" flow would be best, but for now:
                                        // Let's trigger "Share Summary" immediately after saving?
                                        // Or just go to history.
                                        setGameState("history");
                                        // Set selected match to the one just saved (newest)
                                        // We need to wait for state update... tedious.
                                        // Let's just go to setup for now as requested.
                                        setGameState("setup");
                                    }}
                                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20"
                                >
                                    Save & Exit
                                </button>
                                <button
                                    onClick={() => setShowMatchResultModal(false)}
                                    className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-bold rounded-xl transition-colors"
                                >
                                    Cancel (Correct Score)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
