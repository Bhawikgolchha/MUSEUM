'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artifact } from '@/lib/types';
import { usePersona } from './PersonaProvider';
import { resolveVariant } from '@/lib/variants';
import { 
  ShieldCheck, 
  Landmark, 
  ArrowUpRight, 
  Clock, 
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export interface ArtifactCardProps {
  artifact: Artifact;
  featured?: boolean;
  priority?: boolean;
  staggerIndex?: number;
  className?: string;
}

export default function ArtifactCard({
  artifact,
  featured = false,
  priority = false,
  staggerIndex,
  className = '',
}: ArtifactCardProps) {
  const { persona } = usePersona();

  // Resolve current persona variant for live adaptive narrative preview
  const resolved = resolveVariant(artifact.id, persona);
  const variant = resolved?.variant;

  // Extract a brief 1-sentence teaser tailored to the current persona
  const previewSnippet =
    variant?.sections?.[0]?.body ||
    variant?.sections?.[1]?.body ||
    (persona.accessibility
      ? `Preserved in ${artifact.museumName}. Made of ${artifact.material}. Dated to ${artifact.period}.`
      : artifact.canonicalText.slice(0, 140).trim() + '...');

  const cleanMedium = artifact.material ? artifact.material.split('(')[0].trim() : 'Mixed Media';
  const claimCount = artifact.claims?.length || 6;

  return (
    <Link
      href={`/artifact/${artifact.id}`}
      prefetch={true}
      className={`group flex flex-col bg-[var(--paper-surface)] rounded-2xl border border-[var(--hairline)] hover:border-[var(--accent)]/40 tactile-card museum-card-lift overflow-hidden transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 ${
        featured
          ? 'md:col-span-2 md:flex-row md:items-stretch'
          : 'col-span-1'
      } ${className}`}
      aria-label={`View masterwork: ${artifact.title}, ${artifact.period}, ${artifact.museumName}`}
    >
      {/* Visual Photographic Masterwork Plate */}
      <div
        className={`relative bg-[var(--paper-subtle)] overflow-hidden shrink-0 ${
          featured
            ? 'w-full md:w-1/2 aspect-[4/3] md:aspect-auto min-h-[260px] md:min-h-full border-b md:border-b-0 md:border-r border-[var(--hairline)]'
            : 'w-full aspect-[4/3] border-b border-[var(--hairline)]'
        }`}
      >
        {artifact.imageUrl ? (
          <Image
            src={artifact.imageUrl}
            alt={artifact.curatorAltText || `${artifact.title} - ${artifact.culture}`}
            fill
            sizes={
              featured
                ? '(max-width: 768px) 100vw, 50vw'
                : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            }
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            priority={priority || artifact.id === 'art-001'}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[var(--ink-muted)] bg-[var(--paper-subtle)]">
            <span className="font-serif text-lg text-[var(--ink)] mb-1">
              {artifact.title}
            </span>
            <span className="text-xs">Archival Masterwork Record</span>
          </div>
        )}

        {/* Top-Left: Period Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--ink)]/85 backdrop-blur-xs text-[var(--paper)] text-[10px] font-mono uppercase tracking-wider shadow-xs border border-white/10 flex items-center gap-1">
          <Clock className="w-3 h-3 text-[var(--accent-bronze)]" />
          <span>{artifact.period}</span>
        </div>

        {/* Top-Right: Verified Claim Count Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--paper-surface)]/95 backdrop-blur-md text-[var(--verified)] text-[11px] font-mono font-semibold border border-[var(--hairline)] shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--verified)] shrink-0" />
          <span>100% Verified · {claimCount} Claims</span>
        </div>

        {/* Bottom-Left: Provenance Notice if applicable */}
        {artifact.sensitivityFlags?.includes('contested_provenance') && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-0.5 rounded bg-[var(--notice)]/95 text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Provenance Notice</span>
          </div>
        )}

        {/* Subtle Hover Action Indicator */}
        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[var(--paper-surface)]/90 backdrop-blur-xs text-[var(--ink)] flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 border border-[var(--hairline)] shadow-xs">
          <ArrowUpRight className="w-4 h-4 text-[var(--accent)]" />
        </div>
      </div>

      {/* Card Editorial Body */}
      <div
        className={`p-5 sm:p-6 flex flex-col justify-between flex-grow space-y-3 ${
          featured ? 'md:w-1/2 md:p-6 lg:p-7' : ''
        }`}
      >
        <div className="space-y-2">
          {/* Culture / Dynasty tag */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--accent)] truncate">
              {artifact.culture}
            </span>
            <span className="text-[10px] font-mono text-[var(--ink-faint)]">
              #{artifact.id}
            </span>
          </div>

          {/* Title in Modern Serif Fraunces */}
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[var(--ink)] leading-snug group-hover:text-[var(--accent)] transition-colors duration-200">
            {artifact.title}
          </h3>

          {/* Persona-Adaptive Preview Excerpt */}
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] line-clamp-2 sm:line-clamp-3 leading-relaxed font-sans">
            {previewSnippet}
          </p>
        </div>

        {/* Card Footer: Museum Attribution & Medium Tag */}
        <div className="pt-3.5 border-t border-[var(--hairline)] flex items-center justify-between gap-2 text-xs text-[var(--ink-muted)]">
          <div className="flex items-center gap-1.5 truncate max-w-[60%]">
            <Landmark className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span className="truncate font-medium text-[11px] text-[var(--ink)]" title={artifact.museumName}>
              {artifact.museumName}
            </span>
          </div>

          <div className="shrink-0 px-2 py-0.5 rounded-md bg-[var(--paper-subtle)] border border-[var(--hairline)] text-[11px] font-medium text-[var(--ink)] flex items-center gap-1">
            <Layers className="w-3 h-3 text-[var(--ink-muted)]" />
            <span>{cleanMedium}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
