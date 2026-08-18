# Project: Indian Museum Directory, AI Doubt Chat & Spatial Fallback

## Architecture
- **Framework & Runtime**: Next.js 16.3.1 (App Router, Turbopack), React 19.2.8, TypeScript, Tailwind CSS v4.
- **Museum Data Layer**: `data/indian-museums.json` holding authentic museum records with strict schema validation.
- **Geospatial & Spatial Search**: `lib/museums.ts` with Haversine distance calculation, postal circle centroid resolution for 6-digit Indian PIN codes, and city hub matching.
- **AI Grounding & Chat Service**: `lib/openrouter.ts`, `app/api/museum-chat/route.ts` powered by OpenRouter API (`google/gemini-2.0-flash-exp:free`) with museum operational metadata context injection and offline deterministic fallback.
- **UI & Presentation Layer**:
  - `app/explore/page.tsx`: Spatial search, interactive map, list of cards, modal triggers.
  - `components/MuseumCard.tsx`: Museum card with "Ask Doubt" toggle button and embedded chat drawer.
  - `components/MuseumDoubtChat.tsx`: Expandable drawer with 5 preset doubt chips, chat stream, loading indicators, error recovery.
  - `components/NearestMuseumModal.tsx`: "Not Found" modal for non-matching PIN searches showing nearest museum with Haversine distance and 1-click centering CTA.
  - `components/NanoBananaMap.tsx`: Topographic India map with reactive markers and centering.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | F1: Museum Dataset Expansion | Expand `data/indian-museums.json` from 8 to 21 authentic Indian museums across diverse states/UTs with complete verified metadata (PIN, coordinates, fees, schedule, accessibility, description). | M1 | ORIGINAL_REQUEST §R2 |
| 2 | F2: Geospatial & PIN Centroid Resolver | Update `lib/museums.ts` with `POSTAL_PREFIX_CENTROIDS`, `findNearestMuseumForPincode()`, and expanded `KNOWN_INDIAN_LOCATIONS`. | M1 | ORIGINAL_REQUEST §R2, §R3 |
| 3 | F3: PIN Code Search & Fallback Modal UI | Build `components/NearestMuseumModal.tsx` showing "No Museum Directly in PIN [PIN]" with calculated Haversine distance and 1-click CTA. | M2 | ORIGINAL_REQUEST §R3 |
| 4 | F4: Explore Page PIN Search Integration | Update `app/explore/page.tsx` to detect 6-digit PIN code queries and trigger nearest fallback modal when 0 direct matches exist. | M2 | ORIGINAL_REQUEST §R3 |
| 5 | F5: Museum Doubt Chat API Route | Create `app/api/museum-chat/route.ts` using OpenRouter with grounded system prompt, error handling, and offline fallback. | M3 | ORIGINAL_REQUEST §R1 |
| 6 | F6: Inline Museum Doubt Chat Drawer | Create `components/MuseumDoubtChat.tsx` with 5 preset chips, chat history, and loading feedback. Integrate "Ask Doubt" toggle in `components/MuseumCard.tsx`. | M3 | ORIGINAL_REQUEST §R1 |
| 7 | F7: E2E Test Suite & Verification | Comprehensive 4-tier test runner verifying chat API, dataset expansion (>=18 museums), PIN fallback calculation, and full `npm run build` compilation. | M4 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Museum Dataset Expansion & Geospatial Resolver | Add 13 authentic Indian museums to `data/indian-museums.json` (total 21), add PIN prefix centroids & helper functions to `lib/museums.ts`. | None | PLANNED |
| 2 | M2: PIN Code Search & Nearest Museum Fallback Modal | Create `components/NearestMuseumModal.tsx`, integrate PIN query detection and fallback modal in `app/explore/page.tsx`. | M1 | PLANNED |
| 3 | M3: Museum Doubt Chat Box & OpenRouter Integration | Create `app/api/museum-chat/route.ts`, create `components/MuseumDoubtChat.tsx`, integrate into `components/MuseumCard.tsx`. | M1 | PLANNED |
| 4 | M4: Final System Verification & E2E Testing | Execute full test suite, verify `npm run build` with 0 errors, perform challenger and forensic audit checks. | M1, M2, M3 | PLANNED |

## Interface Contracts

### `data/indian-museums.json` ↔ `lib/museums.ts`
```typescript
export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Museum {
  id: string;
  name: string;
  vernacular_names?: Record<string, string | undefined>;
  address: string;
  city: string;
  state: string;
  pincode: string; // 6-digit string: /^[1-9][0-9]{5}$/
  coordinates: Coordinates;
  category: string;
  governance: string;
  opening_hours: {
    schedule: string;
    closed_on: string[];
    timings: string;
  };
  entry_fee: {
    is_free: boolean;
    domestic_inr: number;
    foreign_inr: number;
  };
  accessibility_features: string[];
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  thumbnail_url: string;
  gallery_urls: string[];
  description: string;
  artifact_count_approx: number;
  muse_collection_id?: string;
  featured_artifacts?: string[];
  source: string;
  last_updated: string;
}
```

### `lib/museums.ts` ↔ Nearest Fallback Modal & Explore Page
```typescript
export function findNearestMuseumForPincode(pincode: string): {
  nearestMuseum: MuseumWithDistance;
  distanceKm: number;
  searchedPin: string;
  regionName: string;
} | null;
```

### `components/MuseumCard.tsx` ↔ `app/api/museum-chat`
```typescript
// POST /api/museum-chat
export interface MuseumChatRequest {
  museumId: string;
  question: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface MuseumChatResponse {
  status: 'ok' | 'fallback' | 'error';
  reply: string;
  museumId: string;
  museumName: string;
}
```

## Code Layout
- `data/indian-museums.json`: Canonical repository of authentic Indian museum records.
- `lib/museums.ts`: Spatial queries, Haversine calculations, postal centroids, and data access.
- `lib/openrouter.ts`: OpenRouter API invocation client.
- `app/api/museum-chat/route.ts`: Museum docent chat route handler with metadata prompt grounding.
- `components/MuseumCard.tsx`: Museum card with doubt drawer toggle.
- `components/MuseumDoubtChat.tsx`: Inline expandable chat drawer with preset chips.
- `components/NearestMuseumModal.tsx`: Accessible modal for PIN code fallback.
- `app/explore/page.tsx`: Spatial discovery page orchestrating search, map, cards, and modals.
- `scripts/test-e2e-all.ts`: Opaque-box E2E test suite runner.
