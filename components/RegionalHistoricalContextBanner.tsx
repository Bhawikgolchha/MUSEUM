'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Landmark,
  ChevronDown,
  ChevronUp,
  History,
  Layers,
  MapPin,
  RotateCw,
  Scroll,
} from 'lucide-react';
import ReadAloudButton from '@/components/ReadAloudButton';

export interface HistoricalBriefData {
  ancient_foundations: string;
  living_culture_crafts: string;
  famous_lore_landmarks: string;
  summary_one_liner: string;
}

export interface PincodeHistoryData {
  status: 'success';
  pincode: string;
  location_name: string;
  state: string;
  district: string;
  postal_circle: string;
  historical_brief: HistoricalBriefData;
  key_dynasties: string[];
  traditional_crafts: string[];
  notable_monuments: string[];
  cached?: boolean;
  source?: string;
}

export interface RegionalHistoricalContextBannerProps {
  pincode?: string | null;
  className?: string;
}

// Client-side in-memory cache for ultra-fast instant UI re-renders (<1ms)
const clientHistoricalCache = new Map<string, PincodeHistoryData>();

export default function RegionalHistoricalContextBanner({
  pincode,
  className = '',
}: RegionalHistoricalContextBannerProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [data, setData] = useState<PincodeHistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanPin = pincode ? pincode.trim() : '';
  const isValidPin = /^[1-9][0-9]{5}$/.test(cleanPin);

  useEffect(() => {
    // If not a valid 6-digit Indian PIN code, reset state and do not fetch
    if (!isValidPin) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Check client in-memory cache
    if (clientHistoricalCache.has(cleanPin)) {
      setData(clientHistoricalCache.get(cleanPin)!);
      setError(null);
      setLoading(false);
      return;
    }

    // Cancel any ongoing fetch for prior PIN
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `/api/pincode-history?pincode=${encodeURIComponent(cleanPin)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errJson = await response.json().catch(() => null);
          throw new Error(
            errJson?.message || `Failed to fetch historical context (HTTP ${response.status})`
          );
        }

        const json: PincodeHistoryData = await response.json();
        if (json && json.status === 'success' && json.historical_brief) {
          clientHistoricalCache.set(cleanPin, json);
          setData(json);
          setError(null);
        } else {
          throw new Error('Malformed historical context response received.');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.warn('Error fetching regional historical context:', err);
        setError(
          err instanceof Error ? err.message : 'Unable to retrieve regional historical context.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      controller.abort();
    };
  }, [cleanPin, isValidPin]);

  // If pincode is not valid, render nothing
  if (!isValidPin) {
    return null;
  }

  // Loading skeleton state
  if (loading && !data) {
    return (
      <div
        className={`p-4 sm:p-5 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] shadow-2xs space-y-4 animate-pulse ${className}`}
        aria-busy="true"
        aria-label="Loading regional historical context"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[var(--accent-soft)]" />
            <div className="h-4 w-44 rounded-full bg-[var(--rule)]" />
          </div>
          <div className="h-7 w-24 rounded-lg bg-[var(--rule)]/60" />
        </div>

        <div className="space-y-2">
          <div className="h-5 w-3/4 rounded bg-[var(--rule)]/80" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-20 rounded-md bg-[var(--rule)]/50" />
            <div className="h-5 w-28 rounded-md bg-[var(--rule)]/50" />
            <div className="h-5 w-24 rounded-md bg-[var(--rule)]/50" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--rule)]/60 space-y-2">
          <div className="h-4 w-full rounded bg-[var(--rule)]/60" />
          <div className="h-4 w-5/6 rounded bg-[var(--rule)]/60" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div
        className={`p-4 rounded-2xl bg-[var(--paper-raised)] border border-[var(--flagged)]/30 text-xs text-[var(--ink-muted)] flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[var(--flagged)] flex-shrink-0" />
          <span>Historical context unavailable for PIN {cleanPin}.</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            fetch(`/api/pincode-history?pincode=${encodeURIComponent(cleanPin)}`)
              .then((res) => res.json())
              .then((json) => {
                if (json.status === 'success') {
                  clientHistoricalCache.set(cleanPin, json);
                  setData(json);
                }
              })
              .catch(() => setError('Retry failed.'))
              .finally(() => setLoading(false));
          }}
          className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:underline"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Build audio narration script
  const narrationScript = `Regional historical and cultural context for ${data.location_name || data.district}, ${data.state}, Postal PIN code ${data.pincode}. ${data.historical_brief.summary_one_liner} Ancient Foundations: ${data.historical_brief.ancient_foundations} Key dynasties include: ${data.key_dynasties.join(', ')}. Living Traditions: ${data.historical_brief.living_culture_crafts} Traditional crafts include: ${data.traditional_crafts.join(', ')}. Sacred Landmarks: ${data.historical_brief.famous_lore_landmarks} Notable monuments include: ${data.notable_monuments.join(', ')}.`;

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br from-[var(--paper-raised)] via-[var(--paper-raised)] to-[var(--accent-soft)]/40 border border-[var(--accent)]/30 shadow-sm p-4 sm:p-5 space-y-4 transition-all ${className}`}
      aria-label="Regional Historical Context Banner"
    >
      {/* Top Bar: Header Badge, Postal Badges, Narration & Expand Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--rule)]/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Regional Historical Context</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--rule)] text-[var(--accent)] text-[11px] font-mono font-semibold">
              PIN {data.pincode}
            </span>
          </div>

          <h2 className="font-serif text-lg sm:text-xl font-semibold text-[var(--ink)] tracking-tight">
            {data.location_name || `${data.district}, ${data.state}`}
          </h2>

          {/* Postal Circle, District, and State Badges */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-[var(--ink-muted)] pt-0.5">
            {data.district && (
              <span className="px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--rule)] text-[11px] font-medium text-[var(--ink)]">
                District: {data.district}
              </span>
            )}
            {data.state && (
              <span className="px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--rule)] text-[11px] font-medium text-[var(--ink)]">
                State: {data.state}
              </span>
            )}
            {data.postal_circle && (
              <span className="px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--rule)] text-[11px] font-medium text-[var(--ink-muted)]">
                {data.postal_circle}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls: Read Aloud & Expand Toggle */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
          <ReadAloudButton textToRead={narrationScript} />

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse historical details' : 'Expand historical details'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--rule)] bg-[var(--paper-raised)] text-[var(--ink)] hover:bg-[var(--paper)] text-xs font-semibold transition-all min-h-[40px] shadow-2xs"
          >
            <span>{isExpanded ? 'Hide Details' : 'Explore History'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
            )}
          </button>
        </div>
      </div>

      {/* 1-Line Cultural Summary */}
      {data.historical_brief?.summary_one_liner && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--rule)]">
          <p className="font-serif text-sm sm:text-[15px] italic text-[var(--ink)] leading-relaxed">
            &ldquo;{data.historical_brief.summary_one_liner}&rdquo;
          </p>
        </div>
      )}

      {/* Expandable 3-Part Curated Brief and Badges */}
      {isExpanded && (
        <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Ancient Foundations & Dynastic Heritage */}
            <div className="p-3.5 rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[var(--accent)] font-semibold text-xs uppercase tracking-wider">
                  <History className="w-4 h-4 flex-shrink-0" />
                  <span>Ancient Foundations</span>
                </div>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  {data.historical_brief.ancient_foundations}
                </p>
              </div>

              {data.key_dynasties && data.key_dynasties.length > 0 && (
                <div className="pt-2 border-t border-[var(--rule)]/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block">
                    Key Dynasties:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {data.key_dynasties.map((dynasty, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-medium"
                      >
                        {dynasty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Living Traditions & Craft Roots */}
            <div className="p-3.5 rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[var(--accent)] font-semibold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4 flex-shrink-0" />
                  <span>Living Traditions</span>
                </div>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  {data.historical_brief.living_culture_crafts}
                </p>
              </div>

              {data.traditional_crafts && data.traditional_crafts.length > 0 && (
                <div className="pt-2 border-t border-[var(--rule)]/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block">
                    Traditional Crafts:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {data.traditional_crafts.map((craft, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--rule)] text-[var(--ink)] text-[11px] font-medium"
                      >
                        {craft}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Sacred Landmarks & Lore */}
            <div className="p-3.5 rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[var(--accent)] font-semibold text-xs uppercase tracking-wider">
                  <Landmark className="w-4 h-4 flex-shrink-0" />
                  <span>Sacred Landmarks</span>
                </div>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  {data.historical_brief.famous_lore_landmarks}
                </p>
              </div>

              {data.notable_monuments && data.notable_monuments.length > 0 && (
                <div className="pt-2 border-t border-[var(--rule)]/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block">
                    Notable Monuments:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {data.notable_monuments.map((landmark, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--rule)] text-[var(--ink)] text-[11px] font-medium"
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
    </div>
  );
}
