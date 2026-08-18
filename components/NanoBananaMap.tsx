'use client';

import React, { useState } from 'react';
import { MuseumWithDistance, Coordinates } from '@/lib/museums';
import { MapPin, Navigation, ZoomIn, ZoomOut, Sparkles, Layers, ShieldCheck } from 'lucide-react';

interface NanoBananaMapProps {
  museums: MuseumWithDistance[];
  selectedMuseum: MuseumWithDistance | null;
  onSelectMuseum: (museum: MuseumWithDistance) => void;
  centerCoordinates?: Coordinates | null;
  apiKey?: string;
}

export default function NanoBananaMap({
  museums,
  selectedMuseum,
  onSelectMuseum,
  centerCoordinates,
}: NanoBananaMapProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Geographic bounds for India projection:
  // Lat: 8.0 to 36.0 (Height ~28 deg)
  // Lon: 68.0 to 97.0 (Width ~29 deg)
  const minLat = 8.0;
  const maxLat = 35.5;
  const minLon = 68.5;
  const maxLon = 93.5;

  const projectToPercent = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    // Invert Y because latitude increases upward
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  return (
    <div className="relative w-full h-[420px] lg:h-[580px] rounded-2xl overflow-hidden bg-[#F2EDE4] border border-[var(--rule)] shadow-inner flex flex-col justify-between select-none">
      {/* NanoBanana Map Canvas Layer */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Stylized Topographic Background Grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#1F5F5B 1px, transparent 1px), radial-gradient(#1F5F5B 1px, #F2EDE4 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        />

        {/* India Map Outline & Region Accents */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full opacity-30 text-[var(--accent)] pointer-events-none"
        >
          {/* Subtle connecting heritage routes */}
          <path
            d="M 30,25 Q 45,40 58,48 T 80,68 M 30,25 Q 35,50 48,78"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
            strokeDasharray="1,1"
          />
        </svg>

        {/* Map Markers Overlay */}
        {museums.map((museum) => {
          const { x, y } = projectToPercent(museum.coordinates.lat, museum.coordinates.lon);
          const isSelected = selectedMuseum?.id === museum.id;
          const hasMuse = Boolean(museum.muse_collection_id);

          return (
            <button
              key={museum.id}
              type="button"
              onClick={() => onSelectMuseum(museum)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-200 group focus:outline-none`}
              aria-label={`${museum.name}, ${museum.city}`}
            >
              {/* Pulse effect for selected pin */}
              {isSelected && (
                <span className="absolute -inset-2 rounded-full bg-[var(--accent)]/30 animate-ping" />
              )}

              {/* Pin Icon Bubble */}
              <div
                className={`relative flex items-center justify-center p-2 rounded-full border shadow-md transition-transform duration-200 group-hover:scale-115 ${
                  isSelected
                    ? 'bg-[var(--accent)] text-white border-white ring-3 ring-[var(--accent)]/40 scale-120'
                    : hasMuse
                    ? 'bg-[var(--paper-raised)] text-[var(--accent)] border-[var(--accent)]'
                    : 'bg-[var(--paper-raised)] text-[var(--ink)] border-[var(--rule)]'
                }`}
              >
                <MapPin className="w-4 h-4" />
                {hasMuse && !isSelected && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--verified)] border-2 border-white" />
                )}
              </div>

              {/* Marker Tooltip on Hover / Selection */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium shadow-md transition-opacity pointer-events-none z-20 ${
                  isSelected
                    ? 'bg-[var(--ink)] text-[var(--paper)] opacity-100'
                    : 'bg-[var(--paper-raised)] text-[var(--ink)] border border-[var(--rule)] opacity-0 group-hover:opacity-100'
                }`}
              >
                <div className="font-semibold">{museum.name.split(',')[0]}</div>
                <div className="text-[10px] opacity-80">{museum.city} · {museum.distance_km ? `${museum.distance_km} km` : museum.category}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Map Control HUD Top Left */}
      <div className="relative z-20 p-3 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-[var(--paper-raised)]/95 backdrop-blur-md border border-[var(--rule)] text-xs font-semibold text-[var(--ink)] flex items-center gap-2 shadow-xs">
          <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>NanoBanana Spatial Canvas</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] uppercase font-mono">
            India ({museums.length} mapped)
          </span>
        </div>
      </div>

      {/* Map Control HUD Bottom Right (Zoom + Legend) */}
      <div className="relative z-20 p-3 flex items-end justify-between gap-3">
        {/* Legend */}
        <div className="px-3 py-2 rounded-xl bg-[var(--paper-raised)]/95 backdrop-blur-md border border-[var(--rule)] text-[11px] text-[var(--ink-muted)] space-y-1 shadow-xs hidden sm:block">
          <div className="flex items-center gap-1.5 text-[var(--ink)] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <span>Museum Partner</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--verified)]" />
            <span>Digital Muse Enabled</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1 bg-[var(--paper-raised)]/95 backdrop-blur-md border border-[var(--rule)] rounded-xl p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2))}
            aria-label="Zoom in"
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
            aria-label="Zoom out"
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
