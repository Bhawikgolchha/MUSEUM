'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePersona } from './PersonaProvider';
import { formatPersonaDisplay } from '@/lib/personas';
import { 
  Grid, 
  Compass, 
  Heart, 
  PlusCircle, 
  SlidersHorizontal,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Collection', href: '/', icon: Grid },
  { name: 'Explore Heritage', href: '/explore', icon: Compass },
  { name: 'Ancestral Roots', href: '/roots', icon: Heart, accent: true },
  { name: 'Curator Studio', href: '/add', icon: PlusCircle },
];

export default function Navbar() {
  const pathname = usePathname();
  const { persona, openContextSheet } = usePersona();

  return (
    <header className="sticky top-0 z-40 bg-[var(--paper)]/95 backdrop-blur-md border-b border-[var(--hairline)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Mark & Identity */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none tactile-press"
            aria-label="Digital Muse Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--paper-surface)] flex items-center justify-center font-serif text-lg font-bold shadow-xs border border-[var(--accent-patina)] group-hover:scale-105 transition-transform">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[var(--ink)] block leading-none">
                  DIGITAL MUSE
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
                  <ShieldCheck className="w-2.5 h-2.5 text-[var(--accent)]" />
                  ASI Verified
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-[var(--ink-muted)] tracking-wider uppercase font-medium">
                Adaptive Heritage &amp; Lineage
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 pl-2" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              
              if (item.accent) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all min-h-[36px] tactile-press ${
                      isActive
                        ? 'bg-[var(--accent-bronze-soft)] text-[var(--accent-bronze)] border border-[var(--accent-bronze)]/40 shadow-xs'
                        : 'text-[var(--accent-bronze)] bg-[var(--accent-bronze-soft)]/60 hover:bg-[var(--accent-bronze-soft)] border border-[var(--accent-bronze)]/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 fill-[var(--accent-bronze)] text-[var(--accent-bronze)]" />
                    <span>{item.name}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[36px] tactile-press ${
                    isActive
                      ? 'bg-[var(--paper-subtle)] text-[var(--ink)] border border-[var(--hairline-strong)] font-bold shadow-xs'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-subtle)]/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)]'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Persona Mode Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={openContextSheet}
            type="button"
            aria-label={`Current reading persona: ${formatPersonaDisplay(persona)}. Tap to switch audience mode.`}
            className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/25 hover:border-[var(--accent)]/50 hover:bg-[var(--accent-soft)]/90 transition-all min-h-[38px] sm:min-h-[40px] tactile-press cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span className="hidden xs:inline">
              Reading as: <strong>{formatPersonaDisplay(persona)}</strong>
            </span>
            <span className="xs:hidden font-semibold">
              {formatPersonaDisplay(persona)}
            </span>
            {persona.accessibility && (
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] inline-block" title="Accessibility Active" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Secondary Navigation Bar */}
      <nav 
        className="md:hidden flex items-center justify-around border-t border-[var(--hairline)] py-1.5 bg-[var(--paper-surface)] px-2 text-xs font-semibold"
        aria-label="Mobile Navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          if (item.accent) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-md min-h-[44px] transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-bronze-soft)] text-[var(--accent-bronze)] font-bold'
                    : 'text-[var(--accent-bronze)]'
                }`}
              >
                <Icon className="w-4 h-4 fill-[var(--accent-bronze)] text-[var(--accent-bronze)]" />
                <span>{item.name.replace('Ancestral ', '')}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-md min-h-[44px] transition-colors ${
                isActive
                  ? 'bg-[var(--paper-subtle)] text-[var(--ink)] font-bold'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent)]' : ''}`} />
              <span>{item.name.replace('Explore ', '').replace(' Studio', '')}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
