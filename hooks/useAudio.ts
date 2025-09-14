import { useCallback, useRef } from 'react';

export const useAudio = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (typeof window !== 'undefined' && !audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
            }
        }
        return audioContextRef.current;
    }, []);

    const playSound = useCallback((type: 'success' | 'failure') => {
        const audioContext = getAudioContext();
        if (!audioContext) return;

        // Resume context if it's suspended (e.g., due to browser autoplay policies)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);

        if (type === 'success') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.1);
        } else {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.15);
        }
        
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }, [getAudioContext]);
    
    const playSuccessSound = useCallback(() => playSound('success'), [playSound]);
    const playFailureSound = useCallback(() => playSound('failure'), [playSound]);

    return { playSuccessSound, playFailureSound };
};
