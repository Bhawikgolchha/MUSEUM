import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MuseumWithDistance } from '@/lib/museums';
import { Ticket, Sparkles, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import MuseumDoubtChat from '@/components/MuseumDoubtChat';

interface MuseumCardProps {
  museum: MuseumWithDistance;
  isSelected: boolean;
  onSelect: () => void;
  onOpenDetails: () => void;
}

export default function MuseumCard({
  museum,
  isSelected,
  onSelect,
  onOpenDetails,
}: MuseumCardProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const hasMuseArtifacts = museum.featured_artifacts && museum.featured_artifacts.length > 0;

  return (
    <div
      onClick={onSelect}
      className={`group flex flex-col gap-3 p-4 rounded-2xl bg-[var(--paper-raised)] border transition-all duration-200 cursor-pointer shadow-2xs ${
        isSelected
          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20 shadow-md bg-[var(--accent-soft)]/20'
          : 'border-[var(--rule)] hover:border-[var(--accent)]/40 hover:shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 4:3 Thumbnail */}
        <div className="relative w-full sm:w-36 aspect-[4/3] rounded-xl overflow-hidden bg-[var(--paper)] border border-[var(--rule)] flex-shrink-0">
          {museum.thumbnail_url ? (
            <Image
              src={museum.thumbnail_url}
              alt={museum.name}
              fill
              sizes="(max-width: 640px) 100vw, 150px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-[var(--ink-muted)]">
              {museum.city}
            </div>
          )}

          {/* Distance Pill if available */}
          {museum.distance_km !== undefined && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[var(--ink)]/90 backdrop-blur-xs text-white text-[10px] font-semibold tracking-wide shadow-xs">
              {museum.distance_km} km
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex-1 flex flex-col justify-between space-y-2.5">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                {museum.city}, {museum.state}
              </span>
              {museum.isOpenToday ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--verified)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--verified)]" />
                  Open Today
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--flagged)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--flagged)]" />
                  Closed Today
                </span>
              )}
            </div>

            <h3 className="font-serif text-base sm:text-lg font-semibold text-[var(--ink)] leading-snug group-hover:text-[var(--accent)] transition-colors">
              {museum.name}
            </h3>

            <p className="text-xs text-[var(--ink-muted)] line-clamp-2 mt-1 leading-relaxed">
              {museum.description}
            </p>
          </div>

          {/* Metadata & Actions */}
          <div className="pt-2 border-t border-[var(--rule)]/60 flex flex-wrap items-center justify-between gap-2">
            {/* Fee & Access */}
            <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)]">
              <span className="inline-flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-[var(--ink)]" />
                {museum.entry_fee.is_free ? 'Free' : `₹${museum.entry_fee.domestic_inr}`}
              </span>
              {museum.accessibility_features.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--verified)]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accessible</span>
                </span>
              )}
            </div>

            {/* Action Links */}
            <div className="flex items-center gap-2">
              {/* Ask Doubt Toggle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChatOpen((prev) => !prev);
                }}
                aria-expanded={isChatOpen}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                  isChatOpen
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'bg-[var(--accent-soft)]/50 text-[var(--accent)] hover:bg-[var(--accent-soft)] border border-[var(--accent)]/30'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{isChatOpen ? 'Close Doubt' : 'Ask Doubt'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--ink)] bg-[var(--rule)]/40 hover:bg-[var(--rule)]/80 transition-colors min-h-[36px] cursor-pointer"
              >
                Details
              </button>

              {hasMuseArtifacts && (
                <Link
                  href={`/artifact/${museum.featured_artifacts![0]}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all shadow-2xs min-h-[36px]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explore in Muse</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Museum Doubt Chat Drawer */}
      <MuseumDoubtChat
        museum={museum}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen((prev) => !prev)}
      />
    </div>
  );
}
