/**
 * Hermetic Fetch Interceptor for Museum Discovery Backend Testing
 * Provides 100% in-memory HTTP mocking, ensuring zero external network leakage
 * and deterministic sub-millisecond execution.
 */

export interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  parsedBody?: unknown;
  timestamp: number;
}

export type MockHandler = (
  url: string,
  init?: RequestInit,
  capturedReq?: CapturedRequest
) => Response | Promise<Response> | null;

let originalFetch: typeof globalThis.fetch | null = null;
const handlers: MockHandler[] = [];
const requestHistory: CapturedRequest[] = [];
let isStrict = true;

/**
 * Normalizes headers from HeadersInit into a standard Record<string, string>
 */
function normalizeHeaders(headersInit?: HeadersInit): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headersInit) return result;

  if (headersInit instanceof Headers) {
    headersInit.forEach((val, key) => {
      result[key.toLowerCase()] = val;
    });
  } else if (Array.isArray(headersInit)) {
    for (const [key, val] of headersInit) {
      result[key.toLowerCase()] = val;
    }
  } else {
    for (const [key, val] of Object.entries(headersInit)) {
      result[key.toLowerCase()] = String(val);
    }
  }
  return result;
}

/**
 * Initializes the global fetch interceptor.
 */
export function setupFetchMock(customHandlers: MockHandler[] = [], strictMode = true) {
  if (!originalFetch) {
    originalFetch = globalThis.fetch;
  }
  handlers.length = 0;
  requestHistory.length = 0;
  isStrict = strictMode;

  if (customHandlers.length > 0) {
    handlers.push(...customHandlers);
  }

  globalThis.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    let url: string;
    let method = (init?.method || 'GET').toUpperCase();
    let headers: Record<string, string> = {};
    let body: string | null = null;

    if (typeof input === 'string') {
      url = input;
      headers = normalizeHeaders(init?.headers);
      if (init?.body) {
        body = typeof init.body === 'string' ? init.body : String(init.body);
      }
    } else if (input instanceof URL) {
      url = input.toString();
      headers = normalizeHeaders(init?.headers);
      if (init?.body) {
        body = typeof init.body === 'string' ? init.body : String(init.body);
      }
    } else {
      // Request instance
      url = input.url;
      method = (input.method || init?.method || 'GET').toUpperCase();
      headers = { ...normalizeHeaders(input.headers), ...normalizeHeaders(init?.headers) };
      if (init?.body) {
        body = typeof init.body === 'string' ? init.body : String(init.body);
      }
    }

    let parsedBody: unknown = undefined;
    if (body) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = body;
      }
    }

    const captured: CapturedRequest = {
      url,
      method,
      headers,
      body,
      parsedBody,
      timestamp: Date.now(),
    };

    requestHistory.push(captured);

    for (const handler of handlers) {
      const response = await handler(url, init, captured);
      if (response !== null) {
        return response;
      }
    }

    if (isStrict) {
      throw new Error(`[Hermetic Mock Failure] Unhandled external HTTP request to: ${url}`);
    }

    // If not strict and originalFetch exists, fallback (rarely used in hermetic tests)
    if (originalFetch) {
      return originalFetch(input, init);
    }

    return new Response(JSON.stringify({ error: 'Mock not configured' }), { status: 404 });
  };
}

/**
 * Adds one or more mock handlers to the front or back of the chain.
 */
export function registerMockHandler(handler: MockHandler, prepend = false) {
  if (prepend) {
    handlers.unshift(handler);
  } else {
    handlers.push(handler);
  }
}

/**
 * Clears all active mock handlers.
 */
export function clearMockHandlers() {
  handlers.length = 0;
}

/**
 * Retrieves the full recorded history of intercepted HTTP requests.
 */
export function getInterceptedRequests(): CapturedRequest[] {
  return [...requestHistory];
}

/**
 * Clears request history.
 */
export function clearInterceptedRequests() {
  requestHistory.length = 0;
}

/**
 * Restores globalThis.fetch to its original implementation.
 */
export function restoreFetchMock() {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
    originalFetch = null;
  }
  handlers.length = 0;
  requestHistory.length = 0;
}
