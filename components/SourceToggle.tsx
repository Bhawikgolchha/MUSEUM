import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';

interface SourceToggleProps {
  showOriginal: boolean;
  onToggle: (showOriginal: boolean) => void;
  disabled?: boolean;
}

export default function SourceToggle({ showOriginal, onToggle, disabled = false }: SourceToggleProps) {
  return (
    <div className="flex items-center p-1 rounded-xl bg-[var(--rule)]/40 border border-[var(--rule)] w-full sm:w-auto">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(false)}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all min-h-[40px] ${
          !showOriginal
            ? 'bg-[var(--paper-raised)] text-[var(--accent)] shadow-xs border border-[var(--rule)]'
            : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
        }`}
        aria-pressed={!showOriginal}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Muse Version</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(true)}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all min-h-[40px] ${
          showOriginal
            ? 'bg-[var(--paper-raised)] text-[var(--ink)] shadow-xs border border-[var(--rule)] font-serif'
            : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
        }`}
        aria-pressed={showOriginal}
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>Museum Original</span>
      </button>
    </div>
  );
}
