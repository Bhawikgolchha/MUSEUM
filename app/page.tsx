import React from 'react';
import { getAllArtifacts } from '@/lib/artifacts';
import ArtifactCard from '@/components/ArtifactCard';
import Link from 'next/link';
import { ShieldCheck, Plus, Sparkles, Compass, MapPin, ChevronRight } from 'lucide-react';

export default function CollectionPage() {
  const artifacts = getAllArtifacts();

  return (
    <div className="space-y-8">
      {/* Product Hero Banner */}
      <div className="text-center sm:text-left max-w-2xl">
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

      {/* Find Museums by Area Interactive Callout Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[var(--paper-raised)] to-[var(--accent-soft)]/30 border border-[var(--accent)]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[var(--accent)] text-white shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-serif font-bold text-[var(--ink)]">
                Find Museums by Area
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-white text-[10px] uppercase font-bold tracking-wider">
                New Feature
              </span>
            </div>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5 max-w-lg">
              Explore cultural heritage institutions across India by city, PIN code, or radius with synchronized NanoBanana spatial map visualization.
            </p>
          </div>
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all shadow-xs whitespace-nowrap min-h-[44px]"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Launch Spatial Map</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Artifacts Grid */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--rule)]">
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
            Featured Museum Masterworks
          </h2>
          <span className="text-xs text-[var(--ink-muted)]">
            {artifacts.length} Verified Objects
          </span>
        </div>

        {artifacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {artifacts.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)]">
            <h2 className="font-serif text-2xl font-semibold text-[var(--ink)] mb-2">No artifacts yet</h2>
            <p className="text-sm text-[var(--ink-muted)] mb-4">Add your institution&apos;s first artifact record.</p>
            <Link
              href="/add"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add the first artifact</span>
            </Link>
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
    </div>
  );
}
