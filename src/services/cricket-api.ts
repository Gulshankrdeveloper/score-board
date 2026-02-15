

const API_KEY = "1b20d0ac-58df-4963-bcae-e45844cc0c84"; // Get free key from cricketdata.org or cricapi.com

export type ApiMatch = {
    id: string;
    teamA: string;
    teamAImage?: string;
    teamB: string;
    teamBImage?: string;
    scoreA: string;
    scoreB: string;
    status: string;
    textStatus: string;
    series: string;
    startTime?: string;
    isMock?: boolean;
};

const MOCK_MATCHES: ApiMatch[] = [
    {
        id: 'm1',
        teamA: 'India',
        teamB: 'Australia',
        scoreA: '285/7 (50)',
        scoreB: '142/3 (22.4)',
        status: 'Live',
        textStatus: 'Australia need 144 runs to win',
        series: 'ODI Series',
        isMock: true
    },
    {
        id: 'm2',
        teamA: 'England',
        teamB: 'New Zealand',
        scoreA: 'Yet to bat',
        scoreB: 'Yet to bat',
        status: 'Upcoming',
        textStatus: 'Match starts at 2:00 PM',
        series: 'T20 World Cup',
        startTime: 'Tomorrow, 2:00 PM',
        isMock: true
    },
    {
        id: 'm3',
        teamA: 'Chennai Super Kings',
        teamB: 'Mumbai Indians',
        scoreA: '192/4 (20)',
        scoreB: '193/5 (19.4)',
        status: 'Completed',
        textStatus: 'Mumbai Indians won by 5 wickets',
        series: 'IPL League Match',
        isMock: true
    }
];

export type ApiBatsman = {
    name: string;
    runs: string;
    balls: string;
    fours: string;
    sixes: string;
    strikeRate: string;
    dismissal: string;
};

export type ApiBowler = {
    name: string;
    overs: string;
    maidens: string;
    runs: string;
    wickets: string;
    economy: string;
};

export type ApiInning = {
    inning: string; // "Team A Inning 1"
    r: number;
    w: number;
    o: number;
    batting: ApiBatsman[];
    bowling: ApiBowler[];
};

export type ApiMatchScorecard = {
    scorecard: ApiInning[];
    status: string;
    matchEnded: boolean;
};

export const fetchLiveMatches = async (): Promise<ApiMatch[]> => {
    try {
        const [currentResp, matchesResp] = await Promise.all([
            fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`),
            fetch(`https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`)
        ]);

        const currentData = await currentResp.json();
        const matchesData = await matchesResp.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapMatch = (match: any): ApiMatch => ({
            id: match.id,
            teamA: match.teams[0] || match.teamInfo?.[0]?.name || "Team A",
            teamB: match.teams[1] || match.teamInfo?.[1]?.name || "Team B",
            teamAImage: match.teamInfo?.[0]?.img,
            teamBImage: match.teamInfo?.[1]?.img,
            scoreA: "",
            scoreB: "",
            status: !match.matchStarted ? "Upcoming" : (match.matchEnded ? "Completed" : "Live"),
            textStatus: match.status,
            series: match.name,
            startTime: match.dateTimeGMT, // e.g. "2026-02-15T13:00:00"
            isMock: false
        });

        const liveAndRecent = (currentData.data || []).map(mapMatch);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upcoming = (matchesData.data || [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((m: any) => !m.matchStarted)
            .map(mapMatch);

        // Merge and deduplicate by ID
        const allMatches = [...liveAndRecent, ...upcoming];
        const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());

        // Sort: Live first, then Upcoming (soonest first), then Completed (recent first)
        return uniqueMatches.sort((a, b) => {
            if (a.status === 'Live' && b.status !== 'Live') return -1;
            if (b.status === 'Live' && a.status !== 'Live') return 1;

            // If both upcoming, sort by time asc
            if (a.status === 'Upcoming' && b.status === 'Upcoming') {
                return (a.startTime || '').localeCompare(b.startTime || '');
            }
            // If both completed, sort by time desc (roughly, or just keep order)
            return 0;
        });

    } catch (error) {
        console.error("Failed to fetch matches:", error);
        return MOCK_MATCHES;
    }
};

export const fetchMatchScorecard = async (id: string): Promise<ApiMatchScorecard | null> => {
    try {
        const response = await fetch(`https://api.cricapi.com/v1/match_scorecard?apikey=${API_KEY}&id=${id}`);
        const data = await response.json();

        if (data.status !== "success" || !data.data) return null;

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            scorecard: (data.data.scorecard || []).map((inning: any) => ({
                inning: inning.inning,
                r: inning.r,
                w: inning.w,
                o: inning.o,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                batting: (inning.batting || []).map((b: any) => ({
                    name: b.batsman?.name || b.name || "Unknown",
                    runs: b.r || b.runs || "0",
                    balls: b.b || b.balls || "0",
                    fours: b["4s"] || "0",
                    sixes: b["6s"] || "0",
                    strikeRate: b.sr || "0.00",
                    dismissal: b.dismissal || b.dismissal_text || ""
                })),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                bowling: (inning.bowling || []).map((b: any) => ({
                    name: b.bowler?.name || b.name || "Unknown",
                    overs: b.o || b.overs || "0",
                    maidens: b.m || b.maidens || "0",
                    runs: b.r || b.runs || "0",
                    wickets: b.w || b.wickets || "0",
                    economy: b.eco || "0.00"
                }))
            })),
            status: data.data.status,
            matchEnded: data.data.matchEnded
        };
    } catch (error) {
        console.error("Failed to fetch scorecard:", error);
        return null;
    }
};

