'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface ReadAloudButtonProps {
  textToRead: string;
}

export default function ReadAloudButton({ textToRead }: ReadAloudButtonProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  useEffect(() => {
    // Stop speech when component unmounts or text changes
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [textToRead]);

  if (!isSupported) return null;

  const handleToggle = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95; // Slightly slower, museum audio-guide pace
      utterance.pitch = 1.0;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isPlaying ? 'Stop audio read-aloud' : 'Listen to audio narration'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border min-h-[40px] ${
        isPlaying
          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs animate-pulse'
          : 'bg-[var(--paper-raised)] text-[var(--ink-muted)] hover:text-[var(--ink)] border-[var(--rule)] hover:border-[var(--ink-muted)]/40'
      }`}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-4 h-4" />
          <span>Stop Narration</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-[var(--accent)]" />
          <span>Listen Aloud</span>
        </>
      )}
    </button>
  );
}
