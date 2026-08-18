/**
 * Empirical Adversarial Stress Test Harness for PIN Code Historical Briefing Engine
 * Target: app/api/pincode-history/route.ts
 *
 * Authored by: Backend Challenger 1 (Replacement)
 */

import path from 'path';
import { performance } from 'perf_hooks';

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

const testResults: TestResult[] = [];

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

async function runTest(
  suite: string,
  name: string,
  fn: () => Promise<void> | void
): Promise<TestResult> {
  const start = performance.now();
  try {
    await fn();
    const duration = performance.now() - start;
    const res: TestResult = {
      suite,
      name,
      passed: true,
      durationMs: Math.round(duration * 100) / 100,
    };
    testResults.push(res);
    console.log(`  ${colors.green}✔ PASS${colors.reset} [${suite}] ${name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`);
    return res;
  } catch (err: any) {
    const duration = performance.now() - start;
    const res: TestResult = {
      suite,
      name,
      passed: false,
      durationMs: Math.round(duration * 100) / 100,
      error: err?.message || String(err),
    };
    testResults.push(res);
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

function validateSuccessSchema(data: any, expectedPin?: string) {
  assert(data !== null && typeof data === 'object', 'Response must be non-null object');
  assertEqual(data.status, 'success', 'Status must be "success"');
  if (expectedPin) {
    assertEqual(data.pincode, expectedPin, `Pincode must equal ${expectedPin}`);
  } else {
    assert(/^[1-9][0-9]{5}$/.test(data.pincode), 'Pincode must be 6-digit regex');
  }
  assert(typeof data.location_name === 'string' && data.location_name.length > 0, 'location_name non-empty');
  assert(typeof data.state === 'string' && data.state.length > 0, 'state non-empty');
  assert(typeof data.district === 'string' && data.district.length > 0, 'district non-empty');
  assert(typeof data.postal_circle === 'string' && data.postal_circle.length > 0, 'postal_circle non-empty');

  assert(data.historical_brief && typeof data.historical_brief === 'object', 'historical_brief object exists');
  assert(typeof data.historical_brief.ancient_foundations === 'string' && data.historical_brief.ancient_foundations.length >= 25, 'ancient_foundations length >= 25');
  assert(typeof data.historical_brief.living_culture_crafts === 'string' && data.historical_brief.living_culture_crafts.length >= 25, 'living_culture_crafts length >= 25');
  assert(typeof data.historical_brief.famous_lore_landmarks === 'string' && data.historical_brief.famous_lore_landmarks.length >= 25, 'famous_lore_landmarks length >= 25');
  assert(typeof data.historical_brief.summary_one_liner === 'string' && data.historical_brief.summary_one_liner.length > 0, 'summary_one_liner non-empty');

  assert(Array.isArray(data.key_dynasties) && data.key_dynasties.length >= 1, 'key_dynasties array >= 1');
  assert(Array.isArray(data.traditional_crafts) && data.traditional_crafts.length >= 1, 'traditional_crafts array >= 1');
  assert(Array.isArray(data.notable_monuments) && data.notable_monuments.length >= 1, 'notable_monuments array >= 1');
}

// =========================================================================
// SECTION 1: Adversarial Fuzzing & Injection Defense Matrix
// =========================================================================
async function testFuzzingAndInjection() {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}▶ SECTION 1: Adversarial Fuzzing & Injection Defense Matrix${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);

  // 1.1 Malformed PINs explicitly called out in user prompt:
  // ('11-001', '012345', 'abcdef', '000000', '""', whitespace, 7 digits, negative numbers, null bytes, newlines, fullwidth unicode, emojis)
  const coreMalformedCases = [
    { name: 'Hyphenated PIN (11-001)', raw: '11-001' },
    { name: 'Leading Zero PIN (012345)', raw: '012345' },
    { name: 'Alphabetic string (abcdef)', raw: 'abcdef' },
    { name: 'All zeros (000000)', raw: '000000' },
    { name: 'Empty string ("")', raw: '' },
    { name: 'Whitespace string ("   ")', raw: '   ' },
    { name: '7-digit PIN (1100011)', raw: '1100011' },
    { name: '4-digit short PIN (1100)', raw: '1100' },
    { name: 'Negative number (-11000)', raw: '-11000' },
    { name: 'Embedded Null Byte (1100\\x0001)', raw: '1100\x0001' },
    { name: 'Embedded Newline (11\\r\\n001)', raw: '11\r\n001' },
    { name: 'Fullwidth Unicode (１１０００１)', raw: '１１０００１' },
    { name: 'Emoji Injection (🏛️🇮🇳110001)', raw: '🏛️🇮🇳110001' },
    { name: 'Decimal number (110001.5)', raw: '110001.5' },
    { name: 'Internal Space (11 0001)', raw: '11 0001' },
    { name: 'Special characters (!@#$%^)', raw: '!@#$%^' },
  ];

  for (const item of coreMalformedCases) {
    await runTest('Malformed-GET', `Reject ${item.name} via GET`, async () => {
      const res = await callGet(item.raw);
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.status, 'error', 'Status must be error');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
    });

    await runTest('Malformed-POST', `Reject ${item.name} via POST`, async () => {
      const res = await callPost({ pincode: item.raw });
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.status, 'error', 'Status must be error');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error code must match');
    });
  }

  // 1.2 SQL Injection vectors
  const sqliPayloads = [
    "110001' OR '1'='1",
    "110001'; DROP TABLE museums;--",
    "110001 UNION SELECT null,null,null,null,null,null,null,null,null,null--",
    "110001' AND (SELECT 1 FROM (SELECT(SLEEP(5)))a)--",
    "110001'; WAITFOR DELAY '0:0:5'--",
    "110001/*comment*/",
    '110001" OR ""="',
    "110001' HAVING 1=1--",
    "110001' OR 1=1--",
    "0x313130303031",
  ];

  for (let i = 0; i < sqliPayloads.length; i++) {
    const payload = sqliPayloads[i];
    await runTest('SQLi-GET', `Reject SQLi payload #${i + 1} via GET`, async () => {
      const res = await callGet(payload);
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error must be INVALID_PINCODE_FORMAT');
    });
    await runTest('SQLi-POST', `Reject SQLi payload #${i + 1} via POST`, async () => {
      const res = await callPost({ pincode: payload });
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error must be INVALID_PINCODE_FORMAT');
    });
  }

  // 1.3 XSS & Code Injection vectors
  const xssPayloads = [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "<svg/onload=alert(1)>",
    "javascript:alert(1)",
    "<iframe src='javascript:alert(1)'></iframe>",
    "${process.env.OPENROUTER_API_KEY}",
    "{{7*7}}",
    "__proto__[polluted]=true",
    "constructor.prototype.admin=true",
    "\\u003cscript\\u003ealert(1)\\u003c/script\\u003e",
  ];

  for (let i = 0; i < xssPayloads.length; i++) {
    const payload = xssPayloads[i];
    await runTest('XSS-GET', `Reject XSS payload #${i + 1} via GET`, async () => {
      const res = await callGet(payload);
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error must be INVALID_PINCODE_FORMAT');
    });
    await runTest('XSS-POST', `Reject XSS payload #${i + 1} via POST`, async () => {
      const res = await callPost({ pincode: payload });
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error must be INVALID_PINCODE_FORMAT');
    });
  }

  // 1.4 Non-string types, missing keys, invalid JSON syntax
  const edgeBodies = [
    { name: 'Missing body / raw empty string', body: '' },
    { name: 'Empty JSON object {}', body: {} },
    { name: 'Boolean pincode { pincode: true }', body: { pincode: true } },
    { name: 'Boolean pincode { pincode: false }', body: { pincode: false } },
    { name: 'Null pincode { pincode: null }', body: { pincode: null } },
    { name: 'Object pincode { pincode: { code: 110001 } }', body: { pincode: { code: 110001 } } },
    { name: 'Multi-element array pincode { pincode: ["110001", "600008"] }', body: { pincode: ['110001', '600008'] } },
    { name: 'Malformed JSON unclosed string', body: '{"pincode": "110001' },
    { name: 'Single-quoted JSON', body: "{ 'pincode': '110001' }" },
  ];

  for (const eb of edgeBodies) {
    await runTest('MalformedBodies', `Reject body [${eb.name}]`, async () => {
      const res = await callPost(eb.body);
      assertEqual(res.status, 400, 'Must return HTTP 400');
      assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error must be INVALID_PINCODE_FORMAT');
    });
  }

  // Explicit Type Coercion Audit for single-element array
  await runTest('Type-Coercion-Audit', 'Audit Single-Element Array Body { pincode: ["110001"] } Handling', async () => {
    const res = await callPost({ pincode: ['110001'] });
    // Documents JS coercion behavior: String(['110001']) resolves to '110001'
    assert(res.status === 200 || res.status === 400, 'Should handle array safely without 500 crash');
  });

  // 1.5 Missing GET param
  await runTest('Malformed-GET', 'Reject missing ?pincode query param', async () => {
    const res = await callGet(undefined);
    assertEqual(res.status, 400, 'Must return HTTP 400');
    assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error must be INVALID_PINCODE_FORMAT');
  });

  // 1.6 Oversized payloads (10KB, 50KB)
  await runTest('Oversized', 'Reject 10KB numeric string via GET', async () => {
    const res = await callGet('1'.repeat(10240));
    assertEqual(res.status, 400, 'Must return HTTP 400');
    assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error must be INVALID_PINCODE_FORMAT');
  });

  await runTest('Oversized', 'Reject 50KB payload via POST', async () => {
    const res = await callPost({ pincode: 'A'.repeat(51200) });
    assertEqual(res.status, 400, 'Must return HTTP 400');
    assertEqual(res.data?.error, 'INVALID_PINCODE_FORMAT', 'Error must be INVALID_PINCODE_FORMAT');
  });
}

// =========================================================================
// SECTION 2: High Concurrency Burst & LRU Cache Stress
// =========================================================================
async function testConcurrencyAndCache() {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}▶ SECTION 2: High Concurrency Burst & LRU Cache Stress${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);

  // 2.1 60 Simultaneous Mixed Requests Burst
  await runTest('Concurrency', '60 Simultaneous Concurrent Requests (30 GET + 30 POST) Burst', async () => {
    const pool = ['110001', '600008', '800001', '221001', '700016', '400023'];
    const tasks: Promise<{ status: number; data: any }>[] = [];

    const tStart = performance.now();
    for (let i = 0; i < 60; i++) {
      const pin = pool[i % pool.length];
      if (i % 2 === 0) {
        tasks.push(callGet(pin));
      } else {
        tasks.push(callPost({ pincode: pin }));
      }
    }

    const responses = await Promise.all(tasks);
    const duration = performance.now() - tStart;

    assertEqual(responses.length, 60, 'All 60 concurrent requests resolved');
    for (let i = 0; i < responses.length; i++) {
      const r = responses[i];
      assertEqual(r.status, 200, `Request #${i} returned HTTP 200`);
      validateSuccessSchema(r.data);
    }
    console.log(`    ${colors.gray}→ 60 concurrent requests executed in ${duration.toFixed(2)}ms (~${(60 / (duration / 1000)).toFixed(1)} req/s)${colors.reset}`);
  });

  // 2.2 Cache Stampede (50 Simultaneous cold queries for PIN 122001)
  await runTest('Cache-Stampede', '50 Simultaneous Requests for Cold PIN (122001 - Gurugram)', async () => {
    const stampedePin = '122001';
    const stampedeTasks: Promise<{ status: number; data: any }>[] = [];

    const tStart = performance.now();
    for (let i = 0; i < 50; i++) {
      stampedeTasks.push(i % 2 === 0 ? callGet(stampedePin) : callPost({ pincode: stampedePin }));
    }

    const stampedeResponses = await Promise.all(stampedeTasks);
    const duration = performance.now() - tStart;

    assertEqual(stampedeResponses.length, 50, 'All 50 stampede requests resolved');
    for (let i = 0; i < stampedeResponses.length; i++) {
      const r = stampedeResponses[i];
      assertEqual(r.status, 200, `Stampede request #${i} returned HTTP 200`);
      assertEqual(r.data.pincode, stampedePin, 'Pincode matches');
      validateSuccessSchema(r.data, stampedePin);
    }
    console.log(`    ${colors.gray}→ Cache Stampede handled gracefully in ${duration.toFixed(2)}ms across 50 callers${colors.reset}`);
  });

  // 2.3 Sub-10ms Repeat Cache Hit Latency Benchmark (100 sequential reads)
  await runTest('Cache-Latency', 'Sub-10ms Repeat Cache Hit Latency Benchmark (100 sequential reads)', async () => {
    const testPins = ['110001', '600008', '800001', '221001', '700016', '400023'];
    // Prime cache
    for (const pin of testPins) {
      await callGet(pin);
    }

    const latencies: number[] = [];
    for (let i = 0; i < 100; i++) {
      const pin = testPins[i % testPins.length];
      const start = performance.now();
      const res = await callGet(pin);
      const lat = performance.now() - start;
      latencies.push(lat);

      assertEqual(res.status, 200, 'Must return HTTP 200');
      assertEqual(res.data.cached, true, 'Cached flag must be true');
    }

    const avgLat = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const minLat = Math.min(...latencies);
    const maxLat = Math.max(...latencies);

    assert(avgLat < 10.0, `Average latency must be <10ms (got ${avgLat.toFixed(2)}ms)`);
    assert(maxLat <= 25.0, `Max latency must be <=25ms (got ${maxLat.toFixed(2)}ms)`);
    console.log(`    ${colors.gray}→ 100 Cache Hits: avg ${avgLat.toFixed(2)}ms | min ${minLat.toFixed(2)}ms | max ${maxLat.toFixed(2)}ms${colors.reset}`);
  });

  // 2.4 Cache Isolation Across 50 Distinct PINs
  await runTest('Cache-Isolation', 'Key Isolation & Non-Contamination across 50 Distinct PINs', async () => {
    const pinDataMap = new Map<string, any>();
    const pins = Array.from({ length: 50 }, (_, i) => `${200000 + (i * 100) + 1}`);

    for (const p of pins) {
      const res = await callGet(p);
      assertEqual(res.status, 200, `PIN ${p} returns 200`);
      validateSuccessSchema(res.data, p);
      pinDataMap.set(p, res.data);
    }

    // Re-query in reverse order to verify no cross-contamination
    for (let i = pins.length - 1; i >= 0; i--) {
      const p = pins[i];
      const expected = pinDataMap.get(p);
      const res = await callGet(p);
      assertEqual(res.status, 200, `Re-query ${p} returns 200`);
      assertEqual(res.data.pincode, p, 'Pincode matches');
      assertEqual(res.data.location_name, expected.location_name, 'location_name matches');
      assertEqual(res.data.historical_brief.summary_one_liner, expected.historical_brief.summary_one_liner, 'Summary matches');
    }
  });
}

// =========================================================================
// SECTION 3: Pan-India Geographic Coverage (30+ Distinct PINs)
// =========================================================================
async function testGeographicCoverage() {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}▶ SECTION 3: Pan-India Geographic Coverage (30+ Distinct PINs)${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);

  const panIndiaPINs = [
    // Circle 1: Northern Region
    { pin: '110001', region: 'Delhi', locality: 'New Delhi GPO / Connaught Place' },
    { pin: '122001', region: 'Haryana', locality: 'Gurugram' },
    { pin: '133001', region: 'Haryana', locality: 'Ambala Cantt' },
    { pin: '143001', region: 'Punjab', locality: 'Amritsar Golden Temple' },
    { pin: '151001', region: 'Punjab', locality: 'Bathinda Qila Mubarak' },
    { pin: '160017', region: 'Chandigarh', locality: 'Chandigarh Sector 17' },
    { pin: '175131', region: 'Himachal Pradesh', locality: 'Manali / Kullu Valley' },
    { pin: '180001', region: 'Jammu & Kashmir', locality: 'Jammu Tawi' },
    { pin: '190001', region: 'Jammu & Kashmir', locality: 'Srinagar Dal Lake' },
    { pin: '194101', region: 'Ladakh', locality: 'Leh Ladakh' },

    // Circle 2: Gangetic Plain & Himalayas
    { pin: '201001', region: 'Uttar Pradesh', locality: 'Ghaziabad' },
    { pin: '208001', region: 'Uttar Pradesh', locality: 'Kanpur' },
    { pin: '211001', region: 'Uttar Pradesh', locality: 'Prayagraj Triveni Sangam' },
    { pin: '221001', region: 'Uttar Pradesh', locality: 'Varanasi Kashi Vishwanath' },
    { pin: '231001', region: 'Uttar Pradesh', locality: 'Mirzapur Chunar' },
    { pin: '248001', region: 'Uttarakhand', locality: 'Dehradun' },
    { pin: '282001', region: 'Uttar Pradesh', locality: 'Agra Taj Mahal' },

    // Circle 3: Western Deserts & Coast
    { pin: '302001', region: 'Rajasthan', locality: 'Jaipur Pink City' },
    { pin: '313001', region: 'Rajasthan', locality: 'Udaipur Mewar' },
    { pin: '342001', region: 'Rajasthan', locality: 'Jodhpur Mehrangarh' },
    { pin: '380001', region: 'Gujarat', locality: 'Ahmedabad Sabarmati' },
    { pin: '385535', region: 'Gujarat', locality: 'Banaskantha Tharad (Rural Frontier)' },
    { pin: '395001', region: 'Gujarat', locality: 'Surat' },

    // Circle 4: Central India & Deccan Plateau
    { pin: '400001', region: 'Maharashtra', locality: 'Mumbai Fort' },
    { pin: '411001', region: 'Maharashtra', locality: 'Pune Shaniwar Wada' },
    { pin: '403001', region: 'Goa', locality: 'Panaji' },
    { pin: '462001', region: 'Madhya Pradesh', locality: 'Bhopal Bhojpur' },
    { pin: '474001', region: 'Madhya Pradesh', locality: 'Gwalior Fort' },
    { pin: '492001', region: 'Chhattisgarh', locality: 'Raipur' },

    // Circle 5: Southern Deccan
    { pin: '500001', region: 'Telangana', locality: 'Hyderabad Charminar' },
    { pin: '506001', region: 'Telangana', locality: 'Warangal Ramappa' },
    { pin: '530001', region: 'Andhra Pradesh', locality: 'Visakhapatnam' },
    { pin: '560001', region: 'Karnataka', locality: 'Bengaluru GPO' },
    { pin: '570001', region: 'Karnataka', locality: 'Mysuru Palace' },

    // Circle 6: Deep South & Coastal
    { pin: '600001', region: 'Tamil Nadu', locality: 'Chennai Egmore' },
    { pin: '625001', region: 'Tamil Nadu', locality: 'Madurai Meenakshi' },
    { pin: '682001', region: 'Kerala', locality: 'Kochi Muziris' },
    { pin: '695001', region: 'Kerala', locality: 'Thiruvananthapuram Padmanabhaswamy' },
    { pin: '682555', region: 'Lakshadweep', locality: 'Kavaratti Island' },

    // Circle 7: Eastern Delta & North-East
    { pin: '700001', region: 'West Bengal', locality: 'Kolkata Indian Museum' },
    { pin: '734001', region: 'West Bengal', locality: 'Darjeeling / Siliguri' },
    { pin: '751001', region: 'Odisha', locality: 'Bhubaneswar Kalinga' },
    { pin: '781001', region: 'Assam', locality: 'Guwahati Kamakhya' },
    { pin: '793001', region: 'Meghalaya', locality: 'Shillong Khasi Hills' },
    { pin: '795001', region: 'Manipur', locality: 'Imphal Kangla Fort' },
    { pin: '744101', region: 'Andaman & Nicobar', locality: 'Port Blair' },

    // Circle 8: Bihar & Jharkhand
    { pin: '800001', region: 'Bihar', locality: 'Patna Pataliputra' },
    { pin: '824231', region: 'Bihar', locality: 'Bodh Gaya Mahabodhi' },
    { pin: '834001', region: 'Jharkhand', locality: 'Ranchi Chota Nagpur' },

    // Special: Army Postal Service
    { pin: '900056', region: 'Army Base 56 APO', locality: '56 APO New Delhi' },
    { pin: '900099', region: 'Army Base 99 APO', locality: '99 APO Kolkata' },
  ];

  for (const item of panIndiaPINs) {
    await runTest('Geographic', `Resolve [${item.region}] PIN ${item.pin} (${item.locality})`, async () => {
      const res = await callGet(item.pin);
      assertEqual(res.status, 200, `PIN ${item.pin} must return HTTP 200`);
      validateSuccessSchema(res.data, item.pin);

      // Verify rich content lengths
      assert(res.data.historical_brief.ancient_foundations.length >= 30, 'ancient_foundations depth');
      assert(res.data.historical_brief.living_culture_crafts.length >= 30, 'living_culture_crafts depth');
      assert(res.data.historical_brief.famous_lore_landmarks.length >= 30, 'famous_lore_landmarks depth');
      assert(res.data.historical_brief.summary_one_liner.length <= 350, 'summary_one_liner length');
      assert(res.data.key_dynasties.length >= 1, 'key_dynasties populated');
      assert(res.data.traditional_crafts.length >= 1, 'traditional_crafts populated');
      assert(res.data.notable_monuments.length >= 1, 'notable_monuments populated');
    });
  }
}

// =========================================================================
// Main Execution
// =========================================================================
async function main() {
  console.log(`\n${colors.bright}${colors.magenta}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}🛡️   BACKEND CHALLENGER 1 (REPLACEMENT) - ADVERSARIAL STRESS HARNESS${colors.reset}`);
  console.log(`${colors.dim}    Target: app/api/pincode-history/route.ts${colors.reset}`);
  console.log(`${colors.dim}    Timestamp: ${new Date().toISOString()}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}========================================================================${colors.reset}`);

  const startTotal = performance.now();

  try {
    await testFuzzingAndInjection();
    await testConcurrencyAndCache();
    await testGeographicCoverage();
  } catch (fatal: any) {
    console.error(`\n${colors.red}FATAL ERROR IN HARNESS:${colors.reset}`, fatal);
  }

  const durationTotal = Math.round(performance.now() - startTotal);
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  const suiteMap = new Map<string, { total: number; pass: number; fail: number; time: number }>();
  for (const r of testResults) {
    const s = suiteMap.get(r.suite) || { total: 0, pass: 0, fail: 0, time: 0 };
    s.total++;
    if (r.passed) s.pass++;
    else s.fail++;
    s.time += r.durationMs;
    suiteMap.set(r.suite, s);
  }

  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}📋  ADVERSARIAL STRESS TEST SUMMARY REPORT${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`| Suite                            | Total  | Pass   | Fail   | Time     |`);
  console.log(`|----------------------------------|--------|--------|--------|----------|`);
  for (const [suite, s] of suiteMap.entries()) {
    const padSuite = suite.padEnd(32, ' ');
    const padTotal = String(s.total).padEnd(6, ' ');
    const padPass = String(s.pass).padEnd(6, ' ');
    const padFail = String(s.fail).padEnd(6, ' ');
    const padTime = `${Math.round(s.time)}ms`.padEnd(8, ' ');
    console.log(`| ${padSuite} | ${padTotal} | ${padPass} | ${padFail} | ${padTime} |`);
  }
  console.log(`|----------------------------------|--------|--------|--------|----------|`);
  console.log(`| OVERALL ADVERSARIAL TOTALS       | ${String(total).padEnd(6, ' ')} | ${String(passed).padEnd(6, ' ')} | ${String(failed).padEnd(6, ' ')} | ${durationTotal}ms |`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.bright}${colors.green}✨ ALL ${total} ADVERSARIAL STRESS TESTS PASSED WITH ZERO CRASHES OR REGRESSIONS!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bright}${colors.red}❌ ${failed} / ${total} ADVERSARIAL TESTS FAILED!${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Harness failure:', err);
  process.exit(1);
});
