'use client';

import React from 'react';
import { usePersona } from './PersonaProvider';
import Sheet from './ui/Sheet';
import { Audience, Depth } from '@/lib/types';
import { AUDIENCE_LABELS, DEPTH_LABELS } from '@/lib/personas';
import { Check, Sparkles, User, GraduationCap, Clock, Eye } from 'lucide-react';

export default function ContextSheet() {
  const {
    persona,
    setAudience,
    setDepth,
    toggleAccessibility,
    isContextSheetOpen,
    closeContextSheet,
  } = usePersona();

  const audienceIcons: Record<Audience, React.ReactNode> = {
    adult: <User className="w-4 h-4" />,
    child: <Sparkles className="w-4 h-4" />,
    specialist: <GraduationCap className="w-4 h-4" />,
  };

  return (
    <Sheet
      isOpen={isContextSheetOpen}
      onClose={closeContextSheet}
      title="Visitor Context"
      subtitle="Select who is reading. Muse adapts vocabulary and framing with 100% factual fidelity."
    >
      {/* 1. Who is reading? */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] mb-2.5">
          1. Who is reading?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((key) => {
            const isSelected = persona.audience === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setAudience(key)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all min-h-[44px] ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]/50 text-[var(--ink)] shadow-sm'
                    : 'border-[var(--rule)] bg-[var(--paper-raised)] hover:border-[var(--ink-muted)]/40 text-[var(--ink-muted)]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                    <span className={isSelected ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)]'}>
                      {audienceIcons[key]}
                    </span>
                    {AUDIENCE_LABELS[key].title}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[var(--accent)] stroke-[2.5]" />}
                </div>
                <p className="text-xs text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
                  {AUDIENCE_LABELS[key].description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Reading Depth */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] mb-2.5">
          2. Interpretation Depth
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(Object.keys(DEPTH_LABELS) as Depth[]).map((key) => {
            const isSelected = persona.depth === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDepth(key)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all min-h-[44px] ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]/50 text-[var(--ink)] shadow-sm'
                    : 'border-[var(--rule)] bg-[var(--paper-raised)] hover:border-[var(--ink-muted)]/40 text-[var(--ink-muted)]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
                    <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)]'}`} />
                    {DEPTH_LABELS[key].title}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[var(--accent)] stroke-[2.5]" />}
                </div>
                <p className="text-xs text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
                  {DEPTH_LABELS[key].description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Accessibility Mode Toggle */}
      <div className="pt-2 border-t border-[var(--rule)]">
        <div
          onClick={toggleAccessibility}
          className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all ${
            persona.accessibility
              ? 'border-[var(--accent)] bg-[var(--accent-soft)]/40'
              : 'border-[var(--rule)] bg-[var(--paper-raised)] hover:border-[var(--ink-muted)]/40'
          }`}
        >
          <div className="flex gap-3">
            <div className={`p-2 rounded-lg ${persona.accessibility ? 'bg-[var(--accent)] text-white' : 'bg-[var(--rule)] text-[var(--ink-muted)]'}`}>
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--ink)] flex items-center gap-2">
                Accessibility &amp; Screen-Reader Mode
                {persona.accessibility && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[var(--accent)] text-white">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
                Prioritizes visual descriptions first, eliminates layout-relative language, and enables browser speech synthesis read-aloud.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={persona.accessibility}
            onChange={() => {}} // Handled by parent div
            className="mt-1 w-5 h-5 accent-[var(--accent)] rounded cursor-pointer"
            aria-label="Toggle accessibility mode"
          />
        </div>
      </div>

      {/* Close button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={closeContextSheet}
          className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors shadow-sm active:scale-[0.99] min-h-[44px]"
        >
          Apply &amp; Continue Reading
        </button>
      </div>
    </Sheet>
  );
}
