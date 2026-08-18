'use client';

import React from 'react';
import { FidelityReport } from '@/lib/types';
import { ShieldCheck, AlertTriangle, HelpCircle, Loader2, Sparkles } from 'lucide-react';

interface FidelityBadgeProps {
  fidelity?: FidelityReport | null;
  isLoading?: boolean;
  onOpenReport: () => void;
}

export default function FidelityBadge({
  fidelity,
  isLoading = false,
  onOpenReport,
}: FidelityBadgeProps) {
  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold bg-[var(--paper-subtle)] text-[var(--ink-muted)] border border-[var(--hairline)]">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-patina)]" />
        <span>Auditing museum facts…</span>
      </div>
    );
  }

  if (!fidelity) {
    return (
      <button
        onClick={onOpenReport}
        type="button"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium bg-[var(--paper-subtle)] text-[var(--ink-muted)] border border-[var(--hairline)] hover:bg-[var(--paper-surface)] hover:text-[var(--ink)] transition-all min-h-[40px] tactile-press"
      >
        <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-patina)]" />
        <span>Factual Audit Ledger</span>
      </button>
    );
  }

  const { verdict, covered, total } = fidelity;

  if (verdict === 'fail') {
    return (
      <button
        onClick={onOpenReport}
        type="button"
        aria-label="Factual fidelity violation detected. Tap to inspect claims and see fallback rationale."
        className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-[13px] font-semibold bg-[var(--flagged-soft)] text-[var(--flagged)] border border-[var(--flagged)]/30 hover:bg-[var(--flagged)]/15 transition-all shadow-xs min-h-[40px] tactile-press"
      >
        <AlertTriangle className="w-4 h-4 text-[var(--flagged)] stroke-[2.5] flex-shrink-0" />
        <span>Contradiction Flagged · Verbatim Fallback</span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpenReport}
      type="button"
      aria-label={`Factual fidelity check passed: ${covered} of ${total} museum claims verified. Tap to inspect proof.`}
      className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-[13px] font-semibold bg-[var(--verified-soft)] text-[var(--verified)] border border-[var(--verified)]/30 hover:bg-[var(--verified)]/15 transition-all shadow-xs min-h-[40px] tactile-press group"
    >
      <ShieldCheck className="w-4 h-4 text-[var(--verified)] stroke-[2.5] flex-shrink-0 group-hover:scale-110 transition-transform" />
      <span>
        ✓ {covered} of {total} claims verified
      </span>
    </button>
  );
}
