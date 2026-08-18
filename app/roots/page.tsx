'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { resolveRootsByPincode, RootConnection } from '@/lib/roots';
import { resolvePinToCoordinates } from '@/lib/pincodes';
import { getAllMuseums, MuseumWithDistance, calculateHaversineDistance, isMuseumOpenToday, Coordinates } from '@/lib/museums';
import { getAllArtifacts } from '@/lib/artifacts';
import { saveUserRootDiscovery } from '@/lib/supabase';
import ArtifactCard from '@/components/ArtifactCard';
import MuseumCard from '@/components/MuseumCard';
import MuseumDetailModal from '@/components/MuseumDetailModal';
import ReadAloudButton from '@/components/ReadAloudButton';
import AiHistoricalBrief from '@/components/AiHistoricalBrief';
import CraftTraditions from '@/components/CraftTraditions';
import {
  Sparkles,
  Heart,
  MapPin,
  Search,
  Landmark,
  Layers,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Languages,
  Mountain,
  CheckCircle2,
  AlertCircle,
  X,
  Compass,
  Building2,
  Navigation,
} from 'lucide-react';
import Link from 'next/link';

// Detailed 4-Dimensional Ancestral Lineage Metadata Dictionary
interface AncestralLineageMetadata {
  timePeriod: string;
  linguisticHeritage: string;
  geographicContext: string;
  rulingDynasties: string[];
}

const REGIONAL_LINEAGE_METADATA: Record<string, AncestralLineageMetadata> = {
  // Tamil Nadu
  '60': {
    timePeriod: 'c. 3rd Century BCE – 13th Century CE',
    linguisticHeritage: 'Classical Tamil (Sangam corpus, Tolkappiyam) & Grantha epigraphy',
    geographicContext: 'Cauvery River Delta, Coromandel Maritime Coast & Eastern Ghats foothills',
    rulingDynasties: ['Imperial Cholas', 'Pallavas of Kanchi', 'Early Pandyas', 'Nayakas of Madurai'],
  },
  // Rajasthan (Jaipur / Mewar / Marwar)
  '30': {
    timePeriod: 'c. 8th – 18th Century CE',
    linguisticHeritage: 'Maru-Gurjara, Dhundhari, Dingal & Classical Sanskrit',
    geographicContext: 'Aravalli Range ridges, Dhundhar semi-arid basin & Thar Desert margins',
    rulingDynasties: ['Kachwaha Rajputs of Amber', 'Gurjara-Pratiharas', 'Chauhans', 'Sisodias of Mewar'],
  },
  '31': {
    timePeriod: 'c. 6th – 18th Century CE',
    linguisticHeritage: 'Mewari dialect, Dingal bardic poetry & Devanagari epigraphy',
    geographicContext: 'Mewar hill fortress plateau, Lake Pichola basin & Banas river valley',
    rulingDynasties: ['Sisodias of Mewar', 'Guhila Dynasty of Chittor'],
  },
  // Bihar (Patna / Nalanda / Gaya)
  '80': {
    timePeriod: 'c. 6th Century BCE – 12th Century CE',
    linguisticHeritage: 'Magadhi Prakrit, Classical Sanskrit (Patanjali, Aryabhata) & Mauryan Brahmi',
    geographicContext: 'Indo-Gangetic alluvial plains, Son-Ganga confluence & Rajgir hill range',
    rulingDynasties: ['Mauryan Empire', 'Gupta Golden Age', 'Haryankas', 'Pala Buddhist Empire'],
  },
  // Delhi (NCR)
  '11': {
    timePeriod: 'c. 1000 BCE – 19th Century CE',
    linguisticHeritage: 'Kauravi, Dehlavi Hindavi, Persian courtly registers & Urdu poetry',
    geographicContext: 'Yamuna River floodplains & Aravalli northern ridge terminal',
    rulingDynasties: ['Tomara Rajputs', 'Delhi Sultanate', 'Mughal Empire', 'Sur Dynasty'],
  },
  // Maharashtra (Mumbai / Konkan / Pune)
  '40': {
    timePeriod: 'c. 2nd Century BCE – 19th Century CE',
    linguisticHeritage: 'Maharashtri Prakrit, Old Marathi (Modi script) & Konkani',
    geographicContext: 'Konkan Arabian Sea coastline, Western Ghats basalt cliffs & Ulhas basin',
    rulingDynasties: ['Satavahanas', 'Silharas of Thana', 'Maratha Empire', 'Rashtrakutas'],
  },
  '41': {
    timePeriod: 'c. 13th – 19th Century CE',
    linguisticHeritage: 'Marathi (Modi script, Sant literature) & Classical Sanskrit',
    geographicContext: 'Deccan Lava Plateau, Sahyadri mountain passes & Mutha-Mula river basin',
    rulingDynasties: ['Maratha Swarajya (Chhatrapati Shivaji)', 'Peshwa Regency', 'Yadavas of Devagiri'],
  },
  // Telangana & Hyderabad
  '50': {
    timePeriod: 'c. 3rd Century BCE – 20th Century CE',
    linguisticHeritage: 'Classical Telugu (Prabandha poetry), Deccani & Persian-Urdu',
    geographicContext: 'Deccan crystalline plateau, Musi river valley & Golconda granite hills',
    rulingDynasties: ['Kakatiya Dynasty', 'Qutb Shahi Sultanate of Golconda', 'Asaf Jahi Nizams'],
  },
  // Karnataka (Bengaluru / Mysuru)
  '56': {
    timePeriod: 'c. 4th – 18th Century CE',
    linguisticHeritage: 'Old Kannada (Halegannada, Pampa corpus) & Vijayanagara Telugu',
    geographicContext: 'Deccan Mysore plateau, Arkavathi basin & Western Ghats watershed',
    rulingDynasties: ['Western Gangas', 'Hoysala Empire', 'Vijayanagara Empire', 'Wadiyars of Mysore'],
  },
  // Kerala (Kochi / Travancore)
  '68': {
    timePeriod: 'c. 3rd Century BCE – 19th Century CE',
    linguisticHeritage: 'Early Malayalam, Manipravalam poetic synthesis & Kolezhuthu script',
    geographicContext: 'Malabar Arabian Sea Spice Coast, Vembanad backwaters & Western Ghats rainforest',
    rulingDynasties: ['Chera Dynasty (Mahodayapuram)', 'Kingdom of Cochin', 'Zamorins of Calicut'],
  },
  // West Bengal (Kolkata)
  '70': {
    timePeriod: 'c. 8th – 20th Century CE',
    linguisticHeritage: 'Old Bengali (Charyapada), Gaudi Prakrit & Renaissance literary Bengali',
    geographicContext: 'Lower Gangetic delta, Hooghly river banks & Sundarban estuarine basin',
    rulingDynasties: ['Pala Empire', 'Sena Dynasty', 'Nawabs of Bengal', 'Bengal Renaissance Guilds'],
  },
  // Uttar Pradesh (Varanasi / Sarnath)
  '22': {
    timePeriod: 'c. 1200 BCE – 18th Century CE',
    linguisticHeritage: 'Vedic Sanskrit, Classical Sanskrit, Pali & Bhojpuri/Kashika',
    geographicContext: 'Ganga-Varuna-Asi sacred crescent & Doab alluvial plains',
    rulingDynasties: ['Kashi Mahajanapada', 'Mauryas', 'Guptas', 'Gahadavalas'],
  },
};

// Generic Lineage Fallback
const GENERIC_LINEAGE_METADATA: AncestralLineageMetadata = {
  timePeriod: 'c. 2500 BCE – 18th Century CE',
  linguisticHeritage: 'Classical Sanskrit, Regional Prakrits & Vernacular Epigraphy',
  geographicContext: 'Subcontinental river basin & historic trade caravan crossroads',
  rulingDynasties: ['Classical Indic Empires', 'Regional Dynastic Guilds'],
};

// Prominent Quick PIN Presets requested in specification
const QUICK_PIN_PRESETS = [
  { pin: '600001', city: 'Chennai', lineage: 'Chola / Pallava' },
  { pin: '302001', city: 'Jaipur', lineage: 'Rajput / Maru-Gurjara' },
  { pin: '800001', city: 'Patna', lineage: 'Mauryan / Magadha' },
  { pin: '110001', city: 'Delhi', lineage: 'Sultanate / Mughal' },
  { pin: '400001', city: 'Mumbai', lineage: 'Maratha / Silhara' },
  { pin: '500001', city: 'Hyderabad', lineage: 'Kakatiya / Nizam' },
  { pin: '700001', city: 'Kolkata', lineage: 'Pala / Bengal' },
  { pin: '221001', city: 'Varanasi', lineage: 'Kashi / Gupta' },
  { pin: '560001', city: 'Bengaluru', lineage: 'Hoysala / Vijayanagara' },
  { pin: '682001', city: 'Kochi', lineage: 'Chera / Malabar' },
];

export default function ConnectToRootsPage() {
  const [pincodeInput, setPincodeInput] = useState<string>('600001');
  const [pincode, setPincode] = useState<string>('600001');
  const [selectedMuseum, setSelectedMuseum] = useState<MuseumWithDistance | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Validate strict 6-digit Indian PIN format
  const isInputValid = useMemo(() => {
    return /^[1-9][0-9]{5}$/.test(pincodeInput.trim());
  }, [pincodeInput]);

  // Resolve ancestral roots and lineage
  const rootData: RootConnection = useMemo(() => {
    return resolveRootsByPincode(pincode);
  }, [pincode]);

  // Resolve user geographic coordinates and calculate proximity to all 35+ museums with Haversine distance
  const proximityMuseums: MuseumWithDistance[] = useMemo(() => {
    const cleanPin = pincode.trim().replace(/\D/g, '');
    const resolved = cleanPin.length === 6 ? resolvePinToCoordinates(cleanPin) : null;
    const userCoords: Coordinates = resolved ? resolved.coords : { lat: 13.0827, lon: 80.2707 };

    const allMuseums = getAllMuseums();
    const sorted = allMuseums.map((m) => {
      const dist = calculateHaversineDistance(
        userCoords.lat,
        userCoords.lon,
        m.coordinates.lat,
        m.coordinates.lon
      );
      return {
        ...m,
        distance_km: dist,
        isOpenToday: isMuseumOpenToday(m.opening_hours.closed_on),
      };
    });

    sorted.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
    return sorted;
  }, [pincode]);

  // Derived 4-dimensional lineage metadata
  const prefix2 = pincode.substring(0, 2);
  const lineageMetadata: AncestralLineageMetadata = useMemo(() => {
    const matched = REGIONAL_LINEAGE_METADATA[prefix2];
    if (matched) return matched;

    const firstDigit = pincode.charAt(0);
    if (firstDigit === '6') return REGIONAL_LINEAGE_METADATA['60'] || GENERIC_LINEAGE_METADATA;
    if (firstDigit === '3') return REGIONAL_LINEAGE_METADATA['30'] || GENERIC_LINEAGE_METADATA;
    if (firstDigit === '8') return REGIONAL_LINEAGE_METADATA['80'] || GENERIC_LINEAGE_METADATA;
    if (firstDigit === '1') return REGIONAL_LINEAGE_METADATA['11'] || GENERIC_LINEAGE_METADATA;
    if (firstDigit === '4') return REGIONAL_LINEAGE_METADATA['40'] || GENERIC_LINEAGE_METADATA;
    if (firstDigit === '5') return REGIONAL_LINEAGE_METADATA['50'] || GENERIC_LINEAGE_METADATA;

    return GENERIC_LINEAGE_METADATA;
  }, [pincode, prefix2]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincodeInput.trim().replace(/\D/g, '');
    if (/^[1-9][0-9]{5}$/.test(clean)) {
      setPincode(clean);
      saveUserRootDiscovery({
        pincode: clean,
        state: rootData.state,
        cultural_roots: rootData.dynasticHeritage,
      });
    }
  };

  const handlePresetClick = (pin: string) => {
    setPincodeInput(pin);
    setPincode(pin);
    saveUserRootDiscovery({
      pincode: pin,
      state: rootData.state,
      cultural_roots: rootData.dynasticHeritage,
    });
  };

  const textToNarrate = useMemo(() => {
    if (!rootData) return '';
    return `Ancestral Lineage Discovery for ${rootData.regionName}. Civilizational Heritage: ${rootData.dynasticHeritage}. Era: ${rootData.civilizationalEra}. Time Period: ${lineageMetadata.timePeriod}. Linguistic roots: ${lineageMetadata.linguisticHeritage}. Geographic terrain: ${lineageMetadata.geographicContext}. ${rootData.culturalStory}`;
  }, [rootData, lineageMetadata]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* 1. Asymmetric Editorial Hero */}
      <section className="text-center max-w-3xl mx-auto space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold uppercase tracking-wider shadow-2xs">
          <Heart className="w-3.5 h-3.5 fill-[var(--accent)] text-[var(--accent)]" />
          <span>Postal Lineage Studio · Connect to Your Roots</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold text-[var(--ink)] tracking-tight leading-[1.08]">
          Discover Your Ancestral Soil
        </h1>

        <p className="text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed max-w-2xl mx-auto font-sans">
          Enter any 6-digit Indian postal PIN code. Our civilizational resolver maps your geographic coordinates to ancient dynasties, classical languages, sacred craft traditions, and national museum masterworks.
        </p>
      </section>

      {/* 2. 6-Digit Postal PIN Code Input Bar with Instant Validation */}
      <section className="max-w-2xl mx-auto space-y-3">
        <form
          onSubmit={handleSearch}
          className="p-2 sm:p-2.5 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] shadow-sm flex flex-col sm:flex-row gap-2 transition-all focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20"
        >
          <div className="relative flex-1 flex items-center">
            <MapPin className="absolute left-3.5 w-4 h-4 text-[var(--accent)] flex-shrink-0" />
            <input
              type="text"
              inputMode="numeric"
              required
              maxLength={6}
              placeholder="Enter 6-digit postal PIN (e.g. 600001, 302001, 800001)..."
              value={pincodeInput}
              onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-transparent bg-transparent text-sm text-[var(--ink)] font-mono font-medium focus:outline-none placeholder:text-[var(--ink-muted)]"
            />
            {pincodeInput && (
              <button
                type="button"
                onClick={() => setPincodeInput('')}
                className="absolute right-3 p-1 rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-colors"
                aria-label="Clear PIN code"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!isInputValid}
            className="py-3 px-6 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-xs tactile-press flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Resolve Roots</span>
          </button>
        </form>

        {/* Real-time Validation & Feedback strip */}
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="flex items-center gap-1.5">
            {pincodeInput.length === 6 ? (
              isInputValid ? (
                <span className="inline-flex items-center gap-1 text-[var(--verified)] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Valid 6-digit PIN code format</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[var(--flagged)] font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Indian PIN codes must start with digits 1–9</span>
                </span>
              )
            ) : pincodeInput.length > 0 ? (
              <span className="text-[var(--ink-muted)]">
                Entering PIN: {pincodeInput.length}/6 digits
              </span>
            ) : (
              <span className="text-[var(--ink-muted)]">
                Instant lookup across all Indian postal circles
              </span>
            )}
          </div>

          <span className="text-[10px] font-mono text-[var(--ink-muted)]">
            Active: <strong className="text-[var(--accent)]">{pincode}</strong>
          </span>
        </div>
      </section>

      {/* 3. Quick Sample PIN Chips */}
      <section className="space-y-2.5 text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block">
          Quick Sample Ancestral Regions:
        </span>
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
          {QUICK_PIN_PRESETS.map((item) => (
            <button
              key={item.pin}
              type="button"
              onClick={() => handlePresetClick(item.pin)}
              className={`px-3 py-1.5 rounded-full border text-xs transition-all tactile-press flex items-center gap-1.5 ${
                pincode === item.pin
                  ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-semibold shadow-xs'
                  : 'bg-[var(--paper-raised)] text-[var(--ink-muted)] border-[var(--rule)] hover:border-[var(--accent)]/50 hover:text-[var(--ink)]'
              }`}
            >
              <span className="font-medium">{item.city}</span>
              <span className="font-mono text-[11px] opacity-70">({item.pin})</span>
              <span className="text-[10px] opacity-60">· {item.lineage}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Ancestral Lineage Resolver: 4-Dimensional Showcase Panel */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[var(--paper-raised)] via-[var(--paper-raised)] to-[var(--accent-soft)]/40 border border-[var(--accent)]/30 shadow-md space-y-6 animate-in fade-in duration-300">
        {/* Header Bar with Audio Read Aloud */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--rule)]/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                Ancestral Region &amp; Civilizational Era
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--paper)] border border-[var(--rule)] text-[10px] font-mono font-semibold text-[var(--ink-muted)]">
                PIN {pincode}
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-[var(--ink)]">
              {rootData.dynasticHeritage}
            </h2>
            <div className="text-xs text-[var(--ink-muted)] mt-1 font-sans">
              {rootData.civilizationalEra} · {rootData.state}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ReadAloudButton textToRead={textToNarrate} />
          </div>
        </div>

        {/* 4 Core Lineage Dimensions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dimension 1: Civilizational Era & Dynasties */}
          <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Building2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Ruling Dynasties</span>
            </div>
            <div className="font-serif text-sm font-semibold text-[var(--ink)] leading-snug">
              {lineageMetadata.rulingDynasties.join(', ')}
            </div>
            <div className="text-[11px] text-[var(--ink-muted)]">
              Imperial patrons &amp; monumental architecture
            </div>
          </div>

          {/* Dimension 2: Time Period & Chronology */}
          <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Calendar className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Time Period</span>
            </div>
            <div className="font-mono text-sm font-bold text-[var(--ink)] leading-snug">
              {lineageMetadata.timePeriod}
            </div>
            <div className="text-[11px] text-[var(--ink-muted)]">
              Historical epoch &amp; archaeological horizon
            </div>
          </div>

          {/* Dimension 3: Linguistic & Epigraphic Heritage */}
          <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Languages className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Linguistic Heritage</span>
            </div>
            <div className="text-xs font-semibold text-[var(--ink)] leading-snug">
              {lineageMetadata.linguisticHeritage}
            </div>
            <div className="text-[11px] text-[var(--ink-muted)]">
              Classical inscriptions &amp; literary traditions
            </div>
          </div>

          {/* Dimension 4: Geographic & Topographic Context */}
          <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Mountain className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Geographic Terrain</span>
            </div>
            <div className="text-xs font-semibold text-[var(--ink)] leading-snug">
              {lineageMetadata.geographicContext}
            </div>
            <div className="text-[11px] text-[var(--ink-muted)]">
              River basins &amp; geological landscape
            </div>
          </div>
        </div>

        {/* Cultural Narrative Story */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--paper)] border border-[var(--rule)] space-y-2 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
            Ancestral Cultural Narrative
          </span>
          <p className="font-serif text-base sm:text-lg leading-relaxed text-[var(--ink)] italic">
            &ldquo;{rootData.culturalStory}&rdquo;
          </p>
        </div>

        {/* Craft Lineage Callout */}
        <div className="p-4 rounded-2xl bg-[var(--accent-bronze-soft)]/50 border border-[var(--accent-bronze)]/30 flex items-start gap-3 text-xs sm:text-sm text-[var(--ink)]">
          <div className="p-2 rounded-xl bg-[var(--accent-bronze)] text-white flex-shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-[var(--accent-bronze)] uppercase text-[10px] font-bold block mb-0.5 tracking-wider">
              Generational Craft Tradition:
            </strong>
            <span>{rootData.craftsTradition}</span>
          </div>
        </div>
      </section>

      {/* 5. Masterwork Artifact from Your Ancestral Soil */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
              Masterwork from Your Ancestral Soil
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Preserved in national museum archives with 100% verified factual claims.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {rootData.highlightArtifacts.map((artifact) => (
            <ArtifactCard key={artifact.id} artifact={artifact} />
          ))}
        </div>
      </section>

      {/* 6. AI Historical Brief with Web Speech Narration & Sentence Tracking */}
      <AiHistoricalBrief pincode={pincode} />

      {/* 7. Interactive Regional Craft Traditions with GI Tags & Artisan Profiles */}
      <CraftTraditions pincode={pincode} state={rootData.state} />

      {/* 8. Nearest National Museums Proximity List with Haversine Distance */}
      <section className="space-y-5 pt-4 border-t border-[var(--rule)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                Nearest National Museums by Proximity
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Live Haversine geodesic distance computed from PIN {pincode} coordinates to 35+ verified institutions.
            </p>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline self-start sm:self-auto tactile-press"
          >
            <span>View All on Spatial Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Museum Cards Proximity List (Showing top 5 nearest institutions) */}
        <div className="grid grid-cols-1 gap-4">
          {proximityMuseums.slice(0, 5).map((museum) => (
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
      </section>

      {/* Museum Details Slide-Over Sheet */}
      <MuseumDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        museum={selectedMuseum}
      />
    </div>
  );
}
