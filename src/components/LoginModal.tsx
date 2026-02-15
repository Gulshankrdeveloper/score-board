import React, { useState, useEffect } from 'react';
import { X, Lock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
}

const PIN = "1234";

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [inputPin, setInputPin] = useState('');
    const [error, setError] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setInputPin('');
            setError(false);
        }
    }, [isOpen]);

    const handleNumberClick = (num: string) => {
        if (inputPin.length < 4) {
            setInputPin(prev => prev + num);
            setError(false);
        }
    };

    const handleBackspace = () => {
        setInputPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const handleSubmit = () => {
        if (inputPin === PIN) {
            onLogin();
            onClose();
        } else {
            setError(true);
            setInputPin('');
            // Shake animation logic could go here
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-white font-bold">
                            <Lock size={16} className="text-blue-500" />
                            <span>Admin Access</span>
                        </div>
                        <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Display */}
                    <div className="p-6 flex flex-col items-center gap-4">
                        <div className="text-sm text-neutral-400">Enter 4-digit PIN</div>

                        <div className="flex gap-3 mb-2">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < inputPin.length
                                        ? (error ? 'bg-red-500' : 'bg-blue-500')
                                        : 'bg-neutral-800 border border-neutral-700'
                                    }`} />
                            ))}
                        </div>

                        {error && <div className="text-xs text-red-500 font-bold animate-pulse">Incorrect PIN. Try 1234.</div>}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-px bg-neutral-800 border-t border-neutral-800">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num.toString())}
                                className="bg-neutral-900 hover:bg-neutral-800 p-4 text-xl font-bold text-white transition-colors active:bg-neutral-700"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={handleBackspace}
                            className="bg-neutral-900 hover:bg-neutral-800 p-4 text-sm font-bold text-neutral-400 transition-colors active:bg-neutral-700"
                        >
                            DEL
                        </button>
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="bg-neutral-900 hover:bg-neutral-800 p-4 text-xl font-bold text-white transition-colors active:bg-neutral-700"
                        >
                            0
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="bg-blue-600 hover:bg-blue-500 p-4 text-white transition-colors flex items-center justify-center active:bg-blue-700"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LoginModal;
