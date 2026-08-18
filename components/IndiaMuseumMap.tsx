'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MuseumWithDistance, Coordinates } from '@/lib/museums';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Sparkles,
  Navigation,
  Compass,
  CheckCircle2,
  Clock,
  Ticket,
  Maximize2,
  Map as MapIcon,
  Info,
} from 'lucide-react';

export interface IndiaMuseumMapProps {
  museums: MuseumWithDistance[];
  selectedMuseum: MuseumWithDistance | null;
  hoveredMuseumId?: string | null;
  onSelectMuseum: (museum: MuseumWithDistance) => void;
  onHoverMuseum?: (id: string | null) => void;
  centerCoordinates?: Coordinates | null;
  apiKey?: string;
  onSelectRegion?: (regionId: string | null) => void;
}

interface CulturalRegion {
  id: string;
  name: string;
  subtitle: string;
  eras: string;
  color: string;
  path: string;
  labelPoint: { x: number; y: number };
}

const CULTURAL_REGIONS: CulturalRegion[] = [
  {
    id: 'himalayan',
    name: 'Himalayan Frontier',
    subtitle: 'Kashmir, Ladakh, Kangra, Garhwal',
    eras: 'Namgyal · Karkota · Katyuri',
    color: '#3B82F6',
    path: 'M 220, 85 Q 310, 20 375, 55 C 405, 80 405, 110 395, 160 C 385, 180 375, 200 405, 220 Q 320, 210 242, 195 C 248, 175 240, 150 240, 135 C 225, 125 215, 105 220, 85 Z',
    labelPoint: { x: 320, y: 120 },
  },
  {
    id: 'indus_sapta',
    name: 'Indus & Sapta Sindhu',
    subtitle: 'Punjab, Haryana, Rajasthan, Thar',
    eras: 'Harappan · Vedic Kuru · Rajput',
    color: '#9C6644',
    path: 'M 115, 345 C 135, 315 170, 290 205, 255 C 220, 235 235, 215 405, 220 Q 380, 330 330, 420 Q 230, 460 160, 490 C 130, 500 70, 490 20, 460 C 35, 440 70, 430 115, 430 Z',
    labelPoint: { x: 190, y: 360 },
  },
  {
    id: 'gangetic',
    name: 'Gangetic Heartland',
    subtitle: 'Aryavarta, Magadha, Awadh, Bengal',
    eras: 'Maurya · Gupta · Pala · Mughal',
    color: '#D97706',
    path: 'M 405, 220 C 425, 235 450, 245 580, 345 C 630, 355 685, 350 715, 350 Q 730, 410 710, 490 Q 640, 520 540, 500 Q 420, 480 330, 420 Q 380, 330 405, 220 Z',
    labelPoint: { x: 530, y: 380 },
  },
  {
    id: 'deccan',
    name: 'Deccan Plateau',
    subtitle: 'Maharashtra, Northern Karnataka, Telangana',
    eras: 'Satavahana · Rashtrakuta · Chalukya · Maratha',
    color: '#1F5F5B',
    path: 'M 160, 490 Q 230, 460 330, 420 Q 420, 480 540, 500 Q 640, 520 710, 490 C 715, 535 640, 555 580, 615 C 555, 645 520, 670 490, 690 Q 350, 720 220, 660 C 178, 620 175, 580 170, 535 C 145, 535 105, 565 85, 555 C 65, 545 50, 525 45, 508 Q 110, 490 160, 490 Z',
    labelPoint: { x: 380, y: 590 },
  },
  {
    id: 'dravidian',
    name: 'Dravidian Heartland',
    subtitle: 'Tamil Nadu, Kerala, Southern Karnataka',
    eras: 'Pallava · Chola · Pandya · Chera · Vijayanagara',
    color: '#7C3AED',
    path: 'M 220, 660 Q 350, 720 490, 690 C 460, 715 435, 755 425, 790 C 420, 815 410, 880 385, 945 C 365, 955 335, 981 C 305, 950 245, 820 C 215, 755 210, 730 220, 660 Z',
    labelPoint: { x: 340, y: 800 },
  },
  {
    id: 'northeast',
    name: 'North-East & Brahmaputra',
    subtitle: 'Assam, Meghalaya, Seven Sisters',
    eras: 'Kamarupa · Ahom · Dimasa · Manikya',
    color: '#059669',
    path: 'M 715, 350 C 740, 355 780, 355 810, 345 C 845, 310 880, 295 950, 280 C 985, 315 945, 365 925, 385 C 895, 435 880, 480 845, 520 C 825, 475 755, 415 720, 430 C 710, 470 710, 510 715, 535 Q 715, 430 715, 350 Z',
    labelPoint: { x: 840, y: 390 },
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  archaeology: { bg: '#9C6644', text: '#FFFFFF', border: '#7C4E32', label: 'Archaeology' },
  art_sculpture: { bg: '#B45309', text: '#FFFFFF', border: '#92400E', label: 'Art & Sculpture' },
  science_technology: { bg: '#0D9488', text: '#FFFFFF', border: '#0F766E', label: 'Science & Tech' },
  textiles_crafts: { bg: '#991B1B', text: '#FFFFFF', border: '#7F1D1D', label: 'Textiles & Crafts' },
  multidisciplinary: { bg: '#1F5F5B', text: '#FFFFFF', border: '#164A47', label: 'Multidisciplinary' },
  memorial_historic: { bg: '#475569', text: '#FFFFFF', border: '#334155', label: 'Historic Memorial' },
  natural_history: { bg: '#15803D', text: '#FFFFFF', border: '#166534', label: 'Natural History' },
  maritime_military: { bg: '#1E3A8A', text: '#FFFFFF', border: '#172554', label: 'Maritime & Military' },
};

export default function IndiaMuseumMap({
  museums,
  selectedMuseum,
  hoveredMuseumId,
  onSelectMuseum,
  onHoverMuseum,
  centerCoordinates,
  onSelectRegion,
}: IndiaMuseumMapProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showCulturalRegions, setShowCulturalRegions] = useState<boolean>(true);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calibrated geographic bounds for Indian Subcontinent (viewBox 0 0 1000 1000):
  // Latitude: 7.0°N to 37.5°N (Span: 30.5°)
  // Longitude: 67.0°E to 97.5°E (Span: 30.5°)
  const minLat = 7.0;
  const maxLat = 37.5;
  const minLon = 67.0;
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

  // When centerCoordinates changes (e.g. from GPS or Focus click), smoothly pan to it
  useEffect(() => {
    if (centerCoordinates && containerRef.current) {
      const { x: pctX, y: pctY } = projectToPercent(centerCoordinates.lat, centerCoordinates.lon);
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      // Calculate pixel offset relative to center (50%, 50%)
      const targetPanX = ((50 - pctX) / 100) * width * zoom;
      const targetPanY = ((50 - pctY) / 100) * height * zoom;
      setPan({ x: targetPanX, y: targetPanY });
    }
  }, [centerCoordinates, projectToPercent, zoom]);

  // Zoom handlers (1x to 4x)
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
    setSelectedRegionId(null);
    onSelectRegion?.(null);
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

  // Handle region click to focus and filter
  const handleRegionClick = (region: CulturalRegion) => {
    if (selectedRegionId === region.id) {
      setSelectedRegionId(null);
      onSelectRegion?.(null);
    } else {
      setSelectedRegionId(region.id);
      onSelectRegion?.(region.id);
    }
  };

  const activeRegion = CULTURAL_REGIONS.find(
    (r) => r.id === (hoveredRegionId || selectedRegionId)
  );

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
      className={`relative w-full h-[520px] sm:h-[580px] lg:h-[700px] rounded-2xl overflow-hidden bg-[#F4EFE6] border border-[var(--rule)] shadow-inner flex flex-col justify-between select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      aria-label="Interactive India Spatial Heritage Map Canvas"
    >
      {/* Topographic Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#1F5F5B 1.2px, transparent 1.2px), radial-gradient(#1F5F5B 1.2px, #F4EFE6 1.2px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      />

      {/* Shared Transformed Canvas Layer for SVG Vector Map & Geographic Markers */}
      <div
        className="absolute inset-0 origin-center transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
        }}
      >
        {/* Authentic High-Fidelity SVG Map of India (1000 x 1000 ViewBox) */}
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          style={{ filter: 'drop-shadow(0 8px 24px rgba(31,95,91,0.08))' }}
        >
          <defs>
            {/* Cartographic Landmass Gradient */}
            <linearGradient id="indiaLandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EBE3D6" stopOpacity="0.96" />
              <stop offset="45%" stopColor="#E4DAC8" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#DCCEBB" stopOpacity="0.96" />
            </linearGradient>

            {/* River Glow Gradient */}
            <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1F5F5B" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#2A7B76" stopOpacity="0.85" />
            </linearGradient>

            {/* Patina Highlight Filter */}
            <filter id="patinaGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Geographic Graticule Coordinate Lines & Lat/Long References */}
          <g
            className="text-[var(--ink-muted)] pointer-events-none"
            opacity="0.16"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="4,4"
          >
            {/* Longitude Meridians (70°E, 75°E, 80°E, 85°E, 90°E, 95°E) */}
            <line x1="98.4" y1="30" x2="98.4" y2="970" />
            <line x1="262.3" y1="30" x2="262.3" y2="970" />
            <line x1="426.2" y1="30" x2="426.2" y2="970" />
            <line x1="590.2" y1="30" x2="590.2" y2="970" />
            <line x1="754.1" y1="30" x2="754.1" y2="970" />
            <line x1="918.0" y1="30" x2="918.0" y2="970" />

            {/* Latitude Parallels (35°N, 30°N, 25°N, 20°N, 15°N, 10°N) */}
            <line x1="30" y1="82.0" x2="970" y2="82.0" />
            <line x1="30" y1="245.9" x2="970" y2="245.9" />
            <line x1="30" y1="409.8" x2="970" y2="409.8" />
            <line x1="30" y1="573.8" x2="970" y2="573.8" />
            <line x1="30" y1="737.7" x2="970" y2="737.7" />
            <line x1="30" y1="901.6" x2="970" y2="901.6" />

            {/* Tropic of Cancer (23.5° N = y: 459.0) */}
            <line
              x1="30"
              y1="459.0"
              x2="970"
              y2="459.0"
              stroke="#9C6644"
              strokeWidth="1.2"
              strokeDasharray="6,4"
              opacity="0.4"
            />
          </g>

          {/* Graticule Text Labels */}
          <g
            className="text-[var(--ink-muted)] fill-current pointer-events-none"
            opacity="0.38"
            fontSize="9"
            fontFamily="monospace"
          >
            <text x="98.4" y="24" textAnchor="middle">70°E</text>
            <text x="262.3" y="24" textAnchor="middle">75°E</text>
            <text x="426.2" y="24" textAnchor="middle">80°E</text>
            <text x="590.2" y="24" textAnchor="middle">85°E</text>
            <text x="754.1" y="24" textAnchor="middle">90°E</text>
            <text x="918.0" y="24" textAnchor="middle">95°E</text>

            <text x="26" y="85" textAnchor="end">35°N</text>
            <text x="26" y="249" textAnchor="end">30°N</text>
            <text x="26" y="413" textAnchor="end">25°N</text>
            <text x="26" y="577" textAnchor="end">20°N</text>
            <text x="26" y="741" textAnchor="end">15°N</text>
            <text x="26" y="905" textAnchor="end">10°N</text>

            <text x="975" y="462" textAnchor="end" fill="#9C6644" opacity="0.8">
              Tropic of Cancer (23.5°N)
            </text>
          </g>

          {/* 2. Authentic Vector Outline of Mainland India */}
          <path
            d="M 310, 13 C 330, 25 350, 45 375, 55 C 390, 60 405, 80 405, 110 C 400, 125 385, 140 395, 160 C 385, 180 375, 200 405, 220 C 425, 235 440, 240 450, 245 C 480, 270 530, 310 580, 345 C 630, 355 660, 360 685, 350 C 685, 340 690, 315 705, 315 C 715, 315 715, 335 715, 350 C 740, 355 780, 355 810, 345 C 820, 335 845, 310 880, 295 C 920, 285 950, 280 985, 315 C 965, 340 945, 365 925, 385 C 905, 405 895, 435 890, 455 C 880, 480 860, 515 845, 520 C 835, 500 825, 475 800, 470 C 780, 455 750, 440 755, 415 C 765, 395 735, 395 720, 430 C 710, 470 710, 510 715, 535 C 680, 535 650, 535 640, 555 C 625, 575 605, 595 580, 615 C 555, 645 520, 670 490, 690 C 460, 715 435, 755 425, 790 C 420, 815 415, 845 410, 880 C 405, 905 400, 930 385, 945 C 365, 955 350, 965 335, 981 C 320, 970 305, 950 292, 920 C 280, 885 260, 850 245, 820 C 230, 785 215, 755 210, 730 C 200, 700 185, 660 178, 620 C 175, 580 175, 550 170, 535 C 160, 520 150, 520 145, 535 C 130, 555 105, 565 85, 555 C 65, 545 50, 525 45, 508 C 55, 495 80, 485 100, 485 C 80, 485 45, 480 20, 460 C 35, 440 70, 430 115, 430 C 120, 400 110, 365 115, 345 C 135, 315 170, 290 205, 255 C 220, 235 235, 215 242, 195 C 248, 175 240, 150 240, 135 C 225, 125 215, 105 220, 85 C 230, 60 270, 35 310, 13 Z"
            fill="url(#indiaLandGradient)"
            stroke="#1F5F5B"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 3. Island Territories (Andaman & Nicobar Islands, Lakshadweep) */}
          <g fill="#E4DAC8" stroke="#1F5F5B" strokeWidth="1.8" strokeLinejoin="round">
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

          {/* 4. Cultural Historical Regions Layer (Indus, Gangetic, Deccan, Dravidian, Himalayan, North-East) */}
          {showCulturalRegions && (
            <g className="transition-opacity duration-300">
              {CULTURAL_REGIONS.map((region) => {
                const isHovered = hoveredRegionId === region.id;
                const isSelected = selectedRegionId === region.id;
                const isActive = isHovered || isSelected;

                return (
                  <g
                    key={region.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredRegionId(region.id)}
                    onMouseLeave={() => setHoveredRegionId(null)}
                    onClick={() => handleRegionClick(region)}
                  >
                    <path
                      d={region.path}
                      fill={region.color}
                      fillOpacity={isActive ? 0.22 : 0.08}
                      stroke={region.color}
                      strokeWidth={isActive ? 2 : 1}
                      strokeDasharray={isActive ? 'none' : '5,4'}
                      className="transition-all duration-200"
                    />
                    {/* Region Label */}
                    <text
                      x={region.labelPoint.x}
                      y={region.labelPoint.y}
                      textAnchor="middle"
                      fill={region.color}
                      fontSize={isActive ? '11.5' : '10'}
                      fontFamily="serif"
                      fontWeight="bold"
                      letterSpacing="0.06em"
                      className="pointer-events-none transition-all duration-200"
                      style={{ textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}
                    >
                      {region.name.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* 5. Major Historic Heritage River Overlays (7 Sacred Arteries + Indus) */}
          <g fill="none" stroke="url(#riverGradient)" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
            {/* 1. Sacred Ganga */}
            <path
              id="river-ganga"
              d="M 390, 216 Q 365, 248 437, 362 T 487, 395 T 524, 398 T 594, 390 T 655, 403 T 701, 416 T 725, 490"
              strokeWidth="2.2"
              strokeOpacity="0.8"
            />
            {/* 2. Yamuna */}
            <path
              id="river-yamuna"
              d="M 377, 213 Q 335, 291 361, 338 T 487, 395"
              strokeWidth="1.8"
              strokeOpacity="0.75"
            />
            {/* 3. Mighty Brahmaputra */}
            <path
              id="river-brahmaputra"
              d="M 900, 295 Q 915, 330 811, 372 T 753, 377 T 760, 460"
              strokeWidth="2.4"
              strokeOpacity="0.8"
            />
            {/* 4. Narmada */}
            <path
              id="river-narmada"
              d="M 482, 485 Q 424, 485 352, 485 T 196, 516"
              strokeWidth="1.9"
              strokeOpacity="0.75"
            />
            {/* 5. Godavari */}
            <path
              id="river-godavari"
              d="M 213, 575 Q 337, 603 370, 619 T 455, 650 T 485, 672"
              strokeWidth="2.0"
              strokeOpacity="0.75"
            />
            {/* 6. Krishna */}
            <path
              id="river-krishna"
              d="M 186, 642 Q 245, 677 324, 698 T 442, 687 T 455, 700"
              strokeWidth="1.9"
              strokeOpacity="0.75"
            />
            {/* 7. Kaveri */}
            <path
              id="river-kaveri"
              d="M 279, 788 Q 317, 826 350, 858 T 400, 875"
              strokeWidth="1.8"
              strokeOpacity="0.75"
            />
          </g>

          {/* River Label Typography */}
          <g
            className="text-[var(--accent)] fill-current pointer-events-none"
            opacity="0.8"
            fontSize="8.5"
            fontFamily="serif"
            fontStyle="italic"
            fontWeight="bold"
          >
            <text x="545" y="385" textAnchor="middle">Ganga</text>
            <text x="345" y="325" textAnchor="middle">Yamuna</text>
            <text x="825" y="360" textAnchor="middle">Brahmaputra</text>
            <text x="320" y="478" textAnchor="middle">Narmada</text>
            <text x="385" y="610" textAnchor="middle">Godavari</text>
            <text x="350" y="690" textAnchor="middle">Krishna</text>
            <text x="340" y="850" textAnchor="middle">Kaveri</text>
          </g>

          {/* 6. Regional Ocean & Maritime Labels */}
          <g
            className="text-[var(--ink-muted)] fill-current select-none pointer-events-none"
            opacity="0.32"
            fontSize="10"
            fontFamily="serif"
            letterSpacing="0.16em"
          >
            <text x="100" y="700" textAnchor="middle" transform="rotate(-90 100 700)">
              ARABIAN SEA
            </text>
            <text x="890" y="650" textAnchor="middle" transform="rotate(90 890 650)">
              BAY OF BENGAL
            </text>
            <text x="500" y="985" textAnchor="middle">INDIAN OCEAN</text>
          </g>

          {/* 7. Compass Rose & Scale Accents */}
          <g className="text-[var(--accent)] pointer-events-none" opacity="0.75">
            {/* North Indicator */}
            <g transform="translate(890, 90)">
              <circle
                cx="0"
                cy="0"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="2,2"
              />
              <polygon points="0,-20 6,-3 0,0 -6,-3" fill="currentColor" />
              <polygon points="0,20 6,3 0,0 -6,3" fill="currentColor" opacity="0.4" />
              <polygon points="20,0 3,6 0,0 3,-6" fill="currentColor" opacity="0.4" />
              <polygon points="-20,0 -3,6 0,0 -3,-6" fill="currentColor" opacity="0.4" />
              <text
                x="0"
                y="-25"
                textAnchor="middle"
                fontSize="12"
                fontFamily="serif"
                fontWeight="bold"
                fill="currentColor"
              >
                N
              </text>
            </g>

            {/* Cartographic Scale Bar */}
            <g transform="translate(80, 940)">
              <line x1="0" y1="0" x2="120" y2="0" stroke="currentColor" strokeWidth="2.5" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="currentColor" strokeWidth="1.5" />
              <line x1="60" y1="-3" x2="60" y2="3" stroke="currentColor" strokeWidth="1.5" />
              <line x1="120" y1="-4" x2="120" y2="4" stroke="currentColor" strokeWidth="1.5" />
              <text x="0" y="-8" fontSize="8" fontFamily="monospace" fill="currentColor">0</text>
              <text x="60" y="-8" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="currentColor">250km</text>
              <text x="120" y="-8" fontSize="8" fontFamily="monospace" textAnchor="end" fill="currentColor">500km</text>
            </g>

            {/* Corner Precision Marks */}
            <circle cx="50" cy="50" r="2" fill="currentColor" opacity="0.4" />
            <circle cx="950" cy="50" r="2" fill="currentColor" opacity="0.4" />
            <circle cx="50" cy="950" r="2" fill="currentColor" opacity="0.4" />
            <circle cx="950" cy="950" r="2" fill="currentColor" opacity="0.4" />
          </g>
        </svg>

        {/* Mathematically Synced Geographic Museum Markers */}
        <div className="absolute inset-0 pointer-events-none">
          {museums.map((museum) => {
            const { x, y } = projectToPercent(museum.coordinates.lat, museum.coordinates.lon);
            const isSelected = selectedMuseum?.id === museum.id;
            const isHovered = hoveredMuseumId === museum.id;
            const isHighlighted = isSelected || isHovered;
            const hasMuse = Boolean(
              museum.muse_collection_id || (museum.featured_artifacts && museum.featured_artifacts.length > 0)
            );
            const catStyle = CATEGORY_COLORS[museum.category] || {
              bg: '#1F5F5B',
              text: '#FFFFFF',
              border: '#164A47',
              label: museum.category,
            };

            return (
              <div
                key={museum.id}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-transform duration-200 ${
                  isHighlighted ? 'z-40 scale-125' : 'z-20 scale-100'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMuseum(museum);
                  }}
                  onMouseEnter={() => onHoverMuseum?.(museum.id)}
                  onMouseLeave={() => onHoverMuseum?.(null)}
                  className="relative group focus:outline-none rounded-full cursor-pointer"
                  aria-label={`${museum.name}, ${museum.city}`}
                >
                  {/* Patina Pulsing Ring when Hovered or Selected */}
                  {isHighlighted && (
                    <span className="absolute -inset-3 rounded-full bg-[var(--accent)]/35 animate-ping pointer-events-none" />
                  )}

                  {/* Pin Bubble with Category Color Accent */}
                  <div
                    className={`relative flex items-center justify-center p-2 rounded-full border shadow-md transition-all duration-200 group-hover:scale-120 ${
                      isHighlighted
                        ? 'bg-[var(--accent)] text-white border-white ring-4 ring-[var(--accent)]/35 shadow-lg'
                        : hasMuse
                        ? 'bg-[var(--paper-raised)] text-[var(--accent)] border-[var(--accent)] ring-2 ring-[var(--accent)]/20 shadow-sm'
                        : 'bg-[var(--paper-raised)] text-[var(--ink)] border-[var(--rule)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <MapPin
                      className={`w-3.5 h-3.5 ${isHighlighted ? 'stroke-[2.5]' : ''}`}
                      style={{ color: isHighlighted ? '#FFFFFF' : hasMuse ? 'var(--accent)' : catStyle.bg }}
                    />

                    {/* Masterwork Star Indicator */}
                    {hasMuse && !isHighlighted && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--verified)] border-2 border-white ring-1 ring-[var(--verified)]/40" />
                    )}
                  </div>

                  {/* Marker Tooltip on Hover / Active Selection */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-medium shadow-xl transition-all duration-150 pointer-events-none z-50 min-w-[180px] max-w-[260px] ${
                      isHighlighted
                        ? 'bg-[var(--ink)] text-[var(--paper)] opacity-100 scale-100 translate-y-0'
                        : 'bg-[var(--paper-raised)] text-[var(--ink)] border border-[var(--rule)] opacity-0 scale-95 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
                    }`}
                  >
                    <div className="font-serif font-semibold text-xs leading-tight flex items-center justify-between gap-1.5 pb-1 border-b border-white/10">
                      <span className="truncate">{museum.name.split(',')[0]}</span>
                      {hasMuse && (
                        <Sparkles className="w-3 h-3 text-[#E2B13C] flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-[10.5px] flex items-center justify-between gap-2 mt-1.5 font-sans">
                      <span className="font-semibold opacity-90 truncate">
                        {museum.city}, {museum.state}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9.5px] font-mono uppercase font-bold"
                        style={{
                          backgroundColor: isHighlighted ? 'rgba(255,255,255,0.15)' : catStyle.bg + '20',
                          color: isHighlighted ? '#FFFFFF' : catStyle.bg,
                        }}
                      >
                        {catStyle.label}
                      </span>
                    </div>
                    {museum.distance_km !== undefined && (
                      <div className="text-[10px] opacity-75 font-mono mt-1 text-right">
                        ⚡ {museum.distance_km} km away
                      </div>
                    )}
                    {/* Tooltip bottom pointer arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--ink)]" />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Control HUD Top Left */}
      <div className="relative z-30 p-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-[var(--paper-raised)]/95 backdrop-blur-md border border-[var(--rule)] text-xs font-semibold text-[var(--ink)] flex items-center gap-2.5 shadow-sm">
            <Layers className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-serif tracking-tight">India Spatial Canvas</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] uppercase font-mono font-bold tracking-wider">
              {museums.length} Plotted
            </span>
          </div>

          {/* Cultural Regions Layer Toggle */}
          <button
            type="button"
            onClick={() => setShowCulturalRegions(!showCulturalRegions)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
              showCulturalRegions
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--paper-raised)]/95 backdrop-blur-md text-[var(--ink-muted)] border-[var(--rule)] hover:text-[var(--ink)]'
            }`}
            title="Toggle Cultural & Dynastic Regions Overlay"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cultural Regions</span>
          </button>
        </div>

        {/* Active Region Toast Indicator */}
        {activeRegion && (
          <div className="px-3 py-1.5 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-xs font-medium shadow-md flex items-center gap-2 animate-in fade-in duration-150">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: activeRegion.color }}
            />
            <span className="font-serif font-semibold">{activeRegion.name}:</span>
            <span className="opacity-80 text-[11px] font-sans">{activeRegion.eras}</span>
          </div>
        )}
      </div>

      {/* Map Control HUD Bottom (Pan/Zoom HUD & Legend) */}
      <div className="relative z-30 p-3.5 flex items-end justify-between gap-3 pointer-events-auto">
        {/* Legend */}
        <div className="px-3.5 py-2.5 rounded-xl bg-[var(--paper-raised)]/95 backdrop-blur-md border border-[var(--rule)] text-[11px] text-[var(--ink-muted)] space-y-1.5 shadow-sm hidden sm:block">
          <div className="flex items-center gap-2 text-[var(--ink)] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <span>Verified Institution ({museums.length})</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--verified)] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--verified)]" />
            <span>Muse Masterworks Exhibit</span>
          </div>
          <div className="flex items-center gap-2 text-[#2A7B76]">
            <span className="w-4 h-0.5 bg-[#2A7B76] rounded-full" />
            <span>7 Sacred River Overlays</span>
          </div>
        </div>

        {/* Dynamic Zoom, Pan, & Reset Controls */}
        <div className="flex items-center gap-1.5 bg-[var(--paper-raised)]/95 backdrop-blur-md border border-[var(--rule)] rounded-xl p-1.5 shadow-sm">
          {/* Zoom Factor Indicator */}
          <div className="px-2.5 py-1 text-[11px] font-mono font-semibold text-[var(--ink)] border-r border-[var(--rule)]">
            {Math.round(zoom * 100)}%
          </div>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            aria-label="Zoom in"
            title="Zoom in (+)"
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--rule)]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            aria-label="Zoom out"
            title="Zoom out (-)"
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--rule)]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetView}
            aria-label="Reset view"
            title="Reset pan & zoom"
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
