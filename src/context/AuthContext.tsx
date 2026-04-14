"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";

type AuthContextType = {
    user: any | null;
    loading: boolean;
    signOut: () => Promise<void>;
    loginAsGuest: () => void;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => {},
    loginAsGuest: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe = () => {};
        if (auth) {
            try {
                unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                    if (!currentUser && typeof window !== 'undefined' && localStorage.getItem('isGuest') === 'true') {
                        setUser({ uid: 'guest', email: 'Guest User (Local)' } as any);
                    } else {
                        setUser(currentUser);
                    }
                    setLoading(false);
                });
            } catch (e) {
                console.error("Firebase Auth Init Error:", e);
                if (typeof window !== 'undefined' && localStorage.getItem('isGuest') === 'true') {
                    setUser({ uid: 'guest', email: 'Guest User (Local)' } as any);
                }
                setLoading(false);
            }
        } else {
            // Firebase not configured, check for guest mode or just stop loading
            if (typeof window !== 'undefined' && localStorage.getItem('isGuest') === 'true') {
                setUser({ uid: 'guest', email: 'Guest User (Local)' } as any);
            }
            setLoading(false);
        }

        return () => unsubscribe();
    }, []);

    const loginAsGuest = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('isGuest', 'true');
        }
        setUser({ uid: 'guest', email: 'Guest User (Local)' } as any);
    };

    const signOut = async () => {
        try {
            if (auth) {
                await firebaseSignOut(auth);
            }
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('isGuest');
            }
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut, loginAsGuest }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
