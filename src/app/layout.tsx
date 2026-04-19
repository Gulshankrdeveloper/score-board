import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { AppWrapper } from "@/components/AppWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Local Sports Scoreboard",
    description: "Track scores for local multiplayer games in real-time.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "SportsBoard"
    }
};

export const viewport = {
    themeColor: "#0a0a0a",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={cn(inter.className, "min-h-screen bg-background text-foreground antialiased")}>
                <AuthProvider>
                    <AppWrapper>
                        {children}
                    </AppWrapper>
                </AuthProvider>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', function() {
                                    navigator.serviceWorker.register('/sw.js').then(
                                        function(registration) {
                                            console.log('Service Worker registration successful with scope: ', registration.scope);
                                        },
                                        function(err) {
                                            console.log('Service Worker registration failed: ', err);
                                        }
                                    );
                                });
                            }
                        `,
                    }}
                />
            </body>
        </html>
    );
}
