import React from 'react';
import { Section, GlossaryTerm, Persona } from '@/lib/types';
import { BookOpen, Sparkles, HelpCircle } from 'lucide-react';

interface ExplanationBlockProps {
  sections: Section[];
  canonicalText?: string;
  isOriginal: boolean;
  persona: Persona;
  glossary?: GlossaryTerm[];
  visualDescription?: string;
  isLoading?: boolean;
}

export default function ExplanationBlock({
  sections,
  canonicalText,
  isOriginal,
  persona,
  glossary,
  visualDescription,
  isLoading = false,
}: ExplanationBlockProps) {
  const isChild = persona.audience === 'child';
  const isA11y = persona.accessibility;

  if (isLoading) {
    return (
      <div className="space-y-4 py-4 animate-pulse">
        <div className="h-5 bg-[var(--rule)]/60 rounded-md w-1/3" />
        <div className="space-y-2">
          <div className="h-4 bg-[var(--rule)]/40 rounded-md w-full" />
          <div className="h-4 bg-[var(--rule)]/40 rounded-md w-5/6" />
          <div className="h-4 bg-[var(--rule)]/40 rounded-md w-4/6" />
        </div>
      </div>
    );
  }

  // If Museum Original mode is toggled, render canonical text in serif
  if (isOriginal) {
    return (
      <div className="space-y-4 pt-2" aria-live="polite">
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--rule)] text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          <BookOpen className="w-4 h-4 text-[var(--ink)]" />
          <span>Museum Canonical Wall Text (Verbatim Archive)</span>
        </div>
        <div className="font-serif text-lg sm:text-[19px] leading-[1.75] text-[var(--ink)] max-measure">
          {canonicalText}
        </div>
      </div>
    );
  }

  // Muse Adapted Sections
  return (
    <div
      className={`space-y-6 pt-2 transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
      aria-live="polite"
    >
      {/* Visual Description First in Accessibility Mode */}
      {isA11y && visualDescription && (
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--accent-soft)]/50 border border-[var(--accent)]/30 space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>1. What This Object Looks Like (Visual Description)</span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--ink)] leading-relaxed font-sans">
            {visualDescription}
          </p>
        </div>
      )}

      {/* Rendered Sections */}
      {sections.map((sec, idx) => (
        <div key={idx} className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-semibold text-[var(--ink)] tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[var(--accent)] rounded-full inline-block flex-shrink-0" />
            <span>{sec.heading}</span>
          </h2>
          <div
            className={`text-[var(--ink)] max-measure ${
              isChild
                ? 'text-lg sm:text-[19px] leading-[1.7]'
                : 'text-base sm:text-[17px] leading-[1.65]'
            }`}
          >
            {sec.body}
          </div>
        </div>
      ))}

      {/* Glossary Chips for Child / Specialist definitions */}
      {glossary && glossary.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[var(--rule)] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Key Word Definitions</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {glossary.map((g, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[var(--paper-raised)] border border-[var(--rule)] text-xs space-y-0.5"
              >
                <div className="font-semibold text-[var(--accent)]">{g.term}</div>
                <div className="text-[var(--ink-muted)]">{g.plainDefinition}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
