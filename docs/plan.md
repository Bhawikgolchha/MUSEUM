# Master Execution & Architecture Plan — Digital Muse

**Project:** Muse — Adaptive Museum Interpretation Layer  
**Target:** Hackathon MVP Prototype (Solo Sequential Build · 9 Phases)  
**Sources of Truth:**  
- **Product Requirements Document (`digital-muse-prd.md`):** Features, Personas, User Stories, and Demo Objectives.  
- **Design Document (`digital-muse-design-doc.md`):** Editorial Minimal Visual Direction, Palette, Typography, 11 Components, 4 Screens (S1–S4), and 3 Bottom Sheets (B1–B3).  
- **Technical Requirements Document (`digital-muse-trd.md`):** Next.js 15 App Router Monolith, Static JSON Data Layer, API Route Handlers, Anthropic LLM Integration, Zero Database/Auth.  
- **Specification Document (`digital-muse-spec.md`):** Claim Ledger Schema, Policy Block, Prompt Templates (T1–T8), and Fidelity Validation Contract.  
- **Implementation Plan (`digital-muse-implementation-plan.md`):** 9-Phase Sequential Step-by-Step Delivery.  
- **Frontend Design Skill (`D:\HermesAgents\frontend-design`):** Impeccable Craft, Stitch Semantic Tokens, Anti-Cliché Rules.

---

## 1. Executive Summary & Design North Star

**Digital Muse** is an audience-adaptive museum interpretation web application that dynamically re-voices a museum's canonical artifact descriptions for any reader (**Adult · Standard/Deep**, **Child (8–11)**, **Specialist/Scholar**, or **Screen-Reader/Accessibility User**) **without altering a single factual claim**.

### Design Philosophy: "The Museum's Paper, Not the App's Chrome"
- **High-Trust Editorial Aesthetics:** Warm paper ground (`#FAF8F4`), near-black ink typography (`#1A1A18`), patina teal accent (`#1F5F5B`), forest green verified badge (`#1B6B3A`), and red flagged badge (`#A62A21`).
- **Two Voices, Two Typefaces:** Museum's canonical text in **Source Serif 4**; Muse's adapted text and UI in **Inter**.
- **Permanent Transparency:** Mandatory attribution block, instant "Read the Original" segmented toggle, and per-claim **Fidelity Badge** backed by an atomic claim ledger.
- **Fail-Safe Trust Guarantee:** If any fidelity check fails or is contradicted, the UI immediately reverts to the museum's verbatim canonical text with a clear notice banner.

---

## 2. Technical Architecture & Tech Stack

```
                               ┌───────────────────────────────────────────────────────────┐
                               │                    Next.js 15 (App Router)                │
                               │                                                           │
┌─────────────────────────┐    │  app/layout.tsx (PersonaProvider, Header, PersonaChip)    │
│  Client (Mobile/Web)    │───►│   ├─ app/page.tsx (S1 Collection Grid)                   │
│  - Mobile-First         │    │   ├─ app/artifact/[id]/page.tsx (S2 Artifact Detail)     │
│  - WCAG 2.2 AA          │    │   ├─ app/add/page.tsx (S3 Add Artifact - Curator Demo)   │
│  - Touch targets ≥44px  │    │   └─ app/not-found.tsx (S4 Catch-all)                     │
└─────────────────────────┘    │                                                           │
                               │  Overlays & Sheets:                                       │
                               │   ├─ ContextSheet (B1: 3-tap persona selection)          │
                               │   ├─ FidelityReportSheet (B2: per-claim verification)     │
                               │   └─ SensitivityNotice (B3: flagged provenance barrier)   │
                               └─────────────────────────────┬─────────────────────────────┘
                                                             │
                                   ┌─────────────────────────┴─────────────────────────┐
                                   │                   Data & Server                   │
                                   ├───────────────────────────────────────────────────┤
                                   │  data/artifacts.json (6-8 Seeded Artifacts)       │
                                   │  data/variants.json  (32 Pre-generated Variants) │
                                   │                                                   │
                                   │  Route Handlers:                                  │
                                   │   ├─ POST /api/muse   (Claude T1-T5 generation)   │
                                   │   └─ POST /api/verify (Template 8 Claim Auditor)  │
                                   └───────────────────────────────────────────────────┘
```

### Core Technology Choices
1. **Frontend & Backend Monolith:** Next.js 15 (App Router) + React + TypeScript.
2. **Styling & Design System:** Tailwind CSS configured with exact Design Document tokens + Stitch MCP Design System (`assets/11411931403259598601` on project `9418788586089365215`).
3. **Typography:** Source Serif 4 (headings & canonical text) + Inter (UI & Muse text), 17px min body text.
4. **Data Persistence:** Static JSON (`data/artifacts.json` + `data/variants.json`), zero database.
5. **Session State:** React Context + `sessionStorage` for persona preferences.
6. **AI / LLM Engine:** Server-side Anthropic API (`temperature 0.3` for generation, `0.0` for verification).
7. **Offline/Zero-Latency Demo:** Batch generation script (`scripts/generate.ts`) commits all 32 variants for instant load.

---

## 3. Stitch MCP Server Integration

We have initialized Stitch Project **`9418788586089365215`** with the customized design system **`Digital Muse Editorial Minimal`**:
- **Palette Tokens:** `--paper: #FAF8F4`, `--paper-raised: #FFFFFF`, `--ink: #1A1A18`, `--ink-muted: #5C5A54`, `--accent: #1F5F5B`, `--verified: #1B6B3A`, `--flagged: #A62A21`, `--notice: #8A5A00`.
- **Typography Tokens:** Headline: `SOURCE_SERIF_4`, Body/Label: `INTER`.
- **Roundness:** `ROUND_EIGHT` (8px cards, 16px top sheets).
- **Core Screens to Generate / Align:**
  1. `S1 Collection Screen` (Mobile grid with persistent Persona Chip).
  2. `S2 Artifact Detail Screen` (Hero image, attribution, source toggle, explanation, look-closer, fidelity badge).
  3. `S3 Add Artifact Screen` (Curator paste form with claim ledger inputs).

---

## 4. Phased Execution Roadmap (9 Phases)

### Phase 1: Foundation & Design System Setup
- Initialize Next.js 15 + TypeScript + Tailwind CSS.
- Configure Google Fonts (`Source Serif 4`, `Inter`) and design tokens.
- Set up root layout with base styles, focus ring, and header shell.

### Phase 2: Content Data Layer & Claim Ledgers
- Define TypeScript schemas (`Artifact`, `Claim`, `Variant`, `FidelityReport`).
- Author `data/artifacts.json` with 6 seeded high-quality museum artifacts (e.g. *Dancing Girl of Mohenjo-daro*, *Chola Bronze Nataraja*, *Didarganj Yakshi*, *Pala Buddha*, *Sultanganj Buddha*, *Ashokan Lion Capital*).
- Hand-write 4–6 atomic claims per artifact with hedges (`circa`, `attributed_to`).
- Add image assets in `/public/images/`.
- Validate with `scripts/validate-data.ts`.

### Phase 3: Static UI Shell (S1 & S2)
- Build `ArtifactCard` component (4:3 aspect ratio, serif title, metadata line).
- Build S1 Collection Grid (`app/page.tsx`).
- Build S2 Artifact Page shell (`app/artifact/[id]/page.tsx`) with serif canonical text.
- Implement empty states and responsive breakpoints (320px, 640px, 1024px+).

### Phase 4: Persona Context System & Bottom Sheets
- Define persona model in `lib/personas.ts` (Adult / Child / Specialist / Accessibility).
- Build `PersonaProvider` with `sessionStorage` sync.
- Build accessible `Sheet` primitive (slide-up, focus-trap, ESC/backdrop dismiss).
- Build `PersonaChip` header component and `ContextSheet` (B1).

### Phase 5: Muse Generation Engine (`/api/muse`)
- Author `prompts/policy.md` (closed-world, no invention, exact numbers, hedge preservation).
- Author `prompts/persona-rules.json` (word counts, reading levels, structure per persona).
- Implement `app/api/muse/route.ts` with structured JSON output and fallback resilience.

### Phase 6: Variant Rendering, Attribution & Source Toggle
- Build `AttributionBlock` (always visible above text).
- Build `SourceToggle` (instant switch between Muse version and Museum original).
- Build `ExplanationBlock` (sans text for Muse) and `LookCloserList`.
- Centralize resolution in `lib/variants.ts`.

### Phase 7: Fidelity Verification Engine & Fallback
- Author `prompts/verify.md` (Template 8 factual auditor).
- Implement `app/api/verify/route.ts` (temperature 0).
- Build `FidelityBadge` (pass/fail/unverified) and `FidelityReportSheet` (B2).
- Build `NoticeBanner` and implement safe fallback to canonical text on contradiction.
- Rig repeatable forced-failure demo state.

### Phase 8: Accessibility Mode & Read-Aloud
- Implement section reordering when accessibility mode is enabled (Visual Description first).
- Add browser `speechSynthesis` in `ReadAloudButton`.
- Build `SensitivityNotice` interstitial (B3) for flagged objects.

### Phase 9: Pre-generation Script, Static Switch & Demo Hardening
- Build and run `scripts/generate.ts` to output complete `data/variants.json`.
- Switch `resolveVariant()` to static import with zero runtime API dependency for instant offline demo.
- Test 4-minute demo flow and rehearse fallback scenarios.

---

## 5. Verification Checklist

- [ ] All 6 seeded artifacts render accurately across all 4 personas.
- [ ] Source toggle switches instantly with 0ms network latency.
- [ ] Fidelity badge shows `✓ 6 of 6 museum facts preserved` with per-claim evidence.
- [ ] Forced failure demo turns badge red and smoothly degrades to the museum's verbatim text.
- [ ] Accessibility mode delivers visual description first and supports speech synthesis.
- [ ] Responsive across all screen sizes (320px to 1280px+).
