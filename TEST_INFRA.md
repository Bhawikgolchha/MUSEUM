# E2E Test Infra: Digital Muse Redesign

## Test Philosophy
- Opaque-box, requirement-driven. Derived from `ORIGINAL_REQUEST.md`.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.
- Zero-tolerance integrity: No hardcoded test results, authentic execution of all flows.

## Feature Inventory & Test Mapping
| # | Feature | Requirement Source | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Workload) |
|---|---|---|:---:|:---:|:---:|:---:|
| 1 | Editorial Design Tokens & Styling | ORIGINAL_REQUEST §Visual Theme | ✓ (5 tests) | ✓ (5 tests) | ✓ | ✓ |
| 2 | Modern Typography (Fraunces + Geist) | ORIGINAL_REQUEST §Visual Theme | ✓ (5 tests) | ✓ (5 tests) | ✓ | ✓ |
| 3 | Anti-Slop Visual Rules | ORIGINAL_REQUEST §Acceptance Criteria | ✓ (5 tests) | ✓ (5 tests) | ✓ | ✓ |
| 4 | Asymmetric Split Hero & Persona Bar | ORIGINAL_REQUEST §R1.1 | ✓ (5 tests) | ✓ (5 tests) | ✓ | ✓ |
| 5 | Staggered Diagonal Masonry Grid | ORIGINAL_REQUEST §R1.1 | ✓ (5 tests) | ✓ (5 tests) | ✓ | ✓ |
| 6 | Sticky Photo Plate & Look Closer Pins | ORIGINAL_REQUEST §R1.2 | ✓ (5 tests) | ✓ (5 tests) | ✓ | ✓ |
| 7 | 4-Persona Voice & 0ms Source Toggle | ORIGINAL_REQUEST §R1.2 | ✓ (5 tests) | ✓ (5 tests) | ✓ | ✓ |
| 8 | Slide-Over Factual Fidelity Auditor | ORIGINAL_REQUEST §R1.2 | ✓ (5 tests) | ✓ (5 tests) | ✓ | ✓ |
| 9 | Spatial India SVG Map & GPS Sorting | ORIGINAL_REQUEST §R1.3 | ✓ (5 tests) | ✓ (5 tests) | ✓ | ✓ |
| 10 | 6-Digit PIN Lineage & Web Speech TTS | ORIGINAL_REQUEST §R1.4 | ✓ (5 tests) | ✓ (5 tests) | ✓ | ✓ |
| 11 | Curator Ingestion Studio & Claims | ORIGINAL_REQUEST §R1.5 | ✓ (5 tests) | ✓ (5 tests) | ✓ | ✓ |

## Test Suites Inventory
1. `tests/e2e/e2e_pincode_history_runner.ts` (62 tests): End-to-end postal PIN validation, dynastic heritage resolution, caching, and fallback.
2. `tests/e2e/ui_scenario_stress_runner.ts` (10 tests): Multi-step UI workflow stress tests (persona changes, search filter combinations, PIN lookups).
3. `tests/e2e/ui_component_lifecycle_runner.ts` (4 tests): Client component mounting, unmounting, and memory lifecycle.
4. `tests/unit/geocoding.test.ts` (86 tests): 3-tier geocoding coordinates, distance calculations, fallback behavior.
5. `tests/unit/artifacts.test.ts` (21 tests): Artifact schema, claims structure, and sensitivity notice flags.
6. `tests/unit/milestone2_verification.test.ts` (100 tests): Visual token verification, persona state persistence, search accuracy.
7. `tests/unit/milestone3_explore_banner_verification.test.ts` (6 tests): Historical context banner rendering and TTS scripts.
8. `tests/unit/tts.test.ts` (31 tests): Text-to-speech audio script formatting and speech synthesis fallbacks.

## Acceptance Thresholds
- Tier 1: >= 55 feature-level test cases (all passing).
- Tier 2: >= 55 boundary & edge cases (all passing).
- Tier 3: Pairwise combination matrix (all passing).
- Tier 4: Real-world user discovery scenarios (all passing).
- Tier 5: Adversarial white-box tests (zero TypeScript errors, clean `npm run build`).
