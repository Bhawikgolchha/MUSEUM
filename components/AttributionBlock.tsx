'use client';

import React from 'react';
import { Persona } from '@/lib/types';
import { AUDIENCE_LABELS } from '@/lib/personas';
import { ShieldCheck, Landmark } from 'lucide-react';

interface AttributionBlockProps {
  museumName: string;
  persona: Persona;
  isOriginal: boolean;
}

export default function AttributionBlock({
  museumName,
  persona,
  isOriginal,
}: AttributionBlockProps) {
  const audienceLabel = AUDIENCE_LABELS[persona.audience]?.title || 'Adult';
  const currentPersonaMode = persona.accessibility ? 'accessibility' : persona.audience;

  return (
    <div className="rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] p-4 text-xs leading-relaxed space-y-1.5 shadow-2xs">
      <div className="flex items-center gap-2 font-medium text-[var(--ink)]">
        <Landmark className="w-3.5 h-3.5 text-[var(--accent-patina)] flex-shrink-0" />
        <span>
          Based on canonical curatorial documentation by{' '}
          <strong className="text-[var(--ink)] font-semibold">{museumName}</strong>.
        </span>
      </div>
      <div className="flex items-center gap-2 text-[var(--ink-muted)]">
        <ShieldCheck className="w-3.5 h-3.5 text-[var(--verified)] flex-shrink-0" />
        <span>
          {isOriginal
            ? "Displaying the museum's verbatim archival wall text (primary source record)."
            : `Adapted by Digital Muse for ${
                currentPersonaMode === 'accessibility'
                  ? 'accessible screen-reading & spatial clarity'
                  : `${audienceLabel.toLowerCase()} exploration`
              }. 100% atomic claims mathematically verified.`}
        </span>
      </div>
    </div>
  );
}
