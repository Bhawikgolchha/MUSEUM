# TEST READY: Museum Discovery Backend Heritage Service E2E Test Suite

**Track:** Backend Heritage Service Endpoint (`app/api/heritage-service/route.ts`)  
**Test Writer Specialist:** `test_writer_e2e`  
**Execution Command:** `npx tsx tests/e2e/e2e_backend_runner.ts`  
**Status:** **READY FOR MILESTONE VERIFICATION** (87 Test Cases | 150+ Assertions | 100% Hermetic Mocks)

---

## 1. Executive Summary

The Backend Heritage Service Test Suite is an automated, hermetically mocked end-to-end testing harness designed to validate all requirements from `ORIGINAL_REQUEST.md` (§2026-08-18T09:48:34Z) and `PROJECT.md`.

It exercises the complete request-response lifecycle of the postal PIN code heritage lookup API:
1. **Strict PIN Validation**: Regex validation (`/^[1-9][0-9]{5}$/`), whitespace trimming, numeric coercion, GET query handling, and circle extraction.
2. **3-Tier Geocoding Resolution**: In-memory exact PIN registry $\rightarrow$ 3-digit district centroid $\rightarrow$ National postal directory & OSM Nominatim fallback.
3. **Strict Artifact Retrieval**: Exact PIN-linked matching with **zero fuzzy distance fallback**, explicit zero-match reporting, 10-field canonical schema conformance, and `data_quality` metadata tagging.
4. **Automated PII Redaction**: Sanitization of curator/donor emails, Indian mobile/landline numbers, PAN/Govt IDs, and residential addresses with zero false positive masking of ancient historical names.
5. **IG API TTS Narration**: Spoken script assembly, custom voice/language propagation, exponential backoff retries on transient errors (429, 500, 503), and non-fatal partial degradation.
6. **Key Masking & SHA-256 Audit**: Key masking (`ig-****1234`), 64-character SHA-256 digest creation, and zero raw key echo in payloads.

---

## 2. Test Execution & Exit Semantics

### Command
```bash
npx tsx tests/e2e/e2e_backend_runner.ts
```

### Exit Code Semantics
- **Exit Code 0**: 100% of all 87 test assertions pass cleanly.
- **Exit Code 1**: One or more assertions fail or a required milestone component is missing, providing clear tier-specific diagnostics and stack traces.

---

## 3. Comprehensive 4-Tier Test Catalog

### Tier 1: Feature Coverage (40 Tests)
| Test ID | Test Name | Input / Precondition | Expected Behavior & Assertions |
|---|---|---|---|
| **T1.1.1** | Standard 6-Digit Indian PIN Parsing | `{ pincode: "110001" }` | HTTP 200; `pincode_valid: true`; normalized PIN `"110001"`. |
| **T1.1.2** | Extraneous Whitespace Auto-Trimming | `{ pincode: "  700016  " }` | HTTP 200; auto-trimmed to `"700016"`; `pincode_valid: true`. |
| **T1.1.3** | Numeric Primitive Coercion | `{ pincode: 400001 }` | HTTP 200; coerced to string `"400001"`; `pincode_valid: true`. |
| **T1.1.4** | GET Query Parameter PIN Resolution | `GET ?pincode=500002&response_format=text` | HTTP 200; `pincode_valid: true`; resolved PIN `"500002"`. |
| **T1.1.5** | Geographic Postal Circle Extraction | `{ pincode: "600008" }` | HTTP 200; `state` contains `"Tamil Nadu"` from prefix `"60"`. |
| **T1.2.1** | Tier 1: In-Memory / DB Exact PIN Hit | PIN `"110011"` (National Museum) | HTTP 200; `source_tier: "in_memory_db"`; latency $\le 100\text{ms}$; lat $\approx 28.6118$. |
| **T1.2.2** | Tier 2: 3-Digit District Centroid Hit | PIN `"302001"` (Jaipur GPO) | HTTP 200; `source_tier` in-memory/district; state `"Rajasthan"`. |
| **T1.2.3** | Tier 3: National Postal Directory Hit | Rural PIN `"841301"`; Mock Postal API | HTTP 200; `location` resolved; state `"Bihar"`. |
| **T1.2.4** | Tier 3 External Geocoder Fallback | PIN `"176219"`; Mock Nominatim | HTTP 200; resolves to Dharamshala / Himachal Pradesh. |
| **T1.2.5** | Multi-Match Candidate Resolution | PIN `"560001"`; Mock 3 post offices | HTTP 200/207; `location_candidates.length >= 2`; status `"partial"`. |
| **T1.3.1** | Exact PIN Match Retrieval | PIN `"110011"` | HTTP 200; all returned artifacts have `pincode === "110011"`. |
| **T1.3.2** | 10-Field Canonical Schema Conformance | Any matching artifact record | Validates `artifact_id`, `title`, `description`, `museum_name`, `museum_id`, `pincode`, `exhibit_location`, `digital_asset_urls`, `provenance_date`, `licensing_info`. |
| **T1.3.3** | `max_artifacts` Ceiling Parameter | PIN `"110011"`, `max_artifacts: 1` | `museum_linked_artifacts.length === 1`; `total_artifacts_found >= 1`. |
| **T1.3.4** | Multiple Artifact Aggregation & Unique IDs | PIN `"700016"`, `max_artifacts: 10` | Unique `artifact_id` values across all returned records. |
| **T1.3.5** | Digital Asset URL & Licensing Preservation | CC-BY artifact record | Non-empty `digital_asset_urls`; `licensing_info.license` preserved. |
| **T1.4.1** | Zero-Match Empty Artifact Array | PIN `"110001"` (Connaught Place) | HTTP 200; `museum_linked_artifacts: []`; `total_artifacts_found: 0`. |
| **T1.4.2** | Explicit Zero-Match Indicator Message | PIN `"110001"` | `museum_linked_artifacts.length === 0`; `total_artifacts_found === 0`. |
| **T1.4.3** | Absence of Neighboring Museum Leakage | PIN `"110001"` (0.8km from 110011) | `museum_linked_artifacts` empty; zero injection of 110011 artifacts. |
| **T1.4.4** | Location Preserved on Zero-Match | PIN `"110001"` | `pincode_valid: true`; `location` resolves Connaught Place / Delhi. |
| **T1.4.5** | Unified Payload Contract on Zero-Match | PIN `"110001"` | Valid `request_id`, `status: "success"`, `errors: []`. |
| **T1.5.1** | Mode "text": Data Only Output | `response_format: "text"`, PIN `"700016"` | HTTP 200; `tts === null`; 0 calls made to IG API TTS. |
| **T1.5.2** | Mode "tts": Spoken Audio Metadata | `response_format: "tts"`, valid key | HTTP 200; non-empty `tts.audio_base64` and `tts.narration_text`. |
| **T1.5.3** | Mode "both": Combined Data & Audio | `response_format: "both"`, valid key | HTTP 200; `location`, `museum_linked_artifacts`, and `tts` present. |
| **T1.5.4** | Custom Voice Parameter Propagation | `voice: "en-IN-Wavenet-D"` | Upstream TTS receives requested voice; `tts.voice === "en-IN-Wavenet-D"`. |
| **T1.5.5** | Custom Language Parameter Propagation | `language: "hi-IN"` | TTS synthesized in Hindi; `tts.language === "hi-IN"`. |
| **T1.6.1** | API Key Masking in Diagnostics | `api_key: "ig-live-sk-9876543210abcdef"` | Masked output `"ig-****cdef"`; full raw secret never exposed. |
| **T1.6.2** | Short API Key Masking Resilience | `api_key: "ig-12345"` | Masked output `"ig-****2345"` without substring out-of-bounds error. |
| **T1.6.3** | Zero Raw Key Echo in Response Body | Secret API key in request | Complete response JSON audited: raw secret key does NOT appear. |
| **T1.6.4** | Secure Upstream Authorization Header | `api_key: "ig-test-key-5544"` | Upstream fetch receives `Authorization: Bearer ig-test-key-5544`. |
| **T1.6.5** | Log Audit Key Redaction Sanitization | Security audit log builder | Audit log contains `api_key_masked`, never raw key. |
| **T1.7.1** | SHA-256 Hash Digest Creation | `api_key: "ig-test-audit-key-8899"` | Digest length is exactly 64 hexadecimal characters. |
| **T1.7.2** | Deterministic SHA-256 Hash Invariance | Identical API key hashed twice | Both digest strings match identically ($h_1 = h_2$). |
| **T1.7.3** | Empty / Omitted Key Safe Hashing | Empty string `""` | Returns safe 64-char hash without throwing. |
| **T1.7.4** | Case Sensitivity in Key Hashing | `"ig-Key-Upper"` vs `"ig-key-upper"` | Different SHA-256 digests generated ($h_1 \neq h_2$). |
| **T1.7.5** | Audit Log Schema Verification | Audit log generation | Asserts `timestamp`, `request_id`, `api_key_sha256` keys exist. |
| **T1.8.1** | Unified Schema Top-Level Contract | Standard request | Validates `status`, `request_id`, `pincode_valid`, `location`, `museum_linked_artifacts`, `total_artifacts_found`, `tts`, `errors`. |
| **T1.8.2** | Malformed PIN Error Code | `{ pincode: "1100" }` | HTTP 400; `status: "error"`; `errors[0].code === "INVALID_PINCODE_FORMAT"`. |
| **T1.8.3** | Missing Required Pincode Field | `{}` | HTTP 400; `status: "error"`; `errors[0].code === "MISSING_REQUIRED_FIELD"`. |
| **T1.8.4** | Missing API Key for TTS Mode | `response_format: "tts"`, no key | HTTP 400; `status: "error"`; `errors[0].code === "TTS_AUTH_ERROR"`. |
| **T1.8.5** | Non-Fatal Partial Degradation | Valid data + upstream TTS 503 | HTTP 200/207; `status: "partial"`; location/artifacts intact; error logged. |

---

### Tier 2: Boundary & Corner Cases (30 Tests)
| Test ID | Test Name | Input / Malicious Payload | Expected Behavior & Assertions |
|---|---|---|---|
| **T2.1.1** | 5-Digit PIN (Too Short) | `{ pincode: "11001" }` | HTTP 400; `pincode_valid: false`; geocoding not invoked. |
| **T2.1.2** | 7-Digit PIN (Too Long) | `{ pincode: "1100011" }` | HTTP 400; `pincode_valid: false`. |
| **T2.1.3** | Leading Zero Disallowed in Indian PIN | `{ pincode: "011001" }` | HTTP 400; `pincode_valid: false` (Indian PINs start with 1-9). |
| **T2.1.4** | Alphanumeric Mixed Characters | `{ pincode: "11001A" }` | HTTP 400; `pincode_valid: false`. |
| **T2.1.5** | Prototype Pollution Injection | `{ pincode: "__proto__" }` | HTTP 400; `pincode_valid: false`; prototype remains clean. |
| **T2.2.1** | Unassigned 9-Series PIN | `{ pincode: "999999" }` | HTTP 404; `pincode_valid: false`; `errors[0].code === "PINCODE_NOT_FOUND"`. |
| **T2.2.2** | External Geocoder HTTP 500 | Nominatim returns 500 | Fallback to postal circle centroid; HTTP 200 resolved. |
| **T2.2.3** | Geocoder Socket Timeout | Nominatim hangs / aborts | Graceful fallback to district centroid; 0 uncaught errors. |
| **T2.2.4** | External Geocoder Malformed HTML | Geocoder returns HTML 502 page | Parser error caught; fallback to next tier. |
| **T2.2.5** | Equator / Null Island Anomaly | Geocoder returns `(0.0, 0.0)` | Bounds validator rejects coordinates outside India ($6^\circ\text{–}38^\circ\text{N}$). |
| **T2.3.1** | Missing `provenance_date` Field | `provenance_date: ""` | `data_quality.is_complete === false`; `missing_fields` has `"provenance_date"`. |
| **T2.3.2** | Empty `digital_asset_urls` Array | `digital_asset_urls: []` | `data_quality.is_complete === false`; `missing_fields` has `"digital_asset_urls"`. |
| **T2.3.3** | Missing `exhibit_location` Field | `exhibit_location: ""` | `data_quality.is_complete === false`; `missing_fields` has `"exhibit_location"`. |
| **T2.3.4** | Fully Populated Complete Record | All 10 fields populated | `data_quality.is_complete === true`; `missing_fields: []`. |
| **T2.3.5** | Truncated Description Depth Check | Description `"Coin."` | `data_quality.is_complete === false` for brief descriptions. |
| **T2.4.1** | Curator Email Address Redaction | `"curator.ramesh@asi.gov.in"` | Output: `"[EMAIL REDACTED]"`. |
| **T2.4.2** | Indian Phone Numbers Redaction | `"+91-9876543210 / 011-23019272"` | Output: `"[PHONE REDACTED] / [PHONE REDACTED]"`. |
| **T2.4.3** | Government ID / PAN Redaction | `"PAN: ABCDE1234F"` | Output: `"PAN: [ID REDACTED]"`. |
| **T2.4.4** | Residential vs Museum Address | Private apartment address in text | Private address redacted; institutional museum name preserved. |
| **T2.4.5** | Ancient Historical Names Preservation | `"Raja Raja Chola", "Ernest Mackay"` | Names preserved verbatim; 0 false positive redactions. |
| **T2.5.1** | HTTP 429 Rate Limit -> Retry 2 Success | 1st call 429 (`Retry-After: 0.1`), 2nd 200 | Backoff triggered; 2 total calls; returns HTTP 200 with audio. |
| **T2.5.2** | HTTP 500 Error -> Retry 3 Success | 1st & 2nd call 500, 3rd call 200 | Exponential backoff $(100\text{ms} \rightarrow 200\text{ms})$; returns HTTP 200. |
| **T2.5.3** | Persistent HTTP 503 Partial Fallback | 4 consecutive 503 responses | HTTP 200/207; `status: "partial"`; location/artifacts intact. |
| **T2.5.4** | TTS Socket Timeout Degradation | TTS mock hangs indefinitely | Request aborts; returns non-fatal partial fallback with data. |
| **T2.5.5** | Non-Retryable HTTP 400 Bad Request | Upstream returns 400 | Immediate failure without retry loop; returns partial fallback. |
| **T2.6.1** | Invalid API Key (HTTP 401) | `api_key: "ig-invalid-key"` | HTTP 200/207; `status: "partial"`; `errors[0].code === "TTS_AUTH_ERROR"`. |
| **T2.6.2** | Revoked API Key (HTTP 403) | `api_key: "ig-revoked-key"` | HTTP 200/207; `status: "partial"`; `errors[0].code === "API_KEY_REVOKED"`. |
| **T2.6.3** | Whitespace-Only API Key | `api_key: "     "`, mode `tts` | HTTP 400; `status: "error"`; 0 upstream TTS calls. |
| **T2.6.4** | Missing "ig-" Prefix Validation | `api_key: "sk-invalid-prefix-1234"` | Handled cleanly; 0 uncaught exceptions. |
| **T2.6.5** | Null / Undefined Key in `tts` Mode | `api_key: null`, mode `tts` | HTTP 400; `status: "error"`. |

---

### Tier 3: Cross-Feature Interactions (12 Pairwise Tests)
| Test ID | PIN State | Artifacts | Mode | TTS / Auth State | Expected System Behavior |
|---|---|---|---|---|---|
| **T3.1** | Valid PIN (`110001`) | 0 Artifacts | `both` | Valid Key (200 OK) | Resolves Connaught Place; `total_artifacts_found: 0`; audio guide generated; HTTP 200 `status: "success"`. |
| **T3.2** | Valid PIN (`700016`) | Multi-Artifact (Indian Museum) | `both` | Invalid Key (401) | Resolves Park Street; returns artifacts; `status: "partial"`; auth error logged. |
| **T3.3** | Multi-Match PIN (`560001`) | Sub-Office Artifacts | `both` | Valid Key (200 OK) | Location resolved; audio synthesized; HTTP 200. |
| **T3.4** | Malformed PIN (`"11001"`) | N/A (Validation Fail) | `tts` | Valid Key | Immediate HTTP 400 `INVALID_PINCODE_FORMAT`; **0 calls made to TTS service**. |
| **T3.5** | Valid PIN (`600008`) | Incomplete Record | `both` | Valid Key (200 OK) | `data_quality` flags attached; narration skips missing fields without saying `"undefined"`. |
| **T3.6** | Valid PIN (`400023`) | Artifact with PII | `both` | Valid Key (200 OK) | Text contains `[PHONE REDACTED]`; audio transcript reads sanitized text. |
| **T3.7** | Valid PIN (`500002`) | Single Exact Artifact | `text` | No Key Provided | HTTP 200; returns location & artifact data; `tts: null`; 0 errors for omitted key. |
| **T3.8** | Valid PIN (`302004`) | Multi-Artifact | `tts` | Upstream 500 $\rightarrow$ Retry | Backoff succeeds on 2nd attempt; returns HTTP 200 with audio payload. |
| **T3.9** | Non-existent PIN (`"999999"`) | N/A (Geocoding Fail) | `both` | Valid Key | HTTP 404 `PINCODE_NOT_FOUND`; **0 calls made to TTS service**. |
| **T3.10** | Valid PIN (`221007`) | Sarnath Relics | `both` | Valid Key + Lang: `"hi-IN"` | Generates Hindi narrative text; `language_used: "hi-IN"`. |
| **T3.11** | Valid PIN (`793008`) | North-East Artifacts | `both` | Upstream Persistent 503 | Resolves Shillong; returns artifacts; `status: "partial"`; error logged. |
| **T3.12** | Valid PIN (`382230`) | Lothal Harappan | `text` | Invalid Key in Payload | Mode is `text`, key ignored; returns HTTP 200 with complete artifacts. |

---

### Tier 4: Real-World Scenarios (5 Workloads)
| Test ID | Scenario & Target Location | Language & Voice | Key Workload Flow & Assertions |
|---|---|---|---|
| **T4.1** | **PIN 110001**: New Delhi Central Heritage Corridor | `en-IN`, `en-IN-Standard-A` | Resolves Connaught Place; 0 artifacts found; compiles architectural audio guide; HTTP 200 `status: "success"`. |
| **T4.2** | **PIN 700016**: Park Street, Kolkata (Indian Museum) | `bn-IN` (Bengali) | Resolves Indian Museum; returns authentic artifacts; scrubs donor PII; Bengali audio guide synthesized. |
| **T4.3** | **PIN 400001**: Fort / Mumbai GPO (CSMVS Museum) | `mr-IN` (Marathi) | Simulates upstream 429 rate limit; triggers backoff retry; succeeds on attempt 2 with Marathi audio. |
| **T4.4** | **PIN 500002**: Darulshifa, Hyderabad (Salar Jung) | `en-IN` | Resolves Salar Jung Museum; retrieves Veiled Rebecca & Jahangir daggers; audio narration covers complete provenance. |
| **T4.5** | **PIN 600008**: Egmore, Chennai (Government Museum) | `ta-IN` (Tamil) | Resolves Egmore; retrieves 10th-century Chola Bronzes (Nataraja); Tamil audio guide returned with metadata. |

---

## 4. Verification Check

```bash
# 1. Run Backend Service E2E Test Suite
npx tsx tests/e2e/e2e_backend_runner.ts

# 2. Run TypeScript Type Check
npx tsc --noEmit
```
