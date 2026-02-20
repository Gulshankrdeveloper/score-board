
import React from 'react';

interface WormGraphProps {
    teamAName: string;
    teamBName: string;
    teamARunsPerOver: number[]; // Cumulative
    teamBRunsPerOver?: number[]; // Cumulative (if 2nd innings or comparing)
    totalOvers: number;
}

const WormGraph: React.FC<WormGraphProps> = ({ teamAName, teamBName, teamARunsPerOver, teamBRunsPerOver, totalOvers }) => {
    // Dimensions
    const width = 300;
    const height = 150;
    const padding = 20;

    // Scales
    const maxRuns = Math.max(
        ...(teamARunsPerOver || [0]),
        ...(teamBRunsPerOver || [0]),
        50 // Minimum height 
    ) * 1.2; // 20% buffer

    const xScale = (overIndex: number) => padding + (overIndex / totalOvers) * (width - 2 * padding);
    const yScale = (runs: number) => height - padding - (runs / maxRuns) * (height - 2 * padding);

    // Generate Paths
    const getPath = (data: number[]) => {
        if (!data || data.length === 0) return "";
        let path = `M ${xScale(0)} ${yScale(0)}`; // Start at 0,0
        data.forEach((runs, i) => {
            path += ` L ${xScale(i + 1)} ${yScale(runs)}`;
        });
        return path;
    };

    const pathA = getPath(teamARunsPerOver);
    const pathB = teamBRunsPerOver ? getPath(teamBRunsPerOver) : "";

    return (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
            <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-3 flex justify-between">
                <span>Worm Graph</span>
                <div className="flex gap-3">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> {teamAName}</span>
                    {teamBRunsPerOver && <span className="flex items-center gap-1"><div className="w-2 h-2 bg-white rounded-full opacity-50"></div> {teamBName}</span>}
                </div>
            </h3>

            <div className="relative w-full aspect-[2/1]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid Lines - Y Axis */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                        const y = height - padding - tick * (height - 2 * padding);
                        const val = Math.round(tick * maxRuns);
                        return (
                            <g key={tick}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#333" strokeDasharray="3 3" strokeWidth="1" />
                                <text x={padding - 5} y={y + 3} textAnchor="end" fontSize="8" fill="#666">{val}</text>
                            </g>
                        );
                    })}

                    {/* Grid Lines - X Axis (Overs) */}
                    {Array.from({ length: totalOvers + 1 }).map((_, i) => {
                        // Only show every 5 overs if total > 10, else every 1
                        if (totalOvers > 10 && i % 5 !== 0 && i !== totalOvers) return null;

                        const x = xScale(i);
                        return (
                            <g key={i}>
                                <line x1={x} y1={height - padding} x2={x} y2={padding} stroke="#333" strokeDasharray="3 3" strokeWidth="1" />
                                <text x={x} y={height - 5} textAnchor="middle" fontSize="8" fill="#666">{i}</text>
                            </g>
                        );
                    })}

                    {/* Team B Comparison (Ghost/Background) */}
                    {pathB && (
                        <path d={pathB} fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4 4" />
                    )}

                    {/* Team A Line (Main) */}
                    {pathA && (
                        <path d={pathA} fill="none" stroke="#3b82f6" strokeWidth="2" />
                    )}

                    {/* Current Dot */}
                    {teamARunsPerOver.length > 0 && (
                        <circle cx={xScale(teamARunsPerOver.length)} cy={yScale(teamARunsPerOver[teamARunsPerOver.length - 1])} r="3" fill="#3b82f6" />
                    )}

                </svg>
            </div>
        </div>
    );
};

export default WormGraph;
