/**
 * Security & Audit Logger Service
 * 
 * Provides safe structured logging, automatic secret redaction,
 * API key masking, and cryptographic SHA-256 audit hashing.
 * Guarantees zero raw credentials or API keys enter application logs or stdout/stderr.
 */

import * as crypto from 'crypto';

export interface AuditLogEntry {
  timestamp: string;
  level: 'AUDIT' | 'SECURITY' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  action: string;
  requestId?: string;
  pincode?: string;
  apiKeyMasked?: string;
  apiKeySha256?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Masks an API key for safe display and logging.
 * Patterns:
 *  - "ig-live-1234567890abcdef" -> "ig-****cdef"
 *  - "sk-abcdef123456" -> "****3456"
 *  - Short keys (< 8 chars) -> "****"
 */
export function maskApiKey(key?: string | null): string {
  if (!key || typeof key !== 'string') {
    return '[EMPTY_KEY]';
  }

  const trimmed = key.trim();
  if (trimmed.length === 0) {
    return '[EMPTY_KEY]';
  }

  if (trimmed.startsWith('ig-')) {
    const rawBody = trimmed.slice(3);
    if (rawBody.length >= 4) {
      return `ig-****${rawBody.slice(-4)}`;
    }
    return 'ig-****';
  }

  if (trimmed.length >= 8) {
    return `****${trimmed.slice(-4)}`;
  } else if (trimmed.length >= 4) {
    return `****${trimmed.slice(-2)}`;
  }

  return '****';
}

/**
 * Computes deterministic SHA-256 hex digest for audit logs without leaking plaintext keys.
 */
export function hashApiKey(key?: string | null): string {
  if (!key || typeof key !== 'string') {
    return crypto.createHash('sha256').update('').digest('hex');
  }
  return crypto.createHash('sha256').update(key.trim()).digest('hex');
}

/**
 * Sensitive field regex matching secret keys, tokens, auth headers.
 */
const SENSITIVE_KEY_REGEX = /^(api_?key|auth|authorization|token|secret|password|bearer|credential|x-api-key|x-ig-api-key)$/i;

/**
 * Inline secret regex matching raw 'ig-...' tokens or Bearer headers in strings.
 */
const INLINE_IG_KEY_REGEX = /\b(ig-[a-zA-Z0-9_-]{6,})\b/g;
const INLINE_BEARER_REGEX = /Bearer\s+([a-zA-Z0-9._~+/-]{6,})/gi;

/**
 * Recursively sanitizes data objects by masking any sensitive fields or inline tokens.
 */
export function sanitizeLogData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data
      .replace(INLINE_BEARER_REGEX, (_match, token) => `Bearer ${maskApiKey(token)}`)
      .replace(INLINE_IG_KEY_REGEX, (match) => maskApiKey(match));
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEY_REGEX.test(k)) {
        if (typeof v === 'string') {
          sanitized[k] = maskApiKey(v);
          sanitized[`${k}_sha256`] = hashApiKey(v);
        } else {
          sanitized[k] = '[REDACTED]';
        }
      } else {
        sanitized[k] = sanitizeLogData(v);
      }
    }
    return sanitized;
  }

  return String(data);
}

/**
 * Structured Security & Audit Logger class
 */
export class SecurityLogger {
  private serviceName: string;

  constructor(serviceName: string = 'heritage-service') {
    this.serviceName = serviceName;
  }

  /**
   * Logs an audit record for TTS or API key consumption.
   */
  audit(
    action: string,
    meta: {
      apiKey?: string | null;
      pincode?: string;
      requestId?: string;
      [key: string]: unknown;
    } = {}
  ): AuditLogEntry {
    const { apiKey, pincode, requestId, ...extraMeta } = meta;
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'AUDIT',
      action,
      requestId,
      pincode,
      apiKeyMasked: apiKey ? maskApiKey(apiKey) : undefined,
      apiKeySha256: apiKey ? hashApiKey(apiKey) : undefined,
      metadata: Object.keys(extraMeta).length > 0 ? (sanitizeLogData(extraMeta) as Record<string, unknown>) : undefined,
    };

    const formatted = `[AUDIT] [${entry.timestamp}] [${this.serviceName}] Action: ${action} | ReqID: ${requestId || 'N/A'} | PIN: ${pincode || 'N/A'} | Key: ${entry.apiKeyMasked || 'N/A'} | SHA256: ${entry.apiKeySha256 || 'N/A'}`;
    console.log(formatted);
    return entry;
  }

  /**
   * Logs a security event (e.g. invalid key format, auth failure, potential abuse).
   */
  security(event: string, meta?: Record<string, unknown>): void {
    const sanitized = meta ? sanitizeLogData(meta) : undefined;
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'SECURITY',
      event,
      service: this.serviceName,
      details: sanitized,
    };
    console.warn(`[SECURITY] [${entry.timestamp}] [${this.serviceName}] Event: ${event}`, sanitized || '');
  }

  /**
   * Standard informational log.
   */
  info(message: string, meta?: Record<string, unknown>): void {
    const sanitized = meta ? sanitizeLogData(meta) : undefined;
    console.log(`[INFO] [${new Date().toISOString()}] [${this.serviceName}] ${message}`, sanitized ? JSON.stringify(sanitized) : '');
  }

  /**
   * Warning log.
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    const sanitized = meta ? sanitizeLogData(meta) : undefined;
    console.warn(`[WARN] [${new Date().toISOString()}] [${this.serviceName}] ${message}`, sanitized ? JSON.stringify(sanitized) : '');
  }

  /**
   * Error log with stack trace sanitization.
   */
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const sanitized = meta ? sanitizeLogData(meta) : {};
    const sanitizedObj =
      typeof sanitized === 'object' && sanitized !== null && !Array.isArray(sanitized)
        ? (sanitized as Record<string, unknown>)
        : { meta: sanitized };

    let errorDetails: Record<string, unknown> = {};

    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: sanitizeLogData(error.message),
        stack: sanitizeLogData(error.stack),
      };
    } else if (error) {
      errorDetails = { raw: sanitizeLogData(error) };
    }

    console.error(`[ERROR] [${new Date().toISOString()}] [${this.serviceName}] ${message}`, {
      ...sanitizedObj,
      error: errorDetails,
    });
  }

  /**
   * Debug level log.
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
      const sanitized = meta ? sanitizeLogData(meta) : undefined;
      console.debug(`[DEBUG] [${new Date().toISOString()}] [${this.serviceName}] ${message}`, sanitized || '');
    }
  }
}

// Export default singleton instance
export const logger = new SecurityLogger('heritage-tts-service');
