'use client';

import React from 'react';
import Sheet from './ui/Sheet';
import { Artifact, Variant } from '@/lib/types';
import { ShieldCheck, AlertTriangle, Check, X, Minus, Sparkles, Sliders } from 'lucide-react';

interface FidelityReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: Artifact;
  variant?: Variant | null;
}

export default function FidelityReportSheet({
  isOpen,
  onClose,
  artifact,
  variant,
}: FidelityReportSheetProps) {
  const fidelity = variant?.fidelity;
  const changelog = variant?.changelog;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Fidelity & Verification Report"
      subtitle={`Per-claim mathematical audit for ${artifact.title}`}
    >
      {/* Overview Status Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center gap-3 ${
          fidelity?.verdict === 'pass'
            ? 'bg-[var(--verified)]/10 border-[var(--verified)]/30 text-[var(--verified)]'
            : fidelity?.verdict === 'fail'
            ? 'bg-[var(--flagged)]/10 border-[var(--flagged)]/30 text-[var(--flagged)]'
            : 'bg-[var(--rule)]/40 border-[var(--rule)] text-[var(--ink-muted)]'
        }`}
      >
        {fidelity?.verdict === 'pass' ? (
          <ShieldCheck className="w-6 h-6 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
        )}
        <div>
          <div className="font-semibold text-sm">
            {fidelity?.verdict === 'pass'
              ? `${fidelity.covered} of ${fidelity.total} Museum Claims Preserved`
              : fidelity?.verdict === 'fail'
              ? 'Fidelity Verification Contradiction Detected'
              : 'Claims Unverified'}
          </div>
          <div className="text-xs mt-0.5 opacity-90">
            {fidelity?.verdict === 'pass'
              ? 'Every atomic fact from the canonical description was verified in the adapted text with zero hallucinations.'
              : 'One or more claims failed validation. Falling back to the museum’s original words.'}
          </div>
        </div>
      </div>

      {/* Claim Ledger Verification Checklist */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Curator Atomic Claim Ledger ({artifact.claims.length} Facts)</span>
        </h3>

        <div className="space-y-3">
          {artifact.claims.map((claim) => {
            const audit = fidelity?.claims.find((c) => c.id === claim.id);
            const status = audit?.status || (fidelity ? 'omitted' : 'covered');
            const span = audit?.span;

            return (
              <div
                key={claim.id}
                className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--rule)] text-xs space-y-2"
              >
                {/* Header line with claim type and status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--rule)]/60 text-[10px] font-mono uppercase">
                      {claim.type}
                    </span>
                    {claim.hedge && (
                      <span className="px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-mono">
                        Hedge: {claim.hedge}
                      </span>
                    )}
                  </div>

                  {/* Status Pill */}
                  {status === 'covered' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--verified)]/15 text-[var(--verified)] text-[11px] font-semibold">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      Covered
                    </span>
                  )}
                  {status === 'omitted' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--notice)]/15 text-[var(--notice)] text-[11px] font-semibold">
                      <Minus className="w-3 h-3" />
                      Omitted
                    </span>
                  )}
                  {status === 'contradicted' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--flagged)]/15 text-[var(--flagged)] text-[11px] font-semibold">
                      <X className="w-3 h-3 stroke-[2.5]" />
                      Contradicted
                    </span>
                  )}
                </div>

                {/* Claim Statement */}
                <div className="text-[var(--ink)] font-normal leading-relaxed">
                  {claim.text}
                </div>

                {/* Matched Span in Variant */}
                {span && (
                  <div className="pt-2 border-t border-[var(--rule)]/60 text-[11px] text-[var(--ink-muted)]">
                    <strong className="text-[var(--accent)]">Matched Span: </strong>
                    <span className="italic">&ldquo;{span}&rdquo;</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* How Was This Adapted? (Changelog Section) */}
      {changelog && (
        <div className="pt-2 border-t border-[var(--rule)] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>How Was This Text Adapted?</span>
          </h3>

          <div className="p-3.5 rounded-xl bg-[var(--accent-soft)]/30 border border-[var(--accent)]/20 space-y-2">
            <div className="text-xs text-[var(--ink)]">
              <strong>Applied Transformations:</strong>
            </div>
            <ul className="space-y-1.5 text-xs text-[var(--ink-muted)] list-disc list-inside">
              {changelog.operations?.map((op, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-[var(--ink)]">{op.replace(/_/g, ' ')}</span>
                </li>
              ))}
              {changelog.hedgesPreserved && (
                <li className="text-[var(--verified)] font-medium">
                  ✓ Epistemic hedges (&quot;circa&quot;, &quot;attributed to&quot;) preserved verbatim.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Close button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors shadow-sm active:scale-[0.99] min-h-[44px]"
        >
          Close Report
        </button>
      </div>
    </Sheet>
  );
}
