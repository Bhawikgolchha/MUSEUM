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
    subtitle: 'Kashmir, Ladakh, Himachal, Uttarakhand',
    eras: 'Namgyal · Karkota · Katyuri · Dogra',
    color: '#2563EB',
    path: 'M 250, 150 C 270, 90 315, 30 360, 45 C 410, 60 415, 120 405, 165 C 390, 200 435, 255 420, 280 C 375, 250 330, 230 290, 220 C 255, 200 240, 180 250, 150 Z',
    labelPoint: { x: 330, y: 130 },
  },
  {
    id: 'indus_sapta',
    name: 'Indus & Sapta Sindhu',
    subtitle: 'Punjab, Haryana, Rajasthan, Thar & Gujarat',
    eras: 'Harappan · Vedic Kuru · Gurjara-Pratihara · Rajput',
    color: '#9C6644',
    path: 'M 290, 220 C 330, 230 360, 250 350, 310 C 330, 380 280, 430 240, 465 C 190, 500 130, 560 65, 505 C 35, 470 60, 440 95, 400 C 145, 330 200, 270 250, 220 Z',
    labelPoint: { x: 190, y: 350 },
  },
  {
    id: 'gangetic',
    name: 'Gangetic Heartland',
    subtitle: 'Aryavarta, Magadha, Awadh, Bengal & Odisha',
    eras: 'Maurya · Sunga · Gupta · Pala · Sena · Mughal',
    color: '#D97706',
    path: 'M 350, 310 C 400, 290 440, 280 490, 310 C 560, 340 640, 340 705, 330 C 715, 370 700, 440 690, 485 C 640, 525 570, 550 500, 480 C 430, 440 375, 375 350, 310 Z',
    labelPoint: { x: 520, y: 380 },
  },
  {
    id: 'deccan',
    name: 'Deccan Plateau',
    subtitle: 'Maharashtra, Telangana, North Karnataka, Andhra',
    eras: 'Satavahana · Rashtrakuta · Chalukya · Kakatiya · Maratha',
    color: '#1F5F5B',
    path: 'M 175, 565 C 240, 465 350, 440 500, 480 C 585, 555 530, 630 465, 685 C 380, 715 285, 690 200, 670 C 175, 630 165, 590 175, 565 Z',
    labelPoint: { x: 350, y: 580 },
  },
  {
    id: 'dravidian',
    name: 'Dravidian Heartland',
    subtitle: 'Tamil Nadu, Kerala, South Karnataka',
    eras: 'Sangam · Pallava · Imperial Chola · Pandya · Chera · Hoysala',
    color: '#7C3AED',
    path: 'M 200, 670 C 285, 690 380, 715 465, 685 C 445, 745 425, 820 410, 860 C 370, 920 335, 950 310, 920 C 270, 840 220, 750 200, 670 Z',
    labelPoint: { x: 330, y: 790 },
  },
  {
    id: 'northeast',
    name: 'North-East & Brahmaputra',
    subtitle: 'Assam, Meghalaya, Arunachal, Seven Sisters',
    eras: 'Kamarupa · Ahom · Dimasa · Koch · Manikya',
    color: '#059669',
    path: 'M 705, 330 C 730, 315 780, 325 820, 280 C 880, 250 945, 275 930, 350 C 900, 410 860, 475 820, 420 C 780, 400 730, 415 705, 330 Z',
    labelPoint: { x: 825, y: 355 },
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
  const [showCulturalRegions, setShowCulturalRegions] = useState<boolean>(false);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Geographic projection bounds for Indian Subcontinent:
  // Longitude: 68.0°E to 97.5°E (Span: 29.5°)
  // Latitude: 7.0°N to 37.5°N (Span: 30.5°)
  const minLon = 68.0;
  const maxLon = 97.5;
  const minLat = 7.0;
  const maxLat = 37.5;

  const projectToPercent = useCallback((lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    // Invert Y because latitude increases northward (upward)
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(2, Math.min(98, x)),
      y: Math.max(2, Math.min(98, y)),
    };
  }, []);

  // Smooth center on coordinate updates
  useEffect(() => {
    if (centerCoordinates && containerRef.current) {
      const { x: pctX, y: pctY } = projectToPercent(centerCoordinates.lat, centerCoordinates.lon);
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const targetPanX = ((50 - pctX) / 100) * width * zoom;
      const targetPanY = ((50 - pctY) / 100) * height * zoom;
      setPan({ x: targetPanX, y: targetPanY });
    }
  }, [centerCoordinates, projectToPercent, zoom]);

  // Zoom controls (1x to 4x)
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

  // Touch pan handlers
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
      className={`relative w-full h-[540px] sm:h-[620px] lg:h-[720px] rounded-3xl overflow-hidden bg-[#FAF7F0] border border-[var(--hairline-strong)] shadow-museum flex flex-col justify-between select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      aria-label="Interactive India Spatial Heritage Map Canvas"
    >
      {/* Background Topographic Dot Pattern */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#1F5F5B 1px, transparent 1px), radial-gradient(#1F5F5B 1px, #FAF7F0 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      />

      {/* Transformed Map & Markers Canvas */}
      <div
        className="absolute inset-0 origin-center transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
        }}
      >
        {/* Authoritative High-Precision SVG Map of India (1000 x 1000 ViewBox) */}
        <svg
          viewBox="0 0 1000 1000"
          className="absolute inset-0 w-full h-full"
          style={{ filter: 'drop-shadow(0 12px 32px rgba(31,95,91,0.08))' }}
        >
          <defs>
            {/* Landmass Shading Gradient */}
            <linearGradient id="indiaLandfill" x1="15%" y1="5%" x2="85%" y2="95%">
              <stop offset="0%" stopColor="#F5EFE4" />
              <stop offset="50%" stopColor="#EDE5D6" />
              <stop offset="100%" stopColor="#E2D8C5" />
            </linearGradient>

            {/* Sacred Rivers Gradient */}
            <linearGradient id="riverFlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1F5F5B" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#2A7B76" stopOpacity="0.9" />
            </linearGradient>

            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Geographic Graticule Coordinate Grid */}
          <g
            className="text-[var(--ink-muted)] pointer-events-none"
            opacity="0.18"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="4,4"
          >
            {/* Longitude Meridians: 70°E, 75°E, 80°E, 85°E, 90°E, 95°E */}
            <line x1="68" y1="20" x2="68" y2="980" />
            <line x1="237" y1="20" x2="237" y2="980" />
            <line x1="407" y1="20" x2="407" y2="980" />
            <line x1="576" y1="20" x2="576" y2="980" />
            <line x1="746" y1="20" x2="746" y2="980" />
            <line x1="915" y1="20" x2="915" y2="980" />

            {/* Latitude Parallels: 35°N, 30°N, 25°N, 20°N, 15°N, 10°N */}
            <line x1="20" y1="82" x2="980" y2="82" />
            <line x1="20" y1="246" x2="980" y2="246" />
            <line x1="20" y1="410" x2="980" y2="410" />
            <line x1="20" y1="574" x2="980" y2="574" />
            <line x1="20" y1="738" x2="980" y2="738" />
            <line x1="20" y1="902" x2="980" y2="902" />

            {/* Tropic of Cancer (23.5° N) */}
            <line
              x1="20"
              y1="459"
              x2="980"
              y2="459"
              stroke="#9C6644"
              strokeWidth="1.2"
              strokeDasharray="6,4"
              opacity="0.45"
            />
          </g>

          {/* Graticule Labels */}
          <g
            className="text-[var(--ink-muted)] fill-current pointer-events-none select-none font-mono text-[9px]"
            opacity="0.45"
          >
            <text x="68" y="24" textAnchor="middle">70°E</text>
            <text x="237" y="24" textAnchor="middle">75°E</text>
            <text x="407" y="24" textAnchor="middle">80°E</text>
            <text x="576" y="24" textAnchor="middle">85°E</text>
            <text x="746" y="24" textAnchor="middle">90°E</text>
            <text x="915" y="24" textAnchor="middle">95°E</text>

            <text x="22" y="85" textAnchor="end">35°N</text>
            <text x="22" y="249" textAnchor="end">30°N</text>
            <text x="22" y="413" textAnchor="end">25°N</text>
            <text x="22" y="577" textAnchor="end">20°N</text>
            <text x="22" y="741" textAnchor="end">15°N</text>
            <text x="22" y="905" textAnchor="end">10°N</text>

            <text x="975" y="455" textAnchor="end" fill="#9C6644" fontWeight="bold">
              Tropic of Cancer (23.5°N)
            </text>
          </g>

          {/* 2. Official Boundary Contour of India (Mainland Territory) */}
          <path
            d="M 325, 20
               C 340, 25 365, 45 378, 55
               C 395, 70 412, 105 408, 140
               C 405, 160 385, 185 395, 210
               C 405, 225 430, 240 440, 250
               C 465, 275 520, 310 575, 340
               C 620, 350 660, 355 690, 345
               C 695, 335 700, 310 710, 310
               C 720, 310 722, 328 725, 340
               C 745, 345 780, 348 810, 338
               C 825, 325 850, 295 885, 275
               C 920, 260 955, 268 970, 290
               C 955, 320 935, 355 918, 380
               C 900, 405 888, 435 880, 460
               C 870, 490 850, 520 835, 525
               C 820, 500 810, 465 785, 460
               C 765, 445 735, 430 740, 405
               C 750, 385 725, 385 710, 420
               C 700, 460 700, 500 705, 525
               C 675, 525 645, 525 635, 545
               C 620, 565 600, 585 575, 605
               C 550, 635 515, 660 485, 680
               C 455, 705 430, 745 420, 780
               C 415, 805 410, 835 405, 870
               C 400, 895 395, 920 380, 935
               C 360, 948 345, 958 330, 970
               C 315, 960 300, 940 288, 910
               C 275, 875 255, 840 240, 810
               C 225, 775 210, 745 205, 720
               C 195, 690 180, 650 174, 610
               C 170, 570 170, 540 165, 525
               C 155, 510 145, 510 140, 525
               C 125, 545 100, 555 80, 545
               C 60, 535 45, 515 40, 498
               C 50, 485 75, 475 95, 475
               C 75, 475 40, 470 15, 450
               C 30, 430 65, 420 110, 420
               C 115, 390 105, 355 110, 335
               C 130, 305 165, 280 200, 245
               C 215, 225 230, 205 238, 185
               C 244, 165 236, 140 236, 125
               C 220, 115 210, 95 215, 75
               C 225, 50 265, 28 305, 15
               Z"
            fill="url(#indiaLandfill)"
            stroke="#1F5F5B"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 3. Internal State & Territorial Demarcations */}
          <g stroke="#1F5F5B" strokeWidth="0.8" strokeOpacity="0.32" fill="none" strokeDasharray="3,3">
            {/* Jammu, Kashmir & Ladakh */}
            <path d="M 238, 185 C 280, 180 340, 190 395, 210" />
            <path d="M 320, 45 C 330, 100 320, 150 335, 200" />
            
            {/* Punjab, Haryana & Rajasthan */}
            <path d="M 200, 245 C 240, 260 280, 270 330, 275" />
            <path d="M 240, 260 C 250, 330 260, 400 240, 465" />
            <path d="M 110, 335 C 160, 350 210, 380 240, 465" />

            {/* Gujarat (Kathiawar / Saurashtra & Kutch) */}
            <path d="M 110, 420 C 130, 450 145, 490 165, 525" />
            <path d="M 40, 498 C 80, 505 120, 515 140, 525" />

            {/* Uttar Pradesh, Bihar, Gangetic Plain */}
            <path d="M 330, 275 C 370, 310 430, 340 500, 360" />
            <path d="M 500, 360 C 560, 370 630, 380 690, 345" />

            {/* Central India & Deccan (Madhya Pradesh, Maharashtra) */}
            <path d="M 240, 465 C 320, 470 410, 475 500, 480" />
            <path d="M 170, 570 C 260, 580 370, 590 485, 610" />

            {/* South India (Karnataka, Andhra, Telangana, Tamil Nadu, Kerala) */}
            <path d="M 174, 610 C 230, 630 310, 640 405, 650" />
            <path d="M 205, 720 C 280, 735 360, 745 420, 780" />
            <path d="M 240, 810 C 290, 825 340, 835 405, 870" />
            <path d="M 288, 910 C 310, 920 340, 930 380, 935" />

            {/* Odisha, Bengal, North East */}
            <path d="M 575, 605 C 600, 570 620, 530 635, 545" />
            <path d="M 690, 345 C 700, 380 705, 450 705, 525" />
            <path d="M 725, 340 C 760, 360 800, 375 880, 460" />
          </g>

          {/* 4. Island Territories (Andaman & Nicobar Islands, Lakshadweep) */}
          <g fill="#EDE5D6" stroke="#1F5F5B" strokeWidth="1.8" strokeLinejoin="round">
            {/* Andaman Archipelago */}
            <path d="M 850, 795 C 856, 795 858, 825 852, 835 C 846, 835 844, 805 850, 795 Z" />
            <path d="M 844, 850 C 850, 850 851, 875 845, 878 C 840, 878 839, 855 844, 850 Z" />
            <path d="M 836, 888 C 842, 888 842, 902 837, 902 C 832, 902 832, 888 836, 888 Z" />
            {/* Nicobar Archipelago */}
            <path d="M 846, 938 C 851, 938 851, 948 846, 948 C 841, 948 841, 938 846, 938 Z" />
            <path d="M 876, 975 C 884, 975 886, 995 878, 995 C 872, 995 870, 980 876, 975 Z" />

            {/* Lakshadweep Archipelago */}
            <circle cx="170" cy="855" r="3.5" />
            <circle cx="168" cy="890" r="3.5" />
            <circle cx="202" cy="885" r="4.5" />
            <circle cx="180" cy="965" r="3.5" />
          </g>

          {/* 5. Cultural Historical Regions Layer (Toggleable) */}
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
                      fillOpacity={isActive ? 0.18 : 0.06}
                      stroke={region.color}
                      strokeWidth={isActive ? 2 : 1}
                      strokeDasharray={isActive ? 'none' : '4,4'}
                      className="transition-all duration-200"
                    />
                    <text
                      x={region.labelPoint.x}
                      y={region.labelPoint.y}
                      textAnchor="middle"
                      fill={region.color}
                      fontSize={isActive ? '11.5' : '10'}
                      fontFamily="serif"
                      fontWeight="bold"
                      letterSpacing="0.06em"
                      className="pointer-events-none select-none transition-all duration-200"
                      style={{ textShadow: '0 1px 4px rgba(255,255,255,0.9)' }}
                    >
                      {region.name.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* 6. Major Historic Heritage Rivers */}
          <g fill="none" stroke="url(#riverFlow)" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none opacity-85">
            {/* Ganga */}
            <path
              id="river-ganga"
              d="M 390, 216 Q 410, 270 470, 330 T 540, 365 T 620, 375 T 680, 420 T 700, 490"
              strokeWidth="2.2"
            />
            {/* Yamuna */}
            <path
              id="river-yamuna"
              d="M 360, 210 Q 340, 260 360, 310 T 430, 360 T 540, 365"
              strokeWidth="1.8"
            />
            {/* Brahmaputra */}
            <path
              id="river-brahmaputra"
              d="M 940, 280 Q 880, 310 820, 345 T 740, 360 T 710, 440"
              strokeWidth="2.4"
            />
            {/* Narmada */}
            <path
              id="river-narmada"
              d="M 490, 480 Q 400, 485 300, 495 T 165, 525"
              strokeWidth="1.9"
            />
            {/* Godavari */}
            <path
              id="river-godavari"
              d="M 210, 580 Q 320, 600 420, 620 T 540, 630"
              strokeWidth="2.0"
            />
            {/* Krishna */}
            <path
              id="river-krishna"
              d="M 200, 650 Q 280, 670 380, 680 T 480, 690"
              strokeWidth="1.9"
            />
            {/* Kaveri */}
            <path
              id="river-kaveri"
              d="M 260, 800 Q 320, 830 370, 850 T 410, 860"
              strokeWidth="1.8"
            />
          </g>

          {/* River Typography */}
          <g
            className="text-[var(--accent)] fill-current pointer-events-none select-none font-serif italic text-[8.5px] font-bold"
            opacity="0.85"
          >
            <text x="560" y="355" textAnchor="middle">Ganga</text>
            <text x="360" y="300" textAnchor="middle">Yamuna</text>
            <text x="830" y="335" textAnchor="middle">Brahmaputra</text>
            <text x="330" y="488" textAnchor="middle">Narmada</text>
            <text x="380" y="605" textAnchor="middle">Godavari</text>
            <text x="360" y="675" textAnchor="middle">Krishna</text>
            <text x="350" y="840" textAnchor="middle">Kaveri</text>
          </g>

          {/* 7. Oceanic Body Typography */}
          <g
            className="text-[var(--ink-muted)] fill-current select-none pointer-events-none font-serif text-[10px] tracking-[0.2em]"
            opacity="0.35"
          >
            <text x="100" y="700" textAnchor="middle" transform="rotate(-90 100 700)">
              ARABIAN SEA
            </text>
            <text x="890" y="650" textAnchor="middle" transform="rotate(90 890 650)">
              BAY OF BENGAL
            </text>
            <text x="500" y="985" textAnchor="middle">INDIAN OCEAN</text>
          </g>

          {/* 8. Compass Rose */}
          <g className="text-[var(--accent)] pointer-events-none" opacity="0.8">
            <g transform="translate(895, 90)">
              <circle
                cx="0"
                cy="0"
                r="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="2,2"
              />
              <polygon points="0,-18 5,-2 0,0 -5,-2" fill="currentColor" />
              <polygon points="0,18 5,2 0,0 -5,2" fill="currentColor" opacity="0.4" />
              <polygon points="18,0 2,5 0,0 2,-5" fill="currentColor" opacity="0.4" />
              <polygon points="-18,0 -2,5 0,0 -2,-5" fill="currentColor" opacity="0.4" />
              <text
                x="0"
                y="-23"
                textAnchor="middle"
                fontSize="11"
                fontFamily="serif"
                fontWeight="bold"
                fill="currentColor"
              >
                N
              </text>
            </g>

            {/* Scale Bar */}
            <g transform="translate(75, 945)">
              <line x1="0" y1="0" x2="120" y2="0" stroke="currentColor" strokeWidth="2.5" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="currentColor" strokeWidth="1.5" />
              <line x1="60" y1="-3" x2="60" y2="3" stroke="currentColor" strokeWidth="1.5" />
              <line x1="120" y1="-4" x2="120" y2="4" stroke="currentColor" strokeWidth="1.5" />
              <text x="0" y="-7" fontSize="8" fontFamily="monospace" fill="currentColor">0</text>
              <text x="60" y="-7" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="currentColor">250km</text>
              <text x="120" y="-7" fontSize="8" fontFamily="monospace" textAnchor="end" fill="currentColor">500km</text>
            </g>
          </g>
        </svg>

        {/* Mathematically Projected Museum Markers */}
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
                  {/* Pulsing ring when active */}
                  {isHighlighted && (
                    <span className="absolute -inset-3 rounded-full bg-[var(--accent)]/35 animate-ping pointer-events-none" />
                  )}

                  {/* Pin Bubble */}
                  <div
                    className={`relative flex items-center justify-center p-2 rounded-full border shadow-md transition-all duration-200 group-hover:scale-120 ${
                      isHighlighted
                        ? 'bg-[var(--accent)] text-white border-white ring-4 ring-[var(--accent)]/35 shadow-lg'
                        : hasMuse
                        ? 'bg-[var(--paper-surface)] text-[var(--accent)] border-[var(--accent)] ring-2 ring-[var(--accent)]/20 shadow-sm'
                        : 'bg-[var(--paper-surface)] text-[var(--ink)] border-[var(--hairline)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <MapPin
                      className={`w-3.5 h-3.5 ${isHighlighted ? 'stroke-[2.5]' : ''}`}
                      style={{ color: isHighlighted ? '#FFFFFF' : hasMuse ? 'var(--accent)' : catStyle.bg }}
                    />

                    {/* Masterwork Dot */}
                    {hasMuse && !isHighlighted && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--accent-bronze)] border-2 border-white ring-1 ring-[var(--accent-bronze)]/40" />
                    )}
                  </div>

                  {/* Hover Tooltip Card */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-medium shadow-xl transition-all duration-150 pointer-events-none z-50 min-w-[180px] max-w-[260px] ${
                      isHighlighted
                        ? 'bg-[var(--ink)] text-[var(--paper)] opacity-100 scale-100 translate-y-0'
                        : 'bg-[var(--paper-surface)] text-[var(--ink)] border border-[var(--hairline)] opacity-0 scale-95 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
                    }`}
                  >
                    <div className="font-serif font-semibold text-xs leading-tight flex items-center justify-between gap-1.5 pb-1 border-b border-white/10">
                      <span className="truncate">{museum.name.split(',')[0]}</span>
                      {hasMuse && (
                        <Sparkles className="w-3 h-3 text-[var(--accent-bronze)] flex-shrink-0" />
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
                    {/* Arrow */}
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
          <div className="px-3.5 py-2 rounded-xl bg-[var(--paper-surface)]/95 backdrop-blur-md border border-[var(--hairline)] text-xs font-semibold text-[var(--ink)] flex items-center gap-2.5 shadow-sm">
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
                : 'bg-[var(--paper-surface)]/95 backdrop-blur-md text-[var(--ink-muted)] border-[var(--hairline)] hover:text-[var(--ink)]'
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
        <div className="px-3.5 py-2.5 rounded-xl bg-[var(--paper-surface)]/95 backdrop-blur-md border border-[var(--hairline)] text-[11px] text-[var(--ink-muted)] space-y-1.5 shadow-sm hidden sm:block">
          <div className="flex items-center gap-2 text-[var(--ink)] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <span>Museum Repository ({museums.length})</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--accent-bronze)] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-bronze)]" />
            <span>Muse Masterwork Exhibition</span>
          </div>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-1.5 bg-[var(--paper-surface)]/95 backdrop-blur-md border border-[var(--hairline)] rounded-xl p-1.5 shadow-sm">
          <div className="px-2.5 py-1 text-[11px] font-mono font-semibold text-[var(--ink)] border-r border-[var(--hairline)]">
            {Math.round(zoom * 100)}%
          </div>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            aria-label="Zoom in"
            title="Zoom in (+)"
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--paper-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            aria-label="Zoom out"
            title="Zoom out (-)"
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--paper-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetView}
            aria-label="Reset view"
            title="Reset pan & zoom"
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
