
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Types (Mirrored from page.tsx for independence, or imported if I extract types later)
// For now, I'll define locally or assume passed props structure
type CommentaryItem = {
    runs: number | string;
    isWicket: boolean;
    batterId?: string;
    isBoundary: boolean;
};

type Player = {
    id: string;
    name: string;
    runs: number;
    balls: number;
};

interface PartnershipCardProps {
    commentary: CommentaryItem[];
    striker: Player | null;
    nonStriker: Player | null;
}

const PartnershipCard: React.FC<PartnershipCardProps> = ({ commentary, striker, nonStriker }) => {
    const partnershipStats = useMemo(() => {
        let runs = 0;
        let balls = 0;
        let strikerRuns = 0;
        let strikerBalls = 0;
        let nonStrikerRuns = 0;
        let nonStrikerBalls = 0;

        // Iterate backwards until wicket or start
        for (const ball of commentary) {
            if (ball.isWicket) break; // End of current partnership

            // Parse runs
            const runVal = typeof ball.runs === 'number' ? ball.runs : 0;
            const isWide = ball.runs === "WD";
            const isNoBall = ball.runs === "NB";
            const isExtra = isWide || isNoBall; // Simplified

            // Partnership Total
            // Wides add 1 run but no ball. No ball adds 1 run + no ball.
            // Simplified logic: If number, add. If WD/NB it's usually 1.
            let r = runVal;
            if (ball.runs === "WD" || ball.runs === "NB") r = 1;

            runs += r;
            if (!isWide) balls++; // Wide doesn't count as ball in partnership ball count usually? 
            // Actually partnership balls usually counts legal balls + no balls? Only wides excluded?
            // Let's keep it simple: count all items that aren't Wides as balls.

            // Individual Attribution
            if (striker && ball.batterId === striker.id) {
                if (typeof ball.runs === 'number') {
                    strikerRuns += ball.runs;
                    strikerBalls++;
                }
            } else if (nonStriker && ball.batterId === nonStriker.id) {
                if (typeof ball.runs === 'number') {
                    nonStrikerRuns += ball.runs;
                    nonStrikerBalls++;
                }
            }
        }

        return { runs, balls, strikerRuns, strikerBalls, nonStrikerRuns, nonStrikerBalls };
    }, [commentary, striker, nonStriker]);

    if (!striker || !nonStriker) return null;

    const totalContribution = partnershipStats.runs > 0 ? partnershipStats.runs : 1;
    const sPercent = (partnershipStats.strikerRuns / totalContribution) * 100;
    const nsPercent = (partnershipStats.nonStrikerRuns / totalContribution) * 100;
    const extras = partnershipStats.runs - (partnershipStats.strikerRuns + partnershipStats.nonStrikerRuns);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-xl backdrop-blur-md"
        >
            <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center mb-3">Current Partnership</h3>

            <div className="flex justify-between items-end mb-2">
                <div className="text-left w-1/3">
                    <div className="font-bold text-white text-sm truncate">{striker.name}</div>
                    <div className="text-lg font-black text-blue-400">{partnershipStats.strikerRuns} <span className="text-xs text-neutral-500 font-normal">({partnershipStats.strikerBalls})</span></div>
                </div>

                <div className="text-center w-1/3 pb-1">
                    <div className="text-2xl font-black text-white">{partnershipStats.runs}</div>
                    <div className="text-xs text-neutral-400">{partnershipStats.balls} balls</div>
                </div>

                <div className="text-right w-1/3">
                    <div className="font-bold text-white text-sm truncate">{nonStriker.name}</div>
                    <div className="text-lg font-black text-blue-400">{partnershipStats.nonStrikerRuns} <span className="text-xs text-neutral-500 font-normal">({partnershipStats.nonStrikerBalls})</span></div>
                </div>
            </div>

            {/* Visual Bar */}
            <div className="flex h-2 rounded-full overflow-hidden bg-neutral-800 mb-2">
                <div style={{ width: `${sPercent}%` }} className="bg-blue-500 transition-all duration-500"></div>
                <div style={{ width: `${extras > 0 ? (extras / totalContribution) * 100 : 0}%` }} className="bg-neutral-600 transition-all duration-500"></div>
                <div style={{ width: `${nsPercent}%` }} className="bg-blue-400 transition-all duration-500"></div>
            </div>

            <div className="flex justify-between text-[10px] text-neutral-500 px-1">
                <span>{Math.round(sPercent)}%</span>
                {extras > 0 && <span>Extras: {extras}</span>}
                <span>{Math.round(nsPercent)}%</span>
            </div>

        </motion.div>
    );
};

export default PartnershipCard;
