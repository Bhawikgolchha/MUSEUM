# TEST READY: Digital Muse Automated E2E Test Suite

**Track:** Milestone M-E2E (E2E Testing Track)  
**Author:** `test_writer_1` (Test Writer Specialist & QA)  
**Target Command:** `npx tsx tests/e2e/e2e_runner.ts`  
**TypeScript / Lint Status:** 0 Errors, 0 Warnings (`npx tsc --noEmit`, `npx eslint tests/e2e`)

---

## 1. Test Suite Overview

The Digital Muse E2E Test Suite is an automated, multi-tier testing harness written in TypeScript. It provides rigorous end-to-end contract validation, dataset integrity checks, spatial geodesic mathematics verification, boundary edge-case handling, and real-world UI workflow simulations.

### Test Runner Command
```bash
npx tsx tests/e2e/e2e_runner.ts
```

### Exit Code Semantics
- **Exit Code 0**: 100% of all test assertions across all 4 tiers pass cleanly.
- **Exit Code 1**: One or more assertions fail or a required milestone component is missing, providing clear tier-specific diagnostics and remediation steps.

---

## 2. 4-Tier Test Architecture & Feature Coverage Matrix

### Tier 1: Feature Coverage (`tests/e2e/tier1_features.ts`)
| Test ID | Name | Requirement | Target Module | Scope & Assertions |
|---|---|---|---|---|
| **T1.1** | Museum Count $\ge 18$ & Unique IDs | R2 | `data/indian-museums.json` | Asserts dataset contains $\ge 18$ (and $\ge 20$) authentic museums with unique `mus-in-*` IDs. |
| **T1.2** | 19 Canonical Schema Fields & Types | R2 | `data/indian-museums.json`, `lib/museums.ts` | Validates every museum record has all 19 required fields with correct primitive and structural types. |
| **T1.3** | Geographic Diversity Across India | R2 | `data/indian-museums.json` | Asserts $\ge 10$ unique Indian states and $\ge 12$ cities spanning North, South, East, West, and North-East. |
| **T1.4** | `/api/museum-chat` Route Existence | R1 | `app/api/museum-chat/route.ts` | Validates Next.js App Router POST handler export. |
| **T1.5** | Chat API Grounded Timings & Fee Replies | R1 | `app/api/museum-chat/route.ts` | Submits queries for visiting hours and entry fees; asserts grounded facts in response. |
| **T1.6** | Multi-Turn Chat History Support | R1 | `app/api/museum-chat/route.ts` | Sends message with preceding conversation history; verifies context retention. |
| **T1.7** | `lib/pincodes.ts` Resolvers Export | R3 | `lib/pincodes.ts` | Asserts `resolvePinToCoordinates` and `findNearestMuseum` are exported. |
| **T1.8** | Direct 6-Digit PIN Coordinate Resolution | R3 | `lib/pincodes.ts` | Verifies exact coordinates for key museum PINs (110011, 600008, 302004, 411002, 695033, 700016). |
| **T1.9** | 3-Digit District Centroid Resolution | R3 | `lib/pincodes.ts` | Verifies unindexed PINs resolve to correct district centroids (302001, 411001, 695001, 793001, 180001, 380001). |
| **T1.10** | 2-Digit Postal Circle Fallback Resolution | R3 | `lib/pincodes.ts` | Verifies rural unmapped PINs resolve to state circle capitals (30xxxx, 38xxxx, 41xxxx, 69xxxx, 75xxxx, 78xxxx). |

---

### Tier 2: Boundary & Corner Cases (`tests/e2e/tier2_boundaries.ts`)
| Test ID | Name | Requirement | Target Module | Scope & Assertions |
|---|---|---|---|---|
| **T2.1** | Rejection of Invalid PIN Formats | R3 | `lib/pincodes.ts` | Asserts `null` for 5-digit, 7-digit, alpha, mixed, leading zero (000000, 011001), empty, whitespace, and special characters. |
| **T2.2** | Missing `museumId` in Chat Payload | R1 | `app/api/museum-chat/route.ts` | Asserts HTTP 400 Bad Request with descriptive error payload. |
| **T2.3** | Empty / Whitespace Chat Message | R1 | `app/api/museum-chat/route.ts` | Asserts HTTP 400 Bad Request for whitespace or blank queries. |
| **T2.4** | Non-Existent `museumId` Graceful Handling | R1 | `app/api/museum-chat/route.ts` | Asserts graceful fallback or 404 response without crashing. |
| **T2.5** | Extremely Long Queries (>3000 chars) | R1 | `app/api/museum-chat/route.ts` | Tests query resilience under heavy text loads without memory leak or crash. |
| **T2.6** | Geographic Extreme Bounds in India | R2 | `data/indian-museums.json` | Asserts all coordinates fall strictly within $8.0 \le \text{lat} \le 38.0$ and $68.0 \le \text{lon} \le 98.0$, covering extreme North (Jammu), South (Thiruvananthapuram), West (Lothal), and East (Shillong/Guwahati). |
| **T2.7** | Free vs Paid & Operating Schedules | R2 | `data/indian-museums.json` | Asserts free museums have INR 0 fee, paid museums have valid foreign $\ge$ domestic ratios, and Monday/Friday/7-day schedules are valid. |

---

### Tier 3: Spatial & Haversine Distance (`tests/e2e/tier3_spatial.ts`)
| Test ID | Name | Requirement | Target Module | Scope & Assertions |
|---|---|---|---|---|
| **T3.1** | Geodesic Mathematical Properties | R3 | `lib/museums.ts` | Verifies zero distance to self ($d(P,P) = 0.0\text{ km}$) and mathematical symmetry ($d(A,B) = d(B,A)$). |
| **T3.2** | Benchmark City Pairs Accuracy | R3 | `lib/museums.ts` | Validates Haversine accuracy for Delhi-Jaipur (~238km), Mumbai-Pune (~120km), Kolkata-Bhubaneswar (~365km), Delhi-Chennai (~1757km), Patna-Varanasi (~220km). |
| **T3.3** | Triangle Inequality Verification | R3 | `lib/museums.ts` | Verifies $d(A,C) \le d(A,B) + d(B,C)$ across Indian geographic points. |
| **T3.4** | Unindexed PIN `302001` $\rightarrow$ Albert Hall Jaipur | R3 | `lib/pincodes.ts` | Finds nearest museum for Jaipur GPO (<15km). |
| **T3.5** | Unindexed PIN `411001` $\rightarrow$ Kelkar Museum Pune | R3 | `lib/pincodes.ts` | Finds nearest museum for Pune GPO (<15km). |
| **T3.6** | Unindexed PIN `695001` $\rightarrow$ Napier Thiruvananthapuram | R3 | `lib/pincodes.ts` | Finds nearest museum for Trivandrum GPO (<15km). |
| **T3.7** | Unindexed PIN `180001` $\rightarrow$ Dogra Art Jammu | R3 | `lib/pincodes.ts` | Finds nearest museum for Jammu GPO (<15km). |
| **T3.8** | Unindexed PIN `781001` $\rightarrow$ Assam State Museum | R3 | `lib/pincodes.ts` | Finds nearest museum for Guwahati GPO (<15km). |

---

### Tier 4: Real-World Scenarios (`tests/e2e/tier4_scenarios.ts`)
| Test ID | Name | Requirement | Target Modules | Scope & Assertions |
|---|---|---|---|---|
| **T4.1** | Unindexed PIN Search $\rightarrow$ Fallback Modal $\rightarrow$ Switch Flow | R3 | `lib/pincodes.ts`, `components/NearestMuseumModal.tsx` | Simulates user searching unindexed PIN `302001` $\rightarrow$ 0 direct matches $\rightarrow$ resolves to Albert Hall Jaipur $\rightarrow$ verifies modal props contract $\rightarrow$ executes `onSelectNearest` callback. |
| **T4.2** | Card "Ask Doubt" $\rightarrow$ Preset Chips $\rightarrow$ Grounded Multi-Turn Chat | R1 | `components/MuseumDoubtChat.tsx`, `app/api/museum-chat/route.ts` | Simulates user opening chat drawer $\rightarrow$ clicking "Timings" chip $\rightarrow$ receiving visiting hours $\rightarrow$ clicking "Entry Fee" chip $\rightarrow$ clicking "Accessibility" chip $\rightarrow$ verifies multi-turn conversation stream. |

---

## 3. Directory Structure

```
tests/e2e/
├── e2e_runner.ts            # Master test runner, tabular reporter, exit handler
├── tier1_features.ts        # Tier 1: Feature Coverage (R1, R2, R3)
├── tier2_boundaries.ts      # Tier 2: Boundary & Corner Cases
├── tier3_spatial.ts         # Tier 3: Spatial & Haversine Distance
├── tier4_scenarios.ts       # Tier 4: Real-World Workflows & Modal Contracts
└── types.ts                 # Test interfaces, assertions harness, dynamic module loader
```

---

## 4. Verification Check

To verify the test harness:
```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint check
npx eslint tests/e2e

# 3. Execute E2E Runner
npx tsx tests/e2e/e2e_runner.ts
```
