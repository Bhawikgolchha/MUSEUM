'use client';

import React from 'react';
import { Search, Navigation, SlidersHorizontal, MapPin, Check, Filter } from 'lucide-react';
import { Coordinates } from '@/lib/museums';

interface AreaSearchHeaderProps {
  query: string;
  onQueryChange: (q: string) => void;
  radiusKm: number;
  onRadiusChange: (r: number) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  openTodayOnly: boolean;
  onToggleOpenToday: () => void;
  accessibilityOnly: boolean;
  onToggleAccessibility: () => void;
  onRequestGeolocation: () => void;
  isLocating: boolean;
}

const POPULAR_CITIES = [
  'All India',
  'Delhi',
  'Chennai',
  'Kolkata',
  'Mumbai',
  'Patna',
  'Varanasi',
  'Bengaluru',
  'Hyderabad',
];

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'archaeology', label: 'Archaeology & Antiquity' },
  { id: 'art_sculpture', label: 'Art & Sculpture' },
  { id: 'science_technology', label: 'Science & Tech' },
  { id: 'multidisciplinary', label: 'Multidisciplinary' },
];

export default function AreaSearchHeader({
  query,
  onQueryChange,
  radiusKm,
  onRadiusChange,
  selectedCategory,
  onCategoryChange,
  openTodayOnly,
  onToggleOpenToday,
  accessibilityOnly,
  onToggleAccessibility,
  onRequestGeolocation,
  isLocating,
}: AreaSearchHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Main Search Bar & Quick Geolocation */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)]" />
          <input
            type="text"
            placeholder="Search by Indian city, state, landmark, or PIN code (e.g. 110001)..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--rule)] bg-[var(--paper-raised)] text-sm text-[var(--ink)] focus:border-[var(--accent)] shadow-2xs"
          />
        </div>

        {/* Near Me GPS Button */}
        <button
          type="button"
          onClick={onRequestGeolocation}
          disabled={isLocating}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent-soft)]/80 transition-all font-semibold text-xs whitespace-nowrap min-h-[44px]"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating…' : 'Near Me'}</span>
        </button>

        {/* Radius Selector */}
        <div className="flex items-center gap-1 bg-[var(--paper-raised)] border border-[var(--rule)] rounded-xl px-2 py-1 shadow-2xs">
          <span className="text-[11px] text-[var(--ink-muted)] px-1 font-medium">Radius:</span>
          {[5, 10, 25, 50, 100].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRadiusChange(r)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                radiusKm === r
                  ? 'bg-[var(--accent)] text-white shadow-2xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              {r}km
            </button>
          ))}
        </div>
      </div>

      {/* Popular City Quick-Select Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider whitespace-nowrap mr-1">
          Hubs:
        </span>
        {POPULAR_CITIES.map((city) => {
          const isSelected = city === 'All India' ? query === '' : query.toLowerCase() === city.toLowerCase();
          return (
            <button
              key={city}
              type="button"
              onClick={() => onQueryChange(city === 'All India' ? '' : city)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] shadow-2xs'
                  : 'bg-[var(--paper-raised)] text-[var(--ink-muted)] border-[var(--rule)] hover:border-[var(--ink-muted)]'
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>

      {/* Category Facets & Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[var(--rule)]/60">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onToggleOpenToday}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
              openTodayOnly
                ? 'bg-[var(--verified)]/15 border-[var(--verified)] text-[var(--verified)] font-semibold'
                : 'bg-[var(--paper-raised)] border-[var(--rule)] text-[var(--ink-muted)]'
            }`}
          >
            {openTodayOnly && <Check className="w-3 h-3 stroke-[2.5]" />}
            <span>Open Today</span>
          </button>

          <button
            type="button"
            onClick={onToggleAccessibility}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
              accessibilityOnly
                ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-semibold'
                : 'bg-[var(--paper-raised)] border-[var(--rule)] text-[var(--ink-muted)]'
            }`}
          >
            {accessibilityOnly && <Check className="w-3 h-3 stroke-[2.5]" />}
            <span>Accessible</span>
          </button>
        </div>
      </div>
    </div>
  );
}
