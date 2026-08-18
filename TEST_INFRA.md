# E2E Test Infra: Museum Discovery Platform

## Test Philosophy
- Opaque-box, requirement-driven verification derived directly from `ORIGINAL_REQUEST.md`.
- No reliance on mock implementations or internal private variables.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Real-World Workload Testing.

---

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|----------------------|:------:|:------:|:------:|
| 1 | Authentic India SVG Map Outline | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Dynamic Zoom & Pan Controls | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Lat/Long Museum Pin Projection | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Complete Legacy Brand Sanitization | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | Museum Dataset Expansion (30+) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 6 | Collection Page Tabbed Switcher | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 7 | Live Search & State/Category Filters | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | 6-Digit PIN Geocoding & Distance | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 9 | Archival Narration Text Generator | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 10 | Universal Web Speech Player Controls | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 11 | Narration Integration across UI | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 12 | TypeScript & Build Compilation | ORIGINAL_REQUEST §Acceptance | 5 | 5 | ✓ |

---

## Test Architecture
- Test Runner: Node.js / tsx automated test harness `tests/e2e/e2e_runner.ts` executing headless DOM, dataset, geodetic math, and string sanitization audits.
- Invocation: `npx tsx tests/e2e/e2e_runner.ts`
- Pass/Fail Semantics: Process exits with code 0 on 100% pass rate, non-zero code on any failure.

---

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Tourist explores North-to-South cultural corridor on Collection page | F5, F6, F7, F9, F11 | High |
| 2 | User enters remote PIN code on Roots (`app/roots`) to trace ancestral heritage and nearby museums | F5, F8, F9, F11 | High |
| 3 | Explorer pans and zooms India map from Ladakh to Kanyakumari on Explore (`app/explore`) | F1, F2, F3, F4 | High |
| 4 | Visually impaired user listens to archival narrations across cards and detail modals | F9, F10, F11 | High |
| 5 | End-to-end full build and brand sanitization integrity gate | F4, F12 | High |

---

## Coverage Thresholds
- Tier 1: ≥5 test cases per feature (Total ≥ 60 tests)
- Tier 2: ≥5 boundary/corner cases per feature (Total ≥ 60 tests)
- Tier 3: Pairwise feature interaction tests (Total ≥ 12 tests)
- Tier 4: ≥5 real-world application scenarios
- **Total Suite Minimum: ≥ 137 test cases**
