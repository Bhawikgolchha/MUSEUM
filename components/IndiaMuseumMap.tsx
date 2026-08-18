'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MuseumWithDistance, Coordinates } from '@/lib/museums';
import { MapPin, ZoomIn, ZoomOut, RotateCcw, Layers } from 'lucide-react';

export interface IndiaMuseumMapProps {
  museums: MuseumWithDistance[];
  selectedMuseum: MuseumWithDistance | null;
  onSelectMuseum: (museum: MuseumWithDistance) => void;
  centerCoordinates?: Coordinates | null;
  apiKey?: string;
}

export default function IndiaMuseumMap({
  museums,
  selectedMuseum,
  onSelectMuseum,
  centerCoordinates,
}: IndiaMuseumMapProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calibrated geographic bounds for India (viewBox 0 0 1000 1000):
  // Lat: 7.5 to 37.5 (Span: 30.0 deg)
  // Lon: 67.5 to 97.5 (Span: 30.0 deg)
  const minLat = 7.5;
  const maxLat = 37.5;
  const minLon = 67.5;
  const maxLon = 97.5;

  const projectToPercent = useCallback((lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    // Invert Y because latitude increases northward (upward)
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(1, Math.min(99, x)),
      y: Math.max(1, Math.min(99, y)),
    };
  }, []);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(4, Number((prev + 0.5).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const nextZoom = Math.max(1, Number((prev - 0.5).toFixed(2)));
      if (nextZoom === 1) {
        setPan({ x: 0, y: 0 });
      }
      return nextZoom;
    });
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Touch pan handlers for mobile/tablet
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-[460px] lg:h-[620px] rounded-2xl overflow-hidden bg-[#F4EFE6] border border-[var(--rule)] shadow-inner flex flex-col justify-between select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Topographic Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#1F5F5B 1.2px, transparent 1.2px), radial-gradient(#1F5F5B 1.2px, #F4EFE6 1.2px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      />

      {/* Shared Transformed Canvas Layer for SVG Vector Map & Geographic Markers */}
      <div
        className="absolute inset-0 origin-center transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
        }}
      >
        {/* Authentic High-Fidelity SVG Map of India (1000 x 1000 ViewBox) */}
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ filter: 'drop-shadow(0 4px 16px rgba(31,95,91,0.08))' }}
        >
          <defs>
            {/* Cartographic Landmass Gradient */}
            <linearGradient id="indiaLandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EAE2D4" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#E5DCCB" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#DDD1C0" stopOpacity="0.95" />
            </linearGradient>

            {/* Northern Himalayan Gradient */}
            <linearGradient id="himalayaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D6CBBB" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#E5DCCB" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* 1. Geographic Graticule Coordinate Lines (Lat/Long References) */}
          <g className="text-[var(--ink-muted)]" opacity="0.15" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3,4">
            {/* Longitude Meridians (70°E, 75°E, 80°E, 85°E, 90°E, 95°E) */}
            <line x1="83.3" y1="30" x2="83.3" y2="970" />
            <line x1="250.0" y1="30" x2="250.0" y2="970" />
            <line x1="416.7" y1="30" x2="416.7" y2="970" />
            <line x1="583.3" y1="30" x2="583.3" y2="970" />
            <line x1="750.0" y1="30" x2="750.0" y2="970" />
            <line x1="916.7" y1="30" x2="916.7" y2="970" />

            {/* Latitude Parallels (35°N, 30°N, 25°N, 20°N, 15°N, 10°N) */}
            <line x1="30" y1="83.3" x2="970" y2="83.3" />
            <line x1="30" y1="250.0" x2="970" y2="250.0" />
            <line x1="30" y1="416.7" x2="970" y2="416.7" />
            <line x1="30" y1="583.3" x2="970" y2="583.3" />
            <line x1="30" y1="750.0" x2="970" y2="750.0" />
            <line x1="30" y1="916.7" x2="970" y2="916.7" />
          </g>

          {/* 2. Authentic Vector Outline of Mainland India */}
          <path
            d="M 310, 13 C 330, 25 350, 45 375, 55 C 390, 60 405, 80 405, 110 C 400, 125 385, 140 395, 160 C 385, 180 375, 200 405, 220 C 425, 235 440, 240 450, 245 C 480, 270 530, 310 580, 345 C 630, 355 660, 360 685, 350 C 685, 340 690, 315 705, 315 C 715, 315 715, 335 715, 350 C 740, 355 780, 355 810, 345 C 820, 335 845, 310 880, 295 C 920, 285 950, 280 985, 315 C 965, 340 945, 365 925, 385 C 905, 405 895, 435 890, 455 C 880, 480 860, 515 845, 520 C 835, 500 825, 475 800, 470 C 780, 455 750, 440 755, 415 C 765, 395 735, 395 720, 430 C 710, 470 710, 510 715, 535 C 680, 535 650, 535 640, 555 C 625, 575 605, 595 580, 615 C 555, 645 520, 670 490, 690 C 460, 715 435, 755 425, 790 C 420, 815 415, 845 410, 880 C 405, 905 400, 930 385, 945 C 365, 955 350, 965 335, 981 C 320, 970 305, 950 292, 920 C 280, 885 260, 850 245, 820 C 230, 785 215, 755 210, 730 C 200, 700 185, 660 178, 620 C 175, 580 175, 550 170, 535 C 160, 520 150, 520 145, 535 C 130, 555 105, 565 85, 555 C 65, 545 50, 525 45, 508 C 55, 495 80, 485 100, 485 C 80, 485 45, 480 20, 460 C 35, 440 70, 430 115, 430 C 120, 400 110, 365 115, 345 C 135, 315 170, 290 205, 255 C 220, 235 235, 215 242, 195 C 248, 175 240, 150 240, 135 C 225, 125 215, 105 220, 85 C 230, 60 270, 35 310, 13 Z"
            fill="url(#indiaLandGradient)"
            stroke="#1F5F5B"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 3. Island Territories (Andaman & Nicobar Islands, Lakshadweep) */}
          <g fill="#E5DCCB" stroke="#1F5F5B" strokeWidth="1.8" strokeLinejoin="round">
            {/* Andaman & Nicobar Archipelago */}
            <path d="M 846, 795 C 852, 795 854, 825 848, 835 C 842, 835 840, 805 846, 795 Z" />
            <path d="M 840, 850 C 846, 850 847, 875 841, 878 C 836, 878 835, 855 840, 850 Z" />
            <path d="M 832, 888 C 838, 888 838, 902 833, 902 C 828, 902 828, 888 832, 888 Z" />
            <path d="M 842, 938 C 847, 938 847, 948 842, 948 C 837, 948 837, 938 842, 938 Z" />
            <path d="M 872, 975 C 880, 975 882, 995 874, 995 C 868, 995 866, 980 872, 975 Z" />

            {/* Lakshadweep Archipelago */}
            <path d="M 172, 858 C 176, 858 176, 866 172, 866 C 168, 866 168, 858 172, 858 Z" />
            <path d="M 170, 892 C 176, 892 176, 904 171, 904 C 166, 904 166, 892 170, 892 Z" />
            <path d="M 205, 888 C 210, 888 210, 915 204, 915 C 199, 915 199, 888 205, 888 Z" />
            <path d="M 182, 968 C 187, 968 187, 978 182, 978 C 177, 978 177, 968 182, 968 Z" />
          </g>

          {/* 4. Major Regional Contours & Geographic Zones */}
          <g fill="none" stroke="#1F5F5B" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4,3">
            {/* Himalayan Arc */}
            <path d="M 230, 95 Q 360, 160 450, 245 T 710, 345 T 880, 310 T 960, 320" />
            {/* Indo-Gangetic Basin */}
            <path d="M 170, 300 Q 330, 310 500, 370 T 715, 490" />
            {/* Deccan Plateau Escarpment */}
            <path d="M 185, 620 Q 250, 680 340, 720 T 425, 790" />
            {/* Central Uplands (Vindhya / Satpura) */}
            <path d="M 155, 520 Q 300, 490 450, 520 T 630, 560" />
            {/* Western Ghats Ridge */}
            <path d="M 180, 600 Q 210, 720 250, 810 T 310, 950" strokeOpacity="0.55" strokeWidth="1.2" />
            {/* Eastern Ghats Ridge */}
            <path d="M 620, 580 Q 520, 670 440, 760 T 380, 890" strokeOpacity="0.45" />
          </g>

          {/* 5. Major Historic Heritage River Arteries */}
          <g fill="none" stroke="#1F5F5B" strokeOpacity="0.35" strokeWidth="1.1">
            {/* Sacred Ganga & Yamuna */}
            <path d="M 380, 220 Q 420, 280 500, 330 T 600, 385 T 695, 500" />
            {/* Mighty Brahmaputra */}
            <path d="M 950, 300 Q 880, 340 810, 375 T 730, 420" />
            {/* Narmada */}
            <path d="M 380, 480 Q 270, 490 170, 530" />
            {/* Godavari */}
            <path d="M 200, 630 Q 330, 620 490, 685" />
            {/* Krishna */}
            <path d="M 220, 720 Q 330, 710 450, 715" />
            {/* Kaveri */}
            <path d="M 260, 830 Q 340, 850 405, 890" />
          </g>

          {/* 6. Compass Rose & Scale Accents */}
          <g className="text-[var(--accent)]" opacity="0.6">
            {/* North Indicator */}
            <g transform="translate(880, 80)">
              <circle cx="0" cy="0" r="22" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
              <polygon points="0,-18 5,-2 0,0 -5,-2" fill="currentColor" />
              <polygon points="0,18 5,2 0,0 -5,2" fill="currentColor" opacity="0.4" />
              <text x="0" y="-22" textAnchor="middle" fontSize="11" fontFamily="serif" fontWeight="bold" fill="currentColor">N</text>
            </g>

            {/* Corner Precision Marks */}
            <circle cx="50" cy="50" r="1.5" fill="currentColor" opacity="0.3" />
            <circle cx="950" cy="50" r="1.5" fill="currentColor" opacity="0.3" />
            <circle cx="50" cy="950" r="1.5" fill="currentColor" opacity="0.3" />
            <circle cx="950" cy="950" r="1.5" fill="currentColor" opacity="0.3" />
          </g>
        </svg>

        {/* Mathematically Synced Geographic Museum Markers */}
        <div className="absolute inset-0 pointer-events-none">
          {museums.map((museum) => {
            const { x, y } = projectToPercent(museum.coordinates.lat, museum.coordinates.lon);
            const isSelected = selectedMuseum?.id === museum.id;
            const hasMuse = Boolean(museum.muse_collection_id);

            return (
              <div
                key={museum.id}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMuseum(museum);
                  }}
                  className="relative group focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded-full transition-transform duration-200"
                  aria-label={`${museum.name}, ${museum.city}`}
                >
                  {/* Pulse effect for selected pin */}
                  {isSelected && (
                    <span className="absolute -inset-2.5 rounded-full bg-[var(--accent)]/35 animate-ping pointer-events-none" />
                  )}

                  {/* Pin Bubble */}
                  <div
                    className={`relative flex items-center justify-center p-2 rounded-full border shadow-md transition-all duration-200 group-hover:scale-120 ${
                      isSelected
                        ? 'bg-[var(--accent)] text-white border-white ring-4 ring-[var(--accent)]/30 scale-125'
                        : hasMuse
                        ? 'bg-[var(--paper-raised)] text-[var(--accent)] border-[var(--accent)] hover:border-[var(--accent)]'
                        : 'bg-[var(--paper-raised)] text-[var(--ink)] border-[var(--rule)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {hasMuse && !isSelected && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--verified)] border-2 border-white" />
                    )}
                  </div>

                  {/* Marker Tooltip on Hover / Active Selection */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-medium shadow-lg transition-all duration-150 pointer-events-none z-30 ${
                      isSelected
                        ? 'bg-[var(--ink)] text-[var(--paper)] opacity-100 scale-100'
                        : 'bg-[var(--paper-raised)] text-[var(--ink)] border border-[var(--rule)] opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                    }`}
                  >
                    <div className="font-semibold text-xs leading-tight">{museum.name.split(',')[0]}</div>
                    <div className="text-[10px] opacity-85 flex items-center gap-1.5 mt-0.5">
                      <span>{museum.city}</span>
                      <span>·</span>
                      <span>{museum.distance_km !== undefined ? `${museum.distance_km} km` : museum.category}</span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Control HUD Top Left */}
      <div className="relative z-30 p-3.5 flex items-center gap-2 pointer-events-auto">
        <div className="px-3.5 py-2 rounded-xl bg-[var(--paper-raised)]/95 backdrop-blur-md border border-[var(--rule)] text-xs font-semibold text-[var(--ink)] flex items-center gap-2.5 shadow-sm">
          <Layers className="w-4 h-4 text-[var(--accent)]" />
          <span className="font-serif">India Spatial Heritage Canvas</span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] uppercase font-mono font-bold tracking-wider">
            {museums.length} Mapped
          </span>
        </div>
      </div>

      {/* Map Control HUD Bottom (Pan/Zoom HUD & Legend) */}
      <div className="relative z-30 p-3.5 flex items-end justify-between gap-3 pointer-events-auto">
        {/* Legend */}
        <div className="px-3.5 py-2.5 rounded-xl bg-[var(--paper-raised)]/95 backdrop-blur-md border border-[var(--rule)] text-[11px] text-[var(--ink-muted)] space-y-1.5 shadow-sm hidden sm:block">
          <div className="flex items-center gap-2 text-[var(--ink)] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <span>Museum Partner</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--verified)]" />
            <span>Digital Muse Verified</span>
          </div>
        </div>

        {/* Dynamic Zoom, Pan, & Reset Controls */}
        <div className="flex items-center gap-1.5 bg-[var(--paper-raised)]/95 backdrop-blur-md border border-[var(--rule)] rounded-xl p-1.5 shadow-sm">
          {/* Zoom Factor Indicator */}
          <div className="px-2 py-1 text-[11px] font-mono font-semibold text-[var(--ink-muted)] border-r border-[var(--rule)] hidden sm:block">
            {Math.round(zoom * 100)}%
          </div>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            aria-label="Zoom in"
            title="Zoom in (+)"
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--rule)]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            aria-label="Zoom out"
            title="Zoom out (-)"
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--rule)]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetView}
            aria-label="Reset view"
            title="Reset pan & zoom"
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
