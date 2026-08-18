/**
 * Mock IG API Text-to-Speech (TTS) Provider Factory
 * Simulates upstream Indian Governance / IG API TTS service responses,
 * retry behavior under transient 429 / 500 / 503 errors, auth errors (401/403),
 * socket timeouts, and base64 audio synthesis.
 */

import { MockHandler } from './fetch_interceptor';

export interface IgTtsRequestBody {
  text?: string;
  input?: { text: string };
  voice?: string;
  language?: string;
  language_code?: string;
  audio_config?: { audio_encoding?: string; speaking_rate?: number };
  format?: string;
  api_key?: string;
}

export interface IgTtsCapturedCall {
  url: string;
  headers: Record<string, string>;
  authHeader?: string;
  apiKeyExtracted?: string;
  body: IgTtsRequestBody;
  rawBody: string;
  timestamp: number;
}

export interface IgTtsMockState {
  callCount: number;
  requestHistory: IgTtsCapturedCall[];
  transientFailuresRemaining: number;
  transientStatusCode: number;
  transientErrorCode: string;
  persistentErrorStatus: number | null;
  persistentErrorCode: string | null;
  simulateTimeout: boolean;
  simulateMalformedResponse: boolean;
  fixedDurationSeconds: number;
  customVoiceUsed?: string;
  customLanguageUsed?: string;
}

const state: IgTtsMockState = {
  callCount: 0,
  requestHistory: [],
  transientFailuresRemaining: 0,
  transientStatusCode: 500,
  transientErrorCode: 'INTERNAL_SERVER_ERROR',
  persistentErrorStatus: null,
  persistentErrorCode: null,
  simulateTimeout: false,
  simulateMalformedResponse: false,
  fixedDurationSeconds: 45,
};

// Generates a mock MP3 base64 string
export function generateMockAudioBase64(text: string, seed = 'audio-frame'): string {
  const content = `ID3-AUDIO-STREAM:${seed}:${text.slice(0, 32)}`;
  return Buffer.from(content).toString('base64').padEnd(64, 'A');
}

/**
 * Creates the IG API TTS HTTP request interceptor handler.
 */
export function createIgTtsMockHandler(): MockHandler {
  return (url: string, init?: RequestInit, capturedReq?: any) => {
    // Match IG API TTS endpoints
    if (
      url.includes('/tts') ||
      url.includes('api.ig.gov') ||
      url.includes('api.indian-governance.gov.in') ||
      url.includes('text-to-speech') ||
      url.includes('/audio/speech')
    ) {
      state.callCount++;

      let rawBody = capturedReq?.body || (typeof init?.body === 'string' ? init.body : '') || '';
      let body: IgTtsRequestBody = {};
      try {
        body = JSON.parse(rawBody);
      } catch {
        // Non-JSON or empty body
      }

      const headers = capturedReq?.headers || {};
      const authHeader = headers['authorization'] || headers['x-api-key'] || '';
      let apiKeyExtracted = body.api_key || '';
      if (!apiKeyExtracted && authHeader) {
        apiKeyExtracted = authHeader.replace(/^Bearer\s+/i, '').trim();
      }

      state.requestHistory.push({
        url,
        headers,
        authHeader,
        apiKeyExtracted,
        body,
        rawBody,
        timestamp: Date.now(),
      });

      // 1. Simulate Socket Timeout
      if (state.simulateTimeout) {
        const error = new Error('The operation was aborted (TTS socket timeout)');
        error.name = 'AbortError';
        throw error;
      }

      // 2. Simulate Malformed Response
      if (state.simulateMalformedResponse) {
        return new Response('<html>502 Bad Gateway</html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // 3. Check for Key Validation / Auth simulation
      if (apiKeyExtracted === 'ig-invalid-key' || apiKeyExtracted.includes('invalid')) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired IG API key provided.',
            },
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (apiKeyExtracted === 'ig-revoked-key' || apiKeyExtracted.includes('revoked')) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'FORBIDDEN',
              message: 'IG API key has been revoked or quota exceeded.',
            },
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 4. Check for Persistent Error
      if (state.persistentErrorStatus !== null) {
        return new Response(
          JSON.stringify({
            error: {
              code: state.persistentErrorCode || 'TTS_SERVICE_UNAVAILABLE',
              message: 'Persistent upstream TTS failure.',
            },
          }),
          {
            status: state.persistentErrorStatus,
            headers: {
              'Content-Type': 'application/json',
              ...(state.persistentErrorStatus === 429 ? { 'Retry-After': '1' } : {}),
            },
          }
        );
      }

      // 5. Check for Transient Failures (Backoff simulation)
      if (state.transientFailuresRemaining > 0) {
        state.transientFailuresRemaining--;
        const status = state.transientStatusCode;
        const code = state.transientErrorCode;
        return new Response(
          JSON.stringify({
            error: {
              code,
              message: `Transient TTS failure (${status}). Please retry.`,
            },
          }),
          {
            status,
            headers: {
              'Content-Type': 'application/json',
              ...(status === 429 ? { 'Retry-After': '0.1' } : {}),
            },
          }
        );
      }

      // 6. Success Response
      const textToSpeak = body.text || body.input?.text || 'Museum archival narration audio';
      const voiceUsed = state.customVoiceUsed || body.voice || 'en-IN-Standard-A';
      const langUsed = state.customLanguageUsed || body.language || body.language_code || 'en-IN';
      const audioBase64 = generateMockAudioBase64(textToSpeak, voiceUsed);
      const duration = state.fixedDurationSeconds;

      return new Response(
        JSON.stringify({
          audio_content: audioBase64,
          audio_base64: audioBase64,
          format: 'audio/mp3',
          duration_seconds: duration,
          duration: duration,
          voice: voiceUsed,
          voice_used: voiceUsed,
          language: langUsed,
          language_used: langUsed,
          character_count: textToSpeak.length,
          generated_at: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return null;
  };
}

/**
 * Resets IG TTS mock state and history.
 */
export function resetIgTtsMock() {
  state.callCount = 0;
  state.requestHistory = [];
  state.transientFailuresRemaining = 0;
  state.transientStatusCode = 500;
  state.transientErrorCode = 'INTERNAL_SERVER_ERROR';
  state.persistentErrorStatus = null;
  state.persistentErrorCode = null;
  state.simulateTimeout = false;
  state.simulateMalformedResponse = false;
  state.fixedDurationSeconds = 45;
  delete state.customVoiceUsed;
  delete state.customLanguageUsed;
}

/**
 * Configures transient failures that recover after N attempts.
 */
export function configureTransientFailures(
  failuresBeforeSuccess: number,
  statusCode = 500,
  errorCode = 'INTERNAL_ERROR'
) {
  state.transientFailuresRemaining = failuresBeforeSuccess;
  state.transientStatusCode = statusCode;
  state.transientErrorCode = errorCode;
}

/**
 * Configures persistent errors (never recovers).
 */
export function configurePersistentError(statusCode: number, errorCode: string) {
  state.persistentErrorStatus = statusCode;
  state.persistentErrorCode = errorCode;
}

/**
 * Configures socket timeout simulation.
 */
export function configureTimeout(enable: boolean) {
  state.simulateTimeout = enable;
}

export function getIgTtsCallCount(): number {
  return state.callCount;
}

export function getIgTtsRequestHistory(): IgTtsCapturedCall[] {
  return [...state.requestHistory];
}
