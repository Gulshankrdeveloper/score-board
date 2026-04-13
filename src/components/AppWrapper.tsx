"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";
import { AuthScreen } from "@/components/AuthScreen";
import { Loader2 } from "lucide-react";

export function AppWrapper({ children }: { children: React.ReactNode }) {
    // We maintain global splash state here. Once finished, it stays finished.
    const [isSplashFinished, setIsSplashFinished] = useState(false);
    const { user, loading: authLoading } = useAuth();

    // 1. Show Splash Screen first
    if (!isSplashFinished) {
        return <SplashScreen onFinish={() => setIsSplashFinished(true)} />;
    }

    // 2. Wait for Firebase to determine auth state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
                <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                <p className="text-neutral-500 text-sm font-mono tracking-widest uppercase animate-pulse">Loading Arena...</p>
            </div>
        );
    }

    // 3. If no user, demand Authentication
    if (!user) {
        return <AuthScreen />;
    }

    // 4. If logged in, show main app
    return <>{children}</>;
}
