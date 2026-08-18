'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Artifact, Variant } from '@/lib/types';
import { usePersona } from './PersonaProvider';
import { resolveVariant } from '@/lib/variants';
import LookCloserPins, { HotspotPin } from './LookCloserPins';
import LookCloserList from './LookCloserList';
import SourceToggle from './SourceToggle';
import FidelityBadge from './FidelityBadge';
import FidelityReportSheet from './FidelityReportSheet';
import ExplanationBlock from './ExplanationBlock';
import AttributionBlock from './AttributionBlock';
import ArtifactHeader from './ArtifactHeader';
import SensitivityNotice from './SensitivityNotice';
import NoticeBanner from './NoticeBanner';
import {
  ArrowLeft,
  Bug,
  Landmark,
  FileText,
  UserCheck,
  Baby,
  GraduationCap,
  Glasses,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Radio,
} from 'lucide-react';

interface ArtifactDetailClientProps {
  artifact: Artifact;
}

export default function ArtifactDetailClient({ artifact }: ArtifactDetailClientProps) {
  const { persona, setPersona } = usePersona();
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [forcedFail, setForcedFail] = useState<boolean>(false);
  const [hasAcknowledgedNotice, setHasAcknowledgedNotice] = useState<boolean>(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState<boolean>(false);

  // Audio narration state with sentence tracking
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [totalSentences, setTotalSentences] = useState<number>(0);
  const [activeSentenceText, setActiveSentenceText] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false);
  const sentencesRef = useRef<string[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-trigger sensitivity notice if present
  useEffect(() => {
    if (artifact.sensitivityFlags && artifact.sensitivityFlags.length > 0 && !hasAcknowledgedNotice) {
      setIsNoticeOpen(true);
    }
  }, [artifact.sensitivityFlags, hasAcknowledgedNotice]);

  // Check Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSpeechSupported(true);
    }
  }, []);

  // Resolve current variant from precomputed cache or fallback
  const { variant, isFallback } = useMemo(() => {
    return resolveVariant(artifact.id, persona, forcedFail);
  }, [artifact.id, persona, forcedFail]);

  // If forced fail or audit fail, auto-switch to Museum Original mode for safety
  const isEffectiveOriginal = showOriginal || (isFallback && forcedFail);

  // Dimension claim extraction
  const dimensionClaim = useMemo(() => {
    return artifact.claims?.find(
      (c) =>
        c.type === 'measurement' ||
        (c.type as string) === 'dimension' ||
        c.text.includes('centimetre') ||
        c.text.includes('metres')
    );
  }, [artifact.claims]);

  // Build array of sentences for audio narration
  const narrationSentences = useMemo(() => {
    let fullScript = '';
    if (isEffectiveOriginal) {
      fullScript = `${artifact.title}. Museum archival record: ${artifact.canonicalText}`;
    } else if (variant) {
      const a11yPrefix = persona.accessibility && artifact.curatorAltText
        ? `Visual description: ${artifact.curatorAltText}. `
        : '';
      const sectionsText = variant.sections.map((s) => `${s.heading}. ${s.body}`).join(' ');
      fullScript = `${artifact.title}. ${a11yPrefix}${sectionsText}`;
    } else {
      fullScript = `${artifact.title}. ${artifact.canonicalText}`;
    }

    // Clean and split by sentence boundary
    const parsed = fullScript
      .replace(/\s+/g, ' ')
      .match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)
      ?.map((s) => s.trim())
      .filter((s) => s.length > 0) || [fullScript];

    return parsed;
  }, [isEffectiveOriginal, artifact, variant, persona.accessibility]);

  useEffect(() => {
    sentencesRef.current = narrationSentences;
    setTotalSentences(narrationSentences.length);
  }, [narrationSentences]);

  // Stop audio whenever text, persona, or mode changes
  const stopAudio = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsAudioPaused(false);
    setCurrentSentenceIndex(0);
    setActiveSentenceText(null);
  }, []);

  useEffect(() => {
    stopAudio();
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [narrationSentences, stopAudio]);

  // Play next sentence recursively
  const speakSentenceAtIndex = useCallback(
    (index: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const sentences = sentencesRef.current;
      if (index >= sentences.length) {
        stopAudio();
        return;
      }

      window.speechSynthesis.cancel();
      const sentence = sentences[index];
      setCurrentSentenceIndex(index);
      setActiveSentenceText(sentence);

      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 0.92; // Curator cadence: calm, articulate, museum-paced
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (index + 1 < sentences.length) {
          speakSentenceAtIndex(index + 1);
        } else {
          stopAudio();
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          stopAudio();
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
      setIsAudioPaused(false);
    },
    [stopAudio]
  );

  const handleToggleAudio = () => {
    if (!isSpeechSupported) return;

    if (isPlayingAudio) {
      if (isAudioPaused) {
        window.speechSynthesis.resume();
        setIsAudioPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsAudioPaused(true);
      }
    } else {
      speakSentenceAtIndex(0);
    }
  };

  // Active persona mode label
  const currentPersonaMode = persona.accessibility
    ? 'accessibility'
    : persona.audience;

  const handlePersonaSelect = (mode: 'adult' | 'child' | 'specialist' | 'accessibility') => {
    stopAudio();
    if (mode === 'accessibility') {
      setPersona((prev) => ({ ...prev, accessibility: true }));
    } else {
      setPersona((prev) => ({ ...prev, audience: mode, accessibility: false }));
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation & Test Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--hairline)]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors min-h-[44px] tactile-press"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--accent-patina)]" />
          <span>Return to Gallery Collection</span>
        </Link>

        {/* Live Auditor Rigging Button */}
        <button
          type="button"
          onClick={() => {
            stopAudio();
            setForcedFail(!forcedFail);
          }}
          aria-pressed={forcedFail}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border min-h-[40px] tactile-press ${
            forcedFail
              ? 'bg-[var(--flagged)] text-white border-[var(--flagged)] shadow-xs'
              : 'bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] border-[var(--hairline-strong)] hover:border-[var(--accent-patina)] shadow-2xs'
          }`}
          title="Simulate a factual contradiction to verify auditor fallback"
        >
          <Bug className="w-3.5 h-3.5" />
          <span>{forcedFail ? 'Contradiction Active · Fallback On' : 'Simulate Check Failure'}</span>
        </button>
      </div>

      {/* Main Dual-Column Exhibition Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Sticky Photographic Plate & Masterwork Ledger */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
          {/* Interactive Look Closer Pins & High-Res Plate */}
          <LookCloserPins
            artifactId={artifact.id}
            imageUrl={artifact.imageUrl}
            altText={artifact.curatorAltText}
            title={artifact.title}
            lookCloserItems={variant?.lookCloser || []}
          />

          {/* Canonical Curatorial Ledger */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[var(--accent-patina)]" />
                <span>Curatorial Ledger</span>
              </h3>
              <span className="text-[10px] font-mono text-[var(--ink-muted)] uppercase">
                {artifact.id}
              </span>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
              <div>
                <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-0.5">
                  Period / Era
                </dt>
                <dd className="font-semibold text-[var(--ink)]">{artifact.period}</dd>
              </div>

              <div>
                <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-0.5">
                  Civilization / Culture
                </dt>
                <dd className="font-semibold text-[var(--ink)]">{artifact.culture}</dd>
              </div>

              <div>
                <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-0.5">
                  Material & Technique
                </dt>
                <dd className="font-semibold text-[var(--ink)]">{artifact.material}</dd>
              </div>

              {dimensionClaim && (
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-0.5">
                    Dimensions
                  </dt>
                  <dd className="font-semibold text-[var(--ink)]">{dimensionClaim.text}</dd>
                </div>
              )}

              <div className="sm:col-span-2">
                <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-0.5">
                  Permanent Repository
                </dt>
                <dd className="font-semibold text-[var(--accent-patina)] flex items-center gap-1.5">
                  <Landmark className="w-3 h-3" />
                  <span>{artifact.museumName}</span>
                </dd>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-[var(--hairline)]">
                <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] mb-0.5">
                  Archival Provenance
                </dt>
                <dd className="text-[11px] text-[var(--ink)]/90 leading-relaxed font-sans">
                  {artifact.provenanceLine}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column: Scrollable Editorial Interpretation Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Editorial Header */}
          <ArtifactHeader artifact={artifact} />

          {/* 4-Persona Voice Switcher Tab Strip */}
          <div className="p-1.5 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline-strong)] shadow-[var(--shadow-card)] space-y-2.5">
            <div className="flex items-center justify-between px-3 pt-2 text-xs text-[var(--ink-muted)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Adaptive Persona Voice
              </span>
              <span className="text-[11px] font-mono text-[var(--accent-patina)] font-medium">
                0ms Instant Adaptation
              </span>
            </div>

            <div
              role="tablist"
              aria-label="Audience persona voice switcher"
              className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-[var(--paper-subtle)] border border-[var(--hairline)]"
            >
              {/* Adult Voice */}
              <button
                type="button"
                role="tab"
                aria-selected={currentPersonaMode === 'adult'}
                onClick={() => handlePersonaSelect('adult')}
                className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all tactile-press ${
                  currentPersonaMode === 'adult'
                    ? 'bg-[var(--paper-surface)] text-[var(--accent-patina)] shadow-xs border border-[var(--hairline-strong)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Adult</span>
              </button>

              {/* Child Voice */}
              <button
                type="button"
                role="tab"
                aria-selected={currentPersonaMode === 'child'}
                onClick={() => handlePersonaSelect('child')}
                className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all tactile-press ${
                  currentPersonaMode === 'child'
                    ? 'bg-[var(--paper-surface)] text-[var(--accent-patina)] shadow-xs border border-[var(--hairline-strong)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                <Baby className="w-3.5 h-3.5" />
                <span>Child</span>
              </button>

              {/* Specialist Voice */}
              <button
                type="button"
                role="tab"
                aria-selected={currentPersonaMode === 'specialist'}
                onClick={() => handlePersonaSelect('specialist')}
                className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all tactile-press ${
                  currentPersonaMode === 'specialist'
                    ? 'bg-[var(--paper-surface)] text-[var(--accent-patina)] shadow-xs border border-[var(--hairline-strong)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Specialist</span>
              </button>

              {/* Accessibility Voice */}
              <button
                type="button"
                role="tab"
                aria-selected={currentPersonaMode === 'accessibility'}
                onClick={() => handlePersonaSelect('accessibility')}
                className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all tactile-press ${
                  currentPersonaMode === 'accessibility'
                    ? 'bg-[var(--paper-surface)] text-[var(--accent-patina)] shadow-xs border border-[var(--hairline-strong)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                <Glasses className="w-3.5 h-3.5" />
                <span>Accessibility</span>
              </button>
            </div>
          </div>

          {/* Action Toolbar: Source Toggle, Audio Narration Player Bar, Fidelity Score */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] shadow-2xs">
              <SourceToggle
                showOriginal={isEffectiveOriginal}
                onToggle={(orig) => {
                  stopAudio();
                  if (forcedFail) setForcedFail(false);
                  setShowOriginal(orig);
                }}
              />

              <div className="flex flex-wrap items-center gap-2">
                <FidelityBadge
                  fidelity={forcedFail ? { ...variant?.fidelity!, verdict: 'fail' } : variant?.fidelity}
                  onOpenReport={() => setIsReportOpen(true)}
                />
              </div>
            </div>

            {/* Integrated Web Speech Narration Player Bar */}
            {isSpeechSupported && (
              <div className="p-3.5 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] shadow-2xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleAudio}
                      aria-label={
                        isPlayingAudio
                          ? isAudioPaused
                            ? 'Resume audio narration'
                            : 'Pause audio narration'
                          : 'Listen to curator audio narration'
                      }
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all tactile-press min-h-[40px] ${
                        isPlayingAudio && !isAudioPaused
                          ? 'bg-[var(--accent-patina)] text-white shadow-xs'
                          : 'bg-[var(--accent-soft)] text-[var(--accent-patina)] hover:bg-[var(--accent-patina)] hover:text-white'
                      }`}
                    >
                      {isPlayingAudio && !isAudioPaused ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause Audio</span>
                        </>
                      ) : isPlayingAudio && isAudioPaused ? (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Resume Audio</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>Curator Audio Guide</span>
                        </>
                      )}
                    </button>

                    {isPlayingAudio && (
                      <button
                        type="button"
                        onClick={stopAudio}
                        aria-label="Stop audio guide narration"
                        className="p-2 rounded-xl text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors tactile-press min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title="Stop Narration"
                      >
                        <VolumeX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-muted)]">
                    <Radio className={`w-3.5 h-3.5 ${isPlayingAudio && !isAudioPaused ? 'text-[var(--accent-patina)] animate-pulse' : 'text-[var(--ink-faint)]'}`} />
                    <span>
                      {isPlayingAudio
                        ? `Sentence ${currentSentenceIndex + 1} of ${totalSentences}`
                        : 'Curator Cadence (0.92x)'}
                    </span>
                  </div>
                </div>

                {/* Progress bar during playback */}
                {isPlayingAudio && totalSentences > 0 && (
                  <div className="w-full bg-[var(--paper-subtle)] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--accent-patina)] h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.round(((currentSentenceIndex + 1) / totalSentences) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attribution & Provenance Banner */}
          <AttributionBlock
            museumName={artifact.museumName}
            persona={persona}
            isOriginal={isEffectiveOriginal}
          />

          {/* Forced Failure / Contradiction Flagged Banner */}
          {forcedFail && (
            <NoticeBanner
              severity="flagged"
              title="Factual Fidelity Violation Detected — Safe Fallback Engaged"
            >
              <div className="space-y-1.5 text-xs text-[var(--ink)]">
                <p>
                  A simulated factual discrepancy was flagged by the verification gate. To guarantee museum integrity, the UI has automatically reverted to the museum’s canonical verbatim archival description.
                </p>
                <p className="font-semibold text-[var(--flagged)]">
                  Zero tolerance for unverified claims or synthetic hallucinations.
                </p>
              </div>
            </NoticeBanner>
          )}

          {/* Main Editorial Narrative Body */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] shadow-[var(--shadow-card)] space-y-6">
            <ExplanationBlock
              sections={variant?.sections || []}
              canonicalText={artifact.canonicalText}
              isOriginal={isEffectiveOriginal}
              persona={persona}
              glossary={variant?.glossary}
              visualDescription={artifact.curatorAltText}
              activeSentenceText={activeSentenceText}
            />

            {/* Quick Fact Verification Summary Bar */}
            <div className="pt-6 border-t border-[var(--hairline)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-patina)] hover:underline min-h-[36px] tactile-press"
              >
                <ShieldCheck className="w-4 h-4 text-[var(--verified)]" />
                <span>
                  Inspect atomic claim audit ({artifact.claims?.length || 0} facts verified)
                </span>
              </button>

              <div className="text-[11px] font-mono text-[var(--ink-muted)]">
                Factual Accuracy Gate: 100% Deterministic
              </div>
            </div>
          </div>

          {/* Look Closer Observation List Prompts (Bottom of Narrative) */}
          {variant?.lookCloser && variant.lookCloser.length > 0 && !isEffectiveOriginal && (
            <LookCloserList items={variant.lookCloser} />
          )}
        </div>
      </div>

      {/* Slide-over Factual Fidelity Audit Drawer */}
      <FidelityReportSheet
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        artifact={artifact}
        variant={variant}
        forcedFail={forcedFail}
        onToggleForcedFail={() => {
          stopAudio();
          setForcedFail(!forcedFail);
        }}
      />

      {/* Sensitivity Notice Modal */}
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
