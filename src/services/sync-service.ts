import { db } from "@/lib/firebase";
import {
    doc,
    setDoc,
    onSnapshot,
    collection,
    query,
    where,
    Timestamp,
    getDoc
} from "firebase/firestore";

// Basic Match Data Interface (Matches CricketPage state)
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
    status: 'Live' | 'Completed';
    updatedAt: any;
}

const MATCHES_COLLECTION = "live_matches";

/**
 * Pushes match data to Firestore for real-time updates.
 */
export const syncMatchToCloud = async (matchId: string, data: Partial<SyncMatchData>) => {
    try {
        const matchRef = doc(db, MATCHES_COLLECTION, matchId);
        await setDoc(matchRef, {
            ...data,
            updatedAt: Timestamp.now()
        }, { merge: true });
        console.log("Match synced to cloud successfully");
    } catch (error) {
        console.error("Error syncing match to cloud:", error);
    }
};

/**
 * Subscribes to a specific match for real-time updates.
 */
export const subscribeToMatchSync = (matchId: string, onUpdate: (data: SyncMatchData) => void) => {
    const matchRef = doc(db, MATCHES_COLLECTION, matchId);
    return onSnapshot(matchRef, (doc) => {
        if (doc.exists()) {
            onUpdate(doc.data() as SyncMatchData);
        }
    });
};

/**
 * Fetches match data once from the cloud.
 */
export const fetchMatchFromCloud = async (matchId: string) => {
    try {
        const matchRef = doc(db, MATCHES_COLLECTION, matchId);
        const docSnap = await getDoc(matchRef);
        if (docSnap.exists()) {
            return docSnap.data() as SyncMatchData;
        }
        return null;
    } catch (error) {
        console.error("Error fetching match from cloud:", error);
        return null;
    }
};
