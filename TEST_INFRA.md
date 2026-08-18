# E2E Test Infra: Digital Muse Complete Redesign

## Test Philosophy
- Opaque-box, requirement-driven verification derived from `ORIGINAL_REQUEST.md`.
- Zero coupling to internal component implementations; tests exercise real user journeys, API endpoints, rendering state transitions, and fact-checking invariants.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Scenarios.

## Feature Inventory Coverage Matrix
| # | Feature | Source (Requirement) | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---|---|:---:|:---:|:---:|:---:|
| 1 | Visual Theme & Design Tokens | ORIGINAL_REQUEST §1 | ✓ | ✓ | ✓ | ✓ |
| 2 | Typography Hierarchy | ORIGINAL_REQUEST §1 | ✓ | ✓ | ✓ | ✓ |
| 3 | Stitch Design System & Tokens | ORIGINAL_REQUEST §3 | ✓ | ✓ | ✓ | ✓ |
| 4 | Asymmetric Split Hero | ORIGINAL_REQUEST §2.1 | ✓ | ✓ | ✓ | ✓ |
| 5 | Floating Persona Switcher Bar | ORIGINAL_REQUEST §2.1 | ✓ | ✓ | ✓ | ✓ |
| 6 | Staggered Masonry Grid | ORIGINAL_REQUEST §2.1 | ✓ | ✓ | ✓ | ✓ |
| 7 | Museum Multi-Facet Filter | Spec Survey #3 | ✓ | ✓ | ✓ | ✓ |
| 8 | Dual-Column Exhibition Split | ORIGINAL_REQUEST §2.2 | ✓ | ✓ | ✓ | ✓ |
| 9 | 0ms Verbatim Source Toggle | ORIGINAL_REQUEST §2.2 | ✓ | ✓ | ✓ | ✓ |
| 10 | Slide-Over Factual Fidelity Auditor | ORIGINAL_REQUEST §2.2 | ✓ | ✓ | ✓ | ✓ |
| 11 | Fail-Safe Safe Fallback Trigger | Spec Survey #7 | ✓ | ✓ | ✓ | ✓ |
| 12 | Contested Sensitivity Notice | Spec Survey #8 | ✓ | ✓ | ✓ | ✓ |
| 13 | Interactive India SVG Canvas | ORIGINAL_REQUEST §2.3 | ✓ | ✓ | ✓ | ✓ |
| 14 | GPS Near Me & Spatial Radius | ORIGINAL_REQUEST §2.3 | ✓ | ✓ | ✓ | ✓ |
| 15 | Synchronized Split Map / List | ORIGINAL_REQUEST §2.3 | ✓ | ✓ | ✓ | ✓ |
| 16 | Unindexed PIN Fallback Modal | Spec Survey #11 | ✓ | ✓ | ✓ | ✓ |
| 17 | AI Docent Doubt Chat | Spec Survey #12 | ✓ | ✓ | ✓ | ✓ |
| 18 | Postal Ancestral Lineage Resolver | ORIGINAL_REQUEST §2.4 | ✓ | ✓ | ✓ | ✓ |
| 19 | 3-Part AI Historical Brief | ORIGINAL_REQUEST §2.4 | ✓ | ✓ | ✓ | ✓ |
| 20 | Web Speech Audio Narration | ORIGINAL_REQUEST §2.4 | ✓ | ✓ | ✓ | ✓ |
| 21 | Living Roots Narrative & Links | ORIGINAL_REQUEST §2.4 | ✓ | ✓ | ✓ | ✓ |
| 22 | Multi-Step Curator Ingest Form | ORIGINAL_REQUEST §2.5 | ✓ | ✓ | ✓ | ✓ |
| 23 | Dynamic Atomic Claim Builder | ORIGINAL_REQUEST §2.5 | ✓ | ✓ | ✓ | ✓ |
| 24 | Live Persona Preview & Scorecard | ORIGINAL_REQUEST §2.5 | ✓ | ✓ | ✓ | ✓ |
| 25 | Next.js 15+ & TypeScript Build | ORIGINAL_REQUEST §4 | ✓ | ✓ | ✓ | ✓ |

## Test Architecture
- **E2E Test Runners**:
  - `tests/e2e/e2e_pincode_history_runner.ts` (62 test cases covering PIN validation, caching, hierarchy, error handling)
  - `tests/e2e/e2e_backend_runner.ts` (87 test cases covering heritage service, geocoding, artifact search, TTS, PII redaction)
  - `tests/e2e/ui_component_lifecycle_runner.ts` (UI lifecycle and state persistence)
  - `tests/e2e/ui_scenario_stress_runner.ts` (10 multi-step interactive end-user flows)
- **Execution**: `npm run build`, `npx tsc --noEmit`, `npx tsx tests/e2e/...`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|---|---|---|
| 1 | Schoolchild visits artifact page in Child persona, listens to TTS narration, views Look Closer prompts | F5, F8, F10, F20 | High |
| 2 | Academic specialist reviews Chola Nataraja, toggles verbatim source, inspects claim checklist | F5, F8, F9, F10 | High |
| 3 | Visitor enters Delhi PIN 110001 on /roots, explores Mauryan/Mughal heritage, reads 3-part brief, navigates to National Museum | F18, F19, F20, F21 | High |
| 4 | Traveler explores India Map on /explore, uses GPS Near Me in Bengaluru, filters for Accessible museums, opens AI Docent Chat | F13, F14, F15, F17 | High |
| 5 | Curator ingests a newly discovered Chola bronze on /add, defines 4 atomic claims, verifies 100% claim preservation on live preview | F22, F23, F24 | High |

## Coverage Thresholds
- Tier 1: Feature coverage across all 25 features (>125 test vectors)
- Tier 2: Boundary value analysis on PIN codes, coordinates, missing fields, zoom limits
- Tier 3: Pairwise combinations (Persona × Artifact × Source Mode × Screen)
- Tier 4: 5 comprehensive real-world multi-screen journey scenarios
