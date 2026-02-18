import React from 'react';
import { motion } from 'framer-motion';

export type ShotCoordinate = {
    x: number;
    y: number;
    runs: number;
    id: string; // unique id for key
    color?: string;
};

interface GroundMapProps {
    readOnly?: boolean;
    onShotSelect?: (x: number, y: number) => void;
    shots?: ShotCoordinate[];
    className?: string;
}

const GroundMap: React.FC<GroundMapProps> = ({ readOnly = false, onShotSelect, shots = [], className = "" }) => {

    const handleClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
        if (readOnly || !onShotSelect) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Ensure within bounds (circular field roughly)
        // Center is 50, 50. Radius approx 48.
        const dist = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
        if (dist > 50) return; // Ignore clicks outside

        onShotSelect(x, y);
    };

    return (
        <div className={`relative aspect-square w-full max-w-md mx-auto ${className} select-none`}>
            {/* Field SVG */}
            <svg
                viewBox="0 0 100 100"
                className={`w-full h-full rounded-full border-4 border-green-800 bg-green-600 shadow-inner ${!readOnly ? 'cursor-crosshair active:scale-[0.99] transition-transform' : ''}`}
                onClick={handleClick}
            >
                {/* Grass Stripes Pattern */}
                <defs>
                    <pattern id="grass" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="10" height="5" fill="#16a34a" /> {/* green-600 */}
                        <rect x="0" y="5" width="10" height="5" fill="#15803d" /> {/* green-700 */}
                    </pattern>
                </defs>
                <circle cx="50" cy="50" r="50" fill="url(#grass)" />

                {/* 30 Yard Circle */}
                <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2 2" />

                {/* Pitch */}
                <rect x="46" y="38" width="8" height="24" fill="#eab308" opacity="0.4" /> {/* Clay color */}
                <rect x="46" y="38" width="8" height="24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />

                {/* Stumps (Visual) */}
                <rect x="49" y="38" width="2" height="0.5" fill="white" />
                <rect x="49" y="62" width="2" height="0.5" fill="white" />

                {/* Field Markings (Optional) */}
                <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(0,0,0,0.1)" strokeWidth="0.2" />
                <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(0,0,0,0.1)" strokeWidth="0.2" />

                {/* Shots */}
                {shots.map((shot) => (
                    <circle
                        key={shot.id}
                        cx={shot.x}
                        cy={shot.y}
                        r={readOnly ? 1.5 : 2}
                        fill={shot.color || (shot.runs === 6 ? '#ef4444' : shot.runs === 4 ? '#3b82f6' : '#ffffff')}
                        stroke="black"
                        strokeWidth="0.2"
                        className="animate-in zoom-in duration-300"
                    />
                ))}

                {/* Connection lines for visualization (optional) */}
                {readOnly && shots.map((shot) => (
                    <line
                        key={`line-${shot.id}`}
                        x1="50"
                        y1="50"
                        x2={shot.x}
                        y2={shot.y}
                        stroke={shot.color || (shot.runs === 6 ? '#ef4444' : shot.runs === 4 ? '#3b82f6' : '#ffffff')}
                        strokeWidth="0.2"
                        opacity="0.3"
                    />
                ))}
            </svg>

            {!readOnly && (
                <div className="absolute top-2 w-full text-center pointer-events-none">
                    <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                        Tap location to place shot
                    </span>
                </div>
            )}
        </div>
    );
};

export default GroundMap;
