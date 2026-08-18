/**
 * Core TypeScript definitions for the Heritage & Museum PIN Code Backend Service.
 * Defines request, response, location, artifact, TTS, and error taxonomy contracts.
 */

// ==========================================
// 1. Error Taxonomy & Status Codes
// ==========================================

export type ErrorCode =
  | 'INVALID_PINCODE_FORMAT'
  | 'MISSING_REQUIRED_FIELD'
  | 'UNSUPPORTED_RESPONSE_FORMAT'
  | 'PINCODE_NOT_FOUND'
  | 'TTS_AUTH_ERROR'
  | 'TTS_GENERATION_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface ServiceError {
  code: ErrorCode | string;
  message: string;
  details?: Record<string, unknown> | null;
  retryable: boolean;
}

export type ErrorDetail = ServiceError;

// ==========================================
// 2. Geographic & Location Data Models
// ==========================================

export type SourceTier = 'in_memory_db' | 'national_directory' | 'external_geocoder';

export interface LocationCandidate {
  area: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  confidence?: number;
}

export interface LocationData {
  lat: number;
  lng: number;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  source_tier: SourceTier;
  location_candidates?: LocationCandidate[] | null;
  disambiguation_hint?: string | null;
}

export interface GeocodingResult {
  success: boolean;
  status: 'success' | 'partial' | 'error';
  location: LocationData | null;
  error?: ServiceError | null;
}

export interface GeocodingOptions {
  countryCode?: string;
  allowExternal?: boolean;
  timeoutMs?: number;
  customFetch?: typeof fetch;
  bypassCache?: boolean;
}

export interface GeocodingCacheStats {
  size: number;
  maxCapacity: number;
  hits: number;
  misses: number;
  hitRatio: number;
}

// ==========================================
// 3. Artifact Data Models
// ==========================================

export interface LicensingInfo {
  license: string;
  attribution_required: boolean;
  rights_holder: string;
  url?: string;
}

export interface DataQuality {
  is_complete: boolean;
  missing_fields: string[];
}

export interface StandardizedArtifact {
  artifact_id: string;
  title: string;
  description: string;
  museum_name: string;
  museum_id: string;
  pincode: string;
  exhibit_location: string;
  digital_asset_urls: string[];
  provenance_date: string;
  licensing_info: LicensingInfo;
  data_quality: DataQuality;
}

export interface ArtifactQueryResult {
  artifacts: StandardizedArtifact[];
  museum_linked_artifacts?: StandardizedArtifact[];
  totalFound: number;
  total_artifacts_found?: number;
  pincodeMatched?: boolean;
  explicitNoMatchMessage?: string | null;
  message?: string | null;
}

// ==========================================
// 4. TTS (Text-to-Speech) Audio Models
// ==========================================

export type AudioFormat = 'audio/mp3' | 'audio/wav' | 'audio/aac' | string;

export interface TTSPayload {
  audio_base64: string;
  format: AudioFormat;
  duration_seconds: number | null;
  voice: string;
  language: string;
  character_count: number;
  generated_at: string;
  narration_text: string;
}

export type TTSData = TTSPayload;

export interface TTSOptions {
  apiKey?: string;
  voice?: string;
  language?: string;
  speed?: number;
  timeoutMs?: number;
  maxRetries?: number;
  customFetch?: typeof fetch;
}

export interface TTSResult {
  success: boolean;
  tts: TTSPayload | null;
  error?: ServiceError | null;
}

// ==========================================
// 5. Service Request & Response Contracts
// ==========================================

export type ResponseFormat = 'text' | 'tts' | 'both';

export interface PincodeRequest {
  pincode: string;
  response_format?: ResponseFormat;
  api_key?: string;
  voice?: string;
  language?: string;
  max_artifacts?: number;
  country_code?: string;
}

export type HeritageServiceRequest = PincodeRequest;

export type ResponseStatus = 'success' | 'partial' | 'error';

export interface HeritageServiceResponse {
  status: ResponseStatus;
  request_id: string;
  pincode_valid: boolean;
  location: LocationData | null;
  museum_linked_artifacts: StandardizedArtifact[];
  total_artifacts_found: number;
  tts: TTSPayload | null;
  errors: ServiceError[];
}

export type PincodeResponse = HeritageServiceResponse;

// ==========================================
// 6. Security & Audit Logging Types
// ==========================================

export interface SecurityAuditLog {
  timestamp: string;
  request_id: string;
  pincode: string;
  api_key_masked: string;
  api_key_sha256: string;
  action: string;
  status: ResponseStatus;
  response_format: ResponseFormat;
  duration_ms: number;
  errors_count: number;
}
