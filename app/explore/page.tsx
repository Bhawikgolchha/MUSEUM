'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  searchMuseums,
  Museum,
  MuseumWithDistance,
  Coordinates,
  findNearestMuseumForPincode,
} from '@/lib/museums';
import AreaSearchHeader from '@/components/AreaSearchHeader';
import NanoBananaMap from '@/components/NanoBananaMap';
import MuseumCard from '@/components/MuseumCard';
import MuseumDetailModal from '@/components/MuseumDetailModal';
import NearestMuseumModal from '@/components/NearestMuseumModal';
import { Landmark, Compass, ArrowRight } from 'lucide-react';

interface NearestFallbackState {
  searchedPin: string;
  locationName: string;
  nearestMuseum: MuseumWithDistance;
  distanceKm: number;
}

export default function ExploreMuseumsPage() {
  const [query, setQuery] = useState<string>('');
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [category, setCategory] = useState<string>('all');
  const [openTodayOnly, setOpenTodayOnly] = useState<boolean>(false);
  const [accessibilityOnly, setAccessibilityOnly] = useState<boolean>(false);

  const [centerCoordinates, setCenterCoordinates] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const [selectedMuseum, setSelectedMuseum] = useState<MuseumWithDistance | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Fallback modal state for unindexed PIN code searches
  const [nearestFallback, setNearestFallback] = useState<NearestFallbackState | null>(null);
  const [isNearestModalOpen, setIsNearestModalOpen] = useState<boolean>(false);
  const lastPromptedPin = useRef<string | null>(null);

  // Execute spatial search
  const { results, resolvedCenter, total } = useMemo(() => {
    return searchMuseums({
      query,
      center: centerCoordinates || undefined,
      radiusKm,
      category,
      openTodayOnly,
      accessibilityOnly,
    });
  }, [query, centerCoordinates, radiusKm, category, openTodayOnly, accessibilityOnly]);

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

        // Trigger modal once per unique unindexed PIN search
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
        setQuery('My Location');
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
    setRadiusKm(100);
    setIsNearestModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" />
          <span>Spatial Heritage Discovery</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[var(--ink)] tracking-tight">
          Find Museums by Area
        </h1>
        <p className="text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed">
          Locate cultural institutions across India by city, PIN code, or radius. Tap any partner museum to explore its collection through verified adaptive interpretations.
        </p>
      </div>

      {/* Filter & Search Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] shadow-2xs">
        <AreaSearchHeader
          query={query}
          onQueryChange={(q) => {
            setQuery(q);
            if (centerCoordinates && q !== 'My Location') {
              setCenterCoordinates(null);
            }
          }}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          selectedCategory={category}
          onCategoryChange={setCategory}
          openTodayOnly={openTodayOnly}
          onToggleOpenToday={() => setOpenTodayOnly(!openTodayOnly)}
          accessibilityOnly={accessibilityOnly}
          onToggleAccessibility={() => setAccessibilityOnly(!accessibilityOnly)}
          onRequestGeolocation={handleRequestGeolocation}
          isLocating={isLocating}
        />
      </div>

      {/* Main Dual-Pane Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Top: NanoBanana Interactive Map Canvas */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <NanoBananaMap
            museums={results}
            selectedMuseum={selectedMuseum}
            onSelectMuseum={(m) => {
              setSelectedMuseum(m);
            }}
            centerCoordinates={resolvedCenter || centerCoordinates}
          />
        </div>

        {/* Right / Bottom: Museum Result Cards Stream */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider pb-1">
            <span>
              Showing {results.length} of {total} Institutions
            </span>
            {query && (
              <span className="text-[var(--accent)]">
                Query: &ldquo;{query}&rdquo;
              </span>
            )}
          </div>

          {results.length > 0 ? (
            <div className="space-y-3.5">
              {results.map((museum) => (
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
            /* Empty State */
            <div className="p-8 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mx-auto">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[var(--ink)]">
                {nearestFallback
                  ? `No museum situated directly in PIN ${nearestFallback.searchedPin}`
                  : 'No museums found in this radius'}
              </h3>
              <p className="text-xs text-[var(--ink-muted)] max-w-sm mx-auto leading-relaxed">
                {nearestFallback
                  ? `The region ${nearestFallback.locationName} has no direct museum on file. The closest partner institution is ${nearestFallback.nearestMuseum.name} (${nearestFallback.distanceKm.toFixed(1)} km away).`
                  : 'Try expanding your search radius to 50 km or 100 km, or select one of the major cultural hubs above.'}
              </p>

              {nearestFallback ? (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNearestModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl border border-[var(--rule)] text-[var(--ink)] text-xs font-semibold hover:bg-[var(--paper)] transition-colors"
                  >
                    View Fallback Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectNearestMuseum(nearestFallback.nearestMuseum)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent)]/90 transition-colors shadow-xs"
                  >
                    <span>Switch to {nearestFallback.nearestMuseum.name.split('(')[0].trim()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setRadiusKm(100);
                    setCategory('all');
                    setOpenTodayOnly(false);
                    setAccessibilityOnly(false);
                    setQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent)]/90 transition-colors"
                >
                  Reset Filters &amp; Expand Radius
                </button>
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
