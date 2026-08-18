# Project: Digital Muse Frontend Redesign

## Architecture
Digital Muse is a Next.js 16 (App Router) / React 19 / Tailwind CSS v4 frontend platform for Indian museum discovery and adaptive interpretation. It features 5 primary user-facing screens backed by deterministic fallback synthesis, rich precomputed artifact claim ledgers, and spatial/ancestral PIN code resolvers.

- **Theme Paradigm**: Editorial Heritage & Tactile Museum
- **Color Palette**:
  - Background Ground: Warm Museum Paper (`#FAF8F4`)
  - Elevated Surfaces: Pure Surface (`#FFFFFF`), Recessed Subtle (`#F4F0E8`)
  - Primary Ink: Deep Charcoal Ink (`#18181B`) — Contrast 16.2:1 AAA
  - Secondary Ink: Muted Stone (`#71717A`) — Contrast 4.65:1 AA
  - Primary Accent: Ancient Verdigris Patina (`#1F5F5B`) — Contrast 6.88:1 AAA Large
  - Secondary Accent: Ancient Bronze / Terracotta (`#9C6644`) — Contrast 4.72:1 AA
  - Whisper Hairlines: `rgba(24, 24, 27, 0.08)` (Active: `rgba(24, 24, 27, 0.16)`)
  - Fidelity Indicators: Verified Forest (`#166534`), Flagged Oxide (`#991B1B`), Antiquity Amber (`#8A5A00`)
- **Typography Stack**:
  - Display Modern Serif: `Fraunces` (variable optical size `opsz` 9..144, italic angles)
  - Body Grotesk: `Geist` (clean high-clarity sans)
  - Monospace: `Geist Mono` (claim IDs, coordinates, postal PINs)
- **Micro-Interactions**: Spring-physics micro-interactions (`stiffness: 100, damping: 20`, `.tactile-press`, `.museum-card-lift`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Stitch Design Tokens & CSS Variables | Full palette, hairlines, and typography variables in `app/globals.css` | M1 | ORIGINAL_REQUEST §Theme |
| 2 | Fraunces & Geist Typography Setup | Font imports and CSS variables in `app/layout.tsx` replacing Inter | M1 | ORIGINAL_REQUEST §Theme |
| 3 | Stitch DESIGN.md Token Spec | Authoritative DESIGN.md spec for Google Stitch compliance | M1 | ORIGINAL_REQUEST §R3 |
| 4 | Header & Navigation Bar | Warm editorial header with tactile navigation, brand mark, and persona indicator | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Asymmetric Split Editorial Hero | 7:5 asymmetric split layout with inline visual punctuation and left narrative intro | M2 | ORIGINAL_REQUEST §R1.1 |
| 6 | Floating Persona Mode Switcher | In-situ pill switcher (Adult, Child, Specialist, Accessibility) | M2 | ORIGINAL_REQUEST §R1.1 |
| 7 | Staggered Diagonal Masonry Grid | Masterworks gallery with period badges, medium tags, hover depth, and museum tabs | M2 | ORIGINAL_REQUEST §R1.1 |
| 8 | Dual-Column Exhibition Split-Screen | Sticky high-res photographic masterwork plate on left, scrollable editorial panel on right | M3 | ORIGINAL_REQUEST §R1.2 |
| 9 | 'Look Closer' Observational Callouts | Interactive hotspot pins directly on photographic masterwork plate | M3 | ORIGINAL_REQUEST §R1.2 |
| 10 | 4-Persona Voice Tab Switcher | Seamless tab bar on editorial panel with 0ms verbatim source toggle | M3 | ORIGINAL_REQUEST §R1.2 |
| 11 | Slide-over Factual Fidelity Audit Drawer | Slide-over sheet displaying atomic claim checklist, verification badges, and audit tests | M3 | ORIGINAL_REQUEST §R1.2 |
| 12 | Interactive India SVG Canvas | Authentic India SVG with pan/zoom (1x-4x), river overlays, and custom patina pins | M4 | ORIGINAL_REQUEST §R1.3 |
| 13 | Live GPS 'Near Me' Proximity Sorting | Geolocation distance calculation and sorting of verified museums | M4 | ORIGINAL_REQUEST §R1.3 |
| 14 | Bidirectional Card-Pin Hover Sync | Hovering card pulses corresponding map pin; hovering map pin highlights card | M4 | ORIGINAL_REQUEST §R1.3 |
| 15 | 6-Digit Postal PIN Ancestral Resolver | Resolves postal PIN to civilizational eras (Chola, Mauryan, Gupta, etc.) | M5 | ORIGINAL_REQUEST §R1.4 |
| 16 | Personalized Cultural Narrative & TTS | AI-curated lineage card with Web Speech API audio narration and sentence tracking | M5 | ORIGINAL_REQUEST §R1.4 |
| 17 | Interactive Regional Craft Traditions | Tactile craft cards detailing historical techniques, materials, and living master artisans | M5 | ORIGINAL_REQUEST §R1.4 |
| 18 | Tactile Multi-Step Ingestion Wizard | 4-step wizard for ingesting new museum pieces, claims, and media | M6 | ORIGINAL_REQUEST §R1.5 |
| 19 | Atomic Claim Builder & Synthesizer | Interactive claim authoring with live validation and synthesis preview | M6 | ORIGINAL_REQUEST §R1.5 |
| 20 | Multi-Persona Live Preview Tabs | Simultaneous preview of 4 persona adaptations with claim verification scorecards | M6 | ORIGINAL_REQUEST §R1.5 |
| 21 | E2E Build, Typecheck & Quality Gate | 0 tsc errors, 0 build errors, 100% test pass rate, mobile responsiveness (<768px) | M7 | ORIGINAL_REQUEST §Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Design System & Layout Foundation | `DESIGN.md`, `app/globals.css`, `app/layout.tsx`, `components/Navbar.tsx`, `components/Footer.tsx` | none | DONE |
| M2 | Screen 1: Gallery Showcase (`app/page.tsx`) | Asymmetric Split Hero, floating persona switcher, staggered diagonal masonry grid, `components/ArtifactCard.tsx`, `components/PersonaSwitcher.tsx` | M1 | DONE |
| M3 | Screen 2: Artifact Detail & Auditor (`app/artifact/[id]/page.tsx`) | Dual-column exhibition split, Look Closer hotspot pins, 4-persona voice tabs, 0ms verbatim source toggle, fidelity audit drawer | M1 | DONE |
| M4 | Screen 3: Spatial Heritage Canvas (`app/explore/page.tsx`) | Interactive India SVG with pan/zoom, patina pins, GPS Near Me, bidirectional card-pin hover sync | M1 | DONE |
| M5 | Screen 4: Ancestral Roots (`app/roots/page.tsx`) | 6-digit PIN civilizational resolver, Web Speech TTS narration, interactive craft traditions | M1 | DONE |
| M6 | Screen 5: Curator Ingestion Studio (`app/add/page.tsx`) | Tactile 4-step ingestion wizard, atomic claim builder, live multi-persona preview tabs | M1 | DONE |
| M7 | E2E Verification & Forensic Audit | `npx tsc --noEmit`, `npm run build`, E2E test suites, mobile responsiveness (<768px), forensic integrity audit | M1-M6 | IN_PROGRESS |

## Code Layout
- `app/`
  - `layout.tsx` — Global root layout with Fraunces/Geist font declarations and header
  - `globals.css` — Stitch theme tokens, hairlines, paper surfaces, typography variables, spring micro-interactions
  - `page.tsx` — Screen 1: Collection & Gallery Showcase (Asymmetric Hero + Diagonal Masonry)
  - `artifact/[id]/page.tsx` — Screen 2: Artifact Detail Server Page
  - `explore/page.tsx` — Screen 3: Spatial Heritage Discovery Canvas
  - `roots/page.tsx` — Screen 4: Connect to Your Roots (PIN Code Resolver)
  - `add/page.tsx` — Screen 5: Curator Ingestion Studio Wizard
- `components/`
  - `Navbar.tsx` — Warm editorial top bar with tactile navigation and persona indicator
  - `Footer.tsx` — Tactile museum colophon and institutional acknowledgements
  - `ArtifactCard.tsx` — Editorial card with period badge, medium tag, hover depth
  - `ArtifactDetailClient.tsx` — Dual-column split screen with sticky plate and voice tabs
  - `LookCloserPins.tsx` — Hotspot observational pins on masterwork photographic plate
  - `FidelityReportSheet.tsx` — Slide-over atomic claim audit drawer
  - `SourceToggle.tsx` — 0ms verbatim source toggle
  - `IndiaMuseumMap.tsx` — Interactive India SVG map with patina pins and pan/zoom
  - `MuseumCard.tsx` — Spatial museum card with distance badge and hover link
  - `AiHistoricalBrief.tsx` — Cultural lineage narrative with Web Speech TTS audio
  - `CraftTraditions.tsx` — Interactive regional craft cards with technique steps
  - `PersonaSwitcher.tsx` — In-situ floating persona mode pill switcher
- `lib/`
  - `persona.tsx` — Persona context provider (Adult, Child, Specialist, Accessibility)
  - `roots.ts` — 6-digit postal PIN circle mappings, civilizational eras, Haversine distance
- `data/`
  - `artifacts.json` — 10 canonical Indian museum masterworks with claim ledgers
  - `variants.json` — 90+ precomputed audience adaptations and fidelity reports
  - `indian-museums.json` — 35+ verified institutions across India
- `DESIGN.md` — Authoritative Google Stitch design token specification

## Interface Contracts
### Persona State
- `usePersona()` provides `{ persona: PersonaId, setPersona: (p: PersonaId) => void }`
- `PersonaId`: `'adult' | 'child' | 'specialist' | 'accessibility'`

### Artifact Data Model
- `Artifact`: `{ id: string, title: string, subtitle?: string, period: string, date: string, medium: string, dimensions?: string, location: string, museum: string, imageUrl: string, creditLine?: string, description: string, claims: Claim[], lookCloser?: LookCloserItem[] }`

### Verification Contract
- `npm run build` and `npx tsc --noEmit` must pass with 0 errors.
- Mobile responsiveness: `min-h-[100dvh]` with 0 horizontal overflow at `<768px`.
