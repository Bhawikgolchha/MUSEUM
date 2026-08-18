'use client';

import React from 'react';
import { Section, GlossaryTerm, Persona } from '@/lib/types';
import { BookOpen, Sparkles, HelpCircle, Glasses } from 'lucide-react';

interface ExplanationBlockProps {
  sections: Section[];
  canonicalText?: string;
  isOriginal: boolean;
  persona: Persona;
  glossary?: GlossaryTerm[];
  visualDescription?: string;
  isLoading?: boolean;
  activeSentenceText?: string | null;
}

export default function ExplanationBlock({
  sections,
  canonicalText,
  isOriginal,
  persona,
  glossary,
  visualDescription,
  isLoading = false,
  activeSentenceText = null,
}: ExplanationBlockProps) {
  const isChild = persona.audience === 'child';
  const isA11y = persona.accessibility;

  // Helper to render paragraph with optional active sentence highlighting
  const renderTrackedText = (text: string) => {
    if (!activeSentenceText) return text;

    // Split text into sentences for tracking highlight
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
    return sentences.map((sentence, idx) => {
      const isCurrentSentence =
        activeSentenceText.trim().length > 5 &&
        (sentence.includes(activeSentenceText.trim()) ||
          activeSentenceText.trim().includes(sentence.trim()));

      return (
        <span
          key={idx}
          className={`transition-colors duration-200 ${
            isCurrentSentence
              ? 'bg-[var(--accent-soft)] text-[var(--accent-patina)] px-1 py-0.5 rounded-sm font-medium'
              : ''
          }`}
        >
          {sentence}
        </span>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4 animate-pulse">
        <div className="h-6 bg-[var(--paper-subtle)] rounded-md w-1/3" />
        <div className="space-y-2.5">
          <div className="h-4 bg-[var(--paper-subtle)] rounded-md w-full" />
          <div className="h-4 bg-[var(--paper-subtle)] rounded-md w-5/6" />
          <div className="h-4 bg-[var(--paper-subtle)] rounded-md w-4/6" />
        </div>
      </div>
    );
  }

  // Museum Canonical Record (Verbatim Archival Mode)
  if (isOriginal) {
    return (
      <div
        id="panel-interpretation"
        className="space-y-4 pt-1 animate-in fade-in duration-200 min-h-[260px]"
        aria-live="polite"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)] text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--accent-bronze)]" />
            <span>Museum Archival Wall Text (Verbatim Record)</span>
          </span>
          <span className="font-mono text-[10px] text-[var(--accent-bronze)] px-2 py-0.5 rounded-full bg-[var(--accent-bronze-soft)]">
            Primary Source
          </span>
        </div>
        <div className="font-serif text-lg sm:text-[20px] leading-[1.8] text-[var(--ink)] max-measure">
          {canonicalText ? renderTrackedText(canonicalText) : 'No archival record available.'}
        </div>
      </div>
    );
  }

  // Muse Adaptive Voice Sections
  return (
    <div
      id="panel-interpretation"
      className="space-y-6 pt-1 animate-in fade-in duration-200 min-h-[260px]"
      aria-live="polite"
    >
      {/* Visual Description & Spatial Orientation in Accessibility Mode */}
      {isA11y && visualDescription && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--accent-soft)]/60 border border-[var(--accent-patina)]/30 space-y-2 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-patina)] flex items-center gap-2">
            <Glasses className="w-4 h-4" />
            <span>Visual Description & Spatial Orientation</span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--ink)] leading-relaxed font-sans">
            {renderTrackedText(visualDescription)}
          </p>
        </div>
      )}

      {/* Narrative Interpretation Sections */}
      {sections.map((sec, idx) => (
        <section key={idx} className="space-y-2.5">
          <h2 className="text-lg sm:text-xl font-serif font-semibold text-[var(--ink)] tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-patina)] inline-block flex-shrink-0" />
            <span>{sec.heading}</span>
          </h2>
          <div
            className={`text-[var(--ink)] max-measure font-sans ${
              isChild
                ? 'text-lg sm:text-[19px] leading-[1.75]'
                : 'text-base sm:text-[17.5px] leading-[1.7]'
            }`}
          >
            {renderTrackedText(sec.body)}
          </div>
        </section>
      ))}

      {/* Key Curatorial Terms / Glossary */}
      {glossary && glossary.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[var(--hairline)] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-patina)]" />
            <span>Key Curatorial Terms</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {glossary.map((g, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[var(--paper-subtle)] border border-[var(--hairline)] text-xs space-y-1"
              >
                <div className="font-semibold text-[var(--accent-patina)]">{g.term}</div>
                <div className="text-[var(--ink-muted)] leading-relaxed font-sans">
                  {g.plainDefinition}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
