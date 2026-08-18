import React from 'react';
import Image from 'next/image';
import { Artifact } from '@/lib/types';
import { Landmark, Calendar, Layers, MapPin } from 'lucide-react';

interface ArtifactHeaderProps {
  artifact: Artifact;
}

export default function ArtifactHeader({ artifact }: ArtifactHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Hero Image */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[var(--paper)] border border-[var(--rule)] shadow-sm">
        {artifact.imageUrl ? (
          <Image
            src={artifact.imageUrl}
            alt={artifact.curatorAltText || artifact.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[var(--paper)]">
            <h2 className="font-serif text-2xl text-[var(--ink)] mb-2">{artifact.title}</h2>
            <p className="text-sm text-[var(--ink-muted)]">No image available for this object.</p>
          </div>
        )}
      </div>

      {/* Title and Metadata */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent)] mb-1.5 uppercase tracking-wider">
          <Landmark className="w-3.5 h-3.5" />
          <span>{artifact.museumName}</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-[var(--ink)] leading-tight tracking-tight">
          {artifact.title}
        </h1>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-[var(--ink-muted)]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--rule)]/40 border border-[var(--rule)]">
            <Calendar className="w-3 h-3 text-[var(--ink)]" />
            {artifact.period}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--rule)]/40 border border-[var(--rule)]">
            <Layers className="w-3 h-3 text-[var(--ink)]" />
            {artifact.material}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--rule)]/40 border border-[var(--rule)]">
            <MapPin className="w-3 h-3 text-[var(--ink)]" />
            {artifact.culture}
          </span>
        </div>

        {/* Provenance Line */}
        <div className="mt-3 p-2.5 rounded-lg bg-[var(--paper-raised)] border border-[var(--rule)] text-xs text-[var(--ink-muted)] leading-relaxed">
          <strong className="text-[var(--ink)] font-semibold">Provenance: </strong>
          {artifact.provenanceLine}
        </div>
      </div>
    </div>
  );
}
