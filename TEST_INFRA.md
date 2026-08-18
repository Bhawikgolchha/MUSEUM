# E2E Test Infra: Indian Museum Spatial Discovery & Doubt Chat

## Test Philosophy
- Opaque-box, requirement-driven testing directly derived from `ORIGINAL_REQUEST.md`.
- No reliance on mock facades or hardcoded shortcuts. All tests must verify real computations and API contracts.
- 4-tier systematic validation (Category-Partition, Boundary Value Analysis, Pairwise Combinatorial, and Real-World Application Workloads).

## Feature Inventory & Test Coverage
| # | Feature | Source | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Workload) |
|---|---------|--------|:----------------:|:-----------------:|:----------------------:|:-----------------:|
| 1 | Dataset Expansion (>=18 authentic museums) | ORIGINAL_REQUEST §R2 | 5 tests (count, schema, keys, types, values) | 5 tests (coords bounds, 6-digit PIN regex, fees >= 0, schedule presence) | Pairwise with spatial queries | Scenario 1 & 4 |
| 2 | Geospatial & PIN Centroid Resolution | ORIGINAL_REQUEST §R3 | 5 tests (prefix lookup, coordinates accuracy) | 5 tests (unknown PIN, edge PINs, extreme latitudes) | Pairwise with Haversine finder | Scenario 2 & 4 |
| 3 | PIN Search & Nearest Fallback Modal | ORIGINAL_REQUEST §R3 | 5 tests (exact PIN match, non-matching PIN, modal data payload) | 5 tests (invalid PIN format, out of bounds PIN, radius boundaries) | Pairwise with centering action | Scenario 2 |
| 4 | Museum Doubt Chat API & OpenRouter | ORIGINAL_REQUEST §R1 | 5 tests (POST /api/museum-chat, prompt chips, response schema) | 5 tests (unknown museum ID, empty question, long question, offline fallback) | Pairwise with metadata injection | Scenario 3 |
| 5 | Museum Card Doubt Chat Drawer UI | ORIGINAL_REQUEST §R1 | 5 tests (toggle drawer state, preset chips list, message bubbles) | 5 tests (rapid clicking, error recovery, empty submit prevention) | Pairwise with explore card selection | Scenario 3 |

## Test Architecture
- Test Suite Runner: `scripts/test-e2e-all.ts`
- Direct Next.js App Router Verification: Tested against real compiled build and runtime endpoints.
- Total test cases planned: >= 30 automated assertions across Tiers 1-4.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Expected Outcome |
|---|----------|--------------------|------------------|
| 1 | Tourist in Jaipur queries Albert Hall details | F1, F5, F6 | Finds Albert Hall (`302004`), opens chat, clicks "Timings", gets accurate 9am-5pm + night viewing schedule. |
| 2 | Researcher searches PIN `342001` (Jodhpur) with no direct museum | F1, F2, F3, F4 | System opens Nearest Fallback Modal displaying Albert Hall or City Palace with Haversine distance, click centers map. |
| 3 | Visitor with mobility needs asks about Napier Museum Thiruvananthapuram | F1, F5, F6 | Opens Napier Museum card, asks about accessibility, receives verified wheelchair ramp & tactile details. |
| 4 | Pan-India Geographic & Postal Coverage Validation | F1, F2 | Iterates through all 21 museums in dataset across 12+ states, verifies 100% valid coordinates, PIN codes, and operational metadata. |
