'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Museum, MuseumWithDistance, isMuseumOpenToday } from '@/lib/museums';
import {
  MapPin,
  ArrowRight,
  X,
  Clock,
  Ticket,
  Maximize2,
  AlertCircle,
  Zap,
} from 'lucide-react';

export interface NearestMuseumModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchedPin?: string;
  locationName?: string;
  nearestMuseum: Museum | MuseumWithDistance | null;
  distanceKm: number;
  onSelectNearest: (museum: Museum | MuseumWithDistance) => void;
  onExpandRadius?: () => void;
}

export function NearestMuseumModal({
  isOpen,
  onClose,
  searchedPin,
  locationName,
  nearestMuseum,
  distanceKm,
  onSelectNearest,
  onExpandRadius,
}: NearestMuseumModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
        previouslyFocusedElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !nearestMuseum) return null;

  const handleSelect = () => {
    onSelectNearest(nearestMuseum);
    onClose();
  };

  const handleExpand = () => {
    if (onExpandRadius) {
      onExpandRadius();
    }
    onClose();
  };

  const formattedDistance = distanceKm < 1 ? '< 1 km' : `${distanceKm.toFixed(1)} km`;
  const isOpenToday =
    'isOpenToday' in nearestMuseum && typeof nearestMuseum.isOpenToday === 'boolean'
      ? nearestMuseum.isOpenToday
      : isMuseumOpenToday(nearestMuseum.opening_hours?.closed_on || []);

  const shortMuseumName = nearestMuseum.name.split('(')[0].trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nearest-museum-title"
      aria-describedby="nearest-museum-desc"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[var(--paper-raised)] text-[var(--ink)] rounded-2xl shadow-2xl border border-[var(--rule)] overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 focus:outline-none"
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--rule)] bg-[var(--paper-raised)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                Spatial Fallback Notification
              </span>
              <h2
                id="nearest-museum-title"
                className="font-serif text-lg font-semibold text-[var(--ink)] leading-tight"
              >
                No Museum Directly in PIN {searchedPin || 'Area'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Notice Banner */}
          <div
            id="nearest-museum-desc"
            className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--rule)] text-xs text-[var(--ink)] space-y-1"
          >
            <div className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
              <span>
                No registered institution situated inside PIN{' '}
                <strong className="font-semibold text-[var(--accent)]">{searchedPin || 'code'}</strong>
                {locationName ? ` (${locationName})` : ''}
              </span>
            </div>
            <p className="text-[var(--ink-muted)] pl-5">
              Digital Muse calculated the closest authentic cultural partner using geodesic Haversine distance.
            </p>
          </div>

          {/* Nearest Museum Highlight Card */}
          <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--rule)] hover:border-[var(--accent)]/50 transition-all space-y-3 shadow-2xs">
            {/* Prominent Geodesic Distance Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-[var(--accent)]" />
              <span>⚡ Nearest Cultural Institution: {formattedDistance} away</span>
            </div>

            <div className="flex gap-3.5 items-start">
              {/* Thumbnail */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--paper-raised)] border border-[var(--rule)]">
                <Image
                  src={nearestMuseum.thumbnail_url || '/images/art-001.svg'}
                  alt={nearestMuseum.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Information */}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-serif text-base font-semibold text-[var(--ink)] leading-snug truncate">
                  {nearestMuseum.name}
                </h3>

                <div className="text-xs text-[var(--ink-muted)] flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-[var(--ink-muted)] flex-shrink-0" />
                  <span>
                    {nearestMuseum.city}, {nearestMuseum.state} — {nearestMuseum.pincode}
                  </span>
                </div>

                {/* Status & Entry Fee Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                      isOpenToday
                        ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400'
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span>{isOpenToday ? 'Open Today' : 'Closed Today'}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-[var(--paper-raised)] border border-[var(--rule)] text-[var(--ink)]">
                    <Ticket className="w-2.5 h-2.5 text-[var(--accent)]" />
                    <span>
                      {nearestMuseum.entry_fee.is_free ? (
                        <span className="text-[var(--verified)] font-semibold">Free Entry</span>
                      ) : (
                        `₹${nearestMuseum.entry_fee.domestic_inr} entry`
                      )}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Description Snippet */}
            <p className="text-xs text-[var(--ink-muted)] line-clamp-2 leading-relaxed border-t border-[var(--rule)]/60 pt-2.5">
              {nearestMuseum.description}
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--rule)] bg-[var(--paper-raised)] flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold border border-[var(--rule)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-all min-h-[40px]"
          >
            Dismiss
          </button>
          {onExpandRadius && (
            <button
              type="button"
              onClick={handleExpand}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-[var(--rule)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--paper)] transition-all min-h-[40px]"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand Radius to 100 km</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSelect}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all shadow-xs min-h-[40px]"
          >
            <span>View &amp; Center on {shortMuseumName}</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NearestMuseumModal;
