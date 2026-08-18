# Original User Request

## 2026-08-18T14:16:13+05:30

Implement an interactive museum doubt chat system below each museum card powered by OpenRouter API, expand the national museum directory by adding 10+ authentic Indian museums with unique PIN codes and metadata, and build a nearest-museum fallback modal when a searched PIN code yields no direct results.

Working directory: d:\Hackathon
Integrity mode: development

## Requirements

### R1. Museum Doubt Chat Box
- Under every museum card on the discovery/explore interface, provide an expandable drawer containing an interactive AI doubt chat box.
- The chat box must support pre-set doubt questions (e.g. timings, fees, highlights, accessibility) as well as free-form user questions.
- Use the configured OpenRouter API key to stream or generate grounded answers based on the specific museum's operational details, history, and collection facts.
- Present clear visual feedback during generation and handle error cases gracefully.

### R2. Dataset Expansion with 10+ New Indian Museums
- Add at least 10 authentic Indian museums to the directory across diverse states and PIN codes (e.g., Jaipur, Ahmedabad, Thiruvananthapuram, Pune, Udaipur, Shillong, Panaji, Lothal, Jammu).
- Each museum entry must contain complete verified metadata: 6-digit postal PIN code, latitude/longitude coordinates, opening/closing schedule, domestic and foreign entry fees, accessibility features, categories, high-resolution thumbnail references, and cultural descriptions.

### R3. PIN Code Search & Nearest Museum Fallback Modal
- Enhance the area and PIN code search functionality so that searching by any 6-digit Indian PIN code queries the museum repository.
- If no museum exists in the queried PIN code or its immediate vicinity, display a "Not Found" notification modal indicating that no museum was found for the entered PIN code, displaying the nearest discovered museum with calculated Haversine distance, and offering a one-click action to view and center on that nearest museum.

## Acceptance Criteria

### AI Chat Verification
- [ ] Every museum card on `/explore` renders an "Ask Doubt" toggle button that expands an inline chat drawer.
- [ ] Submitting a question sends a request to `/api/museum-chat` with the museum context and OpenRouter API key, returning a valid, factual answer.
- [ ] Pre-set doubt prompt chips automatically populate and submit relevant questions.

### Directory Expansion Verification
- [ ] The museum dataset in `data/indian-museums.json` contains a minimum of 18 total museums (at least 10 newly added).
- [ ] All new museums have valid 6-digit PIN codes, valid numeric coordinates (lat/lon within India), and complete metadata fields.

### Nearest Museum Fallback Verification
- [ ] Searching a PIN code with no direct museum match triggers a "Not Found" modal.
- [ ] The modal calculates and displays the nearest museum name and accurate distance in kilometers, with an interactive button to switch to that museum.

### System & Build Verification
- [ ] `npm run build` completes with 0 TypeScript or lint errors.
- [ ] All interactive flows function properly across desktop and mobile screen sizes.

## 2026-08-18T09:48:34Z

Build a backend service endpoint that accepts a user-provided postal PIN code, resolves the exact geographic location, retrieves museum artifact/exhibit records strictly associated with that specific PIN code (with explicit zero-match reporting and no fuzzy distance fallbacks), and synthesizes spoken audio via the IG API Text-to-Speech service using a user-supplied API key.

Working directory: d:\Hackathon
Integrity mode: development

## Requirements

### R1. Strict Postal PIN Code Resolution & Geocoding
- Accept and strictly validate postal PIN codes (e.g. 6-digit Indian PIN codes `/^[1-9][0-9]{5}$/` or configurable international postal formats).
- Resolve coordinates (latitude, longitude) and human-readable area/address metadata using a multi-tiered lookup hierarchy: local in-memory/database registry -> national postal directory -> authoritative external geocoding providers (e.g. OpenStreetMap Nominatim / National Postal API).
- If multiple candidate locations match, return all matches in a `location_candidates` list with status `partial` and disambiguation hints.
- Reject invalid or malformed inputs with descriptive error codes (`INVALID_PINCODE_FORMAT`).

### R2. Strict Pincode-Linked Museum Artifact Retrieval
- Query the curated museum/artifact repository for artifacts whose record explicitly matches the queried PIN code.
- If no artifact records match the exact PIN code, return an empty list with `total_artifacts_found: 0` and an explicit indicator (`"no museum-linked artifacts found for this pincode"`). Do not fall back to nearest or neighboring museum records.
- Standardize artifact records with schema: `artifact_id`, `title`, `description`, `museum_name`, `museum_id`, `pincode`, `exhibit_location`, `digital_asset_urls`, `provenance_date`, `licensing_info`, and optional `data_quality` metadata for incomplete records.
- Apply PII redaction to sanitize curator/donor personal identifiers.

### R3. IG API Text-to-Speech (TTS) Generation Integration
- Accept an `api_key`, `voice`, and `language` parameter to synthesize spoken audio from the compiled location and artifact summary.
- Invoke the IG API TTS REST endpoint with exponential backoff retries for transient HTTP errors (429, 500, 502, 503, 504).
- Encode audio output as base64 or attach binary metadata according to requested `response_format` (`text`, `tts`, `both`).
- Never persist or expose raw API keys in application logs; mask keys (e.g. `ig-****1234`) and record audit log hashes only.
- If TTS generation fails, return the full location and artifact text response with a non-fatal error object in `errors[]` (status `partial`).

### R4. Structured Response Formatting & Error Taxonomy
- Support flexible output modes: `text` (data only), `tts` (audio metadata + fallback text), and `both` (combined).
- Return unified payload structure containing: `status`, `request_id`, `pincode_valid`, `location`, `museum_linked_artifacts`, `total_artifacts_found`, `tts`, and `errors`.

## Acceptance Criteria

### Geocoding & Validation Verification
- [ ] Strict regex validation rejects malformed PIN codes (e.g., non-digits, incorrect length, leading zeros where disallowed) with HTTP 400 and `INVALID_PINCODE_FORMAT`.
- [ ] Known PIN codes resolve exact latitude, longitude, and locality name within ≤100ms on cached lookups.
- [ ] Multi-match queries return candidate arrays with `status: "partial"`.

### Museum Artifact Matching Verification
- [ ] Queried PIN codes with exact matches return up to `max_artifacts` matching items with complete fields.
- [ ] Queried PIN codes with zero matching artifacts return `museum_linked_artifacts: []`, `total_artifacts_found: 0`, and explicit no-match status without nearest-museum fallback.
- [ ] Incomplete artifact records are flagged with `data_quality: { is_complete: false, missing_fields: [...] }`.

### TTS Integration & Security Verification
- [ ] Successful TTS requests with valid `api_key` return base64 audio payload and audio metadata.
- [ ] Invalid API keys or TTS upstream errors return HTTP 200/207 with textual data intact and `errors: [{ code: "TTS_GENERATION_FAILED", ... }]`.
- [ ] Application logs contain only masked keys (`api_key_masked`) and SHA-256 hashes of identifiers.
