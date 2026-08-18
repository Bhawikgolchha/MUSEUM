/**
 * Unified Heritage Service API Route Handler
 * 
 * Implements strict postal PIN validation, 3-tier geographic resolution,
 * exact-PIN museum artifact retrieval (zero fuzzy fallback), PII sanitization,
 * and IG API Text-to-Speech audio synthesis with graceful partial degradation.
 * 
 * Supports both HTTP POST (JSON body) and HTTP GET (query parameters).
 */

import { NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { validatePincode, resolvePincode } from '@/lib/services/geocoding';
import { getArtifactsForPincode, clampMaxArtifacts } from '@/lib/services/artifacts';
import { generateHeritageTTS } from '@/lib/services/tts';
import { logger } from '@/lib/services/logger';
import {
  HeritageServiceResponse,
  ResponseFormat,
  ServiceError,
} from '@/lib/services/types';

interface ServiceParams {
  pincode?: unknown;
  response_format?: string;
  api_key?: string | null;
  voice?: string;
  language?: string;
  max_artifacts?: unknown;
  country_code?: string;
}

/**
 * Extracts API key from parameters, Authorization Bearer header, or X-IG-API-Key header.
 */
function extractApiKey(req: Request, paramKey?: string | null): string | null {
  if (paramKey && typeof paramKey === 'string' && paramKey.trim().length > 0) {
    return paramKey.trim();
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader && typeof authHeader === 'string') {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      const token = trimmed.slice(7).trim();
      if (token.length > 0) return token;
    } else if (trimmed.length > 0) {
      return trimmed;
    }
  }

  const igHeader = req.headers.get('x-ig-api-key');
  if (igHeader && typeof igHeader === 'string' && igHeader.trim().length > 0) {
    return igHeader.trim();
  }

  return null;
}

/**
 * Core Request Processing Pipeline for Heritage & Museum Pincode Service.
 */
async function processHeritageRequest(
  req: Request,
  params: ServiceParams
): Promise<Response> {
  const startTime = Date.now();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  // 1. Validate Pincode Parameter Presence
  if (params.pincode === undefined || params.pincode === null || params.pincode === '') {
    const errorDetail: ServiceError = {
      code: 'MISSING_REQUIRED_FIELD',
      message: "Missing required field: 'pincode'. A 6-digit postal PIN code is required.",
      details: { field: 'pincode' },
      retryable: false,
    };

    const responsePayload: HeritageServiceResponse = {
      status: 'error',
      request_id: requestId,
      pincode_valid: false,
      location: null,
      museum_linked_artifacts: [],
      total_artifacts_found: 0,
      tts: null,
      errors: [errorDetail],
    };

    return NextResponse.json(responsePayload, { status: 400 });
  }

  // 2. Strict PIN Validation & Coercion
  const countryCode = (params.country_code || 'IN').toUpperCase();
  const rawPincodeStr = typeof params.pincode === 'number' ? String(params.pincode) : String(params.pincode);
  const validation = validatePincode(rawPincodeStr, countryCode);

  if (!validation.isValid || validation.error) {
    const responsePayload: HeritageServiceResponse = {
      status: 'error',
      request_id: requestId,
      pincode_valid: false,
      location: null,
      museum_linked_artifacts: [],
      total_artifacts_found: 0,
      tts: null,
      errors: [
        validation.error || {
          code: 'INVALID_PINCODE_FORMAT',
          message: `The provided PIN code '${rawPincodeStr}' is invalid. PIN must be a 6-digit numeric string with no leading zero.`,
          details: { input: rawPincodeStr, expected_format: '^[1-9][0-9]{5}$' },
          retryable: false,
        },
      ],
    };

    return NextResponse.json(responsePayload, { status: 400 });
  }

  const cleanPin = validation.cleanPin;

  // 3. Response Format Parsing & Validation
  const rawFormat = (params.response_format || 'both').toLowerCase().trim();
  if (rawFormat !== 'text' && rawFormat !== 'tts' && rawFormat !== 'both') {
    const errorDetail: ServiceError = {
      code: 'UNSUPPORTED_RESPONSE_FORMAT',
      message: `Unsupported response_format '${rawFormat}'. Allowed values are 'text', 'tts', or 'both'.`,
      details: { response_format: rawFormat, supported_formats: ['text', 'tts', 'both'] },
      retryable: false,
    };

    const responsePayload: HeritageServiceResponse = {
      status: 'error',
      request_id: requestId,
      pincode_valid: false,
      location: null,
      museum_linked_artifacts: [],
      total_artifacts_found: 0,
      tts: null,
      errors: [errorDetail],
    };

    return NextResponse.json(responsePayload, { status: 400 });
  }

  const responseFormat = rawFormat as ResponseFormat;
  const apiKey = extractApiKey(req, params.api_key);

  // 4. Pre-validate API Key in Pure 'tts' Mode
  if (responseFormat === 'tts' && (!apiKey || apiKey.trim() === '')) {
    const errorDetail: ServiceError = {
      code: 'TTS_AUTH_ERROR',
      message: 'Missing or invalid IG API key. A valid API key is required for text-to-speech synthesis.',
      details: { missing_field: 'api_key', mode: 'tts' },
      retryable: false,
    };

    const responsePayload: HeritageServiceResponse = {
      status: 'error',
      request_id: requestId,
      pincode_valid: false,
      location: null,
      museum_linked_artifacts: [],
      total_artifacts_found: 0,
      tts: null,
      errors: [errorDetail],
    };

    return NextResponse.json(responsePayload, { status: 400 });
  }

  // 5. Geographic Location Resolution (3-Tier Resolution Hierarchy)
  const geoResult = await resolvePincode(cleanPin, { countryCode });
  if (!geoResult.success || !geoResult.location) {
    const errorDetail: ServiceError = geoResult.error || {
      code: 'PINCODE_NOT_FOUND',
      message: `Postal PIN code '${cleanPin}' could not be resolved across any geocoding tier.`,
      details: { pincode: cleanPin, country_code: countryCode },
      retryable: false,
    };

    const responsePayload: HeritageServiceResponse = {
      status: 'error',
      request_id: requestId,
      pincode_valid: false,
      location: null,
      museum_linked_artifacts: [],
      total_artifacts_found: 0,
      tts: null,
      errors: [errorDetail],
    };

    return NextResponse.json(responsePayload, { status: 404 });
  }

  const location = geoResult.location;

  // 6. Strict Exact-PIN Museum Artifact Retrieval (Zero Fuzzy Fallback)
  const maxLimit =
    typeof params.max_artifacts === 'number'
      ? clampMaxArtifacts(params.max_artifacts)
      : typeof params.max_artifacts === 'string'
      ? clampMaxArtifacts(parseInt(params.max_artifacts, 10))
      : 10;

  const artifactResult = getArtifactsForPincode(cleanPin, {
    max_artifacts: maxLimit,
    sanitizePII: true,
  });

  const museumLinkedArtifacts = artifactResult.museum_linked_artifacts || [];
  const totalArtifactsFound = artifactResult.total_artifacts_found ?? 0;

  // 7. Spoken Narration & IG API TTS Synthesis
  let ttsPayload = null;
  const errors: ServiceError[] = [];
  let isPartial =
    geoResult.status === 'partial' ||
    Boolean(location.location_candidates && location.location_candidates.length > 1);

  if (responseFormat === 'text') {
    // Mode 'text': completely bypass TTS
    ttsPayload = null;
  } else if (responseFormat === 'tts' || responseFormat === 'both') {
    if (apiKey && apiKey.trim().length > 0) {
      const voice = params.voice || 'alloy';
      const language = params.language || 'en-IN';

      const ttsResult = await generateHeritageTTS(location, museumLinkedArtifacts, {
        apiKey: apiKey.trim(),
        voice,
        language,
        requestId,
        pincode: cleanPin,
      });

      if (ttsResult.success && ttsResult.tts) {
        ttsPayload = ttsResult.tts;
      } else {
        // Non-fatal partial degradation fallback
        ttsPayload = null;
        isPartial = true;
        if (ttsResult.error) {
          errors.push(ttsResult.error);
        } else {
          errors.push({
            code: 'TTS_GENERATION_FAILED',
            message: 'IG API Text-to-Speech synthesis failed.',
            retryable: true,
          });
        }
      }
    } else if (responseFormat === 'both') {
      // In 'both' mode, if api_key was omitted, retain text response cleanly
      ttsPayload = null;
    }
  }

  // 8. Construct Final Unified JSON Payload
  const finalStatus = isPartial ? 'partial' : 'success';
  const responsePayload: HeritageServiceResponse = {
    status: finalStatus,
    request_id: requestId,
    pincode_valid: true,
    location,
    museum_linked_artifacts: museumLinkedArtifacts,
    total_artifacts_found: totalArtifactsFound,
    tts: ttsPayload,
    errors,
  };

  // 9. Structured Security Audit Logging
  logger.audit('HERITAGE_SERVICE_REQUEST', {
    requestId,
    pincode: cleanPin,
    apiKey: apiKey || null,
    responseFormat,
    status: finalStatus,
    artifactsFound: totalArtifactsFound,
    durationMs: Date.now() - startTime,
  });

  return NextResponse.json(responsePayload, { status: 200 });
}

/**
 * HTTP POST Handler for Heritage Service Endpoint
 */
export async function POST(req: Request): Promise<Response> {
  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      body = {};
    }

    return await processHeritageRequest(req, {
      pincode: body.pincode,
      response_format: body.response_format,
      api_key: body.api_key,
      voice: body.voice,
      language: body.language,
      max_artifacts: body.max_artifacts,
      country_code: body.country_code,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Unhandled internal exception in POST /api/heritage-service', err);

    const errorPayload: HeritageServiceResponse = {
      status: 'error',
      request_id: req.headers.get('x-request-id') || crypto.randomUUID(),
      pincode_valid: false,
      location: null,
      museum_linked_artifacts: [],
      total_artifacts_found: 0,
      tts: null,
      errors: [
        {
          code: 'INTERNAL_ERROR',
          message: `Internal server error: ${errorMsg}`,
          retryable: false,
        },
      ],
    };

    return NextResponse.json(errorPayload, { status: 500 });
  }
}

/**
 * HTTP GET Handler for Heritage Service Endpoint
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const pincode = searchParams.get('pincode');
    const response_format = searchParams.get('response_format') || undefined;
    const api_key = searchParams.get('api_key') || undefined;
    const voice = searchParams.get('voice') || undefined;
    const language = searchParams.get('language') || undefined;
    const max_artifacts = searchParams.get('max_artifacts') || undefined;
    const country_code = searchParams.get('country_code') || undefined;

    return await processHeritageRequest(req, {
      pincode: pincode !== null ? pincode : undefined,
      response_format,
      api_key,
      voice,
      language,
      max_artifacts,
      country_code,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Unhandled internal exception in GET /api/heritage-service', err);

    const errorPayload: HeritageServiceResponse = {
      status: 'error',
      request_id: req.headers.get('x-request-id') || crypto.randomUUID(),
      pincode_valid: false,
      location: null,
      museum_linked_artifacts: [],
      total_artifacts_found: 0,
      tts: null,
      errors: [
        {
          code: 'INTERNAL_ERROR',
          message: `Internal server error: ${errorMsg}`,
          retryable: false,
        },
      ],
    };

    return NextResponse.json(errorPayload, { status: 500 });
  }
}
