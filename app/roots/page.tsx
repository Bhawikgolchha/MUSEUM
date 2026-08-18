'use client';

import React, { useState } from 'react';
import { resolveRootsByPincode, RootConnection, POSTAL_CIRCLE_MAP } from '@/lib/roots';
import { saveUserRootDiscovery } from '@/lib/supabase';
import ArtifactCard from '@/components/ArtifactCard';
import MuseumCard from '@/components/MuseumCard';
import MuseumDetailModal from '@/components/MuseumDetailModal';
import { MuseumWithDistance } from '@/lib/museums';
import ReadAloudButton from '@/components/ReadAloudButton';
import AiHistoricalBrief from '@/components/AiHistoricalBrief';
import { Sparkles, Heart, MapPin, Search, Landmark, Layers, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ConnectToRootsPage() {
  const [pincode, setPincode] = useState<string>('600008');
  const [rootData, setRootData] = useState<RootConnection | null>(() => resolveRootsByPincode('600008'));
  const [hasSearched, setHasSearched] = useState<boolean>(true);
  const [selectedMuseum, setSelectedMuseum] = useState<MuseumWithDistance | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length < 2) return;

    const result = resolveRootsByPincode(pincode);
    setRootData(result);
    setHasSearched(true);

    // Save discovery event to Supabase or local storage
    saveUserRootDiscovery({
      pincode: pincode.trim(),
      state: result.state,
      cultural_roots: result.dynasticHeritage,
    });
  };

  const textToNarrate = rootData
    ? `Discovering your heritage for ${rootData.state}. ${rootData.culturalStory} Your ancestral craft tradition includes ${rootData.craftsTradition}. Preserved in collections at ${rootData.nearbyMuseums[0]?.name}.`
    : '';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold uppercase tracking-wider">
          <Heart className="w-3.5 h-3.5 fill-[var(--accent)] text-[var(--accent)]" />
          <span>Cultural Lineage &amp; Living Roots</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[var(--ink)] tracking-tight">
          Connect to Your Roots
        </h1>
        <p className="text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed">
          Enter your home PIN code or ancestral region. Discover the ancient dynasties, sacred craftsmanship, and museum masterworks that form the roots of who you are.
        </p>
      </div>

      {/* PIN Code Search Bar */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto p-2 sm:p-2.5 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] shadow-sm flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--accent)]" />
          <input
            type="text"
            required
            maxLength={6}
            placeholder="Enter your 6-digit PIN code (e.g. 600008, 110001, 800001)..."
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-transparent bg-transparent text-sm text-[var(--ink)] font-medium focus:outline-none placeholder:text-[var(--ink-muted)]"
          />
        </div>
        <button
          type="submit"
          className="py-3 px-6 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--accent)]/90 transition-all shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Sparkles className="w-4 h-4" />
          <span>Reveal My Roots</span>
        </button>
      </form>

      {/* Quick Pin Presets */}
      <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-[var(--ink-muted)]">
        <span className="font-semibold uppercase tracking-wider text-[10px]">Try PINs:</span>
        {[
          { pin: '110001', label: 'Delhi' },
          { pin: '600008', label: 'Chennai / Tamil Nadu' },
          { pin: '800001', label: 'Patna / Bihar' },
          { pin: '221001', label: 'Varanasi / Sarnath' },
          { pin: '700016', label: 'Kolkata / Bengal' },
          { pin: '400023', label: 'Mumbai / Maharashtra' },
          { pin: '560001', label: 'Bengaluru / Karnataka' },
          { pin: '500002', label: 'Hyderabad / Telangana' },
        ].map((item) => (
          <button
            key={item.pin}
            type="button"
            onClick={() => {
              setPincode(item.pin);
              const result = resolveRootsByPincode(item.pin);
              setRootData(result);
              setHasSearched(true);
            }}
            className={`px-2.5 py-1 rounded-full border transition-all ${
              pincode === item.pin
                ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-semibold'
                : 'bg-[var(--paper-raised)] text-[var(--ink-muted)] border-[var(--rule)] hover:border-[var(--accent)]'
            }`}
          >
            {item.label} ({item.pin})
          </button>
        ))}
      </div>

      {/* AI Cultural & Historical Brief */}
      <AiHistoricalBrief pincode={pincode} />

      {/* Living Roots Narrative Card */}
      {rootData && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Main Heritage Showcase Panel */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[var(--paper-raised)] via-[var(--paper-raised)] to-[var(--accent-soft)]/40 border border-[var(--accent)]/30 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--rule)]/60">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] block mb-1">
                  Ancestral Region &amp; Civilizational Era
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--ink)]">
                  {rootData.dynasticHeritage}
                </h2>
                <div className="text-xs text-[var(--ink-muted)] mt-1">
                  {rootData.civilizationalEra} · {rootData.state}
                </div>
              </div>

              {/* Audio narration button */}
              <ReadAloudButton textToRead={textToNarrate} />
            </div>

            {/* Cultural Story */}
            <div className="space-y-3">
              <p className="font-serif text-base sm:text-lg leading-relaxed text-[var(--ink)]">
                &ldquo;{rootData.culturalStory}&rdquo;
              </p>
            </div>

            {/* Craft Tradition Badge */}
            <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] flex items-start gap-3 text-xs sm:text-sm text-[var(--ink)]">
              <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-[var(--accent)] uppercase text-[11px] font-bold block mb-0.5 tracking-wider">
                  Ancestral Craft &amp; Artistic Lineage:
                </strong>
                <span>{rootData.craftsTradition}</span>
              </div>
            </div>
          </div>

          {/* Masterwork Artifact from your Ancestral Soil */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                  Masterwork from Your Lineage
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  Preserved in museum archives with 100% verified adaptive interpretation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {rootData.highlightArtifacts.map((artifact) => (
                <ArtifactCard key={artifact.id} artifact={artifact} />
              ))}
            </div>
          </div>

          {/* Regional Museums Preserving Your Roots */}
          {rootData.nearbyMuseums.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[var(--rule)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                    Institutions Preserving Your Heritage
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Visit in person to see original artifacts from your ancestral region.
                  </p>
                </div>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  <span>Explore All Museums</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {rootData.nearbyMuseums.map((museum) => (
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
            </div>
          )}

          {/* Museum Details Sheet Modal */}
          <MuseumDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            museum={selectedMuseum}
          />
        </div>
      )}
    </div>
  );
}
