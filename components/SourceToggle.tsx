'use client';

import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';

interface SourceToggleProps {
  showOriginal: boolean;
  onToggle: (showOriginal: boolean) => void;
  disabled?: boolean;
}

export default function SourceToggle({
  showOriginal,
  onToggle,
  disabled = false,
}: SourceToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Interpretation source mode"
      className="inline-flex p-1 rounded-xl bg-[var(--paper-subtle)] border border-[var(--hairline)] shadow-2xs w-full sm:w-auto relative"
    >
      {/* Adapted Persona Voice Tab */}
      <button
        role="tab"
        id="tab-adaptive-voice"
        aria-selected={!showOriginal}
        aria-controls="panel-interpretation"
        type="button"
        disabled={disabled}
        onClick={() => onToggle(false)}
        className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all min-h-[40px] tactile-press ${
          !showOriginal
            ? 'bg-[var(--paper-surface)] text-[var(--accent-patina)] shadow-xs border border-[var(--hairline-strong)]'
            : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-black/[0.02]'
        }`}
      >
        <Sparkles
          className={`w-3.5 h-3.5 ${
            !showOriginal ? 'text-[var(--accent-patina)]' : 'text-[var(--ink-muted)]'
          }`}
        />
        <span>Adapted Voice</span>
      </button>

      {/* Verbatim Canonical Museum Record Tab (0ms Switch) */}
      <button
        role="tab"
        id="tab-canonical-record"
        aria-selected={showOriginal}
        aria-controls="panel-interpretation"
        type="button"
        disabled={disabled}
        onClick={() => onToggle(true)}
        className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all min-h-[40px] tactile-press ${
          showOriginal
            ? 'bg-[var(--paper-surface)] text-[var(--ink)] shadow-xs border border-[var(--hairline-strong)]'
            : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-black/[0.02]'
        }`}
      >
        <BookOpen
          className={`w-3.5 h-3.5 ${
            showOriginal ? 'text-[var(--accent-bronze)]' : 'text-[var(--ink-muted)]'
          }`}
        />
        <span>Museum Original (0ms)</span>
      </button>
    </div>
  );
}
