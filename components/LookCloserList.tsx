'use client';

import React from 'react';
import { Eye, Sparkles, Search } from 'lucide-react';

interface LookCloserListProps {
  items: string[];
  onItemClick?: (index: number) => void;
}

export default function LookCloserList({ items, onItemClick }: LookCloserListProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[var(--accent-soft)]/40 border border-[var(--accent-patina)]/20 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-patina)]">
          <Eye className="w-4 h-4" />
          <span>Curatorial Observation Prompts</span>
        </div>
        <span className="text-[10px] font-mono text-[var(--accent-patina)] font-semibold uppercase tracking-wider">
          {items.length} Guided Details
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onItemClick?.(idx)}
            className={`p-3.5 rounded-xl bg-[var(--paper-surface)] border border-[var(--hairline)] hover:border-[var(--accent-patina)]/40 text-xs sm:text-[13px] text-[var(--ink)] leading-relaxed transition-all shadow-2xs ${
              onItemClick ? 'cursor-pointer hover:bg-[var(--paper-subtle)] tactile-press' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-patina)] font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="font-sans text-[var(--ink)]/90 font-medium">
                {item}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
