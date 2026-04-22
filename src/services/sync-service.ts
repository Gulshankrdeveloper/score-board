// Optional Firebase fallback (Not used by default to ensure zero-config local network sync works)
import { db } from "@/lib/firebase";
import {
    doc,
    setDoc,
    onSnapshot,
    collection,
    query,
    where,
    Timestamp,
    getDoc,
    getDocs,
    limit,
    orderBy
} from "firebase/firestore";

export interface SyncMatchData {
    id: string;
    teamA: any;
    teamB: any;
    totalRuns: number;
    totalWickets: number;
    totalBalls: number;
    extras: any;
    currentOver: string[];
    thisOverRuns: number;
    strikerId: string | null;
    nonStrikerId: string | null;
    bowlerId: string | null;
    battingTeam: "A" | "B";
    innings: number;
    targetRuns: number | null;
    teamAScore?: { runs: number; wickets: number; balls: number };
    teamBScore?: { runs: number; wickets: number; balls: number };
    status: 'Live' | 'Completed';
    updatedAt: any;
    pin?: string;
}

const MATCHES_COLLECTION = "live_matches";
const POLLING_INTERVAL_MS = 2000; // Poll every 2 seconds for real-time feel

// Helper to determine if we should use Firebase or Internal Network Sync
// If Firebase isn't configured with real keys, we fallback to our Next.js memory API route
const isFirebaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here'
);

export const syncMatchToCloud = async (matchId: string, data: Partial<SyncMatchData>) => {
    try {
        if (isFirebaseConfigured) {
            const matchRef = doc(db, MATCHES_COLLECTION, matchId);
            await setDoc(matchRef, {
                ...data,
                updatedAt: Timestamp.now()
            }, { merge: true });
            console.log("Match synced via Firebase");
        } else {
            // Internal Local Network Sync
            await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: matchId, ...data })
            });
            console.log("Match synced via Internal Network Server");
        }
    } catch (error) {
        console.error("Error syncing match:", error);
    }
};

export const subscribeToMatchSync = (matchId: string, onUpdate: (data: SyncMatchData) => void) => {
    if (isFirebaseConfigured) {
        const matchRef = doc(db, MATCHES_COLLECTION, matchId);
        return onSnapshot(matchRef, (docSnap) => {
            if (docSnap.exists()) {
                onUpdate(docSnap.data() as SyncMatchData);
            }
        });
    } else {
        // Internal Local Network Polling
        let active = true;
        const poll = async () => {
            if (!active) return;
            try {
                const res = await fetch(`/api/sync?id=${matchId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data) onUpdate(data as SyncMatchData);
                }
            } catch (e) {
                // Ignore silent network errors
            }
            if (active) setTimeout(poll, POLLING_INTERVAL_MS);
        };
        poll(); // Start polling
        
        return () => { active = false; }; // Return unsubscribe function
    }
};

export const fetchMatchFromCloud = async (matchId: string) => {
    try {
        if (isFirebaseConfigured) {
            const matchRef = doc(db, MATCHES_COLLECTION, matchId);
            const docSnap = await getDoc(matchRef);
            if (docSnap.exists()) {
                return docSnap.data() as SyncMatchData;
            }
            return null;
        } else {
            const res = await fetch(`/api/sync?id=${matchId}`);
            if (res.ok) return await res.json();
            return null;
        }
    } catch (error) {
        console.error("Error fetching match:", error);
        return null;
    }
};

export const subscribeToLiveMatches = (onUpdate: (matches: SyncMatchData[]) => void) => {
    if (isFirebaseConfigured) {
        const q = query(
            collection(db, MATCHES_COLLECTION),
            where("status", "==", "Live"),
            orderBy("updatedAt", "desc"),
            limit(20)
        );

        return onSnapshot(q, (snapshot) => {
            const matches: SyncMatchData[] = [];
            snapshot.forEach((docSnap) => {
                matches.push({ id: docSnap.id, ...docSnap.data() } as SyncMatchData);
            });
            onUpdate(matches);
        });
    } else {
        // Internal Local Network Polling
        let active = true;
        const poll = async () => {
            if (!active) return;
            try {
                // To avoid caching, append random timestamp optionally, but Next.js app router API is usually dynamic
                const res = await fetch(`/api/sync`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    onUpdate(data as SyncMatchData[]);
                }
            } catch (e) {
                // Ignore silent network errors
            }
            if (active) setTimeout(poll, POLLING_INTERVAL_MS);
        };
        poll(); // Start polling
        
        return () => { active = false; }; // Return unsubscribe function
    }
};
