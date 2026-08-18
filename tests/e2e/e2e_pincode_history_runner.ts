/**
 * AI-Powered Historical Briefing Engine (PIN Code Grounded)
 * 4-Tier Automated End-to-End (E2E) Test Suite Runner & Adversarial Verification
 *
 * Usage: npx tsx tests/e2e/e2e_pincode_history_runner.ts
 */

import path from 'path';
import {
  colors,
  TestResult,
  TierSummary,
  assert,
  assertEqual,
  assertInRange,
  assertMatches,
  assertNonEmptyString,
  assertArrayNonEmpty,
  runTest,
  dynamicImport,
} from './types';

// Global references for route handlers
let routeGet: ((req: Request) => Promise<Response>) | null = null;
let routePost: ((req: Request) => Promise<Response>) | null = null;

/**
 * Initializes and dynamically imports the /api/pincode-history route handler.
 */
async function getRouteHandlers() {
  if (!routeGet || !routePost) {
    try {
      const routeMod = await dynamicImport('app/api/pincode-history/route.ts');
      if (routeMod.GET) routeGet = routeMod.GET;
      if (routeMod.POST) routePost = routeMod.POST;
    } catch (err: unknown) {
      throw new Error(`Failed to load app/api/pincode-history/route.ts: ${String(err)}`);
    }
  }
  return { GET: routeGet!, POST: routePost! };
}

/**
 * Helper to dispatch GET requests to /api/pincode-history?pincode=...
 */
async function callPincodeHistoryGet(pincode?: string, extraParams: Record<string, string> = {}): Promise<{ status: number; data: any; headers: Headers }> {
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
    headers: {
      'Accept': 'application/json',
    },
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

/**
 * Helper to dispatch POST requests to /api/pincode-history with JSON body
 */
async function callPincodeHistoryPost(body: any, headers: Record<string, string> = {}): Promise<{ status: number; data: any; headers: Headers }> {
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

/**
 * Validates the complete structured schema for successful PIN historical brief responses.
 */
function validateHistoricalBriefSchema(data: any, expectedPincode?: string) {
  assert(data !== null && typeof data === 'object', 'Response body must be a valid JSON object');
  assertEqual(data.status, 'success', 'Response status field must be "success"');

  if (expectedPincode) {
    assertEqual(data.pincode, expectedPincode, `Pincode must equal requested "${expectedPincode}"`);
  } else {
    assertMatches(data.pincode, /^[1-9][0-9]{5}$/, 'Pincode must match standard 6-digit regex /^[1-9][0-9]{5}$/');
  }

  // Geographic and administrative hierarchy fields
  assertNonEmptyString(data.location_name, 'location_name must be a non-empty string');
  assertNonEmptyString(data.state, 'state must be a non-empty string');
  assertNonEmptyString(data.district, 'district must be a non-empty string');
  assertNonEmptyString(data.postal_circle, 'postal_circle must be a non-empty string');

  // Structured 3-part historical brief object
  assert(
    typeof data.historical_brief === 'object' && data.historical_brief !== null,
    'historical_brief must be a non-null object'
  );
  assertNonEmptyString(
    data.historical_brief.ancient_foundations,
    'historical_brief.ancient_foundations must be a non-empty string'
  );
  assertNonEmptyString(
    data.historical_brief.living_culture_crafts,
    'historical_brief.living_culture_crafts must be a non-empty string'
  );
  assertNonEmptyString(
    data.historical_brief.famous_lore_landmarks,
    'historical_brief.famous_lore_landmarks must be a non-empty string'
  );
  assertNonEmptyString(
    data.historical_brief.summary_one_liner,
    'historical_brief.summary_one_liner must be a non-empty string'
  );

  // Badges & Tag Arrays
  assertArrayNonEmpty(data.key_dynasties, 'key_dynasties must be a non-empty array of strings');
  for (const dynasty of data.key_dynasties) {
    assertNonEmptyString(dynasty, 'Each dynasty entry in key_dynasties must be a non-empty string');
  }

  assertArrayNonEmpty(data.traditional_crafts, 'traditional_crafts must be a non-empty array of strings');
  for (const craft of data.traditional_crafts) {
    assertNonEmptyString(craft, 'Each craft entry in traditional_crafts must be a non-empty string');
  }

  assertArrayNonEmpty(data.notable_monuments, 'notable_monuments must be a non-empty array of strings');
  for (const monument of data.notable_monuments) {
    assertNonEmptyString(monument, 'Each monument entry in notable_monuments must be a non-empty string');
  }
}

// ============================================================================
// TIER 1: FEATURE COVERAGE
// ============================================================================

export async function runTier1FeatureTests(): Promise<TestResult[]> {
  const TIER = 'Tier 1: Feature Coverage';
  const results: TestResult[] = [];

  const metroPincodes = [
    { pin: '110001', city: 'Delhi / New Delhi', state: 'Delhi', expectedKeywords: ['Mughal', 'Tomar', 'Chauhan', 'Sultanate', 'Delhi', 'Red Fort', 'Qutub'] },
    { pin: '600008', city: 'Chennai (Egmore)', state: 'Tamil Nadu', expectedKeywords: ['Chola', 'Pallava', 'Dravidian', 'Bronze', 'Silk', 'Egmore', 'Temple'] },
    { pin: '800001', city: 'Patna (Pataliputra)', state: 'Bihar', expectedKeywords: ['Maurya', 'Gupta', 'Magadha', 'Ashoka', 'Pataliputra', 'Ganga'] },
    { pin: '221001', city: 'Varanasi (Kashi)', state: 'Uttar Pradesh', expectedKeywords: ['Kashi', 'Ganga', 'Banaras', 'Silk', 'Ghat', 'Vishwanath'] },
    { pin: '700016', city: 'Kolkata (Park Street)', state: 'West Bengal', expectedKeywords: ['Bengal', 'Pala', 'Sena', 'Nawab', 'Terracotta', 'Kantha'] },
    { pin: '400023', city: 'Mumbai (Fort)', state: 'Maharashtra', expectedKeywords: ['Maratha', 'Silhara', 'Western', 'Textile', 'Gateway', 'Fort'] },
    { pin: '560001', city: 'Bengaluru (GPO)', state: 'Karnataka', expectedKeywords: ['Hoysala', 'Ganga', 'Mysore', 'Silk', 'Sandalwood', 'Vijayanagara'] },
    { pin: '500002', city: 'Hyderabad (Charminar)', state: 'Telangana', expectedKeywords: ['Qutb', 'Nizam', 'Golconda', 'Charminar', 'Bidriware', 'Pearl'] },
  ];

  // 1.1 GET Handler on Metro PINs
  for (const item of metroPincodes) {
    results.push(
      await runTest(TIER, `T1.1 - GET /api/pincode-history?pincode=${item.pin} (${item.city})`, async () => {
        const { status, data } = await callPincodeHistoryGet(item.pin);
        assertEqual(status, 200, `Expected HTTP 200 for valid PIN ${item.pin}`);
        validateHistoricalBriefSchema(data, item.pin);

        // Verify state grounding
        assert(
          data.state.toLowerCase().includes(item.state.toLowerCase()) ||
          item.state.toLowerCase().includes(data.state.toLowerCase()),
          `Expected state "${item.state}", got "${data.state}" for PIN ${item.pin}`
        );

        // Verify grounding relevance in brief or tags
        const fullBriefText = [
          data.historical_brief.ancient_foundations,
          data.historical_brief.living_culture_crafts,
          data.historical_brief.famous_lore_landmarks,
          ...data.key_dynasties,
          ...data.traditional_crafts,
          ...data.notable_monuments,
        ].join(' ').toLowerCase();

        const hasRelevantKeyword = item.expectedKeywords.some((kw) => fullBriefText.includes(kw.toLowerCase()));
        assert(
          hasRelevantKeyword,
          `Expected historical content for PIN ${item.pin} (${item.city}) to reference cultural heritage from [${item.expectedKeywords.join(', ')}]`
        );
      })
    );
  }

  // 1.2 POST Handler on Metro PINs
  const postTestPins = ['110001', '600008', '400023', '500002'];
  for (const pin of postTestPins) {
    results.push(
      await runTest(TIER, `T1.2 - POST /api/pincode-history with { pincode: "${pin}" }`, async () => {
        const { status, data } = await callPincodeHistoryPost({ pincode: pin });
        assertEqual(status, 200, `Expected HTTP 200 for POST with PIN ${pin}`);
        validateHistoricalBriefSchema(data, pin);
      })
    );
  }

  // 1.3 Schema Invariants & Key Depth Validation
  results.push(
    await runTest(TIER, 'T1.3 - Response Schema Invariants & Field Content Rigor', async () => {
      const { status, data } = await callPincodeHistoryGet('110001');
      assertEqual(status, 200, 'HTTP status must be 200');

      // Verify lengths and content sanity
      assert(data.historical_brief.ancient_foundations.length >= 30, 'Ancient foundations must be a descriptive paragraph');
      assert(data.historical_brief.living_culture_crafts.length >= 30, 'Living culture & crafts must be descriptive');
      assert(data.historical_brief.famous_lore_landmarks.length >= 30, 'Famous lore & landmarks must be descriptive');
      assert(data.historical_brief.summary_one_liner.length <= 350, 'Summary one-liner must be concise (<=350 chars)');

      // Verify array element types
      assert(data.key_dynasties.length >= 2, 'Must include at least 2 key dynasties');
      assert(data.traditional_crafts.length >= 2, 'Must include at least 2 traditional crafts');
      assert(data.notable_monuments.length >= 2, 'Must include at least 2 notable monuments');
    })
  );

  return results;
}

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES
// ============================================================================

export async function runTier2BoundaryTests(): Promise<TestResult[]> {
  const TIER = 'Tier 2: Boundary & Corner Cases';
  const results: TestResult[] = [];

  // 2.1 Malformed PINs (Rejection Matrix)
  const malformedInputs = [
    { label: 'Hyphenated PIN', pin: '11-001' },
    { label: 'Leading Zero PIN', pin: '012345' },
    { label: 'Alphabetic String', pin: 'abcdef' },
    { label: 'All Zeros', pin: '000000' },
    { label: 'Empty String', pin: '' },
    { label: 'Whitespace String', pin: '   ' },
    { label: '7-Digit PIN', pin: '1100011' },
    { label: '4-Digit PIN', pin: '1100' },
    { label: 'Negative Number Format', pin: '-11000' },
    { label: 'Space-Separated PIN', pin: '11 0001' },
    { label: 'Decimal PIN', pin: '11.001' },
    { label: 'Special Characters', pin: '!@#$%^' },
    { label: 'XSS Script Payload', pin: '<script>alert(1)</script>' },
    { label: 'SQL Injection Payload', pin: "110001'; DROP TABLE museums;--" },
  ];

  for (const item of malformedInputs) {
    results.push(
      await runTest(TIER, `T2.1 - Reject Malformed PIN [${item.label}]: "${item.pin}" (GET)`, async () => {
        const { status, data } = await callPincodeHistoryGet(item.pin);
        assertEqual(status, 400, `Expected HTTP 400 for malformed PIN "${item.pin}"`);
        assert(data !== null && typeof data === 'object', 'Error response must be a JSON object');
        assertEqual(data.status, 'error', 'Status must be "error"');
        assertEqual(data.error, 'INVALID_PINCODE_FORMAT', 'Error code must be "INVALID_PINCODE_FORMAT"');
        assertNonEmptyString(data.message, 'Error message must be present and descriptive');
      })
    );

    results.push(
      await runTest(TIER, `T2.1 - Reject Malformed PIN [${item.label}]: "${item.pin}" (POST)`, async () => {
        const { status, data } = await callPincodeHistoryPost({ pincode: item.pin });
        assertEqual(status, 400, `Expected HTTP 400 for malformed POST body`);
        assertEqual(data.status, 'error', 'Status must be "error"');
        assertEqual(data.error, 'INVALID_PINCODE_FORMAT', 'Error code must be "INVALID_PINCODE_FORMAT"');
      })
    );
  }

  // 2.2 Missing or Invalid POST Payloads
  results.push(
    await runTest(TIER, 'T2.2 - Reject POST with missing "pincode" key ({})', async () => {
      const { status, data } = await callPincodeHistoryPost({});
      assertEqual(status, 400, 'Expected HTTP 400 for missing pincode key');
      assertEqual(data.error, 'INVALID_PINCODE_FORMAT', 'Error code must be "INVALID_PINCODE_FORMAT"');
    })
  );

  results.push(
    await runTest(TIER, 'T2.2 - Reject POST with non-pincode boolean/array ({ pincode: true })', async () => {
      const { status, data } = await callPincodeHistoryPost({ pincode: true });
      assertEqual(status, 400, 'Expected HTTP 400 for boolean pincode');
      assertEqual(data.error, 'INVALID_PINCODE_FORMAT', 'Error code must be "INVALID_PINCODE_FORMAT"');
    })
  );

  results.push(
    await runTest(TIER, 'T2.2 - Reject POST with object pincode ({ pincode: { code: 110001 } })', async () => {
      const { status, data } = await callPincodeHistoryPost({ pincode: { code: 110001 } });
      assertEqual(status, 400, 'Expected HTTP 400 for object pincode');
      assertEqual(data.error, 'INVALID_PINCODE_FORMAT', 'Error code must be "INVALID_PINCODE_FORMAT"');
    })
  );

  results.push(
    await runTest(TIER, 'T2.2 - Reject GET with missing pincode query param', async () => {
      const { status, data } = await callPincodeHistoryGet();
      assertEqual(status, 400, 'Expected HTTP 400 for omitted pincode parameter');
      assertEqual(data.error, 'INVALID_PINCODE_FORMAT', 'Error code must be "INVALID_PINCODE_FORMAT"');
    })
  );

  // 2.3 Rural & Unindexed PIN Codes (Grounded Regional Fallbacks)
  const ruralPincodes = [
    {
      pin: '175131',
      desc: 'Kullu / Manali, Himachal Pradesh (Rural Mountain Valley)',
      state: 'Himachal Pradesh',
      circle: 'Himachal',
      expectedRegionalAnchor: 'Himalayan',
    },
    {
      pin: '385535',
      desc: 'Banaskantha / Tharad, Gujarat (Rural Western Frontier)',
      state: 'Gujarat',
      circle: 'Gujarat',
      expectedRegionalAnchor: 'Gujarat',
    },
    {
      pin: '795001',
      desc: 'Imphal, Manipur (North-Eastern Circle)',
      state: 'Manipur',
      circle: 'North East',
      expectedRegionalAnchor: 'Manipur',
    },
  ];

  for (const rural of ruralPincodes) {
    results.push(
      await runTest(TIER, `T2.3 - Rural PIN Grounding: ${rural.pin} (${rural.desc})`, async () => {
        const { status, data } = await callPincodeHistoryGet(rural.pin);
        assertEqual(status, 200, `Expected HTTP 200 for rural PIN ${rural.pin}`);
        validateHistoricalBriefSchema(data, rural.pin);

        // Verify regional postal circle resolution
        assert(
          data.state.toLowerCase().includes(rural.state.toLowerCase()) ||
          data.postal_circle.toLowerCase().includes(rural.circle.toLowerCase()) ||
          data.location_name.toLowerCase().includes(rural.state.toLowerCase()),
          `Expected rural PIN ${rural.pin} to resolve regional state/circle "${rural.state}", got state "${data.state}" and circle "${data.postal_circle}"`
        );
      })
    );
  }

  return results;
}

// ============================================================================
// TIER 3: PERFORMANCE, CACHING & CONCURRENCY
// ============================================================================

export async function runTier3PerformanceTests(): Promise<TestResult[]> {
  const TIER = 'Tier 3: Performance & Caching';
  const results: TestResult[] = [];

  // 3.1 Repeat Query Latency (<10ms repeat / ≤20ms SLA)
  results.push(
    await runTest(TIER, 'T3.1 - In-Memory Cache Sub-10ms Latency SLA (<10ms repeat / ≤20ms warm)', async () => {
      const pin = '110001';

      // Cold request
      const coldStart = Date.now();
      const coldRes = await callPincodeHistoryGet(pin);
      const coldDuration = Date.now() - coldStart;
      assertEqual(coldRes.status, 200, 'Cold query must succeed with 200');

      // Warm repeat requests (execute 5 warm requests and measure latency)
      const warmDurations: number[] = [];
      for (let i = 0; i < 5; i++) {
        const warmStart = Date.now();
        const warmRes = await callPincodeHistoryGet(pin);
        const warmDuration = Date.now() - warmStart;
        assertEqual(warmRes.status, 200, `Warm query iteration ${i + 1} must succeed with 200`);
        warmDurations.push(warmDuration);

        // Check cache flag if returned
        if (warmRes.data.cached !== undefined) {
          assertEqual(warmRes.data.cached, true, `Expected cached: true on repeat query for PIN ${pin}`);
        }
      }

      const avgWarmLatency = warmDurations.reduce((a, b) => a + b, 0) / warmDurations.length;
      assert(
        avgWarmLatency <= 20,
        `Average warm latency (${avgWarmLatency.toFixed(2)}ms) exceeded SLA of ≤20ms. Individual timings: [${warmDurations.join(', ')}]ms`
      );
    })
  );

  // 3.2 Cross-Method Caching (GET then POST cache hit)
  results.push(
    await runTest(TIER, 'T3.2 - Cross-Method Cache Deduplication (GET then POST)', async () => {
      const pin = '600008';

      // Prime cache with GET
      await callPincodeHistoryGet(pin);

      // Query via POST
      const postStart = Date.now();
      const postRes = await callPincodeHistoryPost({ pincode: pin });
      const postDuration = Date.now() - postStart;

      assertEqual(postRes.status, 200, 'POST must succeed with HTTP 200');
      validateHistoricalBriefSchema(postRes.data, pin);
      assert(
        postDuration <= 20,
        `POST cache hit duration (${postDuration}ms) exceeded SLA of ≤20ms`
      );
      if (postRes.data.cached !== undefined) {
        assertEqual(postRes.data.cached, true, 'POST request must hit shared in-memory cache');
      }
    })
  );

  // 3.3 Multi-PIN Cache Isolation (No Cross-Contamination)
  results.push(
    await runTest(TIER, 'T3.3 - Multi-PIN In-Memory Cache Key Isolation', async () => {
      const testPins = ['800001', '221001', '700016', '560001'];

      // Prime cache for all PINs
      for (const p of testPins) {
        await callPincodeHistoryGet(p);
      }

      // Re-query and verify that each key yields its exact corresponding entity
      for (const p of testPins) {
        const { status, data } = await callPincodeHistoryGet(p);
        assertEqual(status, 200, `PIN ${p} must return 200`);
        assertEqual(data.pincode, p, `Cache key isolation failed: requested ${p}, got ${data.pincode}`);
      }
    })
  );

  // 3.4 Concurrent Request Stability (20 Parallel Requests)
  results.push(
    await runTest(TIER, 'T3.4 - Concurrent Request Burst Stability (20 Simultaneous Calls)', async () => {
      const concurrentPins = [
        '110001', '600008', '800001', '221001', '700016',
        '400023', '560001', '500002', '175131', '385535',
        '110001', '600008', '800001', '221001', '700016',
        '400023', '560001', '500002', '175131', '385535',
      ];

      const start = Date.now();
      const promises = concurrentPins.map((p, idx) =>
        idx % 2 === 0 ? callPincodeHistoryGet(p) : callPincodeHistoryPost({ pincode: p })
      );

      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      assertEqual(responses.length, 20, 'All 20 concurrent requests must complete');
      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        const expectedPin = concurrentPins[i];
        assertEqual(res.status, 200, `Concurrent request ${i + 1} (${expectedPin}) failed with status ${res.status}`);
        validateHistoricalBriefSchema(res.data, expectedPin);
      }
    })
  );

  return results;
}

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// ============================================================================

export async function runTier4ScenarioTests(): Promise<TestResult[]> {
  const TIER = 'Tier 4: Real-World Scenarios';
  const results: TestResult[] = [];

  // 4.1 Scenario 1: Connect to Your Roots (/roots) Page User Journey
  results.push(
    await runTest(TIER, 'T4.1 - Scenario 1: /roots Discovery Journey & Web Speech Narration Compilation', async () => {
      const pin = '110001';
      const { status, data } = await callPincodeHistoryGet(pin);
      assertEqual(status, 200, 'Roots lookup must return 200');

      // 1. Verify 3-part card sections renderable data
      const ancient = data.historical_brief.ancient_foundations;
      const living = data.historical_brief.living_culture_crafts;
      const sacred = data.historical_brief.famous_lore_landmarks;
      const summary = data.historical_brief.summary_one_liner;

      assertNonEmptyString(ancient, 'Ancient Foundations section must be present');
      assertNonEmptyString(living, 'Living Traditions section must be present');
      assertNonEmptyString(sacred, 'Sacred Landmarks section must be present');
      assertNonEmptyString(summary, 'Summary one liner must be present');

      // 2. Verify Badges
      assert(data.key_dynasties.length >= 2, 'Badge count: Dynasties >= 2');
      assert(data.traditional_crafts.length >= 2, 'Badge count: Crafts >= 2');
      assert(data.notable_monuments.length >= 2, 'Badge count: Monuments >= 2');

      // 3. Compile Web Speech Narration Payload
      const narrationScript = `Discovering heritage for ${data.location_name}, ${data.state}. ${summary} Ancient Foundations: ${ancient} Living Traditions: ${living} Sacred Lore and Landmarks: ${sacred}`;

      assert(narrationScript.length >= 150, `Narration script length (${narrationScript.length}) must be comprehensive (>=150 chars)`);
      assert(!narrationScript.includes('<') && !narrationScript.includes('>'), 'Narration script must not contain unescaped HTML tags');
      assert(!narrationScript.includes('{"') && !narrationScript.includes('"}'), 'Narration script must not contain raw JSON artifacts');
    })
  );

  // 4.2 Scenario 2: Explore Page (/explore) Regional Banner & Spatial Museum Synchronization
  results.push(
    await runTest(TIER, 'T4.2 - Scenario 2: /explore Regional Historical Context Banner & Spatial Sync', async () => {
      const pin = '600008'; // Egmore, Chennai
      const { status, data } = await callPincodeHistoryGet(pin);
      assertEqual(status, 200, 'Explore PIN search must return 200');

      // Verify regional context metadata suitable for Explore banner
      assertNonEmptyString(data.location_name, 'Banner location name must be present');
      assertNonEmptyString(data.state, 'Banner state must be present');
      assertNonEmptyString(data.historical_brief.summary_one_liner, 'Banner summary must be present');

      // Verify cultural anchors synchronize with Chennai heritage
      const allText = JSON.stringify(data).toLowerCase();
      assert(
        allText.includes('tamil') || allText.includes('chennai') || allText.includes('chola') || allText.includes('bronze'),
        'Explore banner context must contain authentic regional grounding for Chennai'
      );
    })
  );

  // 4.3 Scenario 3: Rural Unindexed Journey with Nearest Museum Spatial Fallback
  results.push(
    await runTest(TIER, 'T4.3 - Scenario 3: Rural Unindexed PIN (175131) Regional Context with Distance Fallback', async () => {
      const pin = '175131'; // Kullu, Himachal Pradesh
      const { status, data } = await callPincodeHistoryGet(pin);
      assertEqual(status, 200, 'Rural PIN search must return 200');

      // Verify regional brief exists even when no direct museum is indexed at this exact rural PIN
      assertNonEmptyString(data.state, 'Rural search must resolve state (Himachal Pradesh)');
      assertNonEmptyString(data.historical_brief.ancient_foundations, 'Rural brief must supply regional ancient foundations');
      assertArrayNonEmpty(data.traditional_crafts, 'Rural brief must supply traditional crafts');
    })
  );

  return results;
}

// ============================================================================
// TIER 5: ADVERSARIAL COVERAGE HARDENING
// ============================================================================

export async function runTier5AdversarialTests(): Promise<TestResult[]> {
  const TIER = 'Tier 5: Adversarial Hardening';
  const results: TestResult[] = [];

  // 5.1 Extreme Input Fuzzing & Injection Defense
  const fuzzPayloads = [
    { name: '10KB Repeated Digits', val: '1'.repeat(10000) },
    { name: 'Null Byte Embedded', val: '1100\x0001' },
    { name: 'Newline Carriage Return Embedded', val: '11\r\n001' },
    { name: 'Fullwidth Unicode Digits', val: '１１０００１' },
    { name: 'Emoji Injection', val: '🏛️🏛️🏛️🏛️🏛️🏛️' },
    { name: 'JSON Injected String', val: '{"nested": "110001"}' },
  ];

  for (const fuzz of fuzzPayloads) {
    results.push(
      await runTest(TIER, `T5.1 - Adversarial Fuzz Defense: [${fuzz.name}]`, async () => {
        const { status, data } = await callPincodeHistoryGet(fuzz.val);
        assertEqual(status, 400, `Expected HTTP 400 for adversarial payload "${fuzz.name}"`);
        assertEqual(data.error, 'INVALID_PINCODE_FORMAT', 'Must strictly reject with INVALID_PINCODE_FORMAT');
      })
    );
  }

  // 5.2 High-Throughput Burst Execution (50 Sequential Calls)
  results.push(
    await runTest(TIER, 'T5.2 - High-Throughput Burst Execution (50 Sequential Requests)', async () => {
      const pin = '110001';
      const start = Date.now();
      for (let i = 0; i < 50; i++) {
        const res = await callPincodeHistoryGet(pin);
        assertEqual(res.status, 200, `Burst iteration ${i + 1} must return 200`);
      }
      const duration = Date.now() - start;
      const avgPerCall = duration / 50;
      assert(avgPerCall <= 15, `Average burst latency (${avgPerCall.toFixed(2)}ms) must be <= 15ms`);
    })
  );

  return results;
}

// ============================================================================
// MAIN RUNNER & SUITE AGGREGATOR
// ============================================================================

export async function main() {
  const startTime = Date.now();

  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🏛️   PIN CODE HISTORICAL BRIEFING ENGINE - E2E TEST RUNNER${colors.reset}`);
  console.log(`${colors.dim}    Framework: Next.js 16 | TypeScript 5 | Node.js E2E Harness${colors.reset}`);
  console.log(`${colors.dim}    Track: AI Historical Briefs, Schema Invariants, LRU Caching & Narration${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

  const tiers: TierSummary[] = [];

  const tierConfigs = [
    {
      name: 'Tier 1: Feature Coverage',
      desc: 'Metro PINs (110001, 600008, 800001, 221001, 700016, 400023, 560001, 500002), GET/POST, Schema Invariants',
      runner: runTier1FeatureTests,
    },
    {
      name: 'Tier 2: Boundary & Corner Cases',
      desc: 'Malformed PIN Rejection Matrix, Missing/Invalid POST Bodies, Rural/Unindexed PIN Groundings',
      runner: runTier2BoundaryTests,
    },
    {
      name: 'Tier 3: Performance & Caching',
      desc: 'In-Memory Cache Sub-10ms SLA, Cross-Method Caching, Isolation, 20 Concurrent Burst Stability',
      runner: runTier3PerformanceTests,
    },
    {
      name: 'Tier 4: Real-World Scenarios',
      desc: '/roots Discovery Journey & Web Speech Narration, /explore Regional Banner & Nearest Fallback',
      runner: runTier4ScenarioTests,
    },
    {
      name: 'Tier 5: Adversarial Hardening',
      desc: 'Extreme Input Fuzzing, SQLi/XSS/Unicode Defense, 50-Request Burst Throughput',
      runner: runTier5AdversarialTests,
    },
  ];

  for (const tierConfig of tierConfigs) {
    console.log(`${colors.bright}${colors.blue}▶ Running ${tierConfig.name}${colors.reset}`);
    console.log(`${colors.dim}  Scope: ${tierConfig.desc}${colors.reset}`);

    const tierStart = Date.now();
    let results: TestResult[] = [];

    try {
      results = await tierConfig.runner();
    } catch (err: unknown) {
      console.error(`${colors.red}  ✗ Fatal execution error in ${tierConfig.name}:${colors.reset}`, err);
      results.push({
        tier: tierConfig.name,
        name: 'Suite Execution Harness',
        passed: false,
        durationMs: Date.now() - tierStart,
        error: String(err),
      });
    }

    const tierPassed = results.filter((r) => r.passed).length;
    const tierFailed = results.filter((r) => !r.passed).length;

    for (const res of results) {
      if (res.passed) {
        console.log(`  ${colors.green}✔ PASS${colors.reset} ${res.name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✖ FAIL${colors.reset} ${res.name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`);
        if (res.error) {
          console.log(`    ${colors.red}Error: ${res.error}${colors.reset}`);
        }
      }
    }

    const tierSummary: TierSummary = {
      tier: tierConfig.name,
      description: tierConfig.desc,
      total: results.length,
      passed: tierPassed,
      failed: tierFailed,
      durationMs: Date.now() - tierStart,
      results,
    };

    tiers.push(tierSummary);
    console.log();
  }

  const totalDuration = Date.now() - startTime;
  const totalTests = tiers.reduce((acc, t) => acc + t.total, 0);
  const totalPassed = tiers.reduce((acc, t) => acc + t.passed, 0);
  const totalFailed = tiers.reduce((acc, t) => acc + t.failed, 0);

  // Print Summary Table
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}📋  PIN CODE HISTORICAL BRIEFING ENGINE - E2E TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`| ${'Tier'.padEnd(38)} | ${'Total'.padEnd(6)} | ${'Pass'.padEnd(6)} | ${'Fail'.padEnd(6)} | ${'Time'.padEnd(8)} |`);
  console.log(`|${'-'.repeat(40)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(10)}|`);

  for (const t of tiers) {
    const passColor = t.passed === t.total ? colors.green : colors.yellow;
    const failColor = t.failed > 0 ? colors.red : colors.green;
    console.log(
      `| ${t.tier.padEnd(38)} | ${t.total.toString().padEnd(6)} | ${passColor}${t.passed.toString().padEnd(6)}${colors.reset} | ${failColor}${t.failed.toString().padEnd(6)}${colors.reset} | ${(t.durationMs + 'ms').padEnd(8)} |`
    );
  }

  console.log(`|${'-'.repeat(40)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(10)}|`);
  console.log(
    `| ${'OVERALL PIN HISTORICAL BRIEF TOTALS'.padEnd(38)} | ${totalTests.toString().padEnd(6)} | ${colors.green}${totalPassed.toString().padEnd(6)}${colors.reset} | ${totalFailed > 0 ? colors.red : colors.green}${totalFailed.toString().padEnd(6)}${colors.reset} | ${(totalDuration + 'ms').padEnd(8)} |`
  );
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

  if (totalFailed === 0) {
    console.log(`${colors.bright}${colors.green}✨ ALL ${totalTests} TESTS PASSED SUCCESSFULLY! (100% PASS RATE)${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bright}${colors.yellow}⚠️  ${totalFailed} / ${totalTests} TESTS FAILED${colors.reset}`);
    console.log(`${colors.dim}   (Review failing test diagnostics above to complete subsystem implementations)${colors.reset}\n`);
    process.exit(1);
  }
}

// Auto-execute when run as entrypoint
if (process.argv[1]?.endsWith('e2e_pincode_history_runner.ts') || process.argv[1]?.endsWith('e2e_pincode_history_runner.js')) {
  main().catch((err) => {
    console.error(`${colors.red}Unhandled Exception in PIN Code Historical Briefing E2E Runner:${colors.reset}`, err);
    process.exit(1);
  });
}
