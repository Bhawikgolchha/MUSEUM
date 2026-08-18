'use client';

import React from 'react';
import {
  Search,
  Navigation,
  Check,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  X,
  RotateCcw,
  ChevronDown,
  Building2,
  Clock,
  Ticket,
} from 'lucide-react';

export interface AreaSearchHeaderProps {
  query: string;
  onQueryChange: (q: string) => void;
  selectedState: string;
  onStateChange: (state: string) => void;
  radiusKm: number;
  onRadiusChange: (r: number) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  openTodayOnly: boolean;
  onToggleOpenToday: () => void;
  accessibilityOnly: boolean;
  onToggleAccessibility: () => void;
  freeOnly: boolean;
  onToggleFreeOnly: () => void;
  masterworksOnly: boolean;
  onToggleMasterworks: () => void;
  onRequestGeolocation: () => void;
  isLocating: boolean;
  gpsActive: boolean;
  onResetFilters: () => void;
  hasActiveFilters?: boolean;
  resultsCount?: number;
  totalCount?: number;
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
  'Jaipur',
  'Ahmedabad',
  'Kochi',
];

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'archaeology', label: 'Archaeology & Antiquity' },
  { id: 'art_sculpture', label: 'Art & Sculpture' },
  { id: 'science_technology', label: 'Science & Tech' },
  { id: 'textiles_crafts', label: 'Textiles & Crafts' },
  { id: 'multidisciplinary', label: 'Multidisciplinary' },
];

const ALL_INDIAN_STATES = [
  'All States',
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export default function AreaSearchHeader({
  query,
  onQueryChange,
  selectedState,
  onStateChange,
  radiusKm,
  onRadiusChange,
  selectedCategory,
  onCategoryChange,
  openTodayOnly,
  onToggleOpenToday,
  accessibilityOnly,
  onToggleAccessibility,
  freeOnly,
  onToggleFreeOnly,
  masterworksOnly,
  onToggleMasterworks,
  onRequestGeolocation,
  isLocating,
  gpsActive,
  onResetFilters,
  hasActiveFilters = false,
  resultsCount,
  totalCount,
}: AreaSearchHeaderProps) {
  const is6DigitPin = /^[1-9][0-9]{5}$/.test(query.trim());

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--paper-surface)] border border-[var(--rule)] shadow-card space-y-4">
      {/* Top Search & Filter Control Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Main Search Input */}
        <div className="relative sm:col-span-6 lg:col-span-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)]" />
          <input
            type="text"
            placeholder="Search by city, landmark, museum, or 6-digit PIN (e.g. 110001)..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-[var(--rule)] bg-[var(--paper-subtle)] text-sm text-[var(--ink)] focus:bg-[var(--paper-surface)] focus:border-[var(--accent)] transition-all shadow-xs"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Clear search input"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {/* PIN Detection Notification Pill */}
          {is6DigitPin && (
            <div className="absolute -bottom-5 left-3 text-[10.5px] font-mono text-[var(--accent)] font-semibold flex items-center gap-1 animate-in fade-in">
              <Sparkles className="w-3 h-3" />
              <span>Postal PIN Detected: Loading Historical &amp; Spatial Brief</span>
            </div>
          )}
        </div>

        {/* State Filter Dropdown */}
        <div className="relative sm:col-span-3 lg:col-span-3">
          <select
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value)}
            aria-label="Filter by State or Union Territory"
            className="w-full appearance-none pl-3.5 pr-8 py-3 rounded-xl border border-[var(--rule)] bg-[var(--paper-subtle)] text-xs sm:text-sm font-semibold text-[var(--ink)] focus:bg-[var(--paper-surface)] focus:border-[var(--accent)] transition-all shadow-xs cursor-pointer truncate"
          >
            {ALL_INDIAN_STATES.map((stateName) => (
              <option key={stateName} value={stateName}>
                {stateName === 'All States' ? 'All States & UTs' : stateName}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)] pointer-events-none" />
        </div>

        {/* Live GPS "Near Me" Button */}
        <div className="sm:col-span-3 lg:col-span-3">
          <button
            type="button"
            onClick={onRequestGeolocation}
            disabled={isLocating}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs transition-all min-h-[44px] cursor-pointer shadow-xs tactile-press ${
              gpsActive
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent-soft)]/80'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating Device…' : gpsActive ? 'GPS Proximity Active' : 'Near Me (GPS)'}</span>
          </button>
        </div>
      </div>

      {/* Second Row: Popular Hubs Quick-Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] whitespace-nowrap mr-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[var(--accent)]" />
          <span>Hubs:</span>
        </span>
        {POPULAR_CITIES.map((city) => {
          const isSelected = city === 'All India' ? query === '' : query.toLowerCase() === city.toLowerCase();
          return (
            <button
              key={city}
              type="button"
              onClick={() => {
                onQueryChange(city === 'All India' ? '' : city);
                onStateChange('All States');
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap cursor-pointer tactile-press ${
                isSelected
                  ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] shadow-xs'
                  : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] border-[var(--rule)] hover:border-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>

      {/* Third Row: Category Pills & Proximity Radius Slider */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--rule)]">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer tactile-press ${
                selectedCategory === cat.id
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink)] border border-[var(--rule)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Radius Slider / Quick Buttons */}
        <div className="flex items-center gap-2 bg-[var(--paper-subtle)] border border-[var(--rule)] rounded-xl px-2.5 py-1 text-xs">
          <span className="text-[11px] text-[var(--ink-muted)] font-medium whitespace-nowrap">Radius:</span>
          <div className="flex items-center gap-1">
            {[5, 10, 25, 50, 100, 250, 2000].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRadiusChange(r)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  radiusKm === r
                    ? 'bg-[var(--accent)] text-white shadow-2xs'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {r === 2000 ? 'All India' : `${r}km`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fourth Row: Quick Toggle Filters (Muse Exhibits, Open Today, Accessible, Free) & Reset Button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Masterworks Only */}
          <button
            type="button"
            onClick={onToggleMasterworks}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all cursor-pointer tactile-press ${
              masterworksOnly
                ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-2xs'
                : 'bg-[var(--paper-subtle)] border-[var(--rule)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#E2B13C]" />
            <span>Muse Exhibits</span>
          </button>

          {/* Open Today */}
          <button
            type="button"
            onClick={onToggleOpenToday}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all cursor-pointer tactile-press ${
              openTodayOnly
                ? 'bg-[var(--verified)]/15 border-[var(--verified)] text-[var(--verified)] font-semibold shadow-2xs'
                : 'bg-[var(--paper-subtle)] border-[var(--rule)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            {openTodayOnly && <Check className="w-3 h-3 stroke-[2.5]" />}
            <span>Open Today</span>
          </button>

          {/* Accessibility */}
          <button
            type="button"
            onClick={onToggleAccessibility}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all cursor-pointer tactile-press ${
              accessibilityOnly
                ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-2xs'
                : 'bg-[var(--paper-subtle)] border-[var(--rule)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            {accessibilityOnly && <Check className="w-3 h-3 stroke-[2.5]" />}
            <span>Accessible</span>
          </button>

          {/* Free Entry */}
          <button
            type="button"
            onClick={onToggleFreeOnly}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all cursor-pointer tactile-press ${
              freeOnly
                ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-2xs'
                : 'bg-[var(--paper-subtle)] border-[var(--rule)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            {freeOnly && <Check className="w-3 h-3 stroke-[2.5]" />}
            <span>Free Entry</span>
          </button>
        </div>

        {/* Results Counter & Reset Button */}
        <div className="flex items-center gap-3 text-xs">
          {resultsCount !== undefined && totalCount !== undefined && (
            <span className="text-[var(--ink-muted)] font-medium">
              Showing <strong className="text-[var(--ink)]">{resultsCount}</strong> of {totalCount}
            </span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Reset all filters and query"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[var(--flagged)] bg-[var(--flagged-soft)] border border-[var(--flagged)]/20 hover:bg-[var(--flagged-soft)]/80 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
