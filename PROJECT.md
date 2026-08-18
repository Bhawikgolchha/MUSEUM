# Project: AI-Powered Historical Briefing Engine (PIN Code Grounded)

## Architecture
- **Backend Service Layer (`app/api/pincode-history/route.ts`)**:
  - `GET` and `POST` handlers accepting 6-digit Indian PIN codes.
  - Regex validation `/^[1-9][0-9]{5}$/` returning HTTP 400 with `{ status: 'error', error: 'INVALID_PINCODE_FORMAT' }` on malformed inputs.
  - Geocoding & hierarchy resolution via `lib/pincodes.ts`, `lib/services/geocoding.ts`, `lib/roots.ts`, and `data/indian-museums.json`.
  - LLM Grounding pipeline via `lib/openrouter.ts` using model `openrouter/free` with JSON response mode and deterministic offline fallback.
  - In-memory LRU cache (<10ms repeat responses, ≤20ms warm latency, verified at ~0.05ms).
- **Frontend Presentation Layer (`app/roots/page.tsx`, `app/explore/page.tsx`, `components/`)**:
  - `/roots` page: `<AiHistoricalBrief>` section below search bar with 3-part structured card (*Ancient Foundations*, *Living Traditions*, *Sacred Landmarks*), badges for key dynasties, traditional crafts, and notable monuments, shimmer skeleton loading, and Web Speech API narration button.
  - `/explore` page: `<RegionalHistoricalContextBanner>` expandable banner above museum cards synchronized with spatial distances.
  - Shared audio narration: Reusable Web Speech API integration (`components/ReadAloudButton.tsx`).
- **E2E Testing Harness (`tests/e2e/e2e_pincode_history_runner.ts`)**:
  - 5-Tier requirement-driven opaque-box verification suite (Feature coverage, Boundary/Corner, Cross-Feature/Performance, Real-World scenarios, Adversarial Hardening) passing 62/62 (100%).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | PIN Code Regex Validation | Strict validation of 6-digit PIN code `/^[1-9][0-9]{5}$/`, rejects malformed with HTTP 400 `INVALID_PINCODE_FORMAT` | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Geographic & Hierarchy Resolution | Resolves district, state, postal circle, and cultural anchors from `lib/pincodes.ts`, `lib/roots.ts`, `data/indian-museums.json` | M1 | ORIGINAL_REQUEST §R1 |
| 3 | OpenRouter AI Synthesis | Invokes OpenRouter `openrouter/free` with grounded prompt and structured JSON schema, with deterministic offline fallback | M1 | ORIGINAL_REQUEST §R1 |
| 4 | In-Memory Performance Caching | Fast in-memory LRU cache ensuring repeat queries respond in <10ms (SLA ≤20ms) | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Structured API Response Schema | JSON output with `pincode`, `location_name`, `state`, `district`, `postal_circle`, `historical_brief`, `key_dynasties`, `traditional_crafts`, `notable_monuments` | M1 | ORIGINAL_REQUEST §R1 |
| 6 | 3-Part AI Brief Card on /roots | Renders 3 sections (*Ancient Foundations*, *Living Traditions*, *Sacred Landmarks*) with badges on `/roots` | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Loading Skeletons & Error Recovery on /roots | Shimmer loading skeletons during AI fetch and retry/error state handling on `/roots` | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Web Speech Audio Narration on /roots | "Read Aloud" button narrating the structured brief with speech synthesis and playing indicators | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Regional Historical Context Banner on /explore | Expandable historical banner above museum stream on `/explore` when a valid 6-digit PIN is entered | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Spatial Sync with Explore Distance Cards & Modals | Harmonizes banner with museum distance sorting and nearest-fallback modals | M3 | ORIGINAL_REQUEST §R3 |
| 11 | Full E2E Test Suite (Tiers 1-4) & Adversarial Hardening (Tier 5) | Comprehensive opaque-box and white-box test verification passing 100% | M4 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Historical Brief API | Build `app/api/pincode-history/route.ts` with validation, hierarchy resolution, OpenRouter grounding, caching, and fallback | none | DONE |
| M2 | Roots Page AI Brief & Narration | Build `<AiHistoricalBrief>` component in `components/AiHistoricalBrief.tsx` and integrate into `app/roots/page.tsx` | M1 | DONE |
| M3 | Explore Page Historical Banner | Build `<RegionalHistoricalContextBanner>` component in `components/RegionalHistoricalContextBanner.tsx` and integrate into `app/explore/page.tsx` | M1 | DONE |
| M4 | E2E Testing & Adversarial Hardening | Verify 100% pass on Tiers 1-5, Reviewers, Challengers, and Forensic Auditor verification | M1, M2, M3 | DONE |

## Interface Contracts
### Client ↔ `/api/pincode-history`
- **Request**:
  - `GET /api/pincode-history?pincode=<6-digit-pin>`
  - `POST /api/pincode-history` with JSON body `{ "pincode": "<6-digit-pin>" }`
- **Response (HTTP 200 OK)**:
  ```json
  {
    "status": "success",
    "pincode": "110001",
    "location_name": "New Delhi GPO (Central Delhi)",
    "state": "Delhi",
    "district": "Central Delhi",
    "postal_circle": "Northern Region",
    "historical_brief": {
      "ancient_foundations": "...",
      "living_culture_crafts": "...",
      "famous_lore_landmarks": "...",
      "summary_one_liner": "..."
    },
    "key_dynasties": ["Mughals", "Tomaras", "Chauhans"],
    "traditional_crafts": ["Zari & Zardozi Embroidery", "Meenakari", "Ivory Carving"],
    "notable_monuments": ["Red Fort", "Qutub Minar", "Humayun's Tomb"],
    "cached": false,
    "source": "openrouter_ai"
  }
  ```
- **Error Response (HTTP 400 Bad Request)**:
  ```json
  {
    "status": "error",
    "error": "INVALID_PINCODE_FORMAT",
    "message": "PIN code must be a valid 6-digit Indian postal code (/^[1-9][0-9]{5}$/)"
  }
  ```

## Code Layout
- `app/api/pincode-history/route.ts` - Backend endpoint (Worker M1)
- `components/AiHistoricalBrief.tsx` - Roots UI card component (Worker M2)
- `components/RegionalHistoricalContextBanner.tsx` - Explore banner component (Worker M3)
- `app/roots/page.tsx` - Roots page integration (Worker M2)
- `app/explore/page.tsx` - Explore page integration (Worker M3)
- `tests/e2e/e2e_pincode_history_runner.ts` - E2E test runner (Test Writer M4)
