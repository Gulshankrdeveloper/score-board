import { useState, useCallback, useEffect } from 'react';

export const useAudioCommentary = () => {
    const [isMuted, setIsMuted] = useState(false);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            setSupported(true);
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!supported || isMuted) return;

        // Cancel pending utterances
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1; // Slightly faster for excitement
        utterance.pitch = 1;

        // Try to select an Indian English voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('IN') || v.name.includes('India'));
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
    }, [isMuted, supported]);

    const toggleMute = () => setIsMuted(prev => !prev);

    return { speak, isMuted, toggleMute, supported };
};
