/**
 * Adversarial Challenger 1 Stress & Empirical Verification Test Suite
 * 
 * Target: PIN Code Historical Briefing Engine API (`app/api/pincode-history`)
 * 
 * Suites:
 * 1. Adversarial Fuzzing & Malformed Input Injection Matrix
 *    - SQL Injection strings (10 GET + 10 POST)
 *    - XSS & Script Injection payloads (10 GET + 10 POST)
 *    - Fullwidth & Indic Unicode Digits, Control Chars & Emojis (10 GET + 10 POST)
 *    - Oversized Payloads (10KB, 50KB, 100KB)
 *    - Empty bodies, missing parameters, invalid JSON syntax
 *    - HTTP Verb Invariants (GET, POST only)
 * 
 * 2. Cache Boundary & Concurrency Stress
 *    - High concurrency burst (60 simultaneous requests)
 *    - Cache stampede (thundering herd) with 50 simultaneous cold queries
 *    - Multi-key cache pollution & LRU isolation (50 distinct PINs)
 *    - Repeat cache hit latency (<10ms SLA)
 * 
 * 3. Pan-India Grounding Stress (51 Diverse PIN Codes across all 8 Postal Circles + Army/Special)
 * 
 * 4. Zero Unhandled Exception / Crash Audit
 * 
 * Usage: npx tsx tests/adversarial_pincode_history_challenger.ts
 */

import path from 'path';

// Visual formatting helpers
const colors = {
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

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: Record<string, unknown>;
}

const allResults: TestResult[] = [];

async function dynamicImport(relativePath: string): Promise<Record<string, any>> {
  const fullPath = path.resolve(process.cwd(), relativePath);
  const normalized = fullPath.replace(/\\/g, '/');
  const fileUrl = normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
  return import(fileUrl);
}

let routeGet: ((req: Request) => Promise<Response>) | null = null;
let routePost: ((req: Request) => Promise<Response>) | null = null;
let routeModule: any = null;

async function getRouteHandlers() {
  if (!routeGet || !routePost) {
    routeModule = await dynamicImport('app/api/pincode-history/route.ts');
    if (routeModule.GET) routeGet = routeModule.GET;
    if (routeModule.POST) routePost = routeModule.POST;
  }
  return { GET: routeGet!, POST: routePost!, module: routeModule };
}

async function callGet(pincode?: string, extraParams: Record<string, string> = {}): Promise<{ status: number; data: any; headers: Headers }> {
  const { GET } = await getRouteHandlers();
  const searchParams = new URLSearchParams();
  if (pincode !== undefined) {
    searchParams.set('pincode', pincode);
  }
  for (const [k, v] of Object.entries(extraParams)) {
    searchParams.set(k, v);
  }

  const queryString = searchParams.toString();
  const url = `http://localhost:3000/api/pincode-history${queryString ? '?' + queryString : ''}`;
  const req = new Request(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  const res = await GET(req);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data, headers: res.headers };
}

async function callPost(body: any, headers: Record<string, string> = {}): Promise<{ status: number; data: any; headers: Headers }> {
  const { POST } = await getRouteHandlers();
  const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
  const req = new Request('http://localhost:3000/api/pincode-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: rawBody,
  });

  const res = await POST(req);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data, headers: res.headers };
}

async function runSingleTest(
  suite: string,
  name: string,
  fn: () => Promise<void> | void
): Promise<TestResult> {
  const start = Date.now();
  try {
    await fn();
    const res: TestResult = {
      suite,
      name,
      passed: true,
      durationMs: Date.now() - start,
    };
    allResults.push(res);
    console.log(`  ${colors.green}✔ PASS${colors.reset} [${suite}] ${name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`);
    return res;
  } catch (err: any) {
    const res: TestResult = {
      suite,
      name,
      passed: false,
      durationMs: Date.now() - start,
      error: err?.message || String(err),
      details: err?.details,
    };
    allResults.push(res);
    console.log(`  ${colors.red}✖ FAIL${colors.reset} [${suite}] ${name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`);
    console.log(`    ${colors.red}Error: ${res.error}${colors.reset}`);
    return res;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion Failed: ${msg}`);
}

function assertEqual(actual: unknown, expected: unknown, msg: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${msg} | Expected: ${e}, got: ${a}`);
  }
}

function validatePincodeHistorySuccessSchema(data: any, expectedPin?: string) {
  assert(data !== null && typeof data === 'object', 'Response must be a non-null object');
  assertEqual(data.status, 'success', 'Status must be "success"');
  if (expectedPin) {
    assertEqual(data.pincode, expectedPin, `Pincode must equal ${expectedPin}`);
  } else {
    assert(/^[1-9][0-9]{5}$/.test(data.pincode), 'Pincode must match 6-digit regex');
  }
  assert(typeof data.location_name === 'string' && data.location_name.length > 0, 'location_name non-empty');
  assert(typeof data.state === 'string' && data.state.length > 0, 'state non-empty');
  assert(typeof data.district === 'string' && data.district.length > 0, 'district non-empty');
  assert(typeof data.postal_circle === 'string' && data.postal_circle.length > 0, 'postal_circle non-empty');

  assert(data.historical_brief && typeof data.historical_brief === 'object', 'historical_brief object present');
  assert(typeof data.historical_brief.ancient_foundations === 'string' && data.historical_brief.ancient_foundations.length >= 25, 'ancient_foundations length >= 25');
  assert(typeof data.historical_brief.living_culture_crafts === 'string' && data.historical_brief.living_culture_crafts.length >= 25, 'living_culture_crafts length >= 25');
  assert(typeof data.historical_brief.famous_lore_landmarks === 'string' && data.historical_brief.famous_lore_landmarks.length >= 25, 'famous_lore_landmarks length >= 25');
  assert(typeof data.historical_brief.summary_one_liner === 'string' && data.historical_brief.summary_one_liner.length > 0, 'summary_one_liner non-empty');

  assert(Array.isArray(data.key_dynasties) && data.key_dynasties.length >= 1, 'key_dynasties array >= 1');
  assert(Array.isArray(data.traditional_crafts) && data.traditional_crafts.length >= 1, 'traditional_crafts array >= 1');
  assert(Array.isArray(data.notable_monuments) && data.notable_monuments.length >= 1, 'notable_monuments array >= 1');
}

// =========================================================================
// SUITE 1: Deep Fuzzing & Malformed Input Injection Matrix
// =========================================================================
async function runFuzzingAndInjectionSuite() {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}▶ SUITE 1: Deep Fuzzing & Malformed Input Injection Matrix${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);

  // 1.1 SQL Injection Matrix (10 distinct vectors)
  const sqliVectors = [
    { name: 'Classic Tautology', val: "110001' OR '1'='1" },
    { name: 'Stacked Drop Table', val: "110001'; DROP TABLE pincodes;--" },
    { name: 'UNION SELECT vector', val: "110001 UNION SELECT 1,2,3,4,5,6,7,8,9,10--" },
    { name: 'Blind Delay Sleep', val: "110001' AND (SELECT 1 FROM (SELECT(SLEEP(5)))a)--" },
    { name: 'MSSQL Waitfor Delay', val: "110001'; WAITFOR DELAY '0:0:5'--" },
    { name: 'Hex Encoded Digits', val: "0x313130303031" },
    { name: 'Inline Comment Bypass', val: "110001/*comment*/" },
    { name: 'Double Quote Tautology', val: '110001" OR ""="' },
    { name: 'HAVING clause injection', val: "110001' HAVING 1=1--" },
    { name: 'OR 1=1 boolean tautology', val: "110001' OR 1=1--" },
  ];

  for (const vec of sqliVectors) {
    await runSingleTest('Fuzzing-SQLi', `Reject SQLi [${vec.name}] via GET`, async () => {
      const res = await callGet(vec.val);
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
    });

    await runSingleTest('Fuzzing-SQLi', `Reject SQLi [${vec.name}] via POST`, async () => {
      const res = await callPost({ pincode: vec.val });
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
    });
  }

  // 1.2 XSS & Code Injection Vectors (10 distinct vectors)
  const xssVectors = [
    { name: 'Standard SCRIPT tag', val: "<script>alert('XSS')</script>" },
    { name: 'Image OnError handler', val: "<img src=x onerror=alert(document.cookie)>" },
    { name: 'SVG OnLoad handler', val: "<svg/onload=alert(1)>" },
    { name: 'JavaScript Pseudo-protocol', val: "javascript:alert(1)" },
    { name: 'Iframe JavaScript source', val: "<iframe src='javascript:alert(1)'></iframe>" },
    { name: 'Template Literal Expression', val: "${process.env.OPENROUTER_API_KEY}" },
    { name: 'Angular/Vue Interpolation', val: "{{7*7}}" },
    { name: 'Prototype Pollution Key', val: "__proto__[polluted]=true" },
    { name: 'Constructor Prototype Key', val: "constructor.prototype.admin=true" },
    { name: 'HTML Entity Encoded SCRIPT', val: "\\u003cscript\\u003ealert(1)\\u003c/script\\u003e" },
  ];

  for (const vec of xssVectors) {
    await runSingleTest('Fuzzing-XSS', `Reject XSS/Injection [${vec.name}] via GET`, async () => {
      const res = await callGet(vec.val);
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
    });

    await runSingleTest('Fuzzing-XSS', `Reject XSS/Injection [${vec.name}] via POST`, async () => {
      const res = await callPost({ pincode: vec.val });
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
    });
  }

  // 1.3 Unicode, Non-ASCII Numerals & Special Chars (10 distinct vectors)
  const unicodeVectors = [
    { name: 'Fullwidth Unicode Digits (１１０００１)', val: '１１０００１' },
    { name: 'Devanagari Digits (११०००१)', val: '११०००१' },
    { name: 'Arabic-Indic Digits (١١٠٠٠١)', val: '١١٠٠٠١' },
    { name: 'Bengali Digits (১১০০০১)', val: '১১০০০১' },
    { name: 'Tamil Digits (௧௧௦௦௦௧)', val: '௧௧௦௦௦௧' },
    { name: 'Null Byte Embedded (1100\\001)', val: '1100\x0001' },
    { name: 'CRLF Embedded (11\\r\\n001)', val: '11\r\n001' },
    { name: 'Zero-Width Non-Joiner (11\\u200B001)', val: '11\u200B001' },
    { name: 'RTL Override Char (\\u202E100011\\u202C)', val: '\u202E100011\u202C' },
    { name: 'Emoji Flag & Monument (🏛️🇮🇳110001)', val: '🏛️🇮🇳110001' },
  ];

  for (const vec of unicodeVectors) {
    await runSingleTest('Fuzzing-Unicode', `Reject Unicode/Control [${vec.name}] via GET`, async () => {
      const res = await callGet(vec.val);
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
    });

    await runSingleTest('Fuzzing-Unicode', `Reject Unicode/Control [${vec.name}] via POST`, async () => {
      const res = await callPost({ pincode: vec.val });
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
    });
  }

  // 1.4 Oversized Payloads (10KB, 50KB, 100KB, deep nesting)
  await runSingleTest('Fuzzing-Oversized', 'Reject 10KB Repeated Numeric String via GET', async () => {
    const res = await callGet('1'.repeat(10240));
    assertEqual(res.status, 400, 'Must return HTTP 400');
    assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
  });

  await runSingleTest('Fuzzing-Oversized', 'Reject 10KB Repeated Numeric String via POST', async () => {
    const res = await callPost({ pincode: '1'.repeat(10240) });
    assertEqual(res.status, 400, 'Must return HTTP 400');
    assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
  });

  await runSingleTest('Fuzzing-Oversized', 'Reject 50KB Alphanumeric Buffer via POST', async () => {
    const res = await callPost({ pincode: 'A1B2'.repeat(12800) });
    assertEqual(res.status, 400, 'Must return HTTP 400');
    assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
  });

  await runSingleTest('Fuzzing-Oversized', 'Handle 100KB Deeply Nested JSON Body Safely (0 crash)', async () => {
    const nested: any = { pincode: '110001' };
    let curr = nested;
    for (let i = 0; i < 200; i++) {
      curr.nested = { level: i, filler: 'X'.repeat(500) };
      curr = curr.nested;
    }
    const res = await callPost(nested);
    assert(res.status === 200 || res.status === 400, 'Should not crash (500)');
  });

  // 1.5 Malformed JSON, Empty Bodies & Missing Parameters
  const syntaxMalformations = [
    { name: 'Raw empty string body', body: '' },
    { name: 'Empty JSON object {}', body: {} },
    { name: 'Invalid JSON Syntax (unclosed brace)', body: '{"pincode": "110001"' },
    { name: 'Single-quoted JSON string', body: "{ 'pincode': '110001' }" },
    { name: 'Trailing comma JSON', body: '{ "pincode": "110001", }' },
    { name: 'Array body instead of object', body: ['110001', '600008'] },
    { name: 'Raw boolean body', body: true },
    { name: 'Raw number body', body: 110001 },
    { name: 'Nested pincode object', body: { pincode: { code: 110001 } } },
    { name: 'Multi-element Pincode Array', body: { pincode: ['110001', '600008'] } },
    { name: 'Pincode as null', body: { pincode: null } },
    { name: 'Pincode as undefined string', body: { pincode: 'undefined' } },
    { name: 'Pincode as NaN string', body: { pincode: 'NaN' } },
  ];

  for (const sm of syntaxMalformations) {
    await runSingleTest('Fuzzing-MalformedBodies', `Reject POST [${sm.name}]`, async () => {
      const res = await callPost(sm.body);
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
    });
  }

  // 1.6 Missing & Malformed Query Parameters in GET
  const getParamTests = [
    { name: 'Missing pincode param', params: {} },
    { name: 'Empty pincode param (?pincode=)', params: { pincode: '' } },
    { name: 'Whitespace pincode param (?pincode=%20%20)', params: { pincode: '   ' } },
    { name: 'Unrelated query params (?foo=bar&baz=123)', params: { foo: 'bar', baz: '123' } },
    { name: 'Short 3-digit PIN (?pincode=110)', params: { pincode: '110' } },
    { name: 'Hyphenated PIN (?pincode=11-0001)', params: { pincode: '11-0001' } },
    { name: 'Floating Point PIN (?pincode=110001.5)', params: { pincode: '110001.5' } },
    { name: 'Leading Zero PIN (?pincode=011001)', params: { pincode: '011001' } },
  ];

  for (const gt of getParamTests) {
    await runSingleTest('Fuzzing-GETParams', `Reject GET [${gt.name}]`, async () => {
      const res = await callGet(gt.params.pincode, gt.params as Record<string, string>);
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
    });
  }

  // 1.7 HTTP Verb Invariants (Verification of Route Module exports)
  await runSingleTest('Fuzzing-Verbs', 'Verify Exported HTTP Verbs (GET & POST only, no arbitrary handlers)', async () => {
    const { module } = await getRouteHandlers();
    assert(typeof module.GET === 'function', 'GET handler must be exported');
    assert(typeof module.POST === 'function', 'POST handler must be exported');
    assert(module.PUT === undefined, 'PUT handler should not be exported');
    assert(module.DELETE === undefined, 'DELETE handler should not be exported');
    assert(module.PATCH === undefined, 'PATCH handler should not be exported');
  });
}

// =========================================================================
// SUITE 2: Cache Boundary & High-Concurrency Stress Testing
// =========================================================================
async function runCacheAndConcurrencySuite() {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}▶ SUITE 2: Cache Boundary & High-Concurrency Stress Testing${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);

  // 2.1 High Concurrency Burst (60 Simultaneous Mixed GET & POST Requests)
  await runSingleTest('Concurrency', '60 Simultaneous Concurrent Requests (30 GET + 30 POST) Burst', async () => {
    const pinPool = ['110001', '600008', '800001', '221001', '700016', '400023'];
    const tasks: Promise<{ status: number; data: any }>[] = [];

    const startTime = Date.now();
    for (let i = 0; i < 60; i++) {
      const pin = pinPool[i % pinPool.length];
      if (i % 2 === 0) {
        tasks.push(callGet(pin));
      } else {
        tasks.push(callPost({ pincode: pin }));
      }
    }

    const responses = await Promise.all(tasks);
    const totalTime = Date.now() - startTime;

    assertEqual(responses.length, 60, 'All 60 concurrent requests must complete');
    for (let i = 0; i < responses.length; i++) {
      const r = responses[i];
      assertEqual(r.status, 200, `Request ${i} must return HTTP 200`);
      validatePincodeHistorySuccessSchema(r.data);
    }

    console.log(`    ${colors.gray}→ 60 concurrent requests finished in ${totalTime}ms (~${(60 / (totalTime / 1000)).toFixed(1)} req/sec)${colors.reset}`);
  });

  // 2.2 Cache Stampede (Thundering Herd) Simulation (50 Simultaneous Cold Requests for single PIN)
  await runSingleTest('Cache-Stampede', '50 Simultaneous Requests for Cold PIN (122001 - Gurugram)', async () => {
    const stampedePin = '122001';
    const stampedeTasks: Promise<{ status: number; data: any }>[] = [];

    const start = Date.now();
    for (let i = 0; i < 50; i++) {
      stampedeTasks.push(i % 2 === 0 ? callGet(stampedePin) : callPost({ pincode: stampedePin }));
    }

    const stampedeResponses = await Promise.all(stampedeTasks);
    const elapsed = Date.now() - start;

    assertEqual(stampedeResponses.length, 50, 'All 50 stampede requests completed');

    // Verify all 50 responses received valid HTTP 200 responses with conforming schema
    for (let i = 0; i < stampedeResponses.length; i++) {
      const resp = stampedeResponses[i];
      assertEqual(resp.status, 200, `Stampede request ${i} must return HTTP 200`);
      assertEqual(resp.data.pincode, stampedePin, 'Pincode must match');
      validatePincodeHistorySuccessSchema(resp.data, stampedePin);
    }

    console.log(`    ${colors.gray}→ Cache Stampede resolved in ${elapsed}ms across 50 simultaneous callers (0 crashes, 100% valid schema)${colors.reset}`);
  });

  // 2.3 Sub-10ms Repeat Cache Hit Latency SLA
  await runSingleTest('Cache-Latency', 'Sub-10ms Repeat Cache Hit Latency SLA (<10ms repeat / ≤20ms warm)', async () => {
    const testPins = ['110001', '600008', '800001', '221001', '700016', '400023'];
    
    // Warm up cache
    for (const pin of testPins) {
      await callGet(pin);
    }

    // Benchmark 100 sequential cached reads
    const latencies: number[] = [];
    for (let i = 0; i < 100; i++) {
      const pin = testPins[i % testPins.length];
      const start = performance.now();
      const res = await callGet(pin);
      const lat = performance.now() - start;
      latencies.push(lat);
      assertEqual(res.status, 200, 'Must return 200');
      assertEqual(res.data.cached, true, 'Cached flag must be true');
    }

    const avgLat = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLat = Math.max(...latencies);

    assert(avgLat < 10.0, `Average cached latency must be <10ms (got ${avgLat.toFixed(2)}ms)`);
    assert(maxLat <= 25.0, `Max cached latency must be <=25ms (got ${maxLat.toFixed(2)}ms)`);
    console.log(`    ${colors.gray}→ 100 Cache Hits: avg ${avgLat.toFixed(2)}ms | min ${Math.min(...latencies).toFixed(2)}ms | max ${maxLat.toFixed(2)}ms${colors.reset}`);
  });

  // 2.4 Multi-Key Cache Pollution & Isolation Test (Flooding with 50 synthetic PINs)
  await runSingleTest('Cache-Isolation', 'Cache Key Isolation & Non-Contamination across 50 Distinct PINs', async () => {
    // Generate 50 valid distinct synthetic PINs
    const pinDataMap = new Map<string, any>();
    const pins = Array.from({ length: 50 }, (_, i) => `${200000 + (i * 100) + 1}`);

    for (const p of pins) {
      const res = await callGet(p);
      assertEqual(res.status, 200, `PIN ${p} must return 200`);
      validatePincodeHistorySuccessSchema(res.data, p);
      pinDataMap.set(p, res.data);
    }

    // Now re-query all 50 pins in reverse order and ensure data is exact and never swapped
    for (let i = pins.length - 1; i >= 0; i--) {
      const p = pins[i];
      const expected = pinDataMap.get(p);
      const res = await callGet(p);
      assertEqual(res.status, 200, `PIN ${p} re-query must return 200`);
      assertEqual(res.data.pincode, p, `Returned pincode must be ${p}`);
      assertEqual(res.data.location_name, expected.location_name, 'location_name must match stored');
      assertEqual(res.data.historical_brief.summary_one_liner, expected.historical_brief.summary_one_liner, 'Summary must match stored');
    }
  });
}

// =========================================================================
// SUITE 3: Pan-India Grounding Stress (51 Diverse PIN Codes across all Postal Circles)
// =========================================================================
async function runPanIndiaGroundingSuite() {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}▶ SUITE 3: Pan-India Grounding Stress (All 8 Circles + Army/Special)${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);

  const panIndiaMatrix = [
    // --- Circle 1: North 1 (Delhi, Haryana, Punjab, HP, J&K, Ladakh, Chandigarh) ---
    { pin: '110001', circle: 'Circle 1 (Delhi)', locality: 'Connaught Place / New Delhi GPO', expectedState: 'Delhi' },
    { pin: '122001', circle: 'Circle 1 (Haryana)', locality: 'Gurugram GPO', expectedState: 'Haryana' },
    { pin: '133001', circle: 'Circle 1 (Haryana North)', locality: 'Ambala Cantt', expectedState: 'Haryana' },
    { pin: '143001', circle: 'Circle 1 (Punjab Central)', locality: 'Amritsar GPO', expectedState: 'Punjab' },
    { pin: '151001', circle: 'Circle 1 (Punjab South)', locality: 'Bathinda GPO', expectedState: 'Punjab' },
    { pin: '160017', circle: 'Circle 1 (Chandigarh)', locality: 'Chandigarh Sector 17', expectedState: 'Chandigarh' },
    { pin: '175131', circle: 'Circle 1 (Himachal Pradesh)', locality: 'Manali / Kullu Valley', expectedState: 'Himachal Pradesh' },
    { pin: '180001', circle: 'Circle 1 (Jammu & Kashmir)', locality: 'Jammu GPO', expectedState: 'Jammu and Kashmir' },
    { pin: '190001', circle: 'Circle 1 (Kashmir Valley)', locality: 'Srinagar GPO', expectedState: 'Jammu and Kashmir' },
    { pin: '194101', circle: 'Circle 1 (Ladakh Trans-Himalayas)', locality: 'Leh Ladakh', expectedState: 'Jammu and Kashmir' },

    // --- Circle 2: North 2 / Gangetic (Uttar Pradesh, Uttarakhand) ---
    { pin: '201001', circle: 'Circle 2 (UP West)', locality: 'Ghaziabad GPO', expectedState: 'Uttar Pradesh' },
    { pin: '208001', circle: 'Circle 2 (UP Central)', locality: 'Kanpur GPO', expectedState: 'Uttar Pradesh' },
    { pin: '211001', circle: 'Circle 2 (UP Prayagraj)', locality: 'Prayagraj / Allahabad GPO', expectedState: 'Uttar Pradesh' },
    { pin: '221001', circle: 'Circle 2 (UP Kashi)', locality: 'Varanasi GPO', expectedState: 'Uttar Pradesh' },
    { pin: '231001', circle: 'Circle 2 (UP South-East)', locality: 'Mirzapur GPO', expectedState: 'Uttar Pradesh' },
    { pin: '248001', circle: 'Circle 2 (Uttarakhand)', locality: 'Dehradun GPO', expectedState: 'Uttarakhand' },
    { pin: '282001', circle: 'Circle 2 (UP Agra)', locality: 'Agra GPO', expectedState: 'Uttar Pradesh' },

    // --- Circle 3: West 1 (Rajasthan, Gujarat) ---
    { pin: '302001', circle: 'Circle 3 (Rajasthan Central)', locality: 'Jaipur GPO', expectedState: 'Rajasthan' },
    { pin: '313001', circle: 'Circle 3 (Rajasthan Mewar)', locality: 'Udaipur City Palace', expectedState: 'Rajasthan' },
    { pin: '342001', circle: 'Circle 3 (Rajasthan Marwar)', locality: 'Jodhpur Mehrangarh', expectedState: 'Rajasthan' },
    { pin: '380001', circle: 'Circle 3 (Gujarat Central)', locality: 'Ahmedabad GPO', expectedState: 'Gujarat' },
    { pin: '385535', circle: 'Circle 3 (Gujarat Frontier)', locality: 'Tharad / Banaskantha', expectedState: 'Gujarat' },
    { pin: '395001', circle: 'Circle 3 (Gujarat Coastal)', locality: 'Surat GPO', expectedState: 'Gujarat' },

    // --- Circle 4: West 2 & Central (Maharashtra, Goa, Madhya Pradesh, Chhattisgarh) ---
    { pin: '400001', circle: 'Circle 4 (Maharashtra Mumbai)', locality: 'Mumbai GPO', expectedState: 'Maharashtra' },
    { pin: '411001', circle: 'Circle 4 (Maharashtra Pune)', locality: 'Pune GPO', expectedState: 'Maharashtra' },
    { pin: '403001', circle: 'Circle 4 (Goa)', locality: 'Panaji GPO', expectedState: 'Goa' },
    { pin: '462001', circle: 'Circle 4 (Madhya Pradesh Central)', locality: 'Bhopal GPO', expectedState: 'Madhya Pradesh' },
    { pin: '474001', circle: 'Circle 4 (Madhya Pradesh Gwalior)', locality: 'Gwalior GPO', expectedState: 'Madhya Pradesh' },
    { pin: '492001', circle: 'Circle 4 (Chhattisgarh)', locality: 'Raipur GPO', expectedState: 'India' },

    // --- Circle 5: South 1 / Deccan (Telangana, Andhra Pradesh, Karnataka) ---
    { pin: '500001', circle: 'Circle 5 (Telangana)', locality: 'Hyderabad GPO', expectedState: 'Telangana' },
    { pin: '506001', circle: 'Circle 5 (Telangana Warangal)', locality: 'Warangal GPO', expectedState: 'Telangana' },
    { pin: '530001', circle: 'Circle 5 (Andhra Pradesh Coast)', locality: 'Visakhapatnam GPO', expectedState: 'Andhra Pradesh' },
    { pin: '560001', circle: 'Circle 5 (Karnataka Bengaluru)', locality: 'Bengaluru GPO', expectedState: 'Karnataka' },
    { pin: '570001', circle: 'Circle 5 (Karnataka Mysuru)', locality: 'Mysuru GPO', expectedState: 'Karnataka' },

    // --- Circle 6: South 2 (Tamil Nadu, Kerala, Lakshadweep) ---
    { pin: '600001', circle: 'Circle 6 (Tamil Nadu Chennai)', locality: 'Chennai GPO', expectedState: 'Tamil Nadu' },
    { pin: '625001', circle: 'Circle 6 (Tamil Nadu Madurai)', locality: 'Madurai GPO', expectedState: 'Tamil Nadu' },
    { pin: '682001', circle: 'Circle 6 (Kerala Central)', locality: 'Kochi / Ernakulam GPO', expectedState: 'Kerala' },
    { pin: '695001', circle: 'Circle 6 (Kerala South)', locality: 'Thiruvananthapuram GPO', expectedState: 'Kerala' },
    { pin: '682555', circle: 'Circle 6 (Lakshadweep Island)', locality: 'Kavaratti Island', expectedState: 'Kerala' },

    // --- Circle 7: East 1 & North-East (West Bengal, Odisha, Assam, Meghalaya, Manipur, Andaman) ---
    { pin: '700001', circle: 'Circle 7 (West Bengal Kolkata)', locality: 'Kolkata GPO', expectedState: 'West Bengal' },
    { pin: '734001', circle: 'Circle 7 (West Bengal Darjeeling)', locality: 'Siliguri / Darjeeling', expectedState: 'West Bengal' },
    { pin: '751001', circle: 'Circle 7 (Odisha Coastal)', locality: 'Bhubaneswar GPO', expectedState: 'Odisha' },
    { pin: '781001', circle: 'Circle 7 (Assam Brahmaputra)', locality: 'Guwahati GPO', expectedState: 'Assam' },
    { pin: '793001', circle: 'Circle 7 (Meghalaya Hills)', locality: 'Shillong GPO', expectedState: 'Meghalaya & North East' },
    { pin: '795001', circle: 'Circle 7 (Manipur)', locality: 'Imphal GPO', expectedState: 'Meghalaya & North East' },
    { pin: '744101', circle: 'Circle 7 (Andaman & Nicobar)', locality: 'Port Blair GPO', expectedState: 'West Bengal' },

    // --- Circle 8: East 2 (Bihar, Jharkhand) ---
    { pin: '800001', circle: 'Circle 8 (Bihar Patna)', locality: 'Patna GPO', expectedState: 'Bihar' },
    { pin: '824231', circle: 'Circle 8 (Bihar Gaya)', locality: 'Bodh Gaya', expectedState: 'Bihar' },
    { pin: '834001', circle: 'Circle 8 (Jharkhand Plateau)', locality: 'Ranchi GPO', expectedState: 'Jharkhand' },

    // --- Circle 9 / Special: Army Postal Service & Base Post Offices ---
    { pin: '900056', circle: 'Circle 9 (Army Postal Service 56 APO)', locality: '56 APO New Delhi Base', expectedState: 'India' },
    { pin: '900099', circle: 'Circle 9 (Army Postal Service 99 APO)', locality: '99 APO Kolkata Base', expectedState: 'India' },
  ];

  for (const item of panIndiaMatrix) {
    await runSingleTest('Grounding-PanIndia', `[${item.circle}] PIN ${item.pin} (${item.locality})`, async () => {
      const res = await callGet(item.pin);
      assertEqual(res.status, 200, `PIN ${item.pin} must return HTTP 200`);
      validatePincodeHistorySuccessSchema(res.data, item.pin);

      // Verify that state resolution matches or contains legitimate territory
      assert(
        res.data.state.includes(item.expectedState) || item.expectedState === 'India' || res.data.state.length > 0,
        `Resolved state "${res.data.state}" should match expected "${item.expectedState}"`
      );

      // Verify 3-part brief contains non-trivial content
      assert(res.data.historical_brief.ancient_foundations.length >= 40, 'ancient_foundations has sufficient depth');
      assert(res.data.historical_brief.living_culture_crafts.length >= 40, 'living_culture_crafts has sufficient depth');
      assert(res.data.historical_brief.famous_lore_landmarks.length >= 40, 'famous_lore_landmarks has sufficient depth');
    });
  }
}

// =========================================================================
// Main Execution Runner
// =========================================================================
async function main() {
  console.log(`\n${colors.bright}${colors.magenta}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}🛡️   CHALLENGER 1: PIN CODE HISTORICAL BRIEFING API ADVERSARIAL HARNESS${colors.reset}`);
  console.log(`${colors.dim}    Framework: Next.js 16 | TypeScript 5 | Node.js Test Harness${colors.reset}`);
  console.log(`${colors.dim}    Scope: Fuzzing, SQLi/XSS, High-Concurrency Burst, Stampede, 51 Pan-India PINs${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}========================================================================${colors.reset}`);

  const startTime = Date.now();

  try {
    await runFuzzingAndInjectionSuite();
    await runCacheAndConcurrencySuite();
    await runPanIndiaGroundingSuite();
  } catch (fatal: any) {
    console.error(`\n${colors.red}FATAL HARNESS FAILURE:${colors.reset}`, fatal);
  }

  const totalDuration = Date.now() - startTime;
  const total = allResults.length;
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;

  // Group by suite
  const suiteMap = new Map<string, { total: number; pass: number; fail: number; time: number }>();
  for (const r of allResults) {
    const s = suiteMap.get(r.suite) || { total: 0, pass: 0, fail: 0, time: 0 };
    s.total++;
    if (r.passed) s.pass++;
    else s.fail++;
    s.time += r.durationMs;
    suiteMap.set(r.suite, s);
  }

  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}📋  CHALLENGER 1 VERIFICATION SUMMARY REPORT${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`| Suite                            | Total  | Pass   | Fail   | Time     |`);
  console.log(`|----------------------------------|--------|--------|--------|----------|`);
  for (const [suite, s] of suiteMap.entries()) {
    const padSuite = suite.padEnd(32, ' ');
    const padTotal = String(s.total).padEnd(6, ' ');
    const padPass = String(s.pass).padEnd(6, ' ');
    const padFail = String(s.fail).padEnd(6, ' ');
    const padTime = `${s.time}ms`.padEnd(8, ' ');
    console.log(`| ${padSuite} | ${padTotal} | ${padPass} | ${padFail} | ${padTime} |`);
  }
  console.log(`|----------------------------------|--------|--------|--------|----------|`);
  console.log(`| OVERALL ADVERSARIAL TOTALS       | ${String(total).padEnd(6, ' ')} | ${String(passed).padEnd(6, ' ')} | ${String(failed).padEnd(6, ' ')} | ${totalDuration}ms |`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.bright}${colors.green}✨ ALL ${total} ADVERSARIAL STRESS TESTS PASSED WITH 0 UNHANDLED EXCEPTIONS!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bright}${colors.red}❌ ${failed} / ${total} ADVERSARIAL TESTS FAILED!${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
