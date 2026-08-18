'use client';

import React from 'react';
import { usePersona } from './PersonaProvider';
import { Persona } from '@/lib/types';
import { 
  Sparkles, 
  GraduationCap, 
  Eye, 
  BookOpen, 
  ShieldCheck, 
  Zap,
  SlidersHorizontal
} from 'lucide-react';

export type PersonaModeId = 'adult' | 'child' | 'specialist' | 'accessibility';

export interface PersonaOption {
  id: PersonaModeId;
  title: string;
  shortLabel: string;
  subtitle: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  targetPersona: Persona;
}

export const PERSONA_MODES: PersonaOption[] = [
  {
    id: 'adult',
    title: 'Adult (General)',
    shortLabel: 'Adult',
    subtitle: 'Conversational, engaging, and rich in cultural nuance.',
    tag: 'Standard Depth',
    icon: BookOpen,
    targetPersona: { audience: 'adult', depth: 'standard', accessibility: false },
  },
  {
    id: 'child',
    title: 'Child (8–11)',
    shortLabel: 'Child',
    subtitle: 'Curious, wonder-driven with lively spotting challenges.',
    tag: 'Engaging & Simple',
    icon: Sparkles,
    targetPersona: { audience: 'child', depth: 'standard', accessibility: false },
  },
  {
    id: 'specialist',
    title: 'Specialist (Academic)',
    shortLabel: 'Specialist',
    subtitle: 'Historiographical rigor, Sanskrit terms, and preserved hedges.',
    tag: 'Epigraphic Depth',
    icon: GraduationCap,
    targetPersona: { audience: 'specialist', depth: 'deep', accessibility: false },
  },
  {
    id: 'accessibility',
    title: 'Accessibility (Plain & Clear)',
    shortLabel: 'Plain & Clear',
    subtitle: 'High contrast semantics, plain language, and screen-reader ready.',
    tag: 'WCAG AAA Clear',
    icon: Eye,
    targetPersona: { audience: 'adult', depth: 'standard', accessibility: true },
  },
];

export interface PersonaSwitcherProps {
  className?: string;
  variant?: 'floating' | 'inline' | 'hero' | 'compact';
  showDescriptions?: boolean;
  showGuarantee?: boolean;
}

export default function PersonaSwitcher({
  className = '',
  variant = 'hero',
  showDescriptions = true,
  showGuarantee = true,
}: PersonaSwitcherProps) {
  const { persona, setPersona, openContextSheet } = usePersona();

  // Determine current active mode
  const currentModeId: PersonaModeId = persona.accessibility
    ? 'accessibility'
    : (persona.audience as PersonaModeId);

  const handleSelectMode = (option: PersonaOption) => {
    setPersona(option.targetPersona);
  };

  const activeOption = PERSONA_MODES.find((m) => m.id === currentModeId) || PERSONA_MODES[0];

  if (variant === 'floating') {
    return (
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[calc(100%-2rem)] mx-auto p-1.5 rounded-2xl bg-[var(--paper-surface)]/95 backdrop-blur-md border border-[var(--hairline-strong)] shadow-museum transition-all ${className}`}
        role="radiogroup"
        aria-label="Floating Audience Persona Mode Switcher"
      >
        <div className="flex items-center justify-between gap-1">
          {PERSONA_MODES.map((option) => {
            const Icon = option.icon;
            const isActive = currentModeId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => handleSelectMode(option)}
                aria-label={`Switch persona to ${option.title}`}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer tactile-press min-h-[40px] ${
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-subtle)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[var(--accent)]'}`} />
                <span className="truncate">{option.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] p-4 sm:p-5 shadow-card ${className}`}
      role="radiogroup"
      aria-label="In-situ Audience Persona Mode Switcher"
    >
      {/* Header bar of Persona Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--hairline)]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--accent)]">
            In-Situ Persona Lens
          </span>
          <span className="text-[11px] text-[var(--ink-muted)]">· Instant adaptive rewriting</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
            <Zap className="w-3 h-3 text-[var(--accent)]" />
            0ms Switch Latency
          </span>
          <button
            type="button"
            onClick={openContextSheet}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-subtle)] border border-[var(--hairline)] cursor-pointer transition-colors"
            title="Custom Depth & Tone"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Persona Selection Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PERSONA_MODES.map((option) => {
          const Icon = option.icon;
          const isActive = currentModeId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => handleSelectMode(option)}
              className={`group flex flex-col items-start text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer min-h-[56px] tactile-press ${
                isActive
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-museum ring-2 ring-[var(--accent)]/20'
                  : 'bg-[var(--paper-subtle)] text-[var(--ink)] border-[var(--hairline)] hover:border-[var(--accent)]/40 hover:bg-[var(--paper)]'
              }`}
            >
              <div className="w-full flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-[var(--accent)]'
                    }`}
                  />
                  <span className="text-xs font-semibold tracking-tight">{option.shortLabel}</span>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                )}
              </div>

              {showDescriptions && (
                <span
                  className={`text-[10px] line-clamp-1 transition-colors ${
                    isActive ? 'text-white/85' : 'text-[var(--ink-muted)]'
                  }`}
                >
                  {option.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Persona Live Description Callout */}
      {showDescriptions && (
        <div className="mt-3.5 pt-3 border-t border-[var(--hairline)]/70 flex items-start sm:items-center justify-between gap-3 text-xs text-[var(--ink-muted)]">
          <div className="flex items-center gap-2">
            <span className="font-serif italic font-semibold text-[var(--ink)]">
              {activeOption.title}:
            </span>
            <span className="text-[11px] text-[var(--ink-muted)] line-clamp-1 sm:line-clamp-none">
              {activeOption.subtitle}
            </span>
          </div>
          <span className="shrink-0 text-[10px] font-mono font-medium text-[var(--accent)] uppercase tracking-wider hidden sm:inline">
            Active Mode
          </span>
        </div>
      )}
    </div>
  );
}
