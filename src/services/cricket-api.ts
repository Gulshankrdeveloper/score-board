

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

export const fetchLiveMatches = async (): Promise<ApiMatch[]> => {


    try {
        const response = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`);
        const data = await response.json();

        if (data.status !== "success" || !data.data) {
            console.error("API Error:", data);
            return MOCK_MATCHES;
        }

        // Map API response to our app's format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.data.map((match: any) => ({
            id: match.id,
            teamA: match.teams[0],
            teamB: match.teams[1],
            teamAImage: match.teamInfo?.[0]?.img,
            teamBImage: match.teamInfo?.[1]?.img,
            scoreA: "", // Complex parsing needed for scores usually, keeping simple for now
            scoreB: "",
            status: match.matchEnded ? "Completed" : "Live",
            textStatus: match.status,
            series: match.name,
            startTime: match.dateTimeGMT,
            isMock: false
        }));

    } catch (error) {
        console.error("Failed to fetch matches:", error);
        return MOCK_MATCHES;
    }
};
