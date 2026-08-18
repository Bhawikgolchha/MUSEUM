'use client';

import React, { useState, forwardRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MuseumWithDistance, getMuseumNarrationText } from '@/lib/museums';
import { 
  Ticket, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle, 
  MapPin, 
  Clock, 
  Info,
  Building2
} from 'lucide-react';
import MuseumDoubtChat from '@/components/MuseumDoubtChat';
import ReadAloudButton from '@/components/ReadAloudButton';

export interface MuseumCardProps {
  museum: MuseumWithDistance;
  isSelected?: boolean;
  isHovered?: boolean;
  onSelect?: () => void;
  onHover?: (id: string | null) => void;
  onOpenDetails?: () => void;
  onFocusOnMap?: () => void;
  cardRef?: (el: HTMLDivElement | null) => void;
  className?: string;
}

const MuseumCard = forwardRef<HTMLDivElement, MuseumCardProps>(function MuseumCard(
  {
    museum,
    isSelected = false,
    isHovered = false,
    onSelect,
    onHover,
    onOpenDetails,
    onFocusOnMap,
    className = '',
  },
  ref
) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const hasMuseArtifacts = museum.featured_artifacts && museum.featured_artifacts.length > 0;
  const narrationText = getMuseumNarrationText(museum);

  // Format category for human-readable label
  const formatCategory = (cat: string) => {
    return cat
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div
      ref={ref}
      onClick={onSelect}
      onMouseEnter={() => onHover && onHover(museum.id)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`group flex flex-col gap-3.5 p-4 sm:p-5 rounded-2xl bg-[var(--paper-raised)] border transition-all duration-300 cursor-pointer tactile-card museum-card-lift ${
        isSelected || isHovered
          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20 shadow-museum bg-[var(--accent-soft)]/20'
          : 'border-[var(--hairline)] hover:border-[var(--accent)]/40 hover:shadow-card'
      } ${className}`}
      role="article"
      aria-label={`Museum: ${museum.name}`}
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        {/* 4:3 Photographic Thumbnail */}
        <div className="relative w-full sm:w-44 sm:min-w-[176px] aspect-[4/3] rounded-xl overflow-hidden bg-[var(--paper-subtle)] border border-[var(--hairline)] shrink-0">
          {museum.thumbnail_url ? (
            <Image
              src={museum.thumbnail_url}
              alt={museum.name}
              fill
              sizes="(max-width: 640px) 100vw, 176px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-xs text-[var(--ink-muted)]">
              <Building2 className="w-6 h-6 text-[var(--accent)]/50 mb-1" />
              <span>{museum.city}</span>
            </div>
          )}

          {/* Distance Pill if available */}
          {museum.distance_km !== undefined && (
            <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[var(--ink)]/90 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide shadow-xs flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-[var(--accent-bronze)]" />
              <span>{museum.distance_km} km</span>
            </div>
          )}

          {/* Category Chip in thumbnail */}
          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[var(--paper-raised)]/95 backdrop-blur-md text-[var(--ink)] text-[10px] font-medium border border-[var(--hairline)] shadow-xs">
            {formatCategory(museum.category)}
          </div>
        </div>

        {/* Museum Body & Editorial Overview */}
        <div className="flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            {/* Header: Location & Live Open/Closed Status */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                <MapPin className="w-3 h-3 text-[var(--accent)]" />
                <span>
                  {museum.city}, {museum.state}
                </span>
              </div>

              {museum.isOpenToday ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--verified-soft)] text-[var(--verified)] border border-[var(--verified)]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--verified)] animate-pulse" />
                  <span>Open Today</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--flagged-soft)] text-[var(--flagged)] border border-[var(--flagged)]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--flagged)]" />
                  <span>Closed Today</span>
                </span>
              )}
            </div>

            {/* Museum Title in Fraunces Serif */}
            <h3 className="font-serif text-base sm:text-lg font-semibold text-[var(--ink)] leading-snug group-hover:text-[var(--accent)] transition-colors duration-200">
              {museum.name}
            </h3>

            {/* Concise Description */}
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
              {museum.description}
            </p>
          </div>

          {/* Metadata Badges & Timings */}
          <div className="pt-2 border-t border-[var(--hairline)] flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Fee & Accessibility & Timings */}
            <div className="flex flex-wrap items-center gap-3 text-[var(--ink-muted)]">
              {/* Ticket Fee */}
              <span className="inline-flex items-center gap-1 font-medium text-[var(--ink)]">
                <Ticket className="w-3.5 h-3.5 text-[var(--accent-bronze)]" />
                <span>
                  {museum.entry_fee.is_free ? (
                    <strong className="text-[var(--verified)]">Free Entry</strong>
                  ) : (
                    `₹${museum.entry_fee.domestic_inr} entry`
                  )}
                </span>
              </span>

              {/* Timings summary */}
              {museum.opening_hours?.timings && (
                <span className="hidden md:inline-flex items-center gap-1 text-[var(--ink-muted)]">
                  <Clock className="w-3 h-3 text-[var(--ink-muted)]" />
                  <span>{museum.opening_hours.timings}</span>
                </span>
              )}

              {/* Accessibility Feature Indicator */}
              {museum.accessibility_features && museum.accessibility_features.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--verified)] bg-[var(--verified-soft)] px-2 py-0.5 rounded-md border border-[var(--verified)]/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Accessible</span>
                </span>
              )}
            </div>

            {/* Interactive Action Controls */}
            <div
              className="flex flex-wrap items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Text-to-Speech Narration */}
              <ReadAloudButton textToRead={narrationText} />

              {/* Ask Doubt AI Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChatOpen((prev) => !prev);
                }}
                aria-expanded={isChatOpen}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[36px] cursor-pointer tactile-press ${
                  isChatOpen
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent-soft)]/80 border border-[var(--accent)]/25'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{isChatOpen ? 'Close Doubt' : 'Ask Doubt'}</span>
              </button>

              {/* Focus on Map (if available) */}
              {onFocusOnMap && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusOnMap();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--accent)] bg-[var(--accent-soft)]/50 hover:bg-[var(--accent-soft)] border border-[var(--accent)]/20 transition-colors min-h-[36px] cursor-pointer tactile-press"
                  title="Focus pinpoint on Interactive India Map"
                >
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>On Map</span>
                </button>
              )}

              {/* Details Modal Trigger */}
              {onOpenDetails && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetails();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--ink)] bg-[var(--paper-subtle)] hover:bg-[var(--paper-subtle)]/80 border border-[var(--hairline-strong)] transition-colors min-h-[36px] cursor-pointer tactile-press"
                >
                  <Info className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                  <span>Details</span>
                </button>
              )}

              {/* Direct Muse Artifact Masterwork Link */}
              {hasMuseArtifacts && (
                <Link
                  href={`/artifact/${museum.featured_artifacts![0]}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-patina)]/90 transition-all shadow-xs min-h-[36px] tactile-press"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explore Masterwork</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Museum Doubt Chat Drawer */}
      <MuseumDoubtChat
        museum={museum}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen((prev) => !prev)}
      />
    </div>
  );
});

export default MuseumCard;
