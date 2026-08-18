'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Artifact, Variant } from '@/lib/types';
import { usePersona } from './PersonaProvider';
import { resolveVariant } from '@/lib/variants';
import ArtifactHeader from './ArtifactHeader';
import AttributionBlock from './AttributionBlock';
import SourceToggle from './SourceToggle';
import ExplanationBlock from './ExplanationBlock';
import LookCloserList from './LookCloserList';
import FidelityBadge from './FidelityBadge';
import FidelityReportSheet from './FidelityReportSheet';
import SensitivityNotice from './SensitivityNotice';
import ReadAloudButton from './ReadAloudButton';
import NoticeBanner from './NoticeBanner';
import { ArrowLeft, Bug, ShieldAlert, Sparkles } from 'lucide-react';

interface ArtifactDetailClientProps {
  artifact: Artifact;
}

export default function ArtifactDetailClient({ artifact }: ArtifactDetailClientProps) {
  const { persona } = usePersona();
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [forcedFail, setForcedFail] = useState<boolean>(false);
  const [hasAcknowledgedNotice, setHasAcknowledgedNotice] = useState<boolean>(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState<boolean>(false);

  // Auto-trigger Sensitivity Notice for flagged artifacts
  useEffect(() => {
    if (artifact.sensitivityFlags && artifact.sensitivityFlags.length > 0 && !hasAcknowledgedNotice) {
      setIsNoticeOpen(true);
    }
  }, [artifact.sensitivityFlags, hasAcknowledgedNotice]);

  // Resolve current variant from precomputed cache or fallback
  const { variant, isFallback, fallbackReason } = useMemo(() => {
    return resolveVariant(artifact.id, persona, forcedFail);
  }, [artifact.id, persona, forcedFail]);

  // If forced fail or audit fail, auto-switch to Museum Original view mode for safety
  const isEffectiveOriginal = showOriginal || (isFallback && forcedFail);

  // Text for Speech synthesis read-aloud
  const textToRead = useMemo(() => {
    if (isEffectiveOriginal) {
      return `${artifact.title}. Museum archival description: ${artifact.canonicalText}`;
    }
    if (!variant) return artifact.canonicalText;

    const sectionsText = variant.sections.map((s) => `${s.heading}. ${s.body}`).join(' ');
    const a11yPrefix = persona.accessibility ? `Visual description: ${artifact.curatorAltText}. ` : '';
    return `${artifact.title}. ${a11yPrefix}${sectionsText}`;
  }, [isEffectiveOriginal, artifact, variant, persona.accessibility]);

  return (
    <div className="space-y-6">
      {/* Top Bar: Back Link & Demo Controls */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-[var(--rule)]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Collection</span>
        </Link>

        {/* Demo Rigging Switch: Simulate Fidelity Contradiction */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setForcedFail(!forcedFail)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border min-h-[40px] ${
              forcedFail
                ? 'bg-[var(--flagged)] text-white border-[var(--flagged)] shadow-xs'
                : 'bg-[var(--paper-raised)] text-[var(--ink-muted)] hover:text-[var(--ink)] border-[var(--rule)]'
            }`}
            title="Rigged demo control to prove safe fallback behavior"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>{forcedFail ? 'Demo: Check Failed State Active' : 'Simulate Check Failure'}</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Grid: 2-column on desktop (>=1025px), single column mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Sticky Image & Core Metadata on Desktop) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <ArtifactHeader artifact={artifact} />
        </div>

        {/* Right Column (Dynamic Interpretation Surface) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Controls Bar: Read Aloud + Source Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] shadow-2xs">
            <SourceToggle
              showOriginal={isEffectiveOriginal}
              onToggle={(orig) => {
                if (forcedFail) setForcedFail(false);
                setShowOriginal(orig);
              }}
            />
            <ReadAloudButton textToRead={textToRead} />
          </div>

          {/* Mandatory Attribution Block */}
          <AttributionBlock
            museumName={artifact.museumName}
            persona={persona}
            isOriginal={isEffectiveOriginal}
          />

          {/* Forced Failure / Fallback Banner */}
          {forcedFail && (
            <NoticeBanner
              severity="flagged"
              title="Fidelity Check Failed — Safe Fallback Engaged"
            >
              <div className="space-y-1">
                <p>
                  A factual discrepancy was detected in the generated adaptation. To protect institutional credibility, the system has automatically reverted to the museum&apos;s verbatim original words.
                </p>
                <p className="font-semibold text-[var(--flagged)]">
                  Zero tolerance for invented claims.
                </p>
              </div>
            </NoticeBanner>
          )}

          {/* Interpretation Content Area */}
          <div className="p-5 sm:p-7 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-6 shadow-xs">
            <ExplanationBlock
              sections={variant?.sections || []}
              canonicalText={artifact.canonicalText}
              isOriginal={isEffectiveOriginal}
              persona={persona}
              glossary={variant?.glossary}
              visualDescription={artifact.curatorAltText}
            />

            {/* Look-closer prompts for Muse version */}
            {!isEffectiveOriginal && variant?.lookCloser && (
              <LookCloserList items={variant.lookCloser} />
            )}

            {/* Fidelity Badge Trigger (Always Present) */}
            <div className="pt-5 border-t border-[var(--rule)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <FidelityBadge
                fidelity={variant?.fidelity}
                onOpenReport={() => setIsReportOpen(true)}
              />
              <div className="text-xs text-[var(--ink-muted)]">
                Tap badge to view atomic fact checklist.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fidelity Audit Report Sheet (B2) */}
      <FidelityReportSheet
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        artifact={artifact}
        variant={variant}
      />

      {/* Sensitivity Interstitial Notice Modal (B3) */}
      {artifact.contentNoticeText && (
        <SensitivityNotice
          isOpen={isNoticeOpen}
          onAcknowledge={() => {
            setHasAcknowledgedNotice(true);
            setIsNoticeOpen(false);
          }}
          noticeText={artifact.contentNoticeText}
          museumName={artifact.museumName}
        />
      )}
    </div>
  );
}
