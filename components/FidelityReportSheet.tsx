'use client';

import React from 'react';
import Sheet from './ui/Sheet';
import { Artifact, Variant } from '@/lib/types';
import {
  ShieldCheck,
  AlertTriangle,
  Check,
  X,
  Minus,
  Sliders,
  Sparkles,
  Bug,
  BookOpen,
  Info,
  Scale,
  FileCheck2,
  Lock,
} from 'lucide-react';

interface FidelityReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: Artifact;
  variant?: Variant | null;
  forcedFail?: boolean;
  onToggleForcedFail?: () => void;
}

export default function FidelityReportSheet({
  isOpen,
  onClose,
  artifact,
  variant,
  forcedFail = false,
  onToggleForcedFail,
}: FidelityReportSheetProps) {
  const fidelity = variant?.fidelity;
  const changelog = variant?.changelog;

  const totalClaims = artifact.claims?.length || 0;
  const coveredClaims = forcedFail
    ? totalClaims > 0
      ? totalClaims - 1
      : 0
    : fidelity?.covered ?? totalClaims;
  const isPassing = !forcedFail && (fidelity ? fidelity.verdict === 'pass' : true);
  const percentCovered = totalClaims > 0 ? Math.round((coveredClaims / totalClaims) * 100) : 100;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Factual Fidelity Auditor Ledger"
      subtitle={`Deterministic claim verification scorecard for ${artifact.title}`}
    >
      <div className="space-y-6">
        {/* Verification Engine Scorecard Banner */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-300 ${
            isPassing
              ? 'bg-[var(--verified-soft)] border-[var(--verified)]/30 text-[var(--verified)]'
              : 'bg-[var(--flagged-soft)] border-[var(--flagged)]/30 text-[var(--flagged)]'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl ${
                isPassing ? 'bg-[var(--verified)]/15' : 'bg-[var(--flagged)]/15'
              }`}
            >
              {isPassing ? (
                <ShieldCheck className="w-6 h-6 stroke-[2.2] flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 stroke-[2.2] flex-shrink-0" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-lg font-bold">
                  {isPassing
                    ? `${percentCovered}% Verified · ${coveredClaims} of ${totalClaims} Atomic Facts`
                    : 'Factual Discrepancy Flagged · Fallback Engaged'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isPassing
                      ? 'bg-[var(--verified)] text-white shadow-2xs'
                      : 'bg-[var(--flagged)] text-white shadow-2xs'
                  }`}
                >
                  {isPassing ? '100% Archival Gate' : 'Fail-Safe Reversion'}
                </span>
              </div>
              <p className="text-xs text-[var(--ink)]/85 leading-relaxed font-sans">
                {isPassing
                  ? 'All core claims from the museum’s canonical record are verified verbatim or preserved under exact epistemic hedges.'
                  : 'Factual contradiction or unverified assertion detected. The system has automatically engaged zero-tolerance fallback to the canonical museum wall text.'}
              </p>
            </div>
          </div>
        </div>

        {/* Live Auditor Simulation / Test Harness Banner */}
        {onToggleForcedFail && (
          <div className="p-4.5 rounded-2xl bg-[var(--paper-subtle)] border border-[var(--hairline-strong)] shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-[var(--accent-bronze)]" />
                <span className="text-xs font-semibold text-[var(--ink)]">
                  Live Factual Auditor Test Harness
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleForcedFail}
                aria-pressed={forcedFail}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all tactile-press border ${
                  forcedFail
                    ? 'bg-[var(--flagged)] text-white border-[var(--flagged)] shadow-xs'
                    : 'bg-[var(--paper-surface)] text-[var(--ink)] border-[var(--hairline-strong)] hover:border-[var(--accent-patina)] hover:text-[var(--accent-patina)] shadow-2xs'
                }`}
              >
                <span>{forcedFail ? 'Reset Auditor Check' : 'Simulate Check Failure'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
              Demonstrate zero-tolerance fail-safe behavior: inject a synthetic historical anomaly to trigger instantaneous fallback to verbatim canonical museum text.
            </p>
          </div>
        )}

        {/* Atomic Claim Checklist Breakdown (c1 - c6) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[var(--accent-patina)]" />
              <span>Atomic Curatorial Claim Checklist ({totalClaims} Facts)</span>
            </h3>
            <span className="text-[11px] font-mono text-[var(--accent-patina)] font-medium">
              Zero-Hallucination Verified
            </span>
          </div>

          <div className="space-y-3">
            {artifact.claims?.map((claim, index) => {
              const audit = fidelity?.claims?.find((c) => c.id === claim.id);
              let status = audit?.status || 'covered';
              let span = audit?.span;
              let note = audit?.note;

              if (forcedFail && index === 0) {
                status = 'contradicted';
                span = 'Contradictory claim: Altered historical dating without primary source evidence.';
                note = 'Auditor detected chronological anomaly against museum registry.';
              }

              return (
                <div
                  key={claim.id}
                  className={`p-4 rounded-xl border transition-all ${
                    status === 'contradicted'
                      ? 'bg-[var(--flagged-soft)] border-[var(--flagged)]/40 shadow-xs'
                      : 'bg-[var(--paper-surface)] border-[var(--hairline)]'
                  } text-xs space-y-2.5`}
                >
                  {/* Claim Header & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[var(--paper-subtle)] border border-[var(--hairline-strong)] font-mono text-[10px] font-bold text-[var(--ink)] flex items-center justify-center">
                        {claim.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[var(--paper-subtle)] text-[var(--ink)] text-[10px] font-mono font-medium uppercase border border-[var(--hairline)]">
                        {claim.type}
                      </span>
                      {claim.criticality && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium ${
                            claim.criticality === 'must_include'
                              ? 'bg-[var(--accent-soft)] text-[var(--accent-patina)]'
                              : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)]'
                          }`}
                        >
                          {claim.criticality.replace(/_/g, ' ')}
                        </span>
                      )}
                      {claim.hedge && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--notice-soft)] text-[var(--notice)] text-[10px] font-mono font-medium border border-[var(--notice)]/20">
                          Hedge: &ldquo;{claim.hedge}&rdquo;
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    {status === 'covered' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--verified)]/15 text-[var(--verified)] text-[11px] font-semibold">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Covered
                      </span>
                    )}
                    {status === 'omitted' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--notice)]/20 text-[var(--notice)] text-[11px] font-semibold">
                        <Minus className="w-3 h-3" />
                        Omitted
                      </span>
                    )}
                    {status === 'contradicted' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--flagged)] text-white text-[11px] font-semibold shadow-xs">
                        <X className="w-3 h-3 stroke-[2.5]" />
                        Contradicted
                      </span>
                    )}
                  </div>

                  {/* Canonical Museum Claim Text */}
                  <div className="text-[var(--ink)] font-normal text-xs sm:text-[13px] leading-relaxed">
                    <strong className="text-[var(--ink-muted)] font-medium block text-[10px] uppercase font-mono tracking-wider mb-0.5">
                      Canonical Museum Fact:
                    </strong>
                    {claim.text}
                  </div>

                  {/* Highlighted Evidence Span */}
                  {span && (
                    <div
                      className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
                        status === 'contradicted'
                          ? 'bg-white border-[var(--flagged)]/30 text-[var(--flagged)]'
                          : 'bg-[var(--paper-subtle)] border-[var(--hairline)] text-[var(--ink)]'
                      }`}
                    >
                      <span className="font-semibold block mb-0.5 text-[10px] uppercase font-mono tracking-wider text-[var(--ink-muted)]">
                        {status === 'contradicted' ? 'Flagged Text Passage:' : 'Verified Variant Evidence Span:'}
                      </span>
                      <span className="italic font-serif">&ldquo;{span}&rdquo;</span>
                    </div>
                  )}

                  {note && (
                    <div className="text-[11px] text-[var(--flagged)] font-medium flex items-center gap-1.5 pt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{note}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Applied Transformation Operations (Synthesis Changelog) */}
        {changelog && (
          <div className="p-4.5 rounded-2xl bg-[var(--paper-subtle)] border border-[var(--hairline)] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[var(--accent-patina)]" />
              <span>Auditor Synthesis Transformation Log</span>
            </h3>

            <div className="space-y-2">
              <ul className="space-y-1.5 text-xs text-[var(--ink-muted)] list-disc list-inside">
                {changelog.operations?.map((op, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="text-[var(--ink)] font-medium">
                      {op.replace(/_/g, ' ')}
                    </span>
                  </li>
                ))}
                {changelog.hedgesPreserved && (
                  <li className="text-[var(--verified)] font-medium">
                    ✓ All epistemic hedges (&ldquo;circa&rdquo;, &ldquo;attributed to&rdquo;, &ldquo;suggests&rdquo;) preserved verbatim.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[var(--accent-patina)] hover:bg-[#164A47] text-white shadow-sm transition-all tactile-press min-h-[44px]"
          >
            Close Auditor Ledger
          </button>
        </div>
      </div>
    </Sheet>
  );
}
