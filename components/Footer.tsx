'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Landmark, HeartHandshake } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--hairline)] bg-[var(--paper-surface)] py-10 text-xs text-[var(--ink-muted)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Row: Colophon Branding & Navigation */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[var(--hairline)]">
          {/* Brand & Mission */}
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center gap-2 font-serif font-bold text-[var(--ink)] text-base">
              <div className="w-5 h-5 rounded bg-[var(--accent)] text-[var(--paper-surface)] flex items-center justify-center font-serif text-xs font-bold shadow-xs">
                M
              </div>
              <span>DIGITAL MUSE</span>
              <span className="text-[11px] font-sans font-medium text-[var(--ink-faint)]">| Heritage Platform</span>
            </div>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
              Adaptive Indian museum discovery, 6-digit postal ancestral lineage exploration, and audience-tailored interpretation grounded in canonical institutional records.
            </p>
          </div>

          {/* Quick Nav Links */}
          <nav className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-6 text-xs font-medium" aria-label="Footer Navigation">
            <Link href="/" className="text-[var(--ink)] hover:text-[var(--accent)] transition-colors tactile-press py-1">
              Masterworks
            </Link>
            <span className="text-[var(--ink-faint)]">·</span>
            <Link href="/explore" className="text-[var(--ink)] hover:text-[var(--accent)] transition-colors tactile-press py-1">
              Museum Directory
            </Link>
            <span className="text-[var(--ink-faint)]">·</span>
            <Link href="/roots" className="text-[var(--accent-bronze)] font-semibold hover:text-[var(--accent-bronze)]/80 transition-colors tactile-press py-1">
              Ancestral Roots
            </Link>
            <span className="text-[var(--ink-faint)]">·</span>
            <Link href="/add" className="text-[var(--ink)] hover:text-[var(--accent)] transition-colors tactile-press py-1">
              Curator Ingestion
            </Link>
          </nav>
        </div>

        {/* Bottom Row: Institutional Trust Badges & Colophon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-[var(--ink-faint)]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1.5 text-[var(--verified)] bg-[var(--verified-soft)] px-2.5 py-1 rounded-full border border-[var(--verified)]/20 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Mathematical Factual Fidelity</span>
            </div>
            
            <div className="inline-flex items-center gap-1 text-[var(--ink-muted)] bg-[var(--paper-subtle)] px-2.5 py-1 rounded-full border border-[var(--hairline)]">
              <Landmark className="w-3 h-3 text-[var(--accent)]" />
              <span>35+ Verified Indian Institutions</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>National Museum &amp; Cultural Records</span>
            <span>·</span>
            <span>Zero Hallucination Mandate</span>
            <span>·</span>
            <span>&copy; {new Date().getFullYear()} Digital Muse</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
