# Project: Museum Discovery Backend Heritage Service

## Architecture
- Framework: Next.js App Router (Next.js 16.3.1, TypeScript 5, React 19.2.8)
- Primary Service Route: `app/api/heritage-service/route.ts` (POST & GET)
- Subsystem Services:
  - `lib/services/geocoding.ts`: Multi-tier geocoding resolution (LRU cache -> In-memory/DB -> National directory -> Nominatim/External provider) & multi-match disambiguation.
  - `lib/services/artifacts.ts`: Strict PIN-linked artifact retrieval (zero fuzzy fallback), schema normalization, and `data_quality` metadata flagging.
  - `lib/services/pii-redactor.ts`: PII sanitizer scrubbing curator/donor personal identifiers (names, emails, phone numbers).
  - `lib/services/tts.ts`: IG API TTS client with exponential backoff retries (429, 500-504), full jitter, timeout handling, and partial failure fallback.
  - `lib/services/logger.ts`: Security audit logger with API key masking (`ig-****1234`) and SHA-256 digest hashing.
  - `lib/services/types.ts`: TypeScript contracts for requests, responses, artifacts, locations, TTS, and error taxonomy.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Strict PIN Regex Validation | Validates 6-digit Indian PIN (`/^[1-9][0-9]{5}$/`), rejects non-digits and leading zeros with HTTP 400 `INVALID_PINCODE_FORMAT` | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Tier 1 In-Memory/DB Geocoding | Instant resolution against authoritative museum PIN dictionary and metro hubs | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Tier 2 National Postal Directory | Resolves 3-digit sorting district centroid and postal circle coordinates | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Tier 3 External Geocoder | Queries OpenStreetMap Nominatim / National Postal API for unmapped PINs | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Multi-Match Disambiguation | Returns `location_candidates` array with status `partial` when a PIN spans multiple areas | M1 | ORIGINAL_REQUEST §R1 |
| 6 | LRU Low-Latency Cache | High-speed cache guaranteeing <=100ms response time on cached lookups | M1 | ORIGINAL_REQUEST §R1 |
| 7 | Strict Exact-PIN Artifact Matching | Queries museum/artifact repository strictly matching PIN. ZERO fuzzy/distance fallback | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Explicit Zero-Match Reporting | Returns `museum_linked_artifacts: []`, `total_artifacts_found: 0`, and explicit indicator if no artifacts match | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Standardized Artifact Schema | Normalizes artifact records with complete metadata (id, title, description, museum info, licensing) | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Data Quality Metadata Flagging | Audits artifact records for missing critical fields and flags with `data_quality: { is_complete, missing_fields }` | M2 | ORIGINAL_REQUEST §R2 |
| 11 | Automated PII Redaction | Scrubs curator, donor, and collector personal contact info (names, emails, phones) from text fields | M2 | ORIGINAL_REQUEST §R2 |
| 12 | Spoken Narrative Text Composer | Assembles natural language spoken script from geographic location and artifact summaries | M3 | ORIGINAL_REQUEST §R3 |
| 13 | IG API TTS Client | Invokes upstream IG API TTS REST endpoint with user API key, voice, language, and audio base64 output | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Exponential Backoff & Jitter | Retries transient errors (429, 500, 502, 503, 504) up to 3 times with exponential delays + jitter | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Key Masking & SHA-256 Audit | Strictly masks API keys (`ig-****1234`) and records SHA-256 hashes in audit logs | M3 | ORIGINAL_REQUEST §R3 |
| 16 | Partial Failure Non-Fatal Degradation | Returns HTTP 200/207 with intact textual payload and error object if TTS generation fails | M3 | ORIGINAL_REQUEST §R3 |
| 17 | Unified Heritage Service Route | Main Next.js API route (`app/api/heritage-service/route.ts`) supporting POST and GET | M4 | ORIGINAL_REQUEST §R4 |
| 18 | Error Taxonomy & Response Modes | Standardized error taxonomy (`INVALID_PINCODE_FORMAT`, `PINCODE_NOT_FOUND`, `TTS_AUTH_ERROR`, etc.) and response modes (`text`, `tts`, `both`) | M4 | ORIGINAL_REQUEST §R4 |
| 19 | 100% E2E Test Suite & Adversarial Hardening | Comprehensive 4-tier E2E test suite (Tiers 1-4) passing 100% + Tier 5 adversarial coverage hardening | M5 | ORIGINAL_REQUEST §Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Mock harness, test runner, 82+ test cases (Tiers 1-4), `TEST_INFRA.md`, `TEST_READY.md` | none | IN_PROGRESS |
| M1 | Geocoding & Postal Hierarchy | `lib/services/geocoding.ts`, regex validation, 3-tier lookup, multi-match disambiguation, LRU cache | none | IN_PROGRESS |
| M2 | Museum Artifacts & PII Redaction | `lib/services/artifacts.ts`, `lib/services/pii-redactor.ts`, exact matching, zero-match reporting, data_quality flagging | none | IN_PROGRESS |
| M3 | IG API TTS & Security Logger | `lib/services/tts.ts`, `lib/services/logger.ts`, exponential backoff, key masking, SHA-256 audit, partial failure fallback | none | IN_PROGRESS |
| M4 | Unified API Route & Payload Formatter | `app/api/heritage-service/route.ts`, request parsing, response formatting (`text`/`tts`/`both`), error taxonomy | M1, M2, M3 | PLANNED |
| M5 | Final Acceptance & Adversarial Verification | Pass 100% of E2E test suite (Tiers 1-4) + Tier 5 adversarial stress testing | E2E, M4 | PLANNED |

## Code Layout
- `lib/services/types.ts`: Central type definitions for the backend service.
- `lib/services/geocoding.ts`: Geocoding service with 3-tier resolution, LRU cache, and candidate lists.
- `lib/services/artifacts.ts`: Artifact query service with exact matching, zero-match reporting, and data quality checks.
- `lib/services/pii-redactor.ts`: PII sanitization utility for donor/curator data.
- `lib/services/tts.ts`: IG API TTS client with retry logic, backoff, and partial degradation.
- `lib/services/logger.ts`: Masked security logging and SHA-256 hashing.
- `app/api/heritage-service/route.ts`: Next.js App Router API endpoint.
- `tests/e2e/backend_service.test.ts` & `tests/e2e/e2e_backend_runner.ts`: E2E test runner and test cases.

## Interface Contracts
### Types (`lib/services/types.ts`)
- `PincodeRequest`: `{ pincode: string, response_format?: 'text' | 'tts' | 'both', api_key?: string, voice?: string, language?: string, max_artifacts?: number }`
- `PincodeResponse`: `{ status: 'success' | 'partial' | 'error', request_id: string, pincode_valid: boolean, location: LocationData | null, museum_linked_artifacts: StandardizedArtifact[], total_artifacts_found: number, tts: TTSData | null, errors: ErrorDetail[] }`
