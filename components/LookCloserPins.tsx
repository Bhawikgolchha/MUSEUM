'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  MapPin,
  Eye,
  X,
  Layers,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export interface HotspotPin {
  id: string;
  x: number; // percentage from left (0 - 100)
  y: number; // percentage from top (0 - 100)
  label: string;
  detail: string;
  category?: 'craft' | 'iconography' | 'material' | 'inscription' | 'provenance';
}

export const ARTIFACT_HOTSPOTS: Record<string, HotspotPin[]> = {
  'art-001': [
    {
      id: 'p1',
      x: 50,
      y: 18,
      label: 'Elaborate Shoulder Bun',
      detail: 'A heavy coiled chignon rests firmly over her right shoulder, demonstrating intricate Mature Harappan hairstyling techniques.',
      category: 'craft',
    },
    {
      id: 'p2',
      x: 30,
      y: 46,
      label: 'Stacked Shell Bangles',
      detail: 'Nearly 25 individual bangles cover her left arm from wrist to shoulder, meticulously cast in lost-wax bronze.',
      category: 'material',
    },
    {
      id: 'p3',
      x: 64,
      y: 54,
      label: 'Dynamic Resting Stance',
      detail: 'The relaxed right hand placed firmly on her right hip creates a classic dynamic posture full of youthful poise.',
      category: 'iconography',
    },
    {
      id: 'p4',
      x: 51,
      y: 28,
      label: 'Triple-Pendant Necklace',
      detail: 'A miniature necklace with three drop beads delicately accents the neckline with micro-relief accuracy.',
      category: 'craft',
    },
  ],
  'art-002': [
    {
      id: 'p1',
      x: 50,
      y: 14,
      label: 'Prabhamandala Flame Aureole',
      detail: 'The circular halo of cosmic flames represents the continuous cycle of creation, preservation, and dissolution.',
      category: 'iconography',
    },
    {
      id: 'p2',
      x: 74,
      y: 35,
      label: 'Damaru Drum of Creation',
      detail: 'The upper right hand holds the hourglass drum, sounding the primordial cosmic vibration from which all forms arise.',
      category: 'iconography',
    },
    {
      id: 'p3',
      x: 36,
      y: 48,
      label: 'Abhaya Mudra (Reassurance)',
      detail: 'The lower right hand is raised in protection, reassuring the devotee that divine law dispels fear.',
      category: 'iconography',
    },
    {
      id: 'p4',
      x: 50,
      y: 88,
      label: 'Apasmara Purusha (Ignorance)',
      detail: 'Shiva stamps his right foot onto the dwarf demon Apasmara, symbolizing the triumph of spiritual clarity over illusion.',
      category: 'iconography',
    },
  ],
  'art-003': [
    {
      id: 'p1',
      x: 52,
      y: 18,
      label: 'Radiant Mauryan Polish',
      detail: 'Buff Chunar sandstone polished to a glass-like sheen, an exclusive craft hallmark of imperial Mauryan ateliers.',
      category: 'material',
    },
    {
      id: 'p2',
      x: 72,
      y: 32,
      label: 'Chauri Fly-Whisk',
      detail: 'The heavy yak-tail whisk held in her right hand signifies divine attendant status and royal reverence.',
      category: 'iconography',
    },
    {
      id: 'p3',
      x: 50,
      y: 75,
      label: 'Pleated Antariya Drapery',
      detail: 'Finely incised sheer folds cascade down between heavy anklets, exemplifying the sensuous naturalism of 3rd-century BCE stonecraft.',
      category: 'craft',
    },
  ],
  'art-004': [
    {
      id: 'p1',
      x: 50,
      y: 24,
      label: 'Four Asiatic Lions',
      detail: 'Four lions seated back-to-back facing cardinal directions proclaim the universal rule of Dharma across the realm.',
      category: 'iconography',
    },
    {
      id: 'p2',
      x: 50,
      y: 62,
      label: '24-Spoked Dharma Wheel',
      detail: 'The Ashoka Chakra relief wheel on the abacus drum, which now anchors the center of the National Flag of India.',
      category: 'iconography',
    },
    {
      id: 'p3',
      x: 50,
      y: 86,
      label: 'Inverted Bell Lotus',
      detail: 'The fluted lotus base evokes purity rising through worldly waters, reflecting Mauryan monolithic masonry.',
      category: 'material',
    },
  ],
  'art-005': [
    {
      id: 'p1',
      x: 50,
      y: 18,
      label: 'Concentric Lotus Halo',
      detail: 'An elaborately carved circular nimbus featuring bands of radiating lotus petals and delicate creeping arabesques.',
      category: 'craft',
    },
    {
      id: 'p2',
      x: 50,
      y: 48,
      label: 'Wet Drapery Sanghati',
      detail: 'The sheer monastic robe clings seamlessly to the torso without incised fold lines, the signature peak of Gupta sculpture.',
      category: 'craft',
    },
    {
      id: 'p3',
      x: 38,
      y: 65,
      label: 'Gathered Robe Hem',
      detail: 'The Buddha’s left hand grasps the gathered pleated edge of the robe with supreme elegance.',
      category: 'iconography',
    },
  ],
  'art-006': [
    {
      id: 'p1',
      x: 62,
      y: 40,
      label: 'Abhaya Mudra (Fearlessness)',
      detail: 'The raised right palm bestows freedom from fear, rendered with delicate webbed fingers (jalanguli).',
      category: 'iconography',
    },
    {
      id: 'p2',
      x: 50,
      y: 18,
      label: 'Ushnisha & Curled Locks',
      detail: 'Conical cranial protuberance covered with tight snail-shell curls, signifying supreme enlightened wisdom.',
      category: 'iconography',
    },
    {
      id: 'p3',
      x: 50,
      y: 86,
      label: '500kg Lost-Wax Copper Casting',
      detail: 'Cast in pure copper over a clay core in Sultanganj, Bihar; the largest surviving ancient Indian bronze statue.',
      category: 'material',
    },
  ],
  'art-007': [
    {
      id: 'p1',
      x: 45,
      y: 35,
      label: 'Jataka Narrative Medallions',
      detail: 'High-relief circular roundels portraying moral episodes from the previous lives of the Buddha.',
      category: 'iconography',
    },
    {
      id: 'p2',
      x: 60,
      y: 65,
      label: 'Early Brahmi Epigraphy',
      detail: 'Inscriptions incised in archaic Brahmi script recording donations by civic guilds, laywomen, and wandering monks.',
      category: 'inscription',
    },
  ],
  'art-008': [
    {
      id: 'p1',
      x: 50,
      y: 22,
      label: 'Sunken Eyes & Meditative Gaze',
      detail: 'Intense Hellenistic anatomical realism expressing ascetic austerity and unshakeable inward contemplation.',
      category: 'craft',
    },
    {
      id: 'p2',
      x: 50,
      y: 50,
      label: 'Exposed Ribcage & Vascular Relief',
      detail: 'Every rib, vein, and tendon is carved into dark gray schist with masterwork Greco-Buddhist precision.',
      category: 'craft',
    },
  ],
  'art-009': [
    {
      id: 'p1',
      x: 50,
      y: 25,
      label: 'Translucent Marble Veil',
      detail: 'A near-miraculous optical effect where solid white Carrara marble appears as sheer, breathable fabric over Rebecca’s face.',
      category: 'craft',
    },
    {
      id: 'p2',
      x: 50,
      y: 70,
      label: 'Bridal Gown Drapery',
      detail: 'Virtuoso 19th-century Italian neoclassical carving depicting intricate embroidered borders and cascading silk folds.',
      category: 'craft',
    },
  ],
  'art-010': [
    {
      id: 'p1',
      x: 50,
      y: 25,
      label: 'Mutton-Fat Jade Hilt',
      detail: 'Pure white nephrite jade sculpted into an animal head with inlaid floral vines of pure gold and gemstone cabochons.',
      category: 'material',
    },
    {
      id: 'p2',
      x: 50,
      y: 70,
      label: 'Watered Damascus Steel',
      detail: 'High-carbon wootz crucible steel blade forged with crystalline wave patterns renowned for exceptional sharpness.',
      category: 'material',
    },
  ],
};

interface LookCloserPinsProps {
  artifactId: string;
  imageUrl: string;
  altText: string;
  title: string;
  lookCloserItems?: string[];
  onSelectPin?: (pin: HotspotPin | null) => void;
}

export default function LookCloserPins({
  artifactId,
  imageUrl,
  altText,
  title,
  lookCloserItems = [],
  onSelectPin,
}: LookCloserPinsProps) {
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x, 1.75x, 2.5x
  const [showPins, setShowPins] = useState<boolean>(true);
  const [zoomOrigin, setZoomOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const viewportRef = useRef<HTMLDivElement>(null);

  const rawPins: HotspotPin[] =
    ARTIFACT_HOTSPOTS[artifactId] ||
    (lookCloserItems.length > 0
      ? lookCloserItems.map((item, idx) => ({
          id: `p${idx + 1}`,
          x: 35 + ((idx * 25) % 45),
          y: 25 + ((idx * 28) % 55),
          label: `Observational Focus #${idx + 1}`,
          detail: item,
          category: 'craft' as const,
        }))
      : [
          {
            id: 'p1',
            x: 50,
            y: 30,
            label: 'Surface Texture & Craftsmanship',
            detail: 'Observe the fine textural details, surface patination, and metallurgical or sculptural technique.',
            category: 'craft',
          },
          {
            id: 'p2',
            x: 50,
            y: 65,
            label: 'Material Composition & Preservation',
            detail: 'Notice how the material has weathered centuries of archival preservation.',
            category: 'material',
          },
        ]);

  const activePin = rawPins.find((p) => p.id === activePinId) || null;

  useEffect(() => {
    onSelectPin?.(activePin);
  }, [activePin, onSelectPin]);

  const handlePinClick = (pin: HotspotPin) => {
    if (activePinId === pin.id) {
      setActivePinId(null);
      setZoomLevel(1);
      setZoomOrigin({ x: 50, y: 50 });
    } else {
      setActivePinId(pin.id);
      setZoomOrigin({ x: pin.x, y: pin.y });
      if (zoomLevel === 1) {
        setZoomLevel(1.75);
      }
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => (prev < 2.5 ? (prev === 1 ? 1.75 : 2.5) : prev));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = prev > 1 ? (prev === 2.5 ? 1.75 : 1) : 1;
      if (next === 1) {
        setActivePinId(null);
        setZoomOrigin({ x: 50, y: 50 });
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setActivePinId(null);
    setZoomOrigin({ x: 50, y: 50 });
  };

  return (
    <div className="space-y-4">
      {/* High-Resolution Masterwork Photographic Plate */}
      <div className="relative rounded-2xl overflow-hidden bg-[var(--paper-subtle)] border border-[var(--hairline-strong)] shadow-[var(--shadow-plate)] group select-none transition-shadow duration-300 hover:shadow-[var(--shadow-museum)]">
        {/* Main Viewport Container */}
        <div
          ref={viewportRef}
          className="relative aspect-[4/5] sm:aspect-[3/4] w-full overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
            transform: `scale(${zoomLevel})`,
          }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={altText || title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[var(--paper-subtle)]">
              <h3 className="font-serif text-2xl text-[var(--ink)] mb-2">{title}</h3>
              <p className="text-sm text-[var(--ink-muted)]">Masterwork plate preview</p>
            </div>
          )}

          {/* Interactive Hotspot Callout Pins */}
          {showPins &&
            rawPins.map((pin, index) => {
              const isActive = activePinId === pin.id;
              return (
                <div
                  key={pin.id}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200"
                  style={{
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                    transform: `translate(-50%, -50%) scale(${1 / Math.sqrt(zoomLevel)})`,
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePinClick(pin);
                    }}
                    aria-label={`Look closer hotspot ${index + 1}: ${pin.label}`}
                    aria-expanded={isActive}
                    className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-patina)] focus-visible:ring-offset-2 tactile-press ${
                      isActive
                        ? 'bg-[var(--accent-patina)] text-white shadow-lg scale-110 ring-2 ring-white/90'
                        : 'bg-white/95 text-[var(--ink)] hover:bg-white hover:scale-105 shadow-md backdrop-blur-xs border border-[var(--hairline-strong)]'
                    }`}
                  >
                    {/* Animated Pulsing Patina Ring */}
                    <span
                      className={`absolute -inset-1 rounded-full pointer-events-none ${
                        isActive
                          ? 'animate-ping bg-[var(--accent-patina)] opacity-40 duration-1000'
                          : 'animate-pulse bg-[var(--accent-patina)] opacity-25'
                      }`}
                    />

                    {/* Hotspot Pin Index */}
                    <span className="relative z-10 text-[11px] font-mono font-bold">
                      {index + 1}
                    </span>
                  </button>
                </div>
              );
            })}
        </div>

        {/* Accession & Provenance Overlay Badge */}
        <div className="absolute top-3.5 left-3.5 z-30 pointer-events-none flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--paper-surface)]/95 backdrop-blur-md border border-[var(--hairline)] text-[11px] font-semibold text-[var(--accent-patina)] shadow-2xs">
            <Sparkles className="w-3 h-3 text-[var(--accent-patina)]" />
            <span className="tracking-wide">High-Resolution Plate</span>
          </div>
        </div>

        {/* Interactive Masterwork Controls Toolbar */}
        <div className="absolute bottom-3.5 right-3.5 z-30 flex items-center gap-1.5 p-1 rounded-xl bg-[var(--paper-surface)]/95 backdrop-blur-md border border-[var(--hairline-strong)] shadow-md">
          {/* Toggle Pins Visibility */}
          <button
            type="button"
            onClick={() => setShowPins(!showPins)}
            aria-label={showPins ? 'Hide hotspot pins' : 'Show hotspot pins'}
            className={`p-2 rounded-lg text-xs font-medium transition-colors tactile-press ${
              showPins
                ? 'bg-[var(--accent-soft)] text-[var(--accent-patina)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
            title="Toggle observational pins"
          >
            <Eye className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-[var(--hairline-strong)]" />

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2.5}
            aria-label="Zoom in on plate"
            className="p-2 rounded-lg text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors tactile-press"
            title="Zoom In (up to 2.5x)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            aria-label="Zoom out on plate"
            className="p-2 rounded-lg text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors tactile-press"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Reset Zoom */}
          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              aria-label="Reset zoom to default view"
              className="p-2 rounded-lg text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors tactile-press"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Hotspot Observational Detail Callout Card */}
      {activePin ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--paper-surface)] border border-[var(--hairline-strong)] shadow-[var(--shadow-card)] space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-patina)] text-white text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 shadow-2xs">
                {rawPins.findIndex((p) => p.id === activePin.id) + 1}
              </span>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[var(--accent-patina)]">
                  {activePin.category || 'Observational Callout'}
                </span>
                <h4 className="font-serif text-base font-semibold text-[var(--ink)] leading-snug">
                  {activePin.label}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActivePinId(null);
                setZoomLevel(1);
                setZoomOrigin({ x: 50, y: 50 });
              }}
              aria-label="Close hotspot detail"
              className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors tactile-press"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs sm:text-[13px] text-[var(--ink)]/90 leading-relaxed pl-8.5 font-sans">
            {activePin.detail}
          </p>
        </div>
      ) : (
        /* Pin Quick Selector Ribbon */
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] font-medium">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent-patina)]" />
              <span>Look Closer Observational Pins ({rawPins.length})</span>
            </span>
            <span className="text-[11px] font-mono text-[var(--ink-faint)]">
              Select pin to inspect
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {rawPins.map((pin, idx) => (
              <button
                key={pin.id}
                type="button"
                onClick={() => handlePinClick(pin)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--paper-surface)] hover:bg-[var(--paper-subtle)] border border-[var(--hairline)] hover:border-[var(--hairline-strong)] text-[var(--ink)] shadow-2xs transition-all tactile-press"
              >
                <span className="w-4 h-4 rounded-full bg-[var(--accent-soft)] text-[var(--accent-patina)] text-[10px] font-mono font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span>{pin.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
