import React from 'react';
import { Persona } from '@/lib/types';
import { AUDIENCE_LABELS } from '@/lib/personas';
import { ShieldCheck, Landmark } from 'lucide-react';

interface AttributionBlockProps {
  museumName: string;
  persona: Persona;
  isOriginal: boolean;
}

export default function AttributionBlock({ museumName, persona, isOriginal }: AttributionBlockProps) {
  const audienceLabel = AUDIENCE_LABELS[persona.audience]?.title || 'Adult';

  return (
    <div className="rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] p-3.5 sm:p-4 text-xs leading-relaxed space-y-1 shadow-2xs">
      <div className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
        <Landmark className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
        <span>Based on the museum-provided description by <strong>{museumName}</strong>.</span>
      </div>
      <div className="flex items-center gap-1.5 text-[var(--ink-muted)]">
        <ShieldCheck className="w-3.5 h-3.5 text-[var(--verified)] flex-shrink-0" />
        <span>
          {isOriginal
            ? "Displaying the museum's verbatim archival text."
            : `Adapted by Muse for a ${audienceLabel.toLowerCase()} reader. Facts unchanged.`}
        </span>
      </div>
    </div>
  );
}
