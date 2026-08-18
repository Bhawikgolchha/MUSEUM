'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { getAllArtifacts } from '@/lib/artifacts';
import { getAllMuseums, MuseumWithDistance, isMuseumOpenToday } from '@/lib/museums';
import ArtifactCard from '@/components/ArtifactCard';
import MuseumCard from '@/components/MuseumCard';
import MuseumDetailModal from '@/components/MuseumDetailModal';
import {
  ShieldCheck,
  Plus,
  Sparkles,
  Compass,
  MapPin,
  ChevronRight,
  Search,
  Landmark,
  Layers,
  RotateCcw,
  Building2,
  SlidersHorizontal,
  CheckCircle2,
  Ticket,
} from 'lucide-react';

export default function CollectionPage() {
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
  const [artifactCategory, setArtifactCategory] = useState<string>('all');

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

  // Filtered Artifacts
  const filteredArtifacts = useMemo(() => {
    const q = artifactQuery.trim().toLowerCase();
    return allArtifacts.filter((artifact) => {
      // Category filter
      if (artifactCategory !== 'all') {
        const cat = artifactCategory.toLowerCase();
        const artText = `${artifact.material} ${artifact.culture} ${artifact.title}`.toLowerCase();
        if (!artText.includes(cat)) {
          return false;
        }
      }

      // Keyword query filter
      if (q) {
        const matchText = `${artifact.title} ${artifact.culture} ${artifact.material} ${artifact.period} ${artifact.id}`.toLowerCase();
        if (!matchText.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allArtifacts, artifactQuery, artifactCategory]);

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
    setArtifactCategory('all');
  };

  const handleResetMuseumFilters = () => {
    setMuseumQuery('');
    setMuseumState('all');
    setMuseumCategory('all');
    setMuseumFreeOnly(false);
    setMuseumAccessibleOnly(false);
  };

  const isMuseumFilterActive =
    museumQuery.trim() !== '' ||
    museumState !== 'all' ||
    museumCategory !== 'all' ||
    museumFreeOnly ||
    museumAccessibleOnly;

  return (
    <div className="space-y-8">
      {/* Product Hero Banner */}
      <div className="text-center sm:text-left max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verifiable Museum Interpretation</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--ink)] tracking-tight leading-tight">
          Same facts. Re-voiced for whoever is reading.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[var(--ink-muted)] leading-relaxed">
          Muse takes an institution&apos;s canonical artifact description and adapts vocabulary, depth, and tone for children, scholars, casual visitors, and screen-readers—with a visible guarantee that not a single fact was altered.
        </p>
      </div>

      {/* Feature Exploration Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spatial Map Callout */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--paper-raised)] to-[var(--accent-soft)]/30 border border-[var(--accent)]/30 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-[var(--accent)] text-white shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-bold text-[var(--ink)]">
                  Spatial India Map
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-white text-[9px] uppercase font-bold tracking-wider">
                  Interactive
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                Explore 35+ verified institutions with 2D projection and distance radius search.
              </p>
            </div>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all shadow-xs whitespace-nowrap min-h-[40px]"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Launch</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Connect to Roots Callout */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--paper-raised)] to-[var(--accent-soft)]/20 border border-[var(--rule)] flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-[var(--ink)] text-[var(--paper)] shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-bold text-[var(--ink)]">
                  Connect to Your Roots
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                Discover civilizational heritage, dynasties, and craft traditions by home PIN code.
              </p>
            </div>
          </div>

          <Link
            href="/roots"
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--paper)] text-[var(--ink)] border border-[var(--rule)] hover:border-[var(--accent)] transition-all shadow-xs whitespace-nowrap min-h-[40px]"
          >
            <span>Explore Roots</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Dual Tab Navigation Bar */}
      <div className="space-y-6">
        <div className="border-b border-[var(--rule)] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)]" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'artifacts'}
              onClick={() => setActiveTab('artifacts')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'artifacts'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Artifact Masterworks</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'artifacts'
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--rule)]/60 text-[var(--ink-muted)]'
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'museums'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)]'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>All Museums (30+)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'museums'
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--rule)]/60 text-[var(--ink-muted)]'
                }`}
              >
                {filteredMuseums.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-[var(--ink-muted)]">
            {activeTab === 'artifacts'
              ? `${filteredArtifacts.length} masterworks verified for adaptive interpretation`
              : `${filteredMuseums.length} authentic institutions registered across 20+ States/UTs`}
          </div>
        </div>

        {/* Tab 1: Artifact Masterworks */}
        {activeTab === 'artifacts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Artifact Filters Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)]">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)]" />
                <input
                  type="text"
                  placeholder="Search artifacts by name, culture, material, period..."
                  value={artifactQuery}
                  onChange={(e) => setArtifactQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--paper)] border border-[var(--rule)] text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
                {artifactQuery && (
                  <button
                    type="button"
                    onClick={() => setArtifactQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
                {[
                  { id: 'all', label: 'All Media' },
                  { id: 'bronze', label: 'Bronze Castings' },
                  { id: 'sandstone', label: 'Sandstone' },
                  { id: 'copper', label: 'Copper Alloy' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setArtifactCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                      artifactCategory === cat.id
                        ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
                        : 'bg-[var(--paper)] text-[var(--ink-muted)] border border-[var(--rule)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Artifacts Grid */}
            {filteredArtifacts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredArtifacts.map((artifact) => (
                  <ArtifactCard key={artifact.id} artifact={artifact} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
                  No matching artifacts found
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mx-auto">
                  No masterworks match &ldquo;{artifactQuery}&rdquo;. Try clearing your search query or filter.
                </p>
                <button
                  type="button"
                  onClick={handleResetArtifactFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-xs font-semibold hover:bg-[var(--ink)]/90 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Search</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: All Museums (30+) */}
        {activeTab === 'museums' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Museum Filters & Controls */}
            <div className="p-4 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search query input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)]" />
                  <input
                    type="text"
                    placeholder="Search 35+ museums by name, city, state, PIN, or description..."
                    value={museumQuery}
                    onChange={(e) => setMuseumQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--rule)] text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  {museumQuery && (
                    <button
                      type="button"
                      onClick={() => setMuseumQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
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
                    className="px-3 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--rule)] text-xs sm:text-sm text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)] min-h-[42px]"
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
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--rule)]/60">
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
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                        museumCategory === cat.id
                          ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
                          : 'bg-[var(--paper)] text-[var(--ink-muted)] border border-[var(--rule)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Quick Toggle Toggles */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setMuseumFreeOnly((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      museumFreeOnly
                        ? 'bg-[var(--verified)] text-white border-[var(--verified)] font-semibold'
                        : 'bg-[var(--paper)] text-[var(--ink-muted)] border-[var(--rule)] hover:border-[var(--verified)]'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Free Entry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMuseumAccessibleOnly((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      museumAccessibleOnly
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-semibold'
                        : 'bg-[var(--paper)] text-[var(--ink-muted)] border-[var(--rule)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accessible</span>
                  </button>

                  {isMuseumFilterActive && (
                    <button
                      type="button"
                      onClick={handleResetMuseumFilters}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors text-xs font-semibold"
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
              <div className="text-center py-16 px-4 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mx-auto">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
                  No museums match your search
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mx-auto">
                  No registered institutions match the selected state, category, or search keywords.
                </p>
                <button
                  type="button"
                  onClick={handleResetMuseumFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-xs font-semibold hover:bg-[var(--ink)]/90 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Curator Demo Footnote */}
      <div className="p-4 sm:p-5 rounded-xl bg-[var(--paper-raised)] border border-[var(--rule)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--ink)]">
              Curator &amp; Partner Demonstration
            </div>
            <div className="text-xs text-[var(--ink-muted)]">
              Want to see how your museum&apos;s collection is adapted? Paste any wall text into the live generator.
            </div>
          </div>
        </div>
        <Link
          href="/add"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors whitespace-nowrap min-h-[44px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Curator Ingest Form</span>
        </Link>
      </div>

      {/* Museum Detail Sheet Modal */}
      <MuseumDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        museum={selectedMuseum}
      />
    </div>
  );
}
