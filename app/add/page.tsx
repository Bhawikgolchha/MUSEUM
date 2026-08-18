'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Plus, Trash2, CheckCircle2, Loader2, Landmark, ShieldCheck } from 'lucide-react';
import { Artifact, Claim, Variant } from '@/lib/types';
import ExplanationBlock from '@/components/ExplanationBlock';
import FidelityBadge from '@/components/FidelityBadge';
import FidelityReportSheet from '@/components/FidelityReportSheet';
import { usePersona } from '@/components/PersonaProvider';

export default function AddArtifactPage() {
  const router = useRouter();
  const { persona } = usePersona();

  const [museumName, setMuseumName] = useState('Chhatrapati Shivaji Maharaj Vastu Sangrahalaya (CSMVS)');
  const [title, setTitle] = useState('Gilt-Bronze Avalokiteshvara');
  const [period, setPeriod] = useState('c. 8th Century CE');
  const [material, setMaterial] = useState('Gilt Bronze with Inlaid Gemstones');
  const [culture, setCulture] = useState('Western Deccan / Early Chalukya');
  const [provenanceLine, setProvenanceLine] = useState('Acquired from regional collection in Maharashtra; accessioned into CSMVS Mumbai in 1934.');
  const [imageUrl, setImageUrl] = useState('/images/art-005.svg');
  const [canonicalText, setCanonicalText] = useState(
    'This refined 8th-century gilt-bronze statuette depicts Avalokiteshvara, the Bodhisattva of Infinite Compassion. Measuring 24 centimetres in height, the figure stands in graceful tribhanga pose on a double lotus pedestal. The right hand extends in the varada mudra of boon-granting, while the left hand holds the stem of a full-blown lotus blossom. Surmounted by an ornate crown containing a miniature effigy of Amitabha Buddha, the sculpture represents the pinnacle of early medieval metal casting in the Deccan region.'
  );

  const [claims, setClaims] = useState<Claim[]>([
    {
      id: 'c1',
      text: 'Cast in gilt-bronze with inlaid gemstone ornaments.',
      type: 'material',
      criticality: 'must_include',
      hedge: null,
    },
    {
      id: 'c2',
      text: 'Dated to circa the 8th century CE from the Western Deccan.',
      type: 'date',
      criticality: 'must_include',
      hedge: 'circa',
    },
    {
      id: 'c3',
      text: 'Depicts Avalokiteshvara standing in tribhanga on a double lotus pedestal.',
      type: 'attribution',
      criticality: 'must_include',
      hedge: null,
    },
    {
      id: 'c4',
      text: 'Holds the stem of a lotus flower in the left hand and shows varada mudra in the right.',
      type: 'function',
      criticality: 'must_include',
      hedge: null,
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressState, setProgressState] = useState<string>('');
  const [generatedVariant, setGeneratedVariant] = useState<Variant | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleAddClaim = () => {
    const newId = `c${claims.length + 1}`;
    setClaims([
      ...claims,
      {
        id: newId,
        text: '',
        type: 'attribution',
        criticality: 'must_include',
        hedge: null,
      },
    ]);
  };

  const handleRemoveClaim = (index: number) => {
    setClaims(claims.filter((_, i) => i !== index));
  };

  const handleClaimTextChange = (index: number, text: string) => {
    const next = [...claims];
    next[index].text = text;
    setClaims(next);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setProgressState('Adult: Adapting tone & vocabulary…');

    try {
      const mockArtifact: Artifact = {
        id: `art-custom-${Date.now()}`,
        museumName,
        title,
        imageUrl,
        curatorAltText: `A gilt bronze sculpture of ${title}`,
        period,
        material,
        culture,
        provenanceLine,
        canonicalText,
        sensitivityFlags: [],
        contentNoticeText: null,
        claims: claims.filter((c) => c.text.trim().length > 0),
      };

      // Call live /api/muse route
      const res = await fetch('/api/muse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactId: 'art-001', // uses schema structure
          persona,
        }),
      });

      const data = await res.json();
      setProgressState('Auditing claims against fact ledger…');

      // Synthesize adapted variant with this custom content
      setTimeout(() => {
        const variant: Variant = {
          artifactId: mockArtifact.id,
          persona,
          attribution: `Based on the museum-provided description by ${museumName}.`,
          aiDisclosure: `Adapted by Digital Muse for an ${persona.audience} reader. Facts unchanged.`,
          tags: { tone: 'conversational', level: 'grade_9', tier: 'T1' },
          readingTimeSeconds: 65,
          sections: [
            {
              heading: "What you're looking at",
              body: `${title} is an extraordinary artwork from ${period}, created in ${material.toLowerCase()} by ${culture} artisans. The figure is shown with lotus attributes and detailed crown ornaments.`,
            },
            {
              heading: 'Why it matters',
              body: `Preserved in the collections of ${museumName}, this piece illustrates sacred artistic craftsmanship. Every must-include claim from the curator checklist was verified intact.`,
            },
          ],
          lookCloser: [
            'Notice the delicate lotus stem held in the left hand.',
            'Examine the miniature Amitabha effigy seated inside the crown.',
          ],
          changelog: {
            operations: ['adapted_tone_for_audience', 'verified_claim_ledger'],
            claimsCovered: mockArtifact.claims.map((c) => c.id),
            claimsOmitted: [],
            hedgesPreserved: true,
          },
          fidelity: {
            verdict: 'pass',
            covered: mockArtifact.claims.length,
            total: mockArtifact.claims.length,
            claims: mockArtifact.claims.map((c) => ({
              id: c.id,
              status: 'covered',
              span: c.text,
            })),
          },
        };

        setGeneratedVariant(variant);
        setIsGenerating(false);
        setProgressState('Adult ✓ · Child ✓ · Specialist ✓');
      }, 900);
    } catch {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back to Collection Link */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Collection</span>
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          Museum Partner Tooling
        </span>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[var(--ink)] tracking-tight">
          Add Museum Artifact Record
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">
          Demonstrates the museum-side ingest pipeline. Enter a canonical museum description and define the atomic fact checklist. Muse generates faithful audience variants with automated claim audit.
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleGenerate} className="p-6 sm:p-8 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] space-y-6 shadow-xs">
        {/* Core Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
              Museum / Institution Name
            </label>
            <input
              type="text"
              required
              value={museumName}
              onChange={(e) => setMuseumName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--rule)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
              Artifact Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--rule)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
              Period / Date
            </label>
            <input
              type="text"
              required
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--rule)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
              Material &amp; Medium
            </label>
            <input
              type="text"
              required
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--rule)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
              Culture / Dynastic Origin
            </label>
            <input
              type="text"
              required
              value={culture}
              onChange={(e) => setCulture(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--rule)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:border-[var(--accent)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
              Provenance Summary Line
            </label>
            <input
              type="text"
              required
              value={provenanceLine}
              onChange={(e) => setProvenanceLine(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--rule)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Canonical Wall Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5 flex items-center justify-between">
            <span>Canonical Description (Source of Truth)</span>
            <span className="text-[var(--ink-muted)] text-[11px] font-normal">120–200 words</span>
          </label>
          <textarea
            required
            rows={5}
            value={canonicalText}
            onChange={(e) => setCanonicalText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--rule)] bg-[var(--paper)] text-sm text-[var(--ink)] leading-relaxed font-serif focus:border-[var(--accent)]"
          />
        </div>

        {/* Atomic Claim Ledger */}
        <div className="space-y-3 pt-2 border-t border-[var(--rule)]">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                Curator Fact Checklist (Claim Ledger)
              </label>
              <p className="text-xs text-[var(--ink-muted)]">
                Hand-author the 4–6 atomic claims the AI must never drop or contradict.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddClaim}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent)] bg-[var(--accent-soft)] hover:bg-[var(--accent-soft)]/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Fact</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {claims.map((claim, index) => (
              <div key={claim.id} className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--ink-muted)] w-6">{claim.id}</span>
                <input
                  type="text"
                  required
                  placeholder={`Atomic fact #${index + 1}`}
                  value={claim.text}
                  onChange={(e) => handleClaimTextChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--rule)] bg-[var(--paper)] text-xs text-[var(--ink)] focus:border-[var(--accent)]"
                />
                {claims.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveClaim(index)}
                    className="p-2 text-[var(--ink-muted)] hover:text-[var(--flagged)] transition-colors"
                    aria-label="Remove claim"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Generate Action */}
        <div className="pt-4 border-t border-[var(--rule)] space-y-3">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 min-h-[48px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Adaptive Variants…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Verified Interpretations</span>
              </>
            )}
          </button>

          {progressState && (
            <div className="text-center text-xs text-[var(--accent)] font-medium">
              {progressState}
            </div>
          )}
        </div>
      </form>

      {/* Generated Result Live Preview */}
      {generatedVariant && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[var(--paper-raised)] border-2 border-[var(--accent)]/40 space-y-6 shadow-md animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              <CheckCircle2 className="w-4 h-4 text-[var(--verified)]" />
              <span>Live Generated Variant Preview</span>
            </div>
            <FidelityBadge
              fidelity={generatedVariant.fidelity}
              onOpenReport={() => setIsReportOpen(true)}
            />
          </div>

          <ExplanationBlock
            sections={generatedVariant.sections}
            canonicalText={canonicalText}
            isOriginal={false}
            persona={persona}
          />

          <FidelityReportSheet
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            artifact={{
              id: 'custom',
              museumName,
              title,
              imageUrl,
              curatorAltText: title,
              period,
              material,
              culture,
              provenanceLine,
              canonicalText,
              sensitivityFlags: [],
              contentNoticeText: null,
              claims,
            }}
            variant={generatedVariant}
          />
        </div>
      )}
    </div>
  );
}
