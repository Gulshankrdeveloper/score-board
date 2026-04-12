import { NextResponse } from 'next/server';

// Global memory cache to store live matches
// Note: This works perfectly for local network hosting (running `npm run dev` and accessing via IP).
// If deployed to serverless environments like Vercel, this state may reset between cold starts.
const globalMatchesCache: Record<string, any> = {};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        if (!body || !body.id) {
            return NextResponse.json({ success: false, error: "Missing match ID" }, { status: 400 });
        }

        // Store the match data in memory
        globalMatchesCache[body.id] = {
            ...body,
            updatedAt: Date.now()
        };

        return NextResponse.json({ success: true, matchId: body.id });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // Clean up matches older than 12 hours to prevent memory leaks in long-running processes
        const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
        Object.keys(globalMatchesCache).forEach(key => {
            if (globalMatchesCache[key].updatedAt < twelveHoursAgo) {
                delete globalMatchesCache[key];
            }
        });

        if (id) {
            // Get specific match
            const match = globalMatchesCache[id];
            return NextResponse.json(match || null);
        } else {
            // Get all live matches
            const liveMatches = Object.values(globalMatchesCache)
                .filter(m => m.status === 'Live')
                .sort((a, b) => b.updatedAt - a.updatedAt) // Newest first
                .slice(0, 20); // Limit to top 20 like the Firebase query
            
            return NextResponse.json(liveMatches);
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch matches" }, { status: 500 });
    }
}
