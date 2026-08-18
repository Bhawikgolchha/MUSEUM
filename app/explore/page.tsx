'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  getAllMuseums,
  Museum,
  MuseumWithDistance,
  Coordinates,
  findNearestMuseumForPincode,
  calculateHaversineDistance,
  isMuseumOpenToday,
} from '@/lib/museums';
import IndiaMuseumMap from '@/components/IndiaMuseumMap';
import MuseumCard from '@/components/MuseumCard';
import MuseumDetailModal from '@/components/MuseumDetailModal';
import NearestMuseumModal from '@/components/NearestMuseumModal';
import RegionalHistoricalContextBanner from '@/components/RegionalHistoricalContextBanner';
import AreaSearchHeader from '@/components/AreaSearchHeader';
import {
  Compass,
  Landmark,
  RotateCcw,
  Sparkles,
  ArrowRight,
  MapPin,
  Search,
} from 'lucide-react';

interface NearestFallbackState {
  searchedPin: string;
  locationName: string;
  nearestMuseum: MuseumWithDistance;
  distanceKm: number;
}

export default function ExploreMuseumsPage() {
  const [query, setQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [category, setCategory] = useState<string>('all');
  const [openTodayOnly, setOpenTodayOnly] = useState<boolean>(false);
  const [accessibilityOnly, setAccessibilityOnly] = useState<boolean>(false);
  const [freeOnly, setFreeOnly] = useState<boolean>(false);
  const [masterworksOnly, setMasterworksOnly] = useState<boolean>(false);

  const [centerCoordinates, setCenterCoordinates] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsActive, setGpsActive] = useState<boolean>(false);

  const [selectedMuseum, setSelectedMuseum] = useState<MuseumWithDistance | null>(null);
  const [hoveredMuseumId, setHoveredMuseumId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Fallback modal state for unindexed PIN code searches
  const [nearestFallback, setNearestFallback] = useState<NearestFallbackState | null>(null);
  const [isNearestModalOpen, setIsNearestModalOpen] = useState<boolean>(false);
  const lastPromptedPin = useRef<string | null>(null);

  // References to museum card elements for auto-scrolling on map pin hover / click
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Extract 6-digit PIN code from user query (direct or substring)
  const searchedPin = useMemo(() => {
    const clean = query.trim();
    if (/^[1-9][0-9]{5}$/.test(clean)) return clean;
    const match = clean.match(/\b[1-9][0-9]{5}\b/);
    return match ? match[0] : null;
  }, [query]);

  // Execute spatial search and filtering
  const { results, resolvedCenter, total } = useMemo(() => {
    const all = getAllMuseums();
    const q = query.trim().toLowerCase();

    let center = centerCoordinates;

    // 1. If query contains a 6-digit Indian PIN code, resolve center from PIN
    if (!center && searchedPin) {
      const pinFallback = findNearestMuseumForPincode(searchedPin);
      if (pinFallback) {
        center = pinFallback.nearestMuseum.coordinates;
      }
    }

    // Process all museums with calculated distances
    const processed: MuseumWithDistance[] = all.map((m) => {
      let dist: number | undefined;
      if (center) {
        dist = calculateHaversineDistance(center.lat, center.lon, m.coordinates.lat, m.coordinates.lon);
      }
      const openToday = isMuseumOpenToday(m.opening_hours.closed_on);
      return {
        ...m,
        distance_km: dist,
        isOpenToday: openToday,
      };
    });

    const filtered = processed.filter((m) => {
      // 1. State filter
      if (selectedState !== 'All States' && m.state.toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }

      // 2. Text match filter if query given
      if (q && q !== 'my location') {
        const matchText = `${m.name} ${m.city} ${m.state} ${m.pincode} ${m.description} ${m.category}`.toLowerCase();
        const directMatch = matchText.includes(q);
        if (!directMatch && center && m.distance_km !== undefined && m.distance_km > radiusKm) {
          return false;
        }
        if (!directMatch && !center) {
          return false;
        }
      }

      // 3. Radius boundary filter if GPS or center is active
      if (center && radiusKm !== 2000 && m.distance_km !== undefined && m.distance_km > radiusKm) {
        return false;
      }

      // 4. Category filter
      if (category !== 'all' && m.category !== category) {
        return false;
      }

      // 5. Open today filter
      if (openTodayOnly && !m.isOpenToday) {
        return false;
      }

      // 6. Accessibility filter
      if (accessibilityOnly && (!m.accessibility_features || m.accessibility_features.length === 0)) {
        return false;
      }

      // 7. Free entry filter
      if (freeOnly && !m.entry_fee.is_free) {
        return false;
      }

      // 8. Muse Masterworks filter
      if (masterworksOnly && (!m.featured_artifacts || m.featured_artifacts.length === 0)) {
        return false;
      }

      return true;
    });

    // Sort results: Distance first if center active, then masterworks, then alphabetical
    filtered.sort((a, b) => {
      if (a.distance_km !== undefined && b.distance_km !== undefined) {
        return a.distance_km - b.distance_km;
      }
      if (a.featured_artifacts?.length && !b.featured_artifacts?.length) return -1;
      if (!a.featured_artifacts?.length && b.featured_artifacts?.length) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      results: filtered,
      resolvedCenter: center,
      total: filtered.length,
    };
  }, [
    query,
    selectedState,
    centerCoordinates,
    radiusKm,
    category,
    openTodayOnly,
    accessibilityOnly,
    freeOnly,
    masterworksOnly,
    searchedPin,
  ]);

  // Detect 6-digit PIN code search when 0 direct matches are found
  useEffect(() => {
    const cleanQuery = query.trim();
    const is6DigitPin = /^[1-9][0-9]{5}$/.test(cleanQuery);

    if (is6DigitPin && results.length === 0) {
      const fallbackResult = findNearestMuseumForPincode(cleanQuery);
      if (fallbackResult) {
        setNearestFallback({
          searchedPin: cleanQuery,
          locationName: fallbackResult.regionName,
          nearestMuseum: fallbackResult.nearestMuseum,
          distanceKm: fallbackResult.distanceKm,
        });

        if (lastPromptedPin.current !== cleanQuery) {
          setIsNearestModalOpen(true);
          lastPromptedPin.current = cleanQuery;
        }
      }
    } else {
      if (!is6DigitPin) {
        setNearestFallback(null);
        lastPromptedPin.current = null;
      }
    }
  }, [query, results.length]);

  // Bidirectional hover synchronization: When map pin is hovered, scroll card into view
  const handleMapPinHover = useCallback((id: string | null) => {
    setHoveredMuseumId(id);
    if (id && cardRefs.current[id]) {
      cardRefs.current[id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, []);

  // Request user's live GPS Geolocation
  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setCenterCoordinates(coords);
        setGpsActive(true);
        setQuery('My Location');
        setRadiusKm(100);
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        alert('Could not retrieve device location. Try typing your city or PIN code instead.');
      },
      { timeout: 8000 }
    );
  };

  const handleClearSearch = () => {
    setQuery('');
    setSelectedState('All States');
    setCenterCoordinates(null);
    setGpsActive(false);
    setCategory('all');
    setOpenTodayOnly(false);
    setAccessibilityOnly(false);
    setFreeOnly(false);
    setMasterworksOnly(false);
    setRadiusKm(50);
  };

  const handleSelectNearestMuseum = (museum: Museum | MuseumWithDistance) => {
    const museumWithDist: MuseumWithDistance = {
      ...museum,
      distance_km: nearestFallback ? nearestFallback.distanceKm : 0,
    };
    setSelectedMuseum(museumWithDist);
    setCenterCoordinates(museum.coordinates);
    setQuery(museum.name);
    setIsNearestModalOpen(false);
  };

  const handleExpandRadius = () => {
    setRadiusKm(2000);
    setIsNearestModalOpen(false);
  };

  const handleFocusMuseumOnMap = (museum: MuseumWithDistance) => {
    setSelectedMuseum(museum);
    setCenterCoordinates(museum.coordinates);
  };

  const hasActiveFilters = Boolean(
    query ||
      selectedState !== 'All States' ||
      category !== 'all' ||
      openTodayOnly ||
      accessibilityOnly ||
      freeOnly ||
      masterworksOnly ||
      centerCoordinates
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Editorial Header Section */}
      <div className="max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" />
          <span>Spatial Heritage Discovery Canvas</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[var(--ink)] tracking-tight">
          Explore India&apos;s Sacred Repositories
        </h1>
        <p className="text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed">
          Navigate 35+ verified archaeological and cultural institutions across the subcontinent.
          Filter by state, search by city or 6-digit postal PIN, explore ancient cultural regions,
          or enable live GPS for immediate proximity calculation.
        </p>
      </div>

      {/* Comprehensive Search & Multi-Filter Control Hub Component */}
      <AreaSearchHeader
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          if (centerCoordinates && q !== 'My Location') {
            setCenterCoordinates(null);
            setGpsActive(false);
          }
        }}
        selectedState={selectedState}
        onStateChange={setSelectedState}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        selectedCategory={category}
        onCategoryChange={setCategory}
        openTodayOnly={openTodayOnly}
        onToggleOpenToday={() => setOpenTodayOnly(!openTodayOnly)}
        accessibilityOnly={accessibilityOnly}
        onToggleAccessibility={() => setAccessibilityOnly(!accessibilityOnly)}
        freeOnly={freeOnly}
        onToggleFreeOnly={() => setFreeOnly(!freeOnly)}
        masterworksOnly={masterworksOnly}
        onToggleMasterworks={() => setMasterworksOnly(!masterworksOnly)}
        onRequestGeolocation={handleRequestGeolocation}
        isLocating={isLocating}
        gpsActive={gpsActive}
        onResetFilters={handleClearSearch}
        hasActiveFilters={hasActiveFilters}
        resultsCount={results.length}
        totalCount={getAllMuseums().length}
      />

      {/* Main Dual-Pane Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Top Pane: India Spatial Heritage Interactive Map Canvas */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <IndiaMuseumMap
            museums={results}
            selectedMuseum={selectedMuseum}
            hoveredMuseumId={hoveredMuseumId}
            onSelectMuseum={(m) => {
              setSelectedMuseum(m);
              setCenterCoordinates(m.coordinates);
              // Scroll card into view
              if (cardRefs.current[m.id]) {
                cardRefs.current[m.id]?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                });
              }
            }}
            onHoverMuseum={handleMapPinHover}
            centerCoordinates={resolvedCenter || centerCoordinates}
          />
        </div>

        {/* Right / Bottom Pane: Synchronized Museum Directory Stream */}
        <div className="lg:col-span-6 space-y-4">
          {/* Regional Historical Context Banner for 6-Digit PIN Search */}
          {searchedPin && (
            <RegionalHistoricalContextBanner pincode={searchedPin} />
          )}

          {/* Directory Status Header */}
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider pb-1 px-1">
            <span className="flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>
                Showing {results.length} of {getAllMuseums().length} Institutions
              </span>
            </span>
            {selectedState !== 'All States' && (
              <span className="text-[var(--accent)] font-bold">
                State: {selectedState}
              </span>
            )}
          </div>

          {/* Museum Cards List */}
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((museum) => (
                <div
                  key={museum.id}
                  ref={(el) => {
                    cardRefs.current[museum.id] = el;
                  }}
                >
                  <MuseumCard
                    museum={museum}
                    isSelected={selectedMuseum?.id === museum.id}
                    isHovered={hoveredMuseumId === museum.id}
                    onSelect={() => setSelectedMuseum(museum)}
                    onHover={setHoveredMuseumId}
                    onOpenDetails={() => {
                      setSelectedMuseum(museum);
                      setIsDetailModalOpen(true);
                    }}
                    onFocusOnMap={() => handleFocusMuseumOnMap(museum)}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Tactile Empty State */
            <div className="p-8 rounded-2xl bg-[var(--paper-surface)] border border-[var(--rule)] text-center space-y-4 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mx-auto shadow-xs">
                <Landmark className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
                  {nearestFallback
                    ? `No Museum Situated Directly in PIN ${nearestFallback.searchedPin}`
                    : 'No Institutions Found with Current Filters'}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mx-auto leading-relaxed">
                  {nearestFallback
                    ? `The region "${nearestFallback.locationName}" has no immediate indexed museum. The closest partner institution is ${nearestFallback.nearestMuseum.name} (${nearestFallback.distanceKm.toFixed(1)} km away).`
                    : 'Try clearing selected category tags, expanding your proximity radius, or resetting to "All States".'}
                </p>
              </div>

              {nearestFallback ? (
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsNearestModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl border border-[var(--rule)] text-[var(--ink)] text-xs font-semibold hover:bg-[var(--paper-subtle)] transition-colors cursor-pointer tactile-press"
                  >
                    View Fallback Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectNearestMuseum(nearestFallback.nearestMuseum)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent)]/90 transition-colors shadow-xs cursor-pointer tactile-press"
                  >
                    <span>Switch to {nearestFallback.nearestMuseum.name.split('(')[0].trim()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent)]/90 transition-all shadow-xs cursor-pointer tactile-press"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters &amp; View All 35+ Institutions</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Museum Details Sheet / Modal */}
      <MuseumDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        museum={selectedMuseum}
      />

      {/* Nearest Museum Spatial Fallback Modal */}
      {nearestFallback && (
        <NearestMuseumModal
          isOpen={isNearestModalOpen}
          onClose={() => setIsNearestModalOpen(false)}
          searchedPin={nearestFallback.searchedPin}
          locationName={nearestFallback.locationName}
          nearestMuseum={nearestFallback.nearestMuseum}
          distanceKm={nearestFallback.distanceKm}
          onSelectNearest={handleSelectNearestMuseum}
          onExpandRadius={handleExpandRadius}
        />
      )}
    </div>
  );
}
