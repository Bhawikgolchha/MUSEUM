/**
 * Upstream IG API Text-to-Speech (TTS) Client Service
 *
 * Handles spoken narrative construction, upstream IG REST API calls,
 * exponential backoff retries with full jitter, AbortController timeouts,
 * audio Base64 formatting, and graceful non-fatal partial degradation.
 */

import { logger, maskApiKey, hashApiKey } from './logger';
import {
  TTSPayload,
  ServiceError,
  LocationData,
  StandardizedArtifact,
  TTSResult,
} from './types';

export type { TTSPayload, ServiceError, LocationData, StandardizedArtifact, TTSResult };

export interface LocationDataInput {
  area?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export interface ArtifactInput {
  artifact_id?: string;
  id?: string;
  title: string;
  description: string;
  museum_name: string;
  provenance_date?: string;
  pincode?: string;
}

export interface TTSServiceError extends ServiceError {
  code: 'TTS_AUTH_ERROR' | 'TTS_GENERATION_FAILED';
}

export interface SynthesizeAudioOptions {
  apiKey?: string | null;
  voice?: string;
  language?: string;
  speed?: number;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  endpoint?: string;
  requestId?: string;
  pincode?: string;
  fetchFn?: typeof fetch;
  customFetch?: typeof fetch;
}

const DEFAULT_ENDPOINT = process.env.IG_TTS_ENDPOINT || 'https://api.ig.gov/v1/audio/speech';
const DEFAULT_TIMEOUT_MS = parseInt(process.env.IG_TTS_TIMEOUT_MS || '5000', 10);
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 250;
const DEFAULT_MAX_DELAY_MS = 4000;
const DEFAULT_VOICE = 'alloy';
const DEFAULT_LANGUAGE = 'en-IN';
const DEFAULT_MODEL = 'ig-tts-1';

/**
 * Composes natural language spoken narrative from location and artifact records.
 * Falls back to clean location overview when zero artifacts are present.
 */
export function composeNarrationText(
  location: LocationDataInput,
  artifacts: ArtifactInput[] = []
): string {
  const locName = location.area || location.city || 'Heritage Site';
  const stateStr = location.state ? `, ${location.state}` : '';
  const pinStr = location.pincode ? `, postal PIN ${location.pincode}` : '';
  const locPrefix = `Welcome to ${locName}${stateStr}${pinStr}.`;

  if (!artifacts || artifacts.length === 0) {
    const cityStr = location.city || 'this area';
    return `${locPrefix} No museum-linked artifacts were found for this specific pincode. You are exploring the heritage zone of ${cityStr}.`;
  }

  const count = artifacts.length;
  const countStr = count === 1 ? '1 museum masterwork' : `${count} museum masterworks`;

  const topArtifacts = artifacts.slice(0, 3).map((art, idx) => {
    const title = art.title || 'Untitled Masterwork';
    const museum = art.museum_name ? ` at ${art.museum_name}` : '';
    const date = art.provenance_date ? `, dated ${art.provenance_date}` : '';
    const rawDesc = art.description ? art.description.replace(/\s+/g, ' ').trim() : '';
    const desc = rawDesc.length > 150 ? `${rawDesc.slice(0, 150)}...` : rawDesc;
    return `Masterwork ${idx + 1}: ${title}${museum}${date}. ${desc}`;
  });

  return `${locPrefix} Found ${countStr} located at this postal code. ${topArtifacts.join(' ')}`;
}

/**
 * Sleep helper for exponential backoff delay.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates exponential backoff delay with random jitter.
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number = DEFAULT_BASE_DELAY_MS,
  maxDelayMs: number = DEFAULT_MAX_DELAY_MS
): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * (baseDelayMs * 0.5);
  return Math.min(maxDelayMs, Math.round(exponential + jitter));
}

/**
 * Checks if an HTTP status code or error is transient and retryable.
 */
function isTransientStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * Synthesizes audio using the IG Text-to-Speech REST API.
 * Encapsulates exponential backoff, timeout handling, and partial degradation.
 */
export async function synthesizeSpeech(
  narrationText: string,
  options: SynthesizeAudioOptions = {}
): Promise<TTSResult> {
  const apiKey = options.apiKey?.trim();
  const voice = options.voice || DEFAULT_VOICE;
  const language = options.language || DEFAULT_LANGUAGE;
  const speed = options.speed ?? 1.0;
  const model = options.model || DEFAULT_MODEL;
  const endpoint = options.endpoint || DEFAULT_ENDPOINT;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const requestId = options.requestId;
  const pincode = options.pincode;
  const fetchClient = options.fetchFn || options.customFetch || globalThis.fetch;

  // 1. Validate API Key Presence
  if (!apiKey) {
    logger.security('TTS request missing API key', {
      requestId,
      pincode,
      voice,
      language,
    });
    return {
      success: false,
      tts: null,
      error: {
        code: 'TTS_AUTH_ERROR',
        message: 'Missing or invalid IG API key. A valid API key is required for text-to-speech synthesis.',
        details: { missing_field: 'api_key' },
        retryable: false,
      },
    };
  }

  // 2. Audit Log Request Initiation (Never logs raw key)
  logger.audit('TTS_SYNTHESIS_ATTEMPT', {
    apiKey,
    pincode,
    requestId,
    voice,
    language,
    characterCount: narrationText.length,
  });

  const requestPayload = {
    model,
    input: narrationText,
    voice,
    response_format: 'mp3',
    language,
    speed,
  };

  let lastError: Error | null = null;
  let lastStatus = 0;
  let retryCount = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      if (attempt > 0) {
        retryCount = attempt;
        const delay = calculateBackoffDelay(attempt - 1, baseDelayMs, maxDelayMs);
        logger.warn(
          `IG TTS transient error on attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`,
          {
            apiKeyMasked: maskApiKey(apiKey),
            status: lastStatus,
            attempt,
            delayMs: delay,
            requestId,
          }
        );
        await sleep(delay);
      }

      const response = await fetchClient(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg, audio/mp3, application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const status = response.status;
      lastStatus = status;

      // SUCCESS PATH (HTTP 200 / 201)
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let audioBase64 = '';

        if (contentType.includes('application/json')) {
          const jsonBody = (await response.json()) as Record<string, unknown>;
          audioBase64 =
            (jsonBody.audio_base64 as string) ||
            (jsonBody.audio as string) ||
            (jsonBody.data as string) ||
            '';
        } else {
          // Binary audio buffer
          const arrayBuffer = await response.arrayBuffer();
          audioBase64 = Buffer.from(arrayBuffer).toString('base64');
        }

        const durationSeconds = Math.max(
          1.0,
          Math.round((narrationText.length / 15) * 10) / 10
        );

        const ttsPayload: TTSPayload = {
          audio_base64: audioBase64,
          format: 'audio/mp3',
          duration_seconds: durationSeconds,
          voice,
          language,
          character_count: narrationText.length,
          generated_at: new Date().toISOString(),
          narration_text: narrationText,
        };

        logger.audit('TTS_SYNTHESIS_SUCCESS', {
          apiKey,
          pincode,
          requestId,
          voice,
          language,
          durationSeconds,
          attempts: attempt + 1,
        });

        return {
          success: true,
          tts: ttsPayload,
          error: null,
        };
      }

      // PERMANENT AUTH ERRORS (HTTP 401 / 403)
      if (status === 401 || status === 403) {
        logger.security('IG TTS upstream authentication rejected', {
          apiKeyMasked: maskApiKey(apiKey),
          apiKeySha256: hashApiKey(apiKey),
          status,
          requestId,
        });

        return {
          success: false,
          tts: null,
          error: {
            code: 'TTS_AUTH_ERROR',
            message: 'Upstream IG API key authentication failed. The provided key is invalid or expired.',
            details: { upstream_status: status, retryable: false },
            retryable: false,
          },
        };
      }

      // PERMANENT BAD REQUEST (HTTP 400)
      if (status === 400) {
        let errDetails = 'Invalid request parameters to IG TTS upstream.';
        try {
          const errJson = (await response.json()) as Record<string, unknown>;
          if (errJson && errJson.message) {
            errDetails = String(errJson.message);
          }
        } catch {
          // Ignore JSON parse errors
        }

        return {
          success: false,
          tts: null,
          error: {
            code: 'TTS_GENERATION_FAILED',
            message: errDetails,
            details: { upstream_status: 400, retryable: false },
            retryable: false,
          },
        };
      }

      // TRANSIENT STATUS CODES (429, 500, 502, 503, 504)
      if (isTransientStatus(status)) {
        if (attempt < maxRetries) {
          continue; // Loop to next backoff attempt
        }
      }

      // If status is not transient and not ok, break retry loop
      break;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = (err as Error)?.name === 'AbortError' || controller.signal.aborted;

      if (isAbort) {
        logger.warn(`IG TTS request timed out after ${timeoutMs}ms (attempt ${attempt + 1}/${maxRetries + 1})`, {
          requestId,
          pincode,
          timeoutMs,
        });
        lastError = new Error(`Upstream TTS timeout exceeded ${timeoutMs}ms`);
      } else {
        lastError = err instanceof Error ? err : new Error(String(err));
        logger.warn(`IG TTS network error on attempt ${attempt + 1}: ${lastError.message}`, {
          requestId,
        });
      }

      if (attempt < maxRetries) {
        continue;
      }
    }
  }

  // If retries exhausted or non-retryable error occurred:
  const failureMessage = lastError
    ? lastError.message
    : `IG API Text-to-Speech service unavailable after ${retryCount + 1} attempt(s) (upstream status: ${lastStatus || 'network_failure'}).`;

  logger.error('IG TTS generation failed after retries', lastError || new Error(`Status ${lastStatus}`), {
    apiKeyMasked: maskApiKey(apiKey),
    pincode,
    requestId,
    attempts: retryCount + 1,
    lastStatus,
  });

  return {
    success: false,
    tts: null,
    error: {
      code: 'TTS_GENERATION_FAILED',
      message: failureMessage,
      details: {
        upstream_status: lastStatus || undefined,
        attempts: retryCount + 1,
        retryable: true,
      },
      retryable: true,
    },
  };
}

/**
 * Unified helper that composes narration from location and artifacts,
 * and calls synthesizeSpeech with graceful fallback.
 */
export async function generateHeritageTTS(
  location: LocationDataInput,
  artifacts: ArtifactInput[] = [],
  options: SynthesizeAudioOptions = {}
): Promise<TTSResult> {
  const narrationText = composeNarrationText(location, artifacts);
  return synthesizeSpeech(narrationText, {
    ...options,
    pincode: options.pincode || location.pincode,
  });
}

/**
 * Class wrapper for IG TTS Client with preconfigured credentials & settings.
 */
export class IGTTSClient {
  private defaultOptions: SynthesizeAudioOptions;

  constructor(options: SynthesizeAudioOptions = {}) {
    this.defaultOptions = options;
  }

  async synthesize(text: string, overrideOptions?: SynthesizeAudioOptions): Promise<TTSResult> {
    return synthesizeSpeech(text, { ...this.defaultOptions, ...overrideOptions });
  }

  async generateForHeritage(
    location: LocationDataInput,
    artifacts: ArtifactInput[] = [],
    overrideOptions?: SynthesizeAudioOptions
  ): Promise<TTSResult> {
    return generateHeritageTTS(location, artifacts, { ...this.defaultOptions, ...overrideOptions });
  }
}
