/**
 * Digital Muse E2E Test Suite - Core Types & Assertions Harness
 */

import path from 'path';

export interface TestResult {
  tier: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface TierSummary {
  tier: string;
  description: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}

export interface SuiteSummary {
  total: number;
  passed: number;
  failed: number;
  totalDurationMs: number;
  tiers: TierSummary[];
}

// Visual formatting helpers
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export class AssertionError extends Error {
  constructor(message: string, public expected?: unknown, public actual?: unknown) {
    super(message);
    this.name = 'AssertionError';
  }
}

export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new AssertionError(message, true, condition);
  }
}

export function assertEqual<T>(actual: T, expected: T, message: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new AssertionError(`${message} | Expected: ${expectedStr}, got: ${actualStr}`, expected, actual);
  }
}

export function assertInRange(val: number, min: number, max: number, message: string): void {
  if (val < min || val > max) {
    throw new AssertionError(`${message} | Expected value in [${min}, ${max}], got: ${val}`, { min, max }, val);
  }
}

export function assertMatches(val: string, regex: RegExp, message: string): void {
  if (!regex.test(val)) {
    throw new AssertionError(`${message} | String "${val}" does not match pattern ${regex}`, regex.toString(), val);
  }
}

export function assertNonEmptyString(val: unknown, message: string): void {
  if (typeof val !== 'string' || val.trim().length === 0) {
    throw new AssertionError(`${message} | Expected non-empty string, got: ${typeof val} (${val})`, 'non-empty string', val);
  }
}

export function assertArrayNonEmpty(val: unknown, message: string): void {
  if (!Array.isArray(val) || val.length === 0) {
    throw new AssertionError(`${message} | Expected non-empty array, got: ${JSON.stringify(val)}`, 'non-empty array', val);
  }
}

export async function dynamicImport(relativePath: string): Promise<Record<string, any>> {
  const fullPath = path.resolve(process.cwd(), relativePath);
  const normalized = fullPath.replace(/\\/g, '/');
  const fileUrl = normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
  return import(fileUrl);
}

export async function runTest(tier: string, name: string, fn: () => Promise<void> | void): Promise<TestResult> {
  const start = Date.now();
  try {
    await fn();
    return {
      tier,
      name,
      passed: true,
      durationMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      tier,
      name,
      passed: false,
      durationMs: Date.now() - start,
      error: errorMsg,
    };
  }
}
