# Original User Request

## Initial Request — 2026-08-18T11:14:50Z

# Complete Redesign of the Digital Muse Platform

Working directory: D:\Hackathon
Integrity mode: development

Perform a comprehensive visual, UX, and architectural frontend redesign of the Digital Muse Indian museum discovery and adaptive interpretation website using Nano Banana image generation references, Google Stitch semantic design system, and the skills in D:\HermesAgents\frontend-design.

## Visual Theme & Design Tokens
- **Theme Paradigm:** Editorial Heritage & Tactile Museum
- **Palette:** Warm Museum Paper (`#FAF8F4`), Pure Surface (`#FFFFFF`), Deep Charcoal Ink (`#18181B`), Muted Stone (`#71717A`), Ancient Bronze / Patina Accent (`#1F5F5B`, `#9C6644`), Whisper Hairlines (`rgba(24,24,27,0.08)`)
- **Typography:** Display Modern Serif (`Fraunces` / `Editorial New`) paired with high-clarity Grotesk (`Geist` / `Satoshi`)
- **Design Philosophy:** Gallery-airy density, generous negative space, spring-physics micro-interactions (`stiffness: 100, damping: 20`), and zero generic AI slop (no generic 3-card rows, no Inter font, no purple/blue glows, no pure `#000000` blacks).

## Requirements

### R1. Comprehensive Multi-Screen Redesign
- **1. Collection & Gallery Showcase (`app/page.tsx`)**:
  - Asymmetric Split Editorial Hero with inline visual punctuation and left-aligned narrative intro.
  - Floating persona mode switcher (Adult, Child, Specialist, Accessibility).
  - Staggered diagonal masonry grid displaying the masterworks with period badges, medium tags, and hover depth.
- **2. Artifact Detail & Factual Auditor (`app/artifact/[id]/page.tsx`)**:
  - Dual-column Exhibition Split-Screen: Sticky high-resolution photographic masterwork plate on left with observational "Look Closer" callouts; scrollable editorial interpretation panel on right.
  - 4-persona tabbed voice switcher with 0ms verbatim source toggle.
  - Slide-over Factual Fidelity Audit drawer displaying atomic claim checklist and verification status.
- **3. Spatial Heritage Discovery Canvas (`app/explore/page.tsx`)**:
  - Interactive India SVG heritage canvas with zoom/pan controls, custom patina pins, and live GPS "Near Me" proximity sorting.
  - Synchronized museum card list with search by city/PIN code and bidirectional card-pin hover highlights.
- **4. Connect to Your Roots (`app/roots/page.tsx`)**:
  - 6-digit postal PIN code ancestral lineage resolver mapping to civilizational eras (Chola, Mauryan, Gupta, etc.).
  - Personalized cultural narrative cards with Web Speech API audio narration.
  - Interactive regional craft traditions.
- **5. Curator Ingestion Studio (`app/add/page.tsx`)**:
  - Clean tactile multi-step form for ingesting new museum pieces, generating atomic claims, and live-previewing persona variations.

### R2. Nano Banana Image Art Direction & Visual Concept Pipeline
- Follow `taste-skill/skills/imagegen-frontend-web` to generate one separate horizontal reference image (16:9 / 21:9) per major section to guide exact visual tension, contrast, and layout balance.

### R3. Stitch Semantic Design System & Code Implementation
- Author `DESIGN.md` conforming to `taste-skill/skills/stitch-skill` and apply via Google Stitch MCP.
- Implement responsive, accessible, zero-slop UI components using Tailwind CSS v4 and React 19, adhering to `impeccable` and `apple-design` / `emil-design-eng` animation principles.

## Acceptance Criteria

### Visual & Architectural Quality
- [ ] No generic AI design patterns (no purple/blue glows, no 3-card equal columns, no default Inter fonts, no pure `#000000` blacks).
- [ ] Cohesive editorial typography pairing (Display Modern Serif + Body Grotesk).
- [ ] Responsive layouts with `min-h-[100dvh]` and no horizontal overflow on mobile (<768px).

### Code & Execution Integrity
- [ ] Next.js 15 App Router builds cleanly with zero errors (`npm run build`).
- [ ] TypeScript typecheck passes with zero errors (`npx tsc --noEmit`).
- [ ] All interactive flows (persona switching, source toggle, map pan/zoom, PIN code search, TTS narration) remain 100% functional.
- [ ] Factual fidelity claim auditor and fallback mechanisms remain unbroken.

## Follow-up — 2026-08-18T11:30:13Z

You are the Lead Project Orchestrator & Technical Implementer for the Complete Redesign of the Digital Muse Platform.
Your working directory is D:\Hackathon\.agents\orchestrator\
Project root is D:\Hackathon.
Authoritative user request is located at D:\Hackathon\.agents\ORIGINAL_REQUEST.md.

Execute the full visual, UX, and architectural frontend redesign of Digital Muse adhering to:
1. Editorial Heritage & Tactile Museum theme:
   - Palette: Warm Museum Paper (`#FAF8F4`), Pure Surface (`#FFFFFF`), Deep Charcoal Ink (`#18181B`), Muted Stone (`#71717A`), Ancient Bronze / Patina Accent (`#1F5F5B`, `#9C6644`), Whisper Hairlines (`rgba(24,24,27,0.08)`).
   - Typography: Display Modern Serif (`Fraunces` / `Editorial New`) paired with Grotesk (`Geist` / `Satoshi`).
   - Gallery-airy density, negative space, spring-physics micro-interactions (stiffness: 100, damping: 20), zero generic AI slop.
2. Requirements (R1-R3):
   - Screen 1 (`app/page.tsx`): Asymmetric Split Editorial Hero, inline visual punctuation, left-aligned narrative intro, floating persona mode switcher (Adult, Child, Specialist, Accessibility), staggered diagonal masonry grid with period badges, medium tags, hover depth.
   - Screen 2 (`app/artifact/[id]/page.tsx`): Dual-column Exhibition Split-Screen with sticky high-res photographic plate on left with observational "Look Closer" callouts; scrollable editorial panel on right; 4-persona voice switcher with 0ms verbatim source toggle; slide-over Factual Fidelity Audit drawer with atomic claim checklist and verification status.
   - Screen 3 (`app/explore/page.tsx`): Interactive India SVG canvas with zoom/pan controls, custom patina pins, live GPS "Near Me" proximity sorting, synchronized card list with city/PIN search and bidirectional card-pin hover highlights.
   - Screen 4 (`app/roots/page.tsx`): 6-digit postal PIN code ancestral lineage resolver mapping to civilizational eras (Chola, Mauryan, Gupta, etc.), personalized cultural narrative cards with Web Speech API audio narration, interactive regional craft traditions.
   - Screen 5 (`app/add/page.tsx`): Tactile multi-step form for ingesting new museum pieces, generating atomic claims, and live-previewing persona variations.
   - Nano Banana Image Art Direction references.
   - Google Stitch `DESIGN.md` token spec and Tailwind CSS v4 / React 19 implementation.
3. Verification:
   - Run `npx tsc --noEmit` and `npm run build` and ensure 0 errors.
   - Test all interactive flows (persona switcher, source toggle, map pan/zoom, PIN search, TTS narration, claim auditor).
   - Ensure min-h-[100dvh] and no horizontal overflow on mobile (<768px).
4. Maintain `progress.md` and `BRIEFING.md` in `D:\Hackathon\.agents\orchestrator\`.
5. Send your full completion and verification report back to Sentinel via send_message when complete.
