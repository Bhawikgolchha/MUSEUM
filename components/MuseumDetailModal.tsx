'use client';

import React from 'react';
import Sheet from './ui/Sheet';
import Image from 'next/image';
import Link from 'next/link';
import { MuseumWithDistance } from '@/lib/museums';
import { Landmark, MapPin, Clock, Ticket, Phone, Globe, Sparkles, Check, CheckCircle2, ChevronRight } from 'lucide-react';

interface MuseumDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  museum: MuseumWithDistance | null;
}

export default function MuseumDetailModal({
  isOpen,
  onClose,
  museum,
}: MuseumDetailModalProps) {
  if (!museum) return null;

  const hasMuseArtifacts = museum.featured_artifacts && museum.featured_artifacts.length > 0;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={museum.name}
      subtitle={`${museum.city}, ${museum.state} · ${museum.category.replace(/_/g, ' ').toUpperCase()}`}
    >
      {/* Visual Gallery Thumbnail */}
      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[var(--paper)] border border-[var(--rule)]">
        <Image
          src={museum.thumbnail_url || '/images/art-001.svg'}
          alt={museum.name}
          fill
          className="object-cover"
        />
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-[var(--ink)]/90 text-white text-xs font-semibold backdrop-blur-xs">
          {museum.governance.replace(/_/g, ' ').toUpperCase()}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          About The Institution
        </h3>
        <p className="text-sm text-[var(--ink)] leading-relaxed">
          {museum.description}
        </p>
      </div>

      {/* Direct Digital Muse Integration Callout */}
      {hasMuseArtifacts && (
        <div className="p-4 rounded-xl bg-[var(--accent-soft)]/60 border border-[var(--accent)]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--accent)] text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--ink)]">
                Digital Muse Verified Exhibits Available
              </div>
              <div className="text-xs text-[var(--ink-muted)]">
                Explore masterworks from this museum with 100% verified adaptive interpretation.
              </div>
            </div>
          </div>
          <Link
            href={`/artifact/${museum.featured_artifacts![0]}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all shadow-xs whitespace-nowrap min-h-[40px]"
          >
            <span>Launch In Muse</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Key Visitor Details (Hours, Fees, Access) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Opening Hours */}
        <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--rule)] space-y-1.5 text-xs">
          <div className="font-semibold text-[var(--ink)] flex items-center gap-1.5 text-sm">
            <Clock className="w-4 h-4 text-[var(--accent)]" />
            <span>Opening Hours</span>
          </div>
          <div className="text-[var(--ink)] font-medium">{museum.opening_hours.timings}</div>
          <div className="text-[var(--ink-muted)]">
            Closed on: <strong>{museum.opening_hours.closed_on.join(', ') || 'None'}</strong>
          </div>
        </div>

        {/* Entry Tickets */}
        <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--rule)] space-y-1.5 text-xs">
          <div className="font-semibold text-[var(--ink)] flex items-center gap-1.5 text-sm">
            <Ticket className="w-4 h-4 text-[var(--accent)]" />
            <span>Entry Tickets</span>
          </div>
          {museum.entry_fee.is_free ? (
            <div className="text-[var(--verified)] font-bold text-sm">Free Entry</div>
          ) : (
            <div className="text-[var(--ink)]">
              Domestic: <strong>₹{museum.entry_fee.domestic_inr}</strong> · Foreign: <strong>₹{museum.entry_fee.foreign_inr}</strong>
            </div>
          )}
          <div className="text-[var(--ink-muted)]">Photography and special exhibitions may require additional permits.</div>
        </div>
      </div>

      {/* Accessibility Features */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-2.5">
          Accessibility &amp; Amenities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {museum.accessibility_features.map((feat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--paper)] border border-[var(--rule)] text-xs text-[var(--ink)]"
            >
              <CheckCircle2 className="w-4 h-4 text-[var(--verified)] flex-shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Address & Contact */}
      <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--rule)] space-y-2 text-xs">
        <div className="flex items-start gap-2 text-[var(--ink)]">
          <MapPin className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <span>{museum.address}, {museum.city}, {museum.state} — {museum.pincode}</span>
        </div>
        {museum.contact.phone && (
          <div className="flex items-center gap-2 text-[var(--ink-muted)]">
            <Phone className="w-3.5 h-3.5 text-[var(--ink)]" />
            <span>{museum.contact.phone}</span>
          </div>
        )}
        {museum.contact.website && (
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
            <a
              href={museum.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline font-semibold"
            >
              Visit Official Website
            </a>
          </div>
        )}
      </div>

      {/* Close button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--ink)]/90 transition-colors shadow-sm min-h-[44px]"
        >
          Close Details
        </button>
      </div>
    </Sheet>
  );
}
