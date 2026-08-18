'use client';

import React from 'react';
import { Artifact } from '@/lib/types';
import { Landmark, Calendar, Layers, MapPin, ShieldCheck, Sparkles } from 'lucide-react';

interface ArtifactHeaderProps {
  artifact: Artifact;
}

export default function ArtifactHeader({ artifact }: ArtifactHeaderProps) {
  return (
    <header className="space-y-3.5">
      {/* Permanent Repository Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-patina)] uppercase tracking-wider">
          <Landmark className="w-3.5 h-3.5" />
          <span>{artifact.museumName}</span>
        </div>
      </div>

      {/* Fraunces Serif Headline */}
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--ink)] leading-[1.12] tracking-tight">
        {artifact.title}
      </h1>

      {/* Curatorial Header Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--paper-surface)] border border-[var(--hairline)] shadow-2xs font-medium text-[var(--ink)]">
          <Calendar className="w-3.5 h-3.5 text-[var(--accent-patina)]" />
          <span>{artifact.period}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--paper-surface)] border border-[var(--hairline)] shadow-2xs font-medium text-[var(--ink)]">
          <Layers className="w-3.5 h-3.5 text-[var(--accent-bronze)]" />
          <span>{artifact.material}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--paper-surface)] border border-[var(--hairline)] shadow-2xs font-medium text-[var(--ink)]">
          <MapPin className="w-3.5 h-3.5 text-[var(--accent-patina)]" />
          <span>{artifact.culture}</span>
        </span>
      </div>
    </header>
  );
}
