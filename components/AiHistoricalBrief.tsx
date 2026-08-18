'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReadAloudButton from '@/components/ReadAloudButton';
import {
  Sparkles,
  Landmark,
  Layers,
  MapPin,
  RefreshCw,
  AlertCircle,
  Crown,
  Palette,
  Compass,
  CheckCircle2,
  BookOpen,
  Info,
} from 'lucide-react';

export interface HistoricalBrief {
  ancient_foundations: string;
  living_culture_crafts: string;
  famous_lore_landmarks: string;
  summary_one_liner: string;
}

export interface PincodeHistoryResponse {
  status: 'success';
  pincode: string;
  location_name: string;
  state: string;
  district: string;
  postal_circle: string;
  historical_brief: HistoricalBrief;
  key_dynasties: string[];
  traditional_crafts: string[];
  notable_monuments: string[];
  cached?: boolean;
  source?: 'openrouter_ai' | 'deterministic_offline_synthesis';
}

export interface AiHistoricalBriefProps {
  pincode: string;
  className?: string;
  onLoaded?: (data: PincodeHistoryResponse) => void;
}

export default function AiHistoricalBrief({
  pincode,
  className = '',
  onLoaded,
}: AiHistoricalBriefProps) {
  const [data, setData] = useState<PincodeHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);

  // Reference to abort controller for in-flight request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanPin = pincode ? pincode.trim() : '';
  const isValidPincode = /^[1-9][0-9]{5}$/.test(cleanPin);

  const fetchBrief = useCallback(
    async (pinToFetch: string, signal?: AbortSignal) => {
      if (!/^[1-9][0-9]{5}$/.test(pinToFetch)) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/pincode-history?pincode=${encodeURIComponent(pinToFetch)}`, {
          signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.message || `Failed to fetch brief (HTTP ${response.status})`);
        }

        const result: PincodeHistoryResponse = await response.json();
        if (result.status === 'success' && result.historical_brief) {
          setData(result);
          if (onLoaded) {
            onLoaded(result);
          }
        } else {
          throw new Error('Received unexpected format from history API');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Request was aborted due to new input, silent return
          return;
        }
        console.error('[AiHistoricalBrief] Fetch error:', err);
        setError(err.message || 'Unable to retrieve historical brief. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [onLoaded]
  );

  useEffect(() => {
    // Abort previous in-flight request if user is typing rapidly
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!isValidPincode) {
      setIsLoading(false);
      if (cleanPin.length === 0) {
        setData(null);
        setError(null);
      }
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchBrief(cleanPin, controller.signal);

    return () => {
      controller.abort();
    };
  }, [cleanPin, isValidPincode, retryKey, fetchBrief]);

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1);
  };

  // Construct comprehensive spoken text for Web Speech narration
  const buildNarrationText = (): string => {
    if (!data) return '';
    const parts = [
      `AI Cultural and Historical Brief for ${data.location_name}, Postal PIN code ${data.pincode}, in ${data.district}, ${data.state}.`,
      `Summary: ${data.historical_brief.summary_one_liner}`,
      `Ancient Foundations and Dynastic Heritage: ${data.historical_brief.ancient_foundations}`,
      `Living Traditions and Craft Roots: ${data.historical_brief.living_culture_crafts}`,
      `Sacred Landmarks and Historical Lore: ${data.historical_brief.famous_lore_landmarks}`,
    ];

    if (data.key_dynasties && data.key_dynasties.length > 0) {
      parts.push(`Key ruling dynasties of this territory include ${data.key_dynasties.join(', ')}.`);
    }
    if (data.traditional_crafts && data.traditional_crafts.length > 0) {
      parts.push(`Traditional crafts and living arts include ${data.traditional_crafts.join(', ')}.`);
    }
    if (data.notable_monuments && data.notable_monuments.length > 0) {
      parts.push(`Notable landmarks and sacred monuments include ${data.notable_monuments.join(', ')}.`);
    }

    return parts.join(' ');
  };

  // If user entered less than 6 digits and no prior data
  if (!isValidPincode && !data && !isLoading) {
    return null;
  }

  return (
    <section
      aria-label="AI Cultural and Historical Brief"
      className={`rounded-3xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--paper-raised)] via-[var(--paper-raised)] to-[var(--accent-soft)]/30 shadow-md p-6 sm:p-8 space-y-6 transition-all duration-300 ${className}`}
    >
      {/* 1. Header with Badge, Location, and Audio Narration */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--rule)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Cultural &amp; Historical Brief</span>
            </span>

            {data && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--paper)] border border-[var(--rule)] text-[11px] font-medium text-[var(--ink-muted)]">
                <CheckCircle2 className="w-3 h-3 text-[var(--verified)]" />
                <span>PIN {data.pincode} Grounded</span>
              </span>
            )}

            {data?.source && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--paper)] border border-[var(--rule)] text-[10px] uppercase font-semibold text-[var(--ink-muted)]">
                {data.source === 'openrouter_ai' ? 'OpenRouter AI' : 'Archival Knowledge Engine'}
              </span>
            )}
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--ink)] tracking-tight">
            {isLoading ? (
              <div className="h-8 w-64 bg-[var(--rule)]/60 rounded-md animate-pulse mt-1" />
            ) : data ? (
              data.location_name
            ) : (
              `Postal PIN ${cleanPin}`
            )}
          </h2>

          {!isLoading && data && (
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
              <span>
                {data.district}, {data.state} · <span className="font-medium">{data.postal_circle}</span>
              </span>
            </p>
          )}
        </div>

        {/* Read Aloud Narration Control */}
        {!isLoading && data && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ReadAloudButton textToRead={buildNarrationText()} />
          </div>
        )}
      </div>

      {/* 2. Loading Skeleton State */}
      {isLoading && (
        <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading historical brief">
          {/* Summary Banner Skeleton */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--accent-soft)]/50 border border-[var(--accent)]/20 space-y-2">
            <div className="h-4 bg-[var(--accent)]/20 rounded-md w-3/4" />
            <div className="h-3 bg-[var(--accent)]/15 rounded-md w-1/2" />
          </div>

          {/* 3-Part Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--rule)]/70" />
                  <div className="h-4 bg-[var(--rule)]/80 rounded-md w-28" />
                </div>
                <div className="space-y-2 pt-1">
                  <div className="h-3 bg-[var(--rule)]/60 rounded-md w-full" />
                  <div className="h-3 bg-[var(--rule)]/60 rounded-md w-5/6" />
                  <div className="h-3 bg-[var(--rule)]/60 rounded-md w-4/6" />
                  <div className="h-3 bg-[var(--rule)]/50 rounded-md w-3/4" />
                </div>
              </div>
            ))}
          </div>

          {/* Badge Tag Clusters Skeleton */}
          <div className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-3">
            <div className="h-3.5 bg-[var(--rule)]/80 rounded-md w-40" />
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6].map((b) => (
                <div key={b} className="h-7 w-24 bg-[var(--rule)]/60 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Error Recovery State */}
      {!isLoading && error && (
        <div className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--flagged)]/30 text-[var(--ink)] space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--flagged)] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[var(--flagged)]">
                Unable to synthesize brief for PIN {cleanPin}
              </h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{error}</p>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent)]/90 transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Generation</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Loaded Structured Brief Content */}
      {!isLoading && data && (
        <div className="space-y-6">
          {/* Summary One-Liner Banner */}
          {data.historical_brief.summary_one_liner && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--accent-soft)]/60 border border-[var(--accent)]/25 text-[var(--ink)] relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[var(--accent)] text-white flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
                    Civilizational Essence
                  </span>
                  <p className="font-serif text-base sm:text-lg italic text-[var(--ink)] leading-relaxed">
                    &ldquo;{data.historical_brief.summary_one_liner}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3-Part Structured Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Ancient Foundations & Dynastic Heritage */}
            <div className="flex flex-col p-5 sm:p-6 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] hover:border-[var(--accent)]/40 transition-colors shadow-xs">
              <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-[var(--rule)]/60">
                <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
                    Part I
                  </span>
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[var(--ink)] leading-snug">
                    Ancient Foundations &amp; Dynastic Heritage
                  </h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed flex-grow">
                {data.historical_brief.ancient_foundations}
              </p>
            </div>

            {/* Card 2: Living Traditions & Craft Roots */}
            <div className="flex flex-col p-5 sm:p-6 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] hover:border-[var(--accent)]/40 transition-colors shadow-xs">
              <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-[var(--rule)]/60">
                <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
                    Part II
                  </span>
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[var(--ink)] leading-snug">
                    Living Traditions &amp; Craft Roots
                  </h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed flex-grow">
                {data.historical_brief.living_culture_crafts}
              </p>
            </div>

            {/* Card 3: Sacred Landmarks & Historical Lore */}
            <div className="flex flex-col p-5 sm:p-6 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] hover:border-[var(--accent)]/40 transition-colors shadow-xs">
              <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-[var(--rule)]/60">
                <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
                    Part III
                  </span>
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[var(--ink)] leading-snug">
                    Sacred Landmarks &amp; Historical Lore
                  </h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed flex-grow">
                {data.historical_brief.famous_lore_landmarks}
              </p>
            </div>
          </div>

          {/* 5. Badge Tag Clusters (Key Dynasties, Traditional Crafts, Notable Landmarks) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Cultural Anchors &amp; Heritage Highlights</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cluster 1: Key Dynasties */}
              {data.key_dynasties && data.key_dynasties.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
                    <Crown className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Key Dynasties</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.key_dynasties.map((dynasty, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-medium border border-[var(--accent)]/20"
                      >
                        {dynasty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cluster 2: Traditional Crafts */}
              {data.traditional_crafts && data.traditional_crafts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
                    <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Traditional Crafts</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.traditional_crafts.map((craft, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-[var(--paper-raised)] text-[var(--ink)] text-xs font-medium border border-[var(--rule)] hover:border-[var(--accent)]/40 transition-colors"
                      >
                        {craft}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cluster 3: Notable Landmarks / Monuments */}
              {data.notable_monuments && data.notable_monuments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
                    <Landmark className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Notable Landmarks</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.notable_monuments.map((landmark, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-[var(--paper-raised)] text-[var(--ink-muted)] hover:text-[var(--ink)] text-xs font-medium border border-[var(--rule)]"
                      >
                        {landmark}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
