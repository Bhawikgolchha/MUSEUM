'use client';

import React from 'react';
import { FidelityReport } from '@/lib/types';
import { ShieldCheck, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

interface FidelityBadgeProps {
  fidelity?: FidelityReport | null;
  isLoading?: boolean;
  onOpenReport: () => void;
}

export default function FidelityBadge({ fidelity, isLoading = false, onOpenReport }: FidelityBadgeProps) {
  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold bg-[var(--rule)]/40 text-[var(--ink-muted)] border border-[var(--rule)]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Auditing museum facts…</span>
      </div>
    );
  }

  if (!fidelity) {
    return (
      <button
        onClick={onOpenReport}
        type="button"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium bg-[var(--rule)]/40 text-[var(--ink-muted)] border border-[var(--rule)] hover:bg-[var(--rule)]/70 transition-colors min-h-[44px]"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>— Not verified</span>
      </button>
    );
  }

  const { verdict, covered, total } = fidelity;

  if (verdict === 'fail') {
    return (
      <button
        onClick={onOpenReport}
        type="button"
        aria-label="Fidelity check failed. Tap to inspect claims and see why."
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[var(--flagged)]/10 text-[var(--flagged)] border border-[var(--flagged)]/30 hover:bg-[var(--flagged)]/20 transition-all shadow-xs min-h-[44px]"
      >
        <AlertTriangle className="w-4 h-4 text-[var(--flagged)] stroke-[2.5]" />
        <span>⚠ Check failed — showing museum text</span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpenReport}
      type="button"
      aria-label={`Fidelity check passed: ${covered} of ${total} museum facts preserved. Tap to inspect proof.`}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[var(--verified)]/10 text-[var(--verified)] border border-[var(--verified)]/30 hover:bg-[var(--verified)]/20 transition-all shadow-xs min-h-[44px]"
    >
      <ShieldCheck className="w-4 h-4 text-[var(--verified)] stroke-[2.5]" />
      <span>✓ {covered} of {total} museum facts preserved</span>
    </button>
  );
}
