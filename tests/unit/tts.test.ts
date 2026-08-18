/**
 * Unit Test Suite for Milestone 3: IG API TTS Client, Backoff & Security Logger
 *
 * Verifies:
 * 1. Security key masking and redaction (ig-****xxxx, ****xxxx)
 * 2. Deterministic SHA-256 audit hashing
 * 3. Deep object sanitization and zero credential leakage
 * 4. Structured audit and security logger methods
 * 5. Spoken narrative text construction (single/multiple/zero artifacts)
 * 6. Exponential backoff and full jitter math
 * 7. Upstream IG TTS client invocation with binary audio and JSON payloads
 * 8. Immediate non-retryable auth rejection (401/403)
 * 9. Transient error backoff recovery (429/500/503)
 * 10. Max retries exhaustion resulting in graceful partial failure
 * 11. AbortController request timeout handling
 * 12. Non-fatal partial degradation schema conformance
 */

import * as crypto from 'crypto';
import {
  maskApiKey,
  hashApiKey,
  sanitizeLogData,
  logger,
  SecurityLogger,
} from '../../lib/services/logger';
import {
  composeNarrationText,
  calculateBackoffDelay,
  synthesizeSpeech,
  generateHeritageTTS,
  IGTTSClient,
  LocationDataInput,
  ArtifactInput,
} from '../../lib/services/tts';

// Visual formatting helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message} | Expected: ${expectedStr}, got: ${actualStr}`);
  }
}

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ${colors.green}✔${colors.reset} ${name}`);
  } catch (err: unknown) {
    failedTests++;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ${colors.red}✖${colors.reset} ${name}`);
    console.error(`    ${colors.red}${msg}${colors.reset}`);
  }
}

async function runAllTests(): Promise<void> {
  console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  Running Milestone 3 Unit Tests (TTS & Security)    ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

  // ==========================================================
  // 1. API Key Masking & Security
  // ==========================================================
  console.log(`${colors.bold}--- 1. API Key Masking & Redaction ---${colors.reset}`);

  await test('maskApiKey: standard ig- live key', () => {
    const raw = 'ig-live-9876543210abcdef';
    const masked = maskApiKey(raw);
    assertEqual(masked, 'ig-****cdef', 'Standard IG key should mask body and keep last 4 chars');
  });

  await test('maskApiKey: short ig- key', () => {
    const raw = 'ig-key-1234';
    const masked = maskApiKey(raw);
    assertEqual(masked, 'ig-****1234', 'IG key with suffix should preserve last 4 chars');
  });

  await test('maskApiKey: very short ig- key', () => {
    const raw = 'ig-12';
    const masked = maskApiKey(raw);
    assertEqual(masked, 'ig-****', 'Short IG key under 4 char body should mask completely');
  });

  await test('maskApiKey: non-ig standard secret key', () => {
    const raw = 'sk-proj-abcdef1234567890';
    const masked = maskApiKey(raw);
    assertEqual(masked, '****7890', 'Non-IG standard key should mask to **** + last 4 chars');
  });

  await test('maskApiKey: medium length key (4-7 chars)', () => {
    const raw = 'abcde';
    const masked = maskApiKey(raw);
    assertEqual(masked, '****de', 'Medium key should mask to **** + last 2 chars');
  });

  await test('maskApiKey: short key (< 4 chars)', () => {
    const raw = 'abc';
    const masked = maskApiKey(raw);
    assertEqual(masked, '****', 'Short key under 4 chars should mask to ****');
  });

  await test('maskApiKey: null, undefined, empty string', () => {
    assertEqual(maskApiKey(''), '[EMPTY_KEY]', 'Empty string should return [EMPTY_KEY]');
    assertEqual(maskApiKey('   '), '[EMPTY_KEY]', 'Whitespace string should return [EMPTY_KEY]');
    assertEqual(maskApiKey(null), '[EMPTY_KEY]', 'Null should return [EMPTY_KEY]');
    assertEqual(maskApiKey(undefined), '[EMPTY_KEY]', 'Undefined should return [EMPTY_KEY]');
  });

  // ==========================================================
  // 2. SHA-256 Cryptographic Audit Hashing
  // ==========================================================
  console.log(`\n${colors.bold}--- 2. SHA-256 Audit Hashing ---${colors.reset}`);

  await test('hashApiKey: computes valid 64-character hex digest', () => {
    const raw = 'ig-live-sample-api-key-1234';
    const expected = crypto.createHash('sha256').update(raw).digest('hex');
    const hash = hashApiKey(raw);
    assertEqual(hash, expected, 'Hash must match crypto.createHash output');
    assert(/^[a-f0-9]{64}$/.test(hash), 'Hash must be 64 lowercase hex characters');
  });

  await test('hashApiKey: trims surrounding whitespace before hashing', () => {
    const rawWithSpaces = '   ig-secret-key-123   ';
    const rawClean = 'ig-secret-key-123';
    assertEqual(hashApiKey(rawWithSpaces), hashApiKey(rawClean), 'Trimming must produce matching hash');
  });

  await test('hashApiKey: different keys produce distinct hashes', () => {
    const hash1 = hashApiKey('ig-key-alpha');
    const hash2 = hashApiKey('ig-key-beta');
    assert(hash1 !== hash2, 'Distinct keys must have distinct SHA-256 digests');
  });

  await test('hashApiKey: null/undefined handles gracefully', () => {
    const hashNull = hashApiKey(null);
    const hashEmpty = hashApiKey('');
    assertEqual(hashNull, hashEmpty, 'Null and empty key hash should be identical');
    assert(/^[a-f0-9]{64}$/.test(hashNull), 'Hash for empty key must be valid 64-char hex');
  });

  // ==========================================================
  // 3. Deep Object Sanitization & Sensitive Field Redaction
  // ==========================================================
  console.log(`\n${colors.bold}--- 3. Deep Object Sanitization ---${colors.reset}`);

  await test('sanitizeLogData: redacts sensitive keys in object', () => {
    const input = {
      pincode: '110011',
      apiKey: 'ig-live-secret-key-9999',
      api_key: 'ig-test-key-5555',
      authorization: 'Bearer ig-token-value-8888',
      secret: 'super-secret-pass',
      token: 'jwt-token-12345678',
      count: 42,
    };

    const sanitized = sanitizeLogData(input) as Record<string, unknown>;
    assertEqual(sanitized.pincode, '110011', 'Non-sensitive pincode preserved');
    assertEqual(sanitized.count, 42, 'Non-sensitive count preserved');
    assertEqual(sanitized.apiKey, 'ig-****9999', 'apiKey masked');
    assert(Boolean(sanitized.apiKey_sha256), 'apiKey_sha256 created');
    assertEqual(sanitized.api_key, 'ig-****5555', 'api_key masked');
    assertEqual(sanitized.secret, '****pass', 'secret masked');
  });

  await test('sanitizeLogData: redacts nested arrays and inline tokens in strings', () => {
    const input = {
      events: [
        { msg: 'User sent request with Bearer ig-inline-secret-key-1111' },
        { msg: 'Upstream responded to ig-live-222233334444' },
      ],
    };

    const sanitized = sanitizeLogData(input) as Record<string, any>;
    const msg1 = sanitized.events[0].msg;
    const msg2 = sanitized.events[1].msg;

    assert(!msg1.includes('ig-inline-secret-key-1111'), 'Inline bearer key must be scrubbed');
    assert(msg1.includes('ig-****1111'), 'Inline bearer key should be masked');
    assert(!msg2.includes('222233334444'), 'Inline ig key must be scrubbed');
    assert(msg2.includes('ig-****4444'), 'Inline ig key should be masked');
  });

  // ==========================================================
  // 4. Structured Audit & Security Logger
  // ==========================================================
  console.log(`\n${colors.bold}--- 4. Structured Audit Logger ---${colors.reset}`);

  await test('logger.audit: creates structured AuditLogEntry with masked key & sha256', () => {
    const rawKey = 'ig-live-audit-key-7777';
    const entry = logger.audit('TTS_TEST_ACTION', {
      apiKey: rawKey,
      pincode: '110011',
      requestId: 'req-test-uuid-1',
      model: 'ig-tts-1',
    });

    assertEqual(entry.level, 'AUDIT', 'Level must be AUDIT');
    assertEqual(entry.action, 'TTS_TEST_ACTION', 'Action matches');
    assertEqual(entry.pincode, '110011', 'PIN matches');
    assertEqual(entry.requestId, 'req-test-uuid-1', 'RequestId matches');
    assertEqual(entry.apiKeyMasked, 'ig-****7777', 'Key must be masked');
    assertEqual(entry.apiKeySha256, hashApiKey(rawKey), 'SHA-256 must match');
  });

  await test('logger methods: info, warn, security, error operate without throwing', () => {
    logger.info('Test info message', { count: 1 });
    logger.warn('Test warn message', { retryAttempt: 2 });
    logger.security('Test security alert', { suspiciousIp: '127.0.0.1' });
    logger.error('Test error message', new Error('Simulated failure'), { apiKey: 'ig-err-key-1234' });
    assert(true, 'Logging methods executed cleanly');
  });

  // ==========================================================
  // 5. Spoken Narrative Text Composer
  // ==========================================================
  console.log(`\n${colors.bold}--- 5. Spoken Narrative Text Composer ---${colors.reset}`);

  const sampleLocation: LocationDataInput = {
    area: 'Central Secretariat / Janpath',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110011',
  };

  const sampleArtifacts: ArtifactInput[] = [
    {
      artifact_id: 'art-001',
      title: 'Dancing Girl of Mohenjo-daro',
      description: 'Discovered in 1926 at Mohenjo-daro, this rare bronze statuette represents a masterpiece of lost-wax casting from the Indus Valley Civilization.',
      museum_name: 'National Museum, New Delhi',
      provenance_date: 'c. 2300–1750 BCE',
      pincode: '110011',
    },
    {
      artifact_id: 'art-002',
      title: 'Priest-King Replica',
      description: 'Steatite sculpture of a bearded male figure adorned with trefoil patterns.',
      museum_name: 'National Museum, New Delhi',
      provenance_date: 'c. 2000 BCE',
      pincode: '110011',
    },
  ];

  await test('composeNarrationText: handles multiple artifacts', () => {
    const text = composeNarrationText(sampleLocation, sampleArtifacts);
    assert(text.includes('Welcome to Central Secretariat / Janpath, Delhi, postal PIN 110011.'), 'Prefix present');
    assert(text.includes('Found 2 museum masterworks located at this postal code.'), 'Masterwork count included');
    assert(text.includes('Dancing Girl of Mohenjo-daro'), 'Artifact 1 title included');
    assert(text.includes('National Museum, New Delhi'), 'Museum name included');
    assert(text.includes('Priest-King Replica'), 'Artifact 2 title included');
  });

  await test('composeNarrationText: handles single artifact with singular grammar', () => {
    const text = composeNarrationText(sampleLocation, [sampleArtifacts[0]]);
    assert(text.includes('Found 1 museum masterwork located at this postal code.'), 'Singular masterwork phrasing');
  });

  await test('composeNarrationText: handles zero artifacts with explicit heritage overview', () => {
    const ruralLocation: LocationDataInput = {
      area: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
    };
    const text = composeNarrationText(ruralLocation, []);
    assert(text.includes('Welcome to Koramangala, Karnataka, postal PIN 560034.'), 'Prefix present');
    assert(text.includes('No museum-linked artifacts were found for this specific pincode.'), 'Explicit zero-artifact statement');
    assert(text.includes('Bengaluru'), 'City fallback mentioned');
  });

  // ==========================================================
  // 6. Exponential Backoff Delay Math
  // ==========================================================
  console.log(`\n${colors.bold}--- 6. Exponential Backoff Delay Math ---${colors.reset}`);

  await test('calculateBackoffDelay: produces exponential progression with jitter', () => {
    const base = 200;
    const max = 2000;

    const delay0 = calculateBackoffDelay(0, base, max); // base * 1 + jitter [0..100] -> 200..300
    const delay1 = calculateBackoffDelay(1, base, max); // base * 2 + jitter [0..100] -> 400..500
    const delay2 = calculateBackoffDelay(2, base, max); // base * 4 + jitter [0..100] -> 800..900
    const delayLarge = calculateBackoffDelay(10, base, max); // capped at max (2000)

    assert(delay0 >= 200 && delay0 <= 300, `Delay 0 in expected range (got ${delay0})`);
    assert(delay1 >= 400 && delay1 <= 500, `Delay 1 in expected range (got ${delay1})`);
    assert(delay2 >= 800 && delay2 <= 900, `Delay 2 in expected range (got ${delay2})`);
    assertEqual(delayLarge, 2000, 'Delay capped at maxDelayMs');
  });

  // ==========================================================
  // 7. IG TTS Client - Missing / Invalid Input Validation
  // ==========================================================
  console.log(`\n${colors.bold}--- 7. Input Validation & Missing Key ---${colors.reset}`);

  await test('synthesizeSpeech: rejects missing API key with TTS_AUTH_ERROR', async () => {
    const result = await synthesizeSpeech('Test narration text', {
      apiKey: null,
      requestId: 'test-req-no-key',
    });

    assertEqual(result.success, false, 'Success must be false');
    assertEqual(result.tts, null, 'tts payload must be null');
    assert(Boolean(result.error), 'Error must be present');
    assertEqual(result.error?.code, 'TTS_AUTH_ERROR', 'Error code must be TTS_AUTH_ERROR');
    assertEqual(result.error?.retryable, false, 'Auth error is non-retryable');
  });

  await test('synthesizeSpeech: rejects empty whitespace API key with TTS_AUTH_ERROR', async () => {
    const result = await synthesizeSpeech('Test narration text', {
      apiKey: '   ',
      requestId: 'test-req-empty-key',
    });

    assertEqual(result.success, false, 'Success must be false');
    assertEqual(result.error?.code, 'TTS_AUTH_ERROR', 'Error code must be TTS_AUTH_ERROR');
  });

  // ==========================================================
  // 8. IG TTS Client - Successful Synthesis (Binary & JSON)
  // ==========================================================
  console.log(`\n${colors.bold}--- 8. Successful TTS Audio Synthesis ---${colors.reset}`);

  await test('synthesizeSpeech: handles binary audio response (audio/mpeg)', async () => {
    const mockAudioBytes = Buffer.from('MOCK_MP3_BINARY_STREAM_DATA_12345');
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any = null;

    const mockFetch = async (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      capturedBody = JSON.parse((init?.body as string) || '{}');

      return new Response(mockAudioBytes, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    };

    const narration = 'Welcome to National Museum New Delhi.';
    const result = await synthesizeSpeech(narration, {
      apiKey: 'ig-live-valid-key-1234',
      voice: 'alloy',
      language: 'en-IN',
      requestId: 'req-success-1',
      pincode: '110011',
      fetchFn: mockFetch as any,
    });

    assertEqual(result.success, true, 'Synthesis must succeed');
    assertEqual(result.error, null, 'Error must be null');
    assert(Boolean(result.tts), 'tts payload must be populated');
    assertEqual(result.tts?.format, 'audio/mp3', 'Format must be audio/mp3');
    assertEqual(result.tts?.voice, 'alloy', 'Voice matches');
    assertEqual(result.tts?.language, 'en-IN', 'Language matches');
    assertEqual(result.tts?.narration_text, narration, 'Narration text preserved');

    // Verify Base64 encoding
    const decodedBuffer = Buffer.from(result.tts!.audio_base64, 'base64');
    assertEqual(decodedBuffer.toString(), 'MOCK_MP3_BINARY_STREAM_DATA_12345', 'Base64 decoded correctly');

    // Verify Request Headers
    assertEqual(capturedHeaders['Authorization'], 'Bearer ig-live-valid-key-1234', 'Auth header set');
    assertEqual(capturedBody.input, narration, 'Narration passed to upstream');
    assertEqual(capturedBody.voice, 'alloy', 'Voice passed to upstream');
  });

  await test('synthesizeSpeech: handles JSON audio response (audio_base64 field)', async () => {
    const expectedBase64 = Buffer.from('MOCK_JSON_AUDIO_STREAM').toString('base64');

    const mockFetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          audio_base64: expectedBase64,
          format: 'mp3',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    const result = await synthesizeSpeech('Short narration', {
      apiKey: 'ig-live-json-key',
      fetchFn: mockFetch as any,
    });

    assertEqual(result.success, true, 'Success on JSON response');
    assertEqual(result.tts?.audio_base64, expectedBase64, 'Base64 extracted from JSON body');
  });

  // ==========================================================
  // 9. IG TTS Client - Permanent Errors (401 / 403 / 400)
  // ==========================================================
  console.log(`\n${colors.bold}--- 9. Permanent Error Handling (No Retries) ---${colors.reset}`);

  await test('synthesizeSpeech: HTTP 401 returns TTS_AUTH_ERROR immediately (1 fetch call)', async () => {
    let callCount = 0;
    const mockFetch = async (): Promise<Response> => {
      callCount++;
      return new Response(JSON.stringify({ error: 'Unauthorized key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const result = await synthesizeSpeech('Text', {
      apiKey: 'ig-invalid-key-999',
      fetchFn: mockFetch as any,
      maxRetries: 3,
    });

    assertEqual(callCount, 1, '401 must NOT trigger retries (called exactly 1 time)');
    assertEqual(result.success, false, 'Success is false');
    assertEqual(result.tts, null, 'tts is null');
    assertEqual(result.error?.code, 'TTS_AUTH_ERROR', 'Error code is TTS_AUTH_ERROR');
    assertEqual(result.error?.retryable, false, 'Auth error is non-retryable');
  });

  await test('synthesizeSpeech: HTTP 403 returns TTS_AUTH_ERROR immediately', async () => {
    let callCount = 0;
    const mockFetch = async (): Promise<Response> => {
      callCount++;
      return new Response(JSON.stringify({ error: 'Quota exceeded / Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const result = await synthesizeSpeech('Text', {
      apiKey: 'ig-revoked-key',
      fetchFn: mockFetch as any,
      maxRetries: 3,
    });

    assertEqual(callCount, 1, '403 must NOT trigger retries');
    assertEqual(result.error?.code, 'TTS_AUTH_ERROR', 'Error code is TTS_AUTH_ERROR');
    assertEqual(result.error?.retryable, false, 'Forbidden error is non-retryable');
  });

  await test('synthesizeSpeech: HTTP 400 returns TTS_GENERATION_FAILED immediately', async () => {
    let callCount = 0;
    const mockFetch = async (): Promise<Response> => {
      callCount++;
      return new Response(JSON.stringify({ message: 'Unsupported voice identifier' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const result = await synthesizeSpeech('Text', {
      apiKey: 'ig-live-key',
      voice: 'invalid-voice',
      fetchFn: mockFetch as any,
      maxRetries: 3,
    });

    assertEqual(callCount, 1, '400 must NOT trigger retries');
    assertEqual(result.error?.code, 'TTS_GENERATION_FAILED', 'Error code is TTS_GENERATION_FAILED');
    assertEqual(result.error?.message, 'Unsupported voice identifier', 'Error message extracted from upstream');
  });

  // ==========================================================
  // 10. IG TTS Client - Transient Error Recovery (Backoff)
  // ==========================================================
  console.log(`\n${colors.bold}--- 10. Transient Error Exponential Backoff Recovery ---${colors.reset}`);

  await test('synthesizeSpeech: recovers after transient 503 and 429 errors', async () => {
    let attempts = 0;
    const mockAudio = Buffer.from('AUDIO_AFTER_RETRY');

    const mockFetch = async (): Promise<Response> => {
      attempts++;
      if (attempts === 1) {
        return new Response('Service Unavailable', { status: 503 });
      }
      if (attempts === 2) {
        return new Response('Rate Limited', { status: 429 });
      }
      return new Response(mockAudio, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    };

    const result = await synthesizeSpeech('Text to retry', {
      apiKey: 'ig-live-retry-key',
      fetchFn: mockFetch as any,
      maxRetries: 3,
      baseDelayMs: 10, // Fast delay for test execution
      maxDelayMs: 50,
    });

    assertEqual(attempts, 3, 'Fetch was attempted 3 times before succeeding');
    assertEqual(result.success, true, 'Recovered successfully on 3rd attempt');
    assert(Boolean(result.tts), 'Audio payload returned');
  });

  // ==========================================================
  // 11. IG TTS Client - Max Retries Exhaustion
  // ==========================================================
  console.log(`\n${colors.bold}--- 11. Max Retries Exhaustion & Partial Degradation ---${colors.reset}`);

  await test('synthesizeSpeech: exhausts max retries and returns non-fatal TTS_GENERATION_FAILED', async () => {
    let attempts = 0;
    const mockFetch = async (): Promise<Response> => {
      attempts++;
      return new Response('Server Error', { status: 500 });
    };

    const result = await synthesizeSpeech('Text', {
      apiKey: 'ig-live-failing-key',
      fetchFn: mockFetch as any,
      maxRetries: 3,
      baseDelayMs: 5,
      maxDelayMs: 20,
    });

    assertEqual(attempts, 4, 'Attempted initial + 3 retries = 4 attempts');
    assertEqual(result.success, false, 'Success is false');
    assertEqual(result.tts, null, 'tts is null');
    assertEqual(result.error?.code, 'TTS_GENERATION_FAILED', 'Error code is TTS_GENERATION_FAILED');
    assertEqual(result.error?.retryable, true, 'Transient failure flagged as retryable');
    assertEqual(result.error?.details?.attempts, 4, 'Attempts recorded in details');
  });

  // ==========================================================
  // 12. IG TTS Client - Timeout Handling
  // ==========================================================
  console.log(`\n${colors.bold}--- 12. Timeout Handling with AbortController ---${colors.reset}`);

  await test('synthesizeSpeech: handles request timeout with AbortController', async () => {
    const mockFetch = async (_url: any, init?: RequestInit): Promise<Response> => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (signal) {
          signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    };

    const result = await synthesizeSpeech('Timeout test text', {
      apiKey: 'ig-live-timeout-key',
      fetchFn: mockFetch as any,
      timeoutMs: 30, // 30ms timeout
      maxRetries: 1,
      baseDelayMs: 5,
    });

    assertEqual(result.success, false, 'Timeout fails gracefully');
    assertEqual(result.tts, null, 'tts is null on timeout');
    assertEqual(result.error?.code, 'TTS_GENERATION_FAILED', 'Error code is TTS_GENERATION_FAILED');
    assert(
      Boolean(result.error?.message.includes('timeout') || result.error?.message.includes('aborted')),
      `Message mentions timeout: "${result.error?.message}"`
    );
  });

  // ==========================================================
  // 13. High-Level Helpers & Class Wrapper
  // ==========================================================
  console.log(`\n${colors.bold}--- 13. High-Level Helpers & IGTTSClient Class ---${colors.reset}`);

  await test('generateHeritageTTS: synthesizes audio directly from location and artifacts', async () => {
    const mockAudio = Buffer.from('HERITAGE_AUDIO');
    const mockFetch = async (): Promise<Response> => {
      return new Response(mockAudio, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    };

    const result = await generateHeritageTTS(sampleLocation, sampleArtifacts, {
      apiKey: 'ig-live-heritage-key',
      fetchFn: mockFetch as any,
    });

    assertEqual(result.success, true, 'Direct heritage TTS succeeds');
    assert(Boolean(result.tts), 'tts payload populated');
    assert(Boolean(result.tts?.narration_text.includes('Dancing Girl')), 'Narration includes artifact');
  });

  await test('IGTTSClient: class wrapper initializes and generates audio', async () => {
    const mockAudio = Buffer.from('CLIENT_CLASS_AUDIO');
    const mockFetch = async (): Promise<Response> => {
      return new Response(mockAudio, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    };

    const client = new IGTTSClient({
      apiKey: 'ig-live-client-class-key',
      voice: 'onyx',
      language: 'en-IN',
      fetchFn: mockFetch as any,
    });

    const result = await client.generateForHeritage(sampleLocation, sampleArtifacts);
    assertEqual(result.success, true, 'IGTTSClient generateForHeritage succeeds');
    assertEqual(result.tts?.voice, 'onyx', 'Voice preconfigured in client instance');
  });

  // ==========================================================
  // Summary
  // ==========================================================
  console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
  console.log(
    `${colors.bold}Test Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)${colors.reset}`
  );
  console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Execute tests
runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
