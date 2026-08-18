# Feature Specification & Implementation Plan: "Find Museums by Area" (India)

**Feature Name:** Find Museums by Area  
**Target Region:** India (Domestic Geographic Scope)  
**Visuals & Map Provider:** NanoBanana  
**Status:** Ready for Implementation  

---

## 1. Purpose and Goals

The "Find Museums by Area" feature enables users to discover, filter, and explore museums across India by geographical area, city, state, pin code, or live user geolocation. The goal is to provide a low-latency (<250ms search response), visually immersive, map-synchronized exploration interface that connects cultural heritage enthusiasts, students, families, and researchers with relevant institutions.

### Key Success Metrics
- **Discovery Accuracy:** ≥98% accurate mapping of Indian museum geographic boundaries and coordinates.
- **Search Latency:** p95 latency <300ms for spatial bounding box/radius queries.
- **Engagement:** ≥40% of users searching an area interact with either a map pin or museum details card.
- **Resilience:** 100% graceful degradation when map/visual keys are absent or network is degraded.

---

## 2. User Personas and User Stories

### Persona 1: Rajesh, 32 — Domestic Cultural Tourist
- *Profile:* Travelling with family to a new Indian city (e.g., Jaipur, Kolkata); seeking heritage sites within a 10 km radius.
- *User Stories:*
  1. **Story 1.1:** As a tourist, I want to type a city or landmark name (e.g., "Fort Kochi, Kerala") and see all nearby museums on an interactive map, so that I can plan my day's itinerary efficiently.
     - *Acceptance Criteria:* Autocomplete resolves "Fort Kochi", centers the map within 1.5 seconds, and shows all museums within the default 10 km radius.
  2. **Story 1.2:** As a tourist, I want to filter by "Open Today" and "Ticketed/Free entry", so that I don't travel to a closed institution.
     - *Acceptance Criteria:* Filtering hides museums closed on the current day of the week (e.g., standard Monday closures across ASI sites).
  3. **Story 1.3:** As a tourist, I want to tap a map marker and see immediate directions, opening hours, and entry fees in a bottom card/modal.
     - *Acceptance Criteria:* Marker tap highlights the corresponding list item and opens a summary card with address, hours, and navigation link.

---

### Persona 2: Ananya, 20 — University History Student
- *Profile:* Researching specific archaeological periods, numismatics, or textiles across state museums in India.
- *User Stories:*
  1. **Story 2.1:** As a student, I want to filter museums by category (e.g., "Archaeology", "Natural History", "Textiles & Crafts") across an entire state (e.g., "Tamil Nadu").
     - *Acceptance Criteria:* State-level search returns all matching category institutions categorized with verified tag badges.
  2. **Story 2.2:** As a student, I want to see detailed collection overviews and canonical research links in the museum detail modal.
     - *Acceptance Criteria:* Detail view provides institutional affiliation (e.g., ASI, State Govt, Trust), website link, and verified collection tags.

---

### Persona 3: Vikram, 45 — Parent / Weekend Explorer
- *Profile:* Resident of a metro area (e.g., Bengaluru, Mumbai, NCR) looking for child-friendly or interactive science museums within 15–25 km.
- *User Stories:*
  1. **Story 3.1:** As a parent, I want to search using my device's current location with a customizable radius slider (5 km, 10 km, 25 km, 50 km).
     - *Acceptance Criteria:* One-tap "Near Me" button requests browser geolocation, centers map on user coordinates, and applies the selected radius.
  2. **Story 3.2:** As a parent, I want to filter for wheelchair-accessible and child-friendly amenities (parking, cafeteria, restrooms).
     - *Acceptance Criteria:* Selecting the accessibility toggle filters out non-compliant or unverified venues with clear indicator badges.

---

### Persona 4: Dr. Sharma, 54 — Museum Curator & Administrator
- *Profile:* Regional cultural officer reviewing geographic coverage and data completeness for regional institutions.
- *User Stories:*
  1. **Story 4.1:** As a curator, I want to filter by administrative category (National, State, Private, Municipal, University), so that I can inspect institutional distribution.
     - *Acceptance Criteria:* Filter facet reflects administrative ownership accurately from the canonical dataset.

---

## 3. Functional Requirements

### 3.1 Spatial & Text Search
- **Area Search Input:** Autocomplete input supporting:
  - Cities & Towns (e.g., "Varanasi", "Mysuru", "Bhopal")
  - States & UTs (e.g., "Maharashtra", "Odisha", "Ladakh")
  - Landmarks / POIs (e.g., "Red Fort, Delhi", "Marine Drive, Mumbai")
  - 6-digit Indian Postal PIN Codes (e.g., "110001", "700016")
- **Geolocation ("Near Me"):** HTML5 Geolocation API integration with fallback to regional centers.
- **Customizable Search Radius:** Selectable distance filter: `5 km`, `10 km` (default for city), `25 km`, `50 km`, `100 km` (for regional/state view).
- **Region Locking:** Hard geographic boundary lock restricting queries and coordinate bounds to the territory of India (`8.4° N to 37.6° N`, `68.7° E to 97.25° E`).

### 3.2 Filtering Facets
| Filter Type | Options / Values | Default |
|---|---|---|
| **Category** | All, Archaeology, Art & Sculpture, Science & Technology, Natural History, Maritime & Military, Textiles & Crafts, Memorial & Historic House | All |
| **Governance / Type** | All, National / ASI, State Government, Private / Trust, University, Municipal | All |
| **Operating Status** | All, Open Today, Free Entry Only | All |
| **Accessibility** | Wheelchair Accessible, Braille Signage, Tactile Tours, Audio Guides | None (Optional toggle) |
| **Radius** | 5 km, 10 km, 25 km, 50 km, 100 km | 10 km |

### 3.3 UI / UX Layout & Synchronization
- **Dual-Pane Split View:**
  - *Desktop (≥1025px):* 55% NanoBanana Interactive Map (left/top) + 45% Scrollable Museum Result Cards (right).
  - *Mobile (<1025px):* Full-width NanoBanana Map with draggable bottom sheet or segmented "Map / List" toggle.
- **Bidirectional Map-List Sync:**
  - Hovering / tapping a card highlights and bounces the map marker.
  - Tapping a map marker scrolls the corresponding card into view and opens the NanoBanana marker popup.
  - Pan / Zoom on map updates the search results when "Search as I move the map" is toggled on.
- **Marker Clustering:** Dynamic clustering for dense urban areas (e.g., Central Delhi, Kolkata Heritage District, South Mumbai).
- **Museum Detail Modal / Drawer:** Shows high-resolution NanoBanana thumbnail gallery, address, contact, hours table, accessibility audit, and direct link to the Digital Muse interpretation engine.

---

## 4. Data Sources and API Requirements

### 4.1 Data Sources Comparison
| Source | Coverage for India | Pros | Cons | Recommendation |
|---|---|---|---|---|
| **OpenStreetMap (OSM) / Overpass** | High for major cities | Open license (ODbL), precise lat/lon, community maintained | Inconsistent opening hours, missing vernacular names | **Primary Spatial Source** |
| **Wikidata & Wikipedia** | High for notable institutions | Rich descriptions, multilingual labels (Hindi, Tamil, etc.), CC-BY-SA | Unstructured metadata, sporadic hours | **Enrichment & Descriptions** |
| **Ministry of Culture / ASI Open Data** | Authoritative for national sites | 100% verified provenance, ticketing, ownership | Limited API availability, static PDF exports | **Seeded Baseline Registry** |
| **Curated Local JSON Dataset** | Complete control for MVP | Zero runtime latency, zero API rate-limits, deterministic QA | Requires periodic sync scripts | **Recommended Core for Prototype/MVP** |

---

### 4.2 Canonical Museum Data Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MuseumRecord",
  "type": "object",
  "required": [
    "id",
    "name",
    "city",
    "state",
    "pincode",
    "coordinates",
    "category",
    "governance",
    "description",
    "thumbnail_url",
    "source",
    "last_updated"
  ],
  "properties": {
    "id": { "type": "string", "pattern": "^mus-[a-z0-9-]+$" },
    "name": { "type": "string", "minLength": 3 },
    "vernacular_names": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    },
    "address": { "type": "string" },
    "city": { "type": "string" },
    "state": { "type": "string" },
    "pincode": { "type": "string", "pattern": "^[1-9][0-9]{5}$" },
    "coordinates": {
      "type": "object",
      "required": ["lat", "lon"],
      "properties": {
        "lat": { "type": "number", "minimum": 8.0, "maximum": 38.0 },
        "lon": { "type": "number", "minimum": 68.0, "maximum": 98.0 }
      }
    },
    "category": {
      "type": "string",
      "enum": [
        "archaeology",
        "art_sculpture",
        "science_technology",
        "natural_history",
        "maritime_military",
        "textiles_crafts",
        "memorial_historic",
        "multidisciplinary"
      ]
    },
    "governance": {
      "type": "string",
      "enum": ["national_asi", "state_government", "private_trust", "university", "municipal"]
    },
    "opening_hours": {
      "type": "object",
      "properties": {
        "schedule": { "type": "string" },
        "closed_on": { "type": "array", "items": { "type": "string" } },
        "timings": { "type": "string" }
      }
    },
    "entry_fee": {
      "type": "object",
      "properties": {
        "is_free": { "type": "boolean" },
        "domestic_inr": { "type": "number" },
        "foreign_inr": { "type": "number" }
      }
    },
    "accessibility_features": {
      "type": "array",
      "items": { "type": "string" }
    },
    "contact": {
      "type": "object",
      "properties": {
        "phone": { "type": "string" },
        "email": { "type": "string" },
        "website": { "type": "string", "format": "uri" }
      }
    },
    "thumbnail_url": { "type": "string" },
    "gallery_urls": { "type": "array", "items": { "type": "string" } },
    "description": { "type": "string", "maxLength": 1000 },
    "artifact_count_approx": { "type": "number" },
    "muse_collection_id": { "type": "string" },
    "source": { "type": "string" },
    "last_updated": { "type": "string", "format": "date-time" }
  }
}
```

---

## 5. Search/Filter Behavior & Ranking

### 5.1 End-to-End Search Pipeline
```
[User Input: Query / "Near Me"]
             ↓
[1. Geocoder / Bounding Box Resolver (India Locked)]
             ↓ (lat, lon, zoom_level)
[2. Spatial Query / Haversine Distance Calculation]
             ↓ (Candidate set within radius)
[3. Facet Filtering (Category, Open Today, Accessibility)]
             ↓
[4. Ranking & Tie-Breaking Engine]
             ↓
[5. Paginated JSON Result + NanoBanana Marker Layer]
```

### 5.2 Haversine Distance Formula
Given user location $(\phi_1, \lambda_1)$ and museum location $(\phi_2, \lambda_2)$:
\[
d = 2R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)
\]
Where $R = 6371 \text{ km}$.

### 5.3 Ranking & Scoring Algorithm
Every candidate museum receives a composite relevance score $S$:
\[
S = W_d \cdot (1 - \frac{d}{r}) + W_c \cdot C_{score} + W_p \cdot P_{score} + W_m \cdot M_{exact}
\]
- $W_d = 0.45$: Distance proximity weight ($d$ = distance, $r$ = search radius).
- $W_c = 0.25$: Data completeness weight (verified photos, hours, phone, accessibility).
- $W_p = 0.20$: Institutional significance / artifact richness score.
- $W_m = 0.10$: Exact keyword match in title or category.

### 5.4 Tie-Breakers & Default Radii
- **Default Radii:**
  - Metro / City search: **10 km**
  - Landmark / Locality search: **5 km**
  - State search: **100 km**
- **Tie-Breaker Hierarchy:**
  1. Shorter geographical distance ($d$)
  2. Open today status
  3. Higher metadata completeness score
  4. Lexicographical title sort

---

## 6. Visuals Integration with NanoBanana

NanoBanana acts as the high-performance map canvas, spatial cluster visualizer, and thumbnail gallery coordinator.

### 6.1 NanoBanana Configuration & Inputs
```typescript
interface NanoBananaMapConfig {
  apiKey?: string;
  containerId: string;
  center: [number, number]; // [lat, lon] e.g. [28.6139, 77.2090]
  zoom: number;             // Default 11 for city, 6 for national
  minZoom: 4;               // India country boundary clamp
  maxZoom: 18;
  maxBounds: [[6.5, 67.0], [38.5, 98.5]]; // India Bounding Box
  theme: 'museum-paper' | 'editorial-light';
  clusterRadius: 50;
  markers: NanoBananaMarkerItem[];
}

interface NanoBananaMarkerItem {
  id: string;
  coordinates: [number, number];
  title: string;
  category: string;
  thumbnailUrl: string;
  popupHtml: string;
  isActive?: boolean;
}
```

### 6.2 Layout Architecture
- **Split Screen Layout:**
  - NanoBanana map renders with smooth inertial zooming and custom heritage pin markers (using `--accent: #1F5F5B` and `--verified: #1B6B3A`).
  - Active marker displays animated pulse ring with thumbnail mini-preview.
- **NanoBanana Gallery Modal:**
  - Inside the museum detail modal, NanoBanana renders a responsive masonry/carousel gallery with progressive WebP image loading and curator attribution badges.
- **Graceful Fallback:**
  - If `NANOBANANA_API_KEY` is missing or the CDN fails, the UI automatically falls back to an **interactive SVG schematic map** and standard CSS grid list without crashing.

---

## 7. Performance, Caching, and Scalability

### 7.1 Architecture Breakdown
- **Client-Side Spatial Indexing (MVP):**
  - The curated Indian museum registry (~150–500 curated museums, ~250 KB uncompressed JSON, ~45 KB gzip) is imported statically or fetched once on page load.
  - Spatial filtering and Haversine distance computations execute client-side in **< 10ms**, avoiding round-trip server latency.
- **Server-Side Scaling (Production):**
  - Next.js Route Handler `GET /api/museums/search?lat=...&lon=...&radius=...&category=...`
  - In-memory spatial index (R-tree or PostGIS `ST_DWithin` spatial query indexed via GIST).
- **Caching Strategy:**
  - `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800` on museum dataset.
  - Geocoding cache: Map query strings (e.g. "Jaipur") to coordinates in an LRU memory cache.
- **Offline & Low-Bandwidth Resilience:**
  - Pre-cached static museum directory in ServiceWorker/LocalStorage.
  - SVG placeholders and low-res blur-up thumbnails for mobile devices on 3G/4G networks.

---

## 8. Security, API Key Management, and Privacy

### 8.1 Key Configuration
- **Server Keys:** Stored in environment variables (`GEOCODING_API_KEY`, `PLACES_API_KEY`) without client exposure.
- **Client Visual Keys:** `NEXT_PUBLIC_NANOBANANA_KEY` restricted by HTTP Referrer / Domain whitelist (e.g., `*.museum-muse.app`, `localhost:3000`).

### 8.2 Privacy & Geolocation Protection
- **No Coordinate Logging:** Visitor GPS coordinates are used purely in-memory for distance sorting and are never logged, stored in databases, or sent to analytics trackers.
- **Coarse Resolution Fallback:** Users can search by entering city/neighborhood names without granting device GPS permissions.
- **Strict HTTPS:** All communications encrypted via TLS 1.3.

---

## 9. Error Handling and Edge Cases

| Failure Scenario | HTTP / Internal Code | Fallback Behavior & User Message |
|---|---|---|
| **No museums in search radius** | `200 OK` (empty results) | "No museums found within [X] km of [Area]. Would you like to expand radius to 50 km or explore all museums in [State]?" |
| **Geocoding query unresolved** | `404 / GEO_NOT_FOUND` | "We couldn't locate that specific area. Please try searching for a city (e.g., 'Kochi', 'Patna') or postal PIN code." |
| **User denies Geolocation** | `CLIENT_GEO_DENIED` | Graceful prompt: "Location access disabled. Enter your city or PIN code to find nearby museums." |
| **NanoBanana key missing / network drop** | `MAP_FALLBACK` | Displays clean schematic card list with distance badges and static SVG location indicators. |
| **Coordinates outside India** | `400 OUT_OF_BOUNDS` | "Discovery is currently limited to museums across India. Explore our curated collections in New Delhi, Kolkata, Chennai, and Mumbai." |

---

## 10. Testing Plan

### 10.1 Automated Unit & Integration Tests
- **Spatial Haversine Tests:** Assert exact kilometer calculations between known Indian landmarks (e.g., National Museum Delhi to Red Fort = ~5.4 km).
- **Filter Tests:** Assert filtering for `category=archaeology` and `open_today=true` returns only matching subsets.
- **Schema Validation:** Validate 100% of museum records against `MuseumRecord` JSON schema using Ajv / Zod.

### 10.2 Manual QA Checklist & Test Matrix
- [ ] **Test Case 1 (City Search):** Search "Kolkata, West Bengal" -> Verify Indian Museum and Victoria Memorial appear within 5 km.
- [ ] **Test Case 2 (PIN Code Search):** Search "110001" -> Verify National Museum, Crafts Museum, and National Gallery of Modern Art appear.
- [ ] **Test Case 3 (Radius Expansion):** Change radius from 5 km to 25 km in Bengaluru -> Verify HAL Heritage Centre and NIMHANS Brain Museum populate.
- [ ] **Test Case 4 (Accessibility Filter):** Toggle "Wheelchair Accessible" -> Verify filtered badges update and non-accessible venues are hidden.
- [ ] **Test Case 5 (Cross-Device Responsiveness):** Test on 320px mobile viewport, iPad portrait, and 1440px desktop.

---

## 11. Deployment Checklist and Rollout

1. **Dataset Seeding:** Bundle `data/indian-museums.json` containing verified records across major Indian cultural hubs.
2. **Environment Variables Configuration:**
   - `NEXT_PUBLIC_NANOBANANA_KEY=nb_live_xxx` (or left blank for offline fallback mode).
   - `GEOCODING_API_KEY=geo_xxx` (optional external geocoding provider).
3. **Feature Flagging:** Feature flag `ENABLE_MUSEUM_GEO_DISCOVERY=true`.
4. **Monitoring & Latency Alarms:**
   - Alert if `/api/museums/search` error rate > 1%.
   - Monitor p95 latency threshold (< 300ms).

---

## 12. Example Requests and Responses

### 12.1 Configuration Snippet (Environment Format)
```ini
# Environment Configuration (.env.local)
NEXT_PUBLIC_NANOBANANA_KEY=nb_live_sample_key_ind_2026
NEXT_PUBLIC_DEFAULT_SEARCH_REGION=IN
GEOCODING_API_KEY=geo_provider_secure_key
ENABLE_MUSEUM_GEO_DISCOVERY=true
```

---

### 12.2 Example Search Request
`GET /api/museums/search?area=Chennai,%20Tamil%20Nadu&radius=15&category=all&page=1&limit=3`

---

### 12.3 Example JSON Response (3 Sample Records)
```json
{
  "status": "success",
  "query": {
    "area": "Chennai, Tamil Nadu",
    "resolved_coordinates": { "lat": 13.0827, "lon": 80.2707 },
    "radius_km": 15,
    "applied_filters": { "category": "all", "open_today": false }
  },
  "pagination": {
    "total_results": 14,
    "page": 1,
    "limit": 3,
    "total_pages": 5
  },
  "data": [
    {
      "id": "mus-in-che-001",
      "name": "Government Museum Chennai (Egmore)",
      "vernacular_names": {
        "ta": "அரசு அருங்காட்சியகம் சென்னை"
      },
      "address": "Pantheon Road, Egmore",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600008",
      "coordinates": {
        "lat": 13.0694,
        "lon": 80.2569
      },
      "distance_km": 2.1,
      "category": "archaeology",
      "governance": "state_government",
      "opening_hours": {
        "schedule": "09:30 - 17:00",
        "closed_on": ["Friday", "National Holidays"],
        "timings": "Open 6 days a week"
      },
      "entry_fee": {
        "is_free": false,
        "domestic_inr": 15,
        "foreign_inr": 250
      },
      "accessibility_features": [
        "Wheelchair Accessible Ground Floor",
        "Braille Labeling in Bronze Gallery",
        "Audio Guides"
      ],
      "contact": {
        "phone": "+91 44 2819 3238",
        "website": "https://govtmuseumchennai.org"
      },
      "thumbnail_url": "/images/museums/chennai-egmore.jpg",
      "gallery_urls": [
        "/images/museums/chennai-bronze-gallery.jpg",
        "/images/museums/chennai-amravati-hall.jpg"
      ],
      "description": "Established in 1851, it is India's second oldest museum, globally renowned for its world-class Chola Bronze gallery and Amaravati Buddhist marble sculptures.",
      "artifact_count_approx": 45000,
      "muse_collection_id": "c-chennai-001",
      "source": "Government Museum Registry",
      "last_updated": "2026-08-18T10:00:00Z"
    },
    {
      "id": "mus-in-che-002",
      "name": "Fort St. George Museum",
      "vernacular_names": {
        "ta": "புனித ஜார்ஜ் கோட்டை அருங்காட்சியகம்"
      },
      "address": "Rajaji Salai, Fort St George",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600009",
      "coordinates": {
        "lat": 13.0797,
        "lon": 80.2874
      },
      "distance_km": 1.9,
      "category": "maritime_military",
      "governance": "national_asi",
      "opening_hours": {
        "schedule": "09:00 - 17:00",
        "closed_on": ["Friday"],
        "timings": "Open Saturday through Thursday"
      },
      "entry_fee": {
        "is_free": false,
        "domestic_inr": 25,
        "foreign_inr": 300
      },
      "accessibility_features": [
        "Ramp Access to Main Hall",
        "Tactile Guidebook"
      ],
      "contact": {
        "phone": "+91 44 2567 1127",
        "website": "https://asi.nic.in"
      },
      "thumbnail_url": "/images/museums/fort-st-george.jpg",
      "gallery_urls": [
        "/images/museums/fort-gallery-1.jpg"
      ],
      "description": "Showcases colonial military artifacts, coins, uniforms, and historical records of Madras Presidency inside the 1644 fortress.",
      "artifact_count_approx": 3600,
      "muse_collection_id": "c-fort-002",
      "source": "Archaeological Survey of India",
      "last_updated": "2026-08-18T10:00:00Z"
    },
    {
      "id": "mus-in-che-003",
      "name": "DakshinaChitra Heritage Museum",
      "vernacular_names": {
        "ta": "தட்சிணசித்ரா அருங்காட்சியகம்"
      },
      "address": "East Coast Road, Muttukadu",
      "city": "Chennai (Suburban)",
      "state": "Tamil Nadu",
      "pincode": "603112",
      "coordinates": {
        "lat": 12.8225,
        "lon": 80.2415
      },
      "distance_km": 14.8,
      "category": "textiles_crafts",
      "governance": "private_trust",
      "opening_hours": {
        "schedule": "10:00 - 18:00",
        "closed_on": ["Tuesday"],
        "timings": "Open Wednesday through Monday"
      },
      "entry_fee": {
        "is_free": false,
        "domestic_inr": 175,
        "foreign_inr": 350
      },
      "accessibility_features": [
        "Wheelchair Pathways",
        "Craft Demonstration Accessible Stalls"
      ],
      "contact": {
        "phone": "+91 44 2747 2603",
        "website": "https://dakshinachitra.net"
      },
      "thumbnail_url": "/images/museums/dakshinachitra.jpg",
      "gallery_urls": [
        "/images/museums/dakshina-houses.jpg"
      ],
      "description": "Living history museum featuring 18 authentic heritage houses representing the vernacular architecture and traditional folk crafts of South India.",
      "artifact_count_approx": 12000,
      "muse_collection_id": "c-dakshina-003",
      "source": "Madras Craft Foundation",
      "last_updated": "2026-08-18T10:00:00Z"
    }
  ]
}
```
