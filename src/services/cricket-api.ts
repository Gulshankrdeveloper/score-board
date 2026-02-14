
export type ApiMatch = {
    id: string;
    teamA: string;
    teamAImage?: string;
    teamB: string;
    teamBImage?: string;
    scoreA: string; // e.g., "145/3 (18.2)"
    scoreB: string; // e.g., "Yet to bat"
    status: string; // "Live", "Completed", "Upcoming"
    textStatus: string; // "India need 20 runs in 10 balls"
    series: string; // e.g., "ICC World Cup"
    startTime?: string;
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
        startTime: 'Tomorrow, 2:00 PM'
    },
    {
        id: 'm3',
        teamA: 'Chennai Super Kings',
        teamB: 'Mumbai Indians',
        scoreA: '192/4 (20)',
        scoreB: '193/5 (19.4)',
        status: 'Completed',
        textStatus: 'Mumbai Indians won by 5 wickets',
        series: 'IPL League Match'
    }
];

export const fetchLiveMatches = async (): Promise<ApiMatch[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_MATCHES;
};
