# Digital Muse — Verifiable Adaptive Museum Interpretation & Spatial Discovery

> **Same facts. Re-voiced for whoever is reading.**

**Digital Muse** is an audience-adaptive museum interpretation and cultural discovery platform. It takes canonical museum descriptions and adapts vocabulary, depth, and tone for **Children (8–11)**, **Scholars & Specialists**, **Casual Adults**, and **Accessibility / Screen-Reader Users**—backed by a mathematical, claim-level factual fidelity guarantee with automatic fallback to the museum's verbatim words if any contradiction is detected.

---

## Key Features

### 🏛️ 1. Verifiable Adaptive Interpretation (Digital Muse Engine)
- **4 Persona Modes:**
  - **Adult (General / Quick / Deep):** Engaging, conversational, and context-rich interpretation.
  - **Child (8–11):** High-energy, wonder-driven, grade 4 vocabulary with spotting prompts.
  - **Specialist / Scholar:** Rigorous historiographical analysis, formal/material typology, and preserved epistemic hedges (*circa*, *attributed to*, *suggests*).
  - **Accessibility Mode:** Visual description first, object-relative spatial framing, and browser speech synthesis narration.
- **Factual Fidelity Auditor:** Every claim from the curator's atomic fact checklist is audited against the adapted text. If a claim is contradicted, the system automatically engages a safe fallback to the museum's verbatim original words.
- **Source Toggle:** 0ms instant toggle between the *Muse Version* and verbatim *Museum Original*.

### 🗺️ 2. Find Museums by Area (India Spatial Heritage Canvas)
- **Multi-Modal Search:** Discover museums across India by city (*Delhi*, *Chennai*, *Kolkata*, *Mumbai*, *Patna*, *Varanasi*, *Bengaluru*, *Hyderabad*), landmark, or 6-digit postal PIN code.
- **HTML5 Geolocation ("Near Me"):** Instant proximity sorting with customizable radius ($5\text{ km}$, $10\text{ km}$, $25\text{ km}$, $50\text{ km}$, $100\text{ km}$).
- **Interactive Heritage Map:** High-fidelity SVG vector map of India with calibrated coordinates, pan/zoom controls, custom heritage pins, and bidirectional card-pin synchronization.

### 🌿 3. Connect to Your Roots (Living Lineage Discovery)
- **PIN Code Lineage:** Maps any Indian PIN code to its ancestral postal circle and civilizational era (*Chola/Pandya*, *Mauryan/Magadha*, *Indus-Saraswati*, *Gupta Golden Age*, *Maratha*, *Pala-Sena*, *Kakatiya*, *Vijayanagara*).
- **Personalized Cultural Narrative:** Generates an emotional heritage connection story with regional craft traditions and masterworks from that soil.
- **Audio Guide Narration:** Web Speech API integration to listen aloud to your heritage story.

### 📸 4. High-End Museum Photography
- Uses authentic photographic plates generated for all 6 artifact masterworks (*Dancing Girl of Mohenjo-daro*, *Chola Bronze Nataraja*, *Didarganj Yakshi*, *Lion Capital of Ashoka*, *Standing Buddha of Sarnath*, and *Sultanganj Bronze Buddha*).

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15 (App Router) + TypeScript + React 19
- **Styling & Theme:** Vanilla Tailwind CSS + Custom Editorial Minimal Tokens (`#FAF8F4` paper ground, `#1A1A18` ink text, `#1F5F5B` patina accent, `#1B6B3A` verified green, `#A62A21` flagged red)
- **Typography:** Source Serif 4 (Canonical Museum Voice) + Inter (Muse Adapted Voice & UI)
- **AI Models:** OpenRouter Free Tier (`google/gemini-2.0-flash-exp:free`, `openrouter/auto`) + Anthropic Claude 3.5 Sonnet + 54 Precomputed Offline Fallbacks
- **Backend / Database:** Supabase PostgreSQL Schema + Local Fallback
- **Spatial Map Engine:** India Spatial Heritage Canvas (SVG Vector Engine)

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/pressleypius2007-wq/null-theo.git
cd null-theo/muse
npm install
```

### 2. Configure Environment (Optional)
Create `muse/.env.local`:
```ini
# OpenRouter Free API Key (Optional for live generation):
OPENROUTER_API_KEY=your_key_here

# Supabase (Optional for persistent user roots):
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
*(Note: The app runs 100% offline out-of-the-box with 54 precomputed verified variants if no keys are provided!)*

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Repository Structure

```
.
├── digital-muse-prd.md                  # Product Requirements Document
├── digital-muse-design-doc.md            # Design & UI/UX Document
├── digital-muse-trd.md                   # Technical Requirements Document
├── digital-muse-spec.md                  # Comprehensive Engine Specification
├── find-museums-by-area-spec.md          # Spatial Discovery Specification
├── plan.md                               # 9-Phase Master Execution Plan
└── muse/                                 # Next.js Application
    ├── app/
    │   ├── page.tsx                      # S1 Collection Screen
    │   ├── explore/page.tsx              # 🗺️ Find Museums by Area
    │   ├── roots/page.tsx                # 🌿 Connect to Your Roots
    │   ├── add/page.tsx                  # S3 Curator Ingest Screen
    │   ├── artifact/[id]/page.tsx        # S2 Artifact Detail Screen
    │   └── api/                          # Next.js API Routes (/api/muse, /api/verify)
    ├── components/                       # 14 Reusable UI Components
    ├── data/                             # Seeded Museum & Artifact Datasets
    ├── lib/                              # Business Logic, Personas, OpenRouter, Supabase
    ├── prompts/                          # Verification Prompts & Policy Blocks
    ├── public/images/                    # High-Resolution Masterwork Photography
    ├── scripts/                          # Data Validation & Batch Generator Scripts
    └── supabase/schema.sql               # Supabase Database Migrations
```
