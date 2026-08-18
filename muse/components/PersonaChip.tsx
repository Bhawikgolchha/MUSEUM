'use client';

import React from 'react';
import { usePersona } from './PersonaProvider';
import { formatPersonaDisplay } from '@/lib/personas';
import { SlidersHorizontal } from 'lucide-react';

export default function PersonaChip() {
  const { persona, openContextSheet } = usePersona();

  return (
    <button
      onClick={openContextSheet}
      aria-label={`Current reading context: ${formatPersonaDisplay(persona)}. Tap to change persona.`}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20 hover:border-[var(--accent)]/50 hover:bg-[var(--accent-soft)]/80 transition-all duration-150 active:scale-[0.98] min-h-[44px]"
    >
      <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent)]" />
      <span>
        Reading as: <strong>{formatPersonaDisplay(persona)}</strong>
      </span>
    </button>
  );
}
