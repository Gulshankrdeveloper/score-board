import { useState, useCallback, useEffect } from 'react';

export type CommentaryLang = 'en' | 'hi';

export const useAudioCommentary = () => {
    const [isMuted, setIsMuted] = useState(false);
    const [supported, setSupported] = useState(false);
    const [lang, setLang] = useState<CommentaryLang>('en');

    useEffect(() => {
        if ('speechSynthesis' in window) {
            setSupported(true);
        }
    }, []);

    const speak = useCallback((text: string, forceLang?: CommentaryLang) => {
        if (!supported || isMuted) return;

        // Cancel pending utterances
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1;

        const currentLang = forceLang || lang;
        const voices = window.speechSynthesis.getVoices();

        if (currentLang === 'hi') {
            const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi'));
            if (hindiVoice) {
                utterance.voice = hindiVoice;
                utterance.lang = 'hi-IN';
            }
        } else {
            const indianEngVoice = voices.find(v => v.lang.includes('IN') || v.name.includes('India'));
            if (indianEngVoice) utterance.voice = indianEngVoice;
        }

        window.speechSynthesis.speak(utterance);
    }, [isMuted, supported, lang]);

    const toggleMute = () => setIsMuted(prev => !prev);
    const changeLang = (newLang: CommentaryLang) => setLang(newLang);

    return { speak, isMuted, toggleMute, supported, lang, changeLang };
};
