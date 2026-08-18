'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllArtifacts } from '@/lib/artifacts';
import { getAllMuseums, MuseumWithDistance, isMuseumOpenToday } from '@/lib/museums';
import ArtifactCard from '@/components/ArtifactCard';
import MuseumCard from '@/components/MuseumCard';
import MuseumDetailModal from '@/components/MuseumDetailModal';
import PersonaSwitcher from '@/components/PersonaSwitcher';
import { usePersona } from '@/components/PersonaProvider';
import {
  ShieldCheck,
  Plus,
  Sparkles,
  Compass,
  ChevronRight,
  Search,
  Landmark,
  RotateCcw,
  Building2,
  CheckCircle2,
  Ticket,
  ArrowRight,
  Zap,
  Layers,
} from 'lucide-react';

export default function CollectionPage() {
  const { persona } = usePersona();
  const allArtifacts = useMemo(() => getAllArtifacts(), []);
  const allMuseums = useMemo(() => {
    return getAllMuseums().map((m) => ({
      ...m,
      isOpenToday: isMuseumOpenToday(m.opening_hours.closed_on),
    })) as MuseumWithDistance[];
  }, []);

  // Main Tab State: 'artifacts' | 'museums'
  const [activeTab, setActiveTab] = useState<'artifacts' | 'museums'>('artifacts');

  // Artifact Search & Filter State
  const [artifactQuery, setArtifactQuery] = useState<string>('');
  const [artifactPeriod, setArtifactPeriod] = useState<string>('all');
  const [artifactMedium, setArtifactMedium] = useState<string>('all');

  // Museum Search & Filter State
  const [museumQuery, setMuseumQuery] = useState<string>('');
  const [museumState, setMuseumState] = useState<string>('all');
  const [museumCategory, setMuseumCategory] = useState<string>('all');
  const [museumFreeOnly, setMuseumFreeOnly] = useState<boolean>(false);
  const [museumAccessibleOnly, setMuseumAccessibleOnly] = useState<boolean>(false);

  // Museum Details Modal State
  const [selectedMuseum, setSelectedMuseum] = useState<MuseumWithDistance | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Extract unique states for dropdown
  const uniqueStates = useMemo(() => {
    const states = Array.from(new Set(allMuseums.map((m) => m.state))).sort();
    return states;
  }, [allMuseums]);

  // Filtered Artifacts with Period & Medium support
  const filteredArtifacts = useMemo(() => {
    const q = artifactQuery.trim().toLowerCase();
    return allArtifacts.filter((artifact) => {
      // Period filter
      if (artifactPeriod !== 'all') {
        const periodKey = artifactPeriod.toLowerCase();
        const artPeriod = `${artifact.period} ${artifact.culture}`.toLowerCase();
        if (!artPeriod.includes(periodKey)) {
          return false;
        }
      }

      // Medium filter
      if (artifactMedium !== 'all') {
        const medKey = artifactMedium.toLowerCase();
        const artMed = artifact.material.toLowerCase();
        if (!artMed.includes(medKey)) {
          return false;
        }
      }

      // Keyword query filter
      if (q) {
        const matchText = `${artifact.title} ${artifact.culture} ${artifact.material} ${artifact.period} ${artifact.museumName} ${artifact.id}`.toLowerCase();
        if (!matchText.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allArtifacts, artifactQuery, artifactPeriod, artifactMedium]);

  // Filtered Museums
  const filteredMuseums = useMemo(() => {
    const q = museumQuery.trim().toLowerCase();
    return allMuseums.filter((museum) => {
      // Keyword search
      if (q) {
        const matchText = `${museum.name} ${museum.city} ${museum.state} ${museum.pincode} ${museum.description} ${museum.category}`.toLowerCase();
        if (!matchText.includes(q)) {
          return false;
        }
      }

      // State filter
      if (museumState !== 'all' && museum.state !== museumState) {
        return false;
      }

      // Category filter
      if (museumCategory !== 'all' && museum.category !== museumCategory) {
        return false;
      }

      // Free Entry
      if (museumFreeOnly && !museum.entry_fee.is_free) {
        return false;
      }

      // Accessible Only
      if (museumAccessibleOnly && (!museum.accessibility_features || museum.accessibility_features.length === 0)) {
        return false;
      }

      return true;
    });
  }, [allMuseums, museumQuery, museumState, museumCategory, museumFreeOnly, museumAccessibleOnly]);

  const handleResetArtifactFilters = () => {
    setArtifactQuery('');
    setArtifactPeriod('all');
    setArtifactMedium('all');
  };

  const handleResetMuseumFilters = () => {
    setMuseumQuery('');
    setMuseumState('all');
    setMuseumCategory('all');
    setMuseumFreeOnly(false);
    setMuseumAccessibleOnly(false);
  };

  const isArtifactFilterActive =
    artifactQuery.trim() !== '' ||
    artifactPeriod !== 'all' ||
    artifactMedium !== 'all';

  const isMuseumFilterActive =
    museumQuery.trim() !== '' ||
    museumState !== 'all' ||
    museumCategory !== 'all' ||
    museumFreeOnly ||
    museumAccessibleOnly;

  // Hero Masterwork reference (Dancing Girl art-001)
  const heroArtifact = allArtifacts[0];

  // Dynamic persona snippet for hero showcase card
  const heroSnippet = useMemo(() => {
    if (persona.accessibility) {
      return 'Discovered in 1926 at Mohenjo-daro. 10.5 cm bronze statue created with lost-wax technique. Verified by the Archaeological Survey of India.';
    }
    if (persona.audience === 'child') {
      return 'Look at her bangles all the way up her left arm! She stands proudly with her hand on her hip, looking ready to dance across 4,500 years of history!';
    }
    if (persona.audience === 'specialist') {
      return 'Mature Harappan lost-wax (cire perdue) masterpiece from the HR area. Notable for naturalistic limb articulation, triple-bead pendant necklace, and resting shoulder bun.';
    }
    return 'Cast circa 2300–1750 BCE in bronze, this 10.5 cm Harappan masterpiece portrays a young woman in a dynamic posture, adorned with bangles and an elaborate bun.';
  }, [persona]);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 min-h-[100dvh] overflow-x-hidden">
      {/* 1. Asymmetric Split Editorial Hero (7:5) */}
      <section className="relative pt-4 sm:pt-6 lg:pt-8" aria-label="Hero Introduction">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: 7 Units Narrative & Platform Stats */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Curatorial Accreditation Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-mono font-semibold uppercase tracking-wider border border-[var(--accent)]/20 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>Verifiable Museum Interpretation · ASI Benchmark</span>
            </div>

            {/* Editorial Title with Modern Serif Fraunces */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-bronze)] uppercase tracking-widest font-semibold">
                <span>✦ Cultural Heritage Interpretation Engine</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[var(--ink)] tracking-tight leading-[1.1]">
                Same facts. <br className="hidden sm:inline" />
                <span className="italic font-normal text-[var(--accent)]">Re-voiced</span> for whoever is reading.
              </h1>
            </div>

            {/* Narrative Editorial Lead */}
            <p className="text-base sm:text-lg text-[var(--ink-muted)] leading-relaxed max-w-2xl font-sans">
              Digital Muse transforms canonical museum accession records and wall texts into 4 adaptive audience voices—for curious children, academic scholars, casual visitors, and screen-readers—with an immutable guarantee that not a single historical claim is compromised.
            </p>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('artifacts');
                  const el = document.getElementById('gallery-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--accent)]/90 transition-all tactile-press shadow-museum cursor-pointer min-h-[44px]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Masterworks</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--paper-surface)] text-[var(--ink)] text-xs sm:text-sm font-semibold border border-[var(--hairline)] hover:border-[var(--accent)]/50 hover:bg-[var(--paper-subtle)] transition-all tactile-press min-h-[44px]"
              >
                <Compass className="w-4 h-4 text-[var(--accent)]" />
                <span>Spatial Map (35+)</span>
              </Link>

              <Link
                href="/roots"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-bronze-soft)] text-[var(--accent-bronze)] text-xs sm:text-sm font-semibold border border-[var(--accent-bronze)]/30 hover:bg-[var(--accent-bronze-soft)]/80 transition-all tactile-press min-h-[44px]"
              >
                <Building2 className="w-4 h-4 text-[var(--accent-bronze)]" />
                <span>Roots by PIN</span>
              </Link>
            </div>

            {/* Platform Stats Grid (4 key metrics) */}
            <div className="pt-6 border-t border-[var(--hairline)] grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-0.5">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                  10
                </div>
                <div className="text-[11px] font-mono text-[var(--ink-muted)] uppercase tracking-wider">
                  Masterworks
                </div>
                <div className="text-[10px] text-[var(--accent)]">
                  100% Fact Claimed
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                  35+
                </div>
                <div className="text-[11px] font-mono text-[var(--ink-muted)] uppercase tracking-wider">
                  Museums
                </div>
                <div className="text-[10px] text-[var(--accent)]">
                  20+ States &amp; UTs
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                  4
                </div>
                <div className="text-[11px] font-mono text-[var(--ink-muted)] uppercase tracking-wider">
                  Personas
                </div>
                <div className="text-[10px] text-[var(--accent)]">
                  Adult, Child, Academic, A11y
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                  0ms
                </div>
                <div className="text-[11px] font-mono text-[var(--ink-muted)] uppercase tracking-wider">
                  Latency
                </div>
                <div className="text-[10px] text-[var(--verified)]">
                  Instant Synthesis
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 5 Units Hero Masterwork Plate */}
          <div className="lg:col-span-5">
            <div className="relative group rounded-3xl bg-[var(--paper-surface)] border border-[var(--hairline-strong)] p-4 sm:p-5 shadow-museum tactile-card">
              {/* Top Meta Bar */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--verified)] animate-pulse" />
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Featured Masterwork Plate
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--verified-soft)] text-[var(--verified)] border border-[var(--verified)]/20">
                  ASI Benchmark
                </span>
              </div>

              {/* Masterwork Photographic Plate */}
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[var(--paper-subtle)] border border-[var(--hairline)] mb-4">
                <Image
                  src={heroArtifact.imageUrl}
                  alt={heroArtifact.curatorAltText || heroArtifact.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />

                {/* Period Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--ink)]/85 backdrop-blur-xs text-[var(--paper)] text-[10px] font-mono uppercase tracking-wider shadow-xs">
                  {heroArtifact.period}
                </div>

                {/* Claim Count */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--paper-surface)]/95 backdrop-blur-xs text-[var(--verified)] text-[11px] font-mono font-semibold border border-[var(--hairline)] shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--verified)]" />
                  <span>100% Verified · {heroArtifact.claims.length} Claims</span>
                </div>
              </div>

              {/* Title & Live Persona Snippet Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--accent)]">
                    {heroArtifact.culture}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                    {heroArtifact.museumName}
                  </span>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink)]">
                  {heroArtifact.title}
                </h3>

                {/* Real-time Dynamic Lens Quote */}
                <div className="p-3.5 rounded-xl bg-[var(--paper-subtle)] border border-[var(--hairline)] text-xs text-[var(--ink)] leading-relaxed">
                  <div className="text-[10px] font-mono text-[var(--accent)] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[var(--accent)]" />
                    <span>Live Persona Preview ({persona.accessibility ? 'Plain & Clear' : persona.audience.toUpperCase()}):</span>
                  </div>
                  <p className="italic font-serif text-[13px] text-[var(--ink)]">
                    &ldquo;{heroSnippet}&rdquo;
                  </p>
                </div>

                {/* Direct Action Link to Detail & Auditor */}
                <Link
                  href={`/artifact/${heroArtifact.id}`}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-xs font-semibold hover:bg-[var(--accent)] transition-colors min-h-[42px] tactile-press"
                >
                  <span>Examine &amp; Audit Masterwork</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. In-situ Floating Persona Mode Switcher */}
      <section aria-label="Audience Persona Mode Switcher" className="space-y-3">
        <PersonaSwitcher variant="hero" showDescriptions={true} />
      </section>

      {/* 3. Feature Exploration Quick Launch Callouts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Platform Capabilities">
        {/* Spatial Map Callout */}
        <div className="p-5 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] hover:border-[var(--accent)]/40 tactile-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
                  Spatial Heritage Canvas
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                  Interactive
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
                Pan and zoom 35+ verified institutions across India with GPS proximity sorting and card-pin synchronization.
              </p>
            </div>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--paper-subtle)] text-[var(--ink)] hover:bg-[var(--accent)] hover:text-white border border-[var(--hairline)] transition-all min-h-[40px] tactile-press"
          >
            <span>Launch Canvas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Connect to Roots Callout */}
        <div className="p-5 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] hover:border-[var(--accent-bronze)]/40 tactile-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-bronze-soft)] text-[var(--accent-bronze)] flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
                  Connect to Your Roots
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent-bronze)] text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                  PIN Resolver
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
                Enter your 6-digit postal PIN code to discover ancestral civilizational dynasties, living craft traditions, and TTS narration.
              </p>
            </div>
          </div>

          <Link
            href="/roots"
            className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--paper-subtle)] text-[var(--ink)] hover:bg-[var(--accent-bronze)] hover:text-white border border-[var(--hairline)] transition-all min-h-[40px] tactile-press"
          >
            <span>Explore Roots</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Curator Ingestion Studio Callout */}
        <div className="p-5 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] hover:border-[var(--ink)]/40 tactile-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--paper-subtle)] text-[var(--ink)] border border-[var(--hairline)] flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
                  Curator Studio Wizard
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[var(--ink)] text-[var(--paper)] text-[9px] font-mono font-bold uppercase tracking-wider">
                  4-Step Studio
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
                Ingest new artifact records, author verifiable atomic claims, and live-preview simultaneous persona adaptations.
              </p>
            </div>
          </div>

          <Link
            href="/add"
            className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--paper-subtle)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] border border-[var(--hairline)] transition-all min-h-[40px] tactile-press"
          >
            <span>Launch Ingest Studio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 4. Main Gallery & Directory Showcase */}
      <section id="gallery-section" className="space-y-8" aria-label="Museum Gallery and Directory">
        {/* Dual Tab Navigation Bar */}
        <div className="border-b border-[var(--hairline)] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] shadow-2xs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'artifacts'}
              onClick={() => setActiveTab('artifacts')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[40px] tactile-press ${
                activeTab === 'artifacts'
                  ? 'bg-[var(--accent)] text-white shadow-museum'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-subtle)]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Masterworks Showcase</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'artifacts'
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] border border-[var(--hairline)]'
                }`}
              >
                {filteredArtifacts.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'museums'}
              onClick={() => setActiveTab('museums')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[40px] tactile-press ${
                activeTab === 'museums'
                  ? 'bg-[var(--accent)] text-white shadow-museum'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-subtle)]'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Verified Museums (35+)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'museums'
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] border border-[var(--hairline)]'
                }`}
              >
                {filteredMuseums.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-[var(--ink-muted)] font-sans">
            {activeTab === 'artifacts'
              ? `${filteredArtifacts.length} masterworks verified for adaptive interpretation`
              : `${filteredMuseums.length} registered institutions across 20+ States & UTs`}
          </div>
        </div>

        {/* Tab 1: Artifact Masterworks */}
        {activeTab === 'artifacts' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Artifact Filters Control Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] shadow-card space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)]" />
                <input
                  type="text"
                  placeholder="Search 10 masterworks by title, culture, material, period, or museum..."
                  value={artifactQuery}
                  onChange={(e) => setArtifactQuery(e.target.value)}
                  className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-[var(--paper-subtle)] border border-[var(--hairline)] text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors min-h-[42px]"
                />
                {artifactQuery && (
                  <button
                    type="button"
                    onClick={() => setArtifactQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Period and Medium Filter Pills */}
              <div className="space-y-3 pt-2 border-t border-[var(--hairline)]">
                {/* Period Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--ink-muted)] shrink-0 sm:w-20">
                    Period:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                    {[
                      { id: 'all', label: 'All Periods' },
                      { id: 'indus', label: 'Indus Valley (c. 2300–1750 BCE)' },
                      { id: 'mauryan', label: 'Mauryan (c. 3rd–2nd C. BCE)' },
                      { id: 'gupta', label: 'Gupta (c. 4th–6th C. CE)' },
                      { id: 'chola', label: 'Chola (c. 10th–11th C. CE)' },
                      { id: 'mughal', label: 'Mughal / Modern (c. 16th–19th C.)' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setArtifactPeriod(p.id)}
                        className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-150 cursor-pointer min-h-[32px] tactile-press ${
                          artifactPeriod === p.id
                            ? 'bg-[var(--accent)] text-white font-semibold shadow-xs'
                            : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] border border-[var(--hairline)] hover:border-[var(--accent)]/40 hover:text-[var(--ink)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Medium Pills & Reset button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--ink-muted)] shrink-0 sm:w-20">
                      Medium:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                      {[
                        { id: 'all', label: 'All Media' },
                        { id: 'bronze', label: 'Bronze Castings' },
                        { id: 'sandstone', label: 'Chunar Sandstone' },
                        { id: 'copper', label: 'Copper Alloy' },
                        { id: 'marble', label: 'Marble / Jade' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setArtifactMedium(m.id)}
                          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-150 cursor-pointer min-h-[32px] tactile-press ${
                            artifactMedium === m.id
                              ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold shadow-xs'
                              : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] border border-[var(--hairline)] hover:border-[var(--ink)]/40 hover:text-[var(--ink)]'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isArtifactFilterActive && (
                    <button
                      type="button"
                      onClick={handleResetArtifactFilters}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Staggered Diagonal Masonry Grid */}
            {filteredArtifacts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredArtifacts.map((artifact, index) => (
                  <div
                    key={artifact.id}
                    className={`transition-transform duration-300 ${
                      index % 3 === 1 ? 'lg:translate-y-4' : index % 3 === 2 ? 'lg:translate-y-8' : ''
                    }`}
                  >
                    <ArtifactCard
                      artifact={artifact}
                      priority={index < 3}
                      staggerIndex={index}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 rounded-3xl bg-[var(--paper-surface)] border border-[var(--hairline)] space-y-4 shadow-card">
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[var(--ink)]">
                  No matching masterworks found
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mx-auto leading-relaxed">
                  No artifacts match &ldquo;{artifactQuery || artifactPeriod || artifactMedium}&rdquo;. Try clearing your search query or adjusting your filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetArtifactFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-xs font-semibold hover:bg-[var(--accent)] transition-colors cursor-pointer tactile-press min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Verified Indian Museums (35+) */}
        {activeTab === 'museums' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Museum Filters & Controls */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline)] shadow-card space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search query input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)]" />
                  <input
                    type="text"
                    placeholder="Search 35+ museums by name, city, state, PIN, or description..."
                    value={museumQuery}
                    onChange={(e) => setMuseumQuery(e.target.value)}
                    className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-[var(--paper-subtle)] border border-[var(--hairline)] text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors min-h-[42px]"
                  />
                  {museumQuery && (
                    <button
                      type="button"
                      onClick={() => setMuseumQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* State selector dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={museumState}
                    onChange={(e) => setMuseumState(e.target.value)}
                    aria-label="Filter museums by state or union territory"
                    className="px-3 py-2.5 rounded-xl bg-[var(--paper-subtle)] border border-[var(--hairline)] text-xs sm:text-sm text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)] min-h-[42px] cursor-pointer"
                  >
                    <option value="all">All States &amp; UTs ({allMuseums.length})</option>
                    {uniqueStates.map((st) => (
                      <option key={st} value={st}>
                        {st} ({allMuseums.filter((m) => m.state === st).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Pills & Quick Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--hairline)]">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                  {[
                    { id: 'all', label: 'All Categories' },
                    { id: 'archaeology', label: 'Archaeology' },
                    { id: 'art_sculpture', label: 'Art & Sculpture' },
                    { id: 'memorial_historic', label: 'Memorial & Historic' },
                    { id: 'textiles_crafts', label: 'Textiles & Crafts' },
                    { id: 'natural_history', label: 'Natural History' },
                    { id: 'maritime_military', label: 'Military' },
                    { id: 'multidisciplinary', label: 'Multidisciplinary' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setMuseumCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-150 cursor-pointer min-h-[32px] tactile-press ${
                        museumCategory === cat.id
                          ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold shadow-xs'
                          : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] border border-[var(--hairline)] hover:border-[var(--accent)]/40 hover:text-[var(--ink)]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Quick Toggle Buttons */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setMuseumFreeOnly((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer min-h-[32px] tactile-press ${
                      museumFreeOnly
                        ? 'bg-[var(--verified)] text-white border-[var(--verified)] font-semibold'
                        : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] border-[var(--hairline)] hover:border-[var(--verified)]'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Free Entry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMuseumAccessibleOnly((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer min-h-[32px] tactile-press ${
                      museumAccessibleOnly
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-semibold'
                        : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] border-[var(--hairline)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accessible</span>
                  </button>

                  {isMuseumFilterActive && (
                    <button
                      type="button"
                      onClick={handleResetMuseumFilters}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors text-xs font-mono font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Museum Cards Grid */}
            {filteredMuseums.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredMuseums.map((museum) => (
                  <MuseumCard
                    key={museum.id}
                    museum={museum}
                    isSelected={selectedMuseum?.id === museum.id}
                    onSelect={() => setSelectedMuseum(museum)}
                    onOpenDetails={() => {
                      setSelectedMuseum(museum);
                      setIsDetailModalOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 rounded-3xl bg-[var(--paper-surface)] border border-[var(--hairline)] space-y-4 shadow-card">
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mx-auto shadow-xs">
                  <Landmark className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[var(--ink)]">
                  No museums match your search
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mx-auto leading-relaxed">
                  No registered institutions match the selected state, category, or search keywords.
                </p>
                <button
                  type="button"
                  onClick={handleResetMuseumFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-xs font-semibold hover:bg-[var(--accent)] transition-colors cursor-pointer tactile-press min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. Curator & Institutional Partner Banner Colophon */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[var(--paper-surface)] to-[var(--accent-soft)]/30 border border-[var(--hairline-strong)] shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center shadow-xs shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="font-serif text-lg sm:text-xl font-bold text-[var(--ink)]">
              Curator &amp; Institutional Partner Studio
            </div>
            <div className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
              Want to see how your institution&apos;s collection is adapted? Test our 4-step ingestion form with live atomic claim validation.
            </div>
          </div>
        </div>

        <Link
          href="/add"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all shadow-museum whitespace-nowrap min-h-[44px] tactile-press shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Curator Studio</span>
        </Link>
      </section>

      {/* Museum Detail Sheet Modal */}
      <MuseumDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        museum={selectedMuseum}
      />
    </div>
  );
}
