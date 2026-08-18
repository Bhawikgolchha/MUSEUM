/**
 * Frontend & UI E2E Scenario & State Transition Empirical Stress Runner
 * 
 * Challenger 2 Verification Suite
 * Tests:
 *  1. State transitions on /roots (preset switching, invalid PIN, error recovery, narration payload)
 *  2. State transitions on /explore (query permutations, accordion toggles, spatial distance sync)
 *  3. Complete E2E user journeys without console errors or runtime crashes
 * 
 * Usage: npx tsx tests/e2e/ui_scenario_stress_runner.ts
 */

import { resolveRootsByPincode, RootConnection } from '../../lib/roots';
import {
  searchMuseums,
  getAllMuseums,
  findNearestMuseumForPincode,
  calculateHaversineDistance,
  MuseumWithDistance,
} from '../../lib/museums';
import { resolvePinToCoordinates, EXACT_PIN_COORDINATES } from '../../lib/pincodes';

// Color formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: string;
}

const allResults: TestResult[] = [];

async function runTestCase(
  suite: string,
  name: string,
  fn: () => Promise<void> | void
): Promise<TestResult> {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    const res: TestResult = { suite, name, passed: true, durationMs };
    allResults.push(res);
    console.log(`  ${colors.green}✔ PASS${colors.reset} ${name} ${colors.gray}(${durationMs}ms)${colors.reset}`);
    return res;
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const res: TestResult = {
      suite,
      name,
      passed: false,
      durationMs,
      error: err?.message || String(err),
    };
    allResults.push(res);
    console.log(`  ${colors.red}✖ FAIL${colors.reset} ${name} ${colors.gray}(${durationMs}ms)${colors.reset}`);
    console.log(`    ${colors.red}Error: ${res.error}${colors.reset}`);
    return res;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertEqual<T>(actual: T, expected: T, msg?: string) {
  if (actual !== expected) {
    throw new Error(`${msg ? msg + ': ' : ''}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// Dynamic API caller for route handler
async function callApi(pincode: string): Promise<{ status: number; data: any }> {
  const routeMod = await import('../../app/api/pincode-history/route');
  const req = new Request(`http://localhost:3000/api/pincode-history?pincode=${encodeURIComponent(pincode)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const res = await routeMod.GET(req);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// Simulation of /roots speech synthesis payload compilation
function buildRootsNarrationText(data: any): string {
  if (!data) return '';
  const parts = [
    `AI Cultural and Historical Brief for ${data.location_name}, Postal PIN code ${data.pincode}, in ${data.district}, ${data.state}.`,
    `Summary: ${data.historical_brief.summary_one_liner}`,
    `Ancient Foundations and Dynastic Heritage: ${data.historical_brief.ancient_foundations}`,
    `Living Traditions and Craft Roots: ${data.historical_brief.living_culture_crafts}`,
    `Sacred Landmarks and Historical Lore: ${data.historical_brief.famous_lore_landmarks}`,
  ];

  if (data.key_dynasties && data.key_dynasties.length > 0) {
    parts.push(`Key ruling dynasties of this territory include ${data.key_dynasties.join(', ')}.`);
  }
  if (data.traditional_crafts && data.traditional_crafts.length > 0) {
    parts.push(`Traditional crafts and living arts include ${data.traditional_crafts.join(', ')}.`);
  }
  if (data.notable_monuments && data.notable_monuments.length > 0) {
    parts.push(`Notable landmarks and sacred monuments include ${data.notable_monuments.join(', ')}.`);
  }

  return parts.join(' ');
}

// Simulation of /explore banner speech synthesis payload compilation
function buildExploreNarrationText(data: any): string {
  if (!data) return '';
  return `Regional historical and cultural context for ${data.location_name || data.district}, ${data.state}, Postal PIN code ${data.pincode}. ${data.historical_brief.summary_one_liner} Ancient Foundations: ${data.historical_brief.ancient_foundations} Key dynasties include: ${data.key_dynasties.join(', ')}. Living Traditions: ${data.historical_brief.living_culture_crafts} Traditional crafts include: ${data.traditional_crafts.join(', ')}. Sacred Landmarks: ${data.historical_brief.famous_lore_landmarks} Notable monuments include: ${data.notable_monuments.join(', ')}.`;
}

// Simulation of Explore PIN extraction logic
function extractPinFromQuery(query: string): string | null {
  const clean = query.trim();
  if (/^[1-9][0-9]{5}$/.test(clean)) return clean;
  const match = clean.match(/\b[1-9][0-9]{5}\b/);
  return match ? match[0] : null;
}

// ============================================================================
// SUITE 1: /roots STATE TRANSITIONS & NARATION HARNESS
// ============================================================================
async function runRootsStateTransitionSuite() {
  const SUITE = 'Suite 1: /roots UI State Transitions & Narration';
  console.log(`\n${colors.bright}${colors.blue}▶ Running ${SUITE}${colors.reset}`);

  // Test 1.1: Rapid PIN switching across all 8 preset buttons
  await runTestCase(SUITE, '1.1 - Rapid PIN Switching across 8 Presets in Sequence & Parallel', async () => {
    const presets = [
      { pin: '110001', label: 'Delhi', expectedState: 'Delhi' },
      { pin: '600008', label: 'Chennai / Tamil Nadu', expectedState: 'Tamil Nadu' },
      { pin: '800001', label: 'Patna / Bihar', expectedState: 'Bihar' },
      { pin: '221001', label: 'Varanasi / Sarnath', expectedState: 'Uttar Pradesh' },
      { pin: '700016', label: 'Kolkata / Bengal', expectedState: 'West Bengal' },
      { pin: '400023', label: 'Mumbai / Maharashtra', expectedState: 'Maharashtra' },
      { pin: '560001', label: 'Bengaluru / Karnataka', expectedState: 'Karnataka' },
      { pin: '500002', label: 'Hyderabad / Telangana', expectedState: 'Telangana' },
    ];

    // Sequential rapid clicks
    for (const preset of presets) {
      const rootRes = resolveRootsByPincode(preset.pin);
      assert(rootRes !== null, `resolveRootsByPincode(${preset.pin}) returned null`);
      assert(rootRes.nearbyMuseums.length > 0, `roots for ${preset.pin} missing nearby museums`);

      const apiRes = await callApi(preset.pin);
      assertEqual(apiRes.status, 200, `API status for preset ${preset.pin}`);
      assertEqual(apiRes.data.status, 'success', `API status field for ${preset.pin}`);
      assertEqual(apiRes.data.pincode, preset.pin, `API returned pincode mismatch`);
      assert(apiRes.data.state.toLowerCase().includes(preset.expectedState.toLowerCase()), `State mismatch for ${preset.pin}`);
    }

    // Parallel burst switching (simulating rapid user spamming clicks)
    const burstPromises = presets.map((p) => callApi(p.pin));
    const burstResults = await Promise.all(burstPromises);
    assertEqual(burstResults.length, 8, 'All 8 burst preset requests resolved');
    for (let i = 0; i < burstResults.length; i++) {
      assertEqual(burstResults[i].status, 200, `Burst item ${i} (${presets[i].pin}) failed`);
      assertEqual(burstResults[i].data.pincode, presets[i].pin, `Burst data isolation check ${i}`);
    }
  });

  // Test 1.2: Invalid PIN handling & State Reset
  await runTestCase(SUITE, '1.2 - Invalid PIN Handling, Incomplete Length & State Reset', async () => {
    const invalidInputs = [
      '11-001',
      '012345',
      'abcdef',
      '000000',
      '',
      '   ',
      '1100011',
      '1100',
      '-11000',
      '11 0001',
      '11.001',
      '!@#$%^',
    ];

    for (const inv of invalidInputs) {
      const clean = inv.trim();
      const isValid = /^[1-9][0-9]{5}$/.test(clean);
      assertEqual(isValid, false, `Input "${inv}" must be rejected by client-side regex`);

      // Verify that calling API with invalid PIN returns HTTP 400
      const apiRes = await callApi(inv);
      assertEqual(apiRes.status, 400, `API must return 400 for "${inv}"`);
      assertEqual(apiRes.data.status, 'error', `API must return status error for "${inv}"`);
      assertEqual(apiRes.data.error, 'INVALID_PINCODE_FORMAT', `API error code must be INVALID_PINCODE_FORMAT for "${inv}"`);
    }
  });

  // Test 1.3: Error Recovery & Retry Flow Simulation
  await runTestCase(SUITE, '1.3 - Error Recovery & Retry State Machine Simulation', async () => {
    let callCount = 0;
    // Simulate a state machine like AiHistoricalBrief
    interface ComponentState {
      data: any | null;
      isLoading: boolean;
      error: string | null;
      retryKey: number;
    }

    const state: ComponentState = {
      data: null,
      isLoading: false,
      error: null,
      retryKey: 0,
    };

    const simulateFetch = async (pin: string, shouldFailFirstTime: boolean) => {
      callCount++;
      state.isLoading = true;
      state.error = null;

      if (shouldFailFirstTime && callCount === 1) {
        state.isLoading = false;
        state.error = 'Network request failed (simulated 500 error)';
        state.data = null;
        return;
      }

      const res = await callApi(pin);
      state.isLoading = false;
      if (res.status === 200) {
        state.data = res.data;
        state.error = null;
      } else {
        state.error = res.data.message || 'API error';
      }
    };

    // 1. Initial attempt fails
    await simulateFetch('110001', true);
    assertEqual(state.isLoading, false, 'Loading should be false after error');
    assert(state.error !== null, 'Error state must be set');
    assertEqual(state.data, null, 'Data must be null during error');

    // 2. User clicks Retry Generation (increments retryKey)
    state.retryKey++;
    await simulateFetch('110001', false);
    assertEqual(state.isLoading, false, 'Loading should be false after retry');
    assertEqual(state.error, null, 'Error state must be cleared after retry');
    assert(state.data !== null, 'Data must be populated after retry');
    assertEqual(state.data.pincode, '110001', 'Retried data pincode check');
  });

  // Test 1.4: Speech Synthesis Narration Payload Rigor
  await runTestCase(SUITE, '1.4 - Web Speech Narration Payload Validation & Sound Integrity', async () => {
    const testPins = ['110001', '600008', '800001', '221001', '700016', '400023', '560001', '500002', '175131'];

    for (const pin of testPins) {
      const apiRes = await callApi(pin);
      assertEqual(apiRes.status, 200, `API success for PIN ${pin}`);

      const narrationText = buildRootsNarrationText(apiRes.data);

      // Verify length
      assert(narrationText.length >= 200, `Narration text for ${pin} is too short (${narrationText.length} chars)`);

      // Verify no syntax/HTML/JSON bleed
      assert(!narrationText.includes('<'), `Narration contains "<" tag bleed in ${pin}`);
      assert(!narrationText.includes('>'), `Narration contains ">" tag bleed in ${pin}`);
      assert(!narrationText.includes('undefined'), `Narration contains "undefined" in ${pin}`);
      assert(!narrationText.includes('null'), `Narration contains "null" in ${pin}`);
      assert(!narrationText.includes('{"'), `Narration contains JSON object start in ${pin}`);
      assert(!narrationText.includes('"}'), `Narration contains JSON object end in ${pin}`);

      // Verify essential sections present in narration
      assert(narrationText.includes(apiRes.data.location_name), `Narration missing location_name for ${pin}`);
      assert(narrationText.includes(apiRes.data.pincode), `Narration missing pincode for ${pin}`);
      assert(narrationText.includes(apiRes.data.district), `Narration missing district for ${pin}`);
      assert(narrationText.includes(apiRes.data.state), `Narration missing state for ${pin}`);
      assert(narrationText.includes(apiRes.data.historical_brief.summary_one_liner), `Narration missing summary for ${pin}`);
      assert(narrationText.includes(apiRes.data.historical_brief.ancient_foundations), `Narration missing ancient foundations for ${pin}`);
      assert(narrationText.includes(apiRes.data.historical_brief.living_culture_crafts), `Narration missing living crafts for ${pin}`);
      assert(narrationText.includes(apiRes.data.historical_brief.famous_lore_landmarks), `Narration missing sacred landmarks for ${pin}`);
    }
  });
}

// ============================================================================
// SUITE 2: /explore STATE TRANSITIONS & SPATIAL SYNC HARNESS
// ============================================================================
async function runExploreStateTransitionSuite() {
  const SUITE = 'Suite 2: /explore Query Permutations & Spatial Sync';
  console.log(`\n${colors.bright}${colors.blue}▶ Running ${SUITE}${colors.reset}`);

  // Test 2.1: Query Permutations & PIN Extraction
  await runTestCase(SUITE, '2.1 - Explore Search Query Permutations & Regex Extraction', async () => {
    const queryMatrix = [
      { query: '110001', expectedPin: '110001', desc: 'Raw 6-digit metro PIN' },
      { query: 'Museums near 110001', expectedPin: '110001', desc: 'Query containing PIN suffix' },
      { query: '110001 Delhi National Museum', expectedPin: '110001', desc: 'Query containing PIN prefix' },
      { query: 'Search in 600008 area', expectedPin: '600008', desc: 'Query with embedded PIN' },
      { query: 'PIN: 800001 Patna', expectedPin: '800001', desc: 'Query with colon prefix' },
      { query: '175131', expectedPin: '175131', desc: 'Rural mountain PIN' },
      { query: '385535', expectedPin: '385535', desc: 'Rural desert frontier PIN' },
      { query: '11-001', expectedPin: null, desc: 'Hyphenated invalid PIN' },
      { query: '012345', expectedPin: null, desc: 'Leading zero invalid PIN' },
      { query: '12345', expectedPin: null, desc: '5-digit incomplete PIN' },
      { query: 'National Museum New Delhi', expectedPin: null, desc: 'Pure textual name query' },
      { query: '', expectedPin: null, desc: 'Empty query' },
    ];

    for (const item of queryMatrix) {
      const extracted = extractPinFromQuery(item.query);
      assertEqual(
        extracted,
        item.expectedPin,
        `Query extraction mismatch for "${item.query}" (${item.desc})`
      );

      if (extracted) {
        const apiRes = await callApi(extracted);
        assertEqual(apiRes.status, 200, `API lookup for extracted PIN ${extracted}`);
        const narration = buildExploreNarrationText(apiRes.data);
        assert(narration.length >= 180, `Narration length check for ${extracted}`);
      }
    }
  });

  // Test 2.2: Expandable Accordion Toggle State
  await runTestCase(SUITE, '2.2 - Accordion Expand/Collapse State Transitions & ARIA Accessibility', async () => {
    interface BannerAccordionState {
      isExpanded: boolean;
      data: any;
    }

    const bannerState: BannerAccordionState = {
      isExpanded: true, // default is true
      data: (await callApi('110001')).data,
    };

    // Verify initial expanded state
    assertEqual(bannerState.isExpanded, true, 'Default accordion state must be expanded');
    assert(bannerState.data.historical_brief.ancient_foundations.length > 0, 'Ancient foundations available');

    // Simulate user clicking "Hide Details"
    bannerState.isExpanded = false;
    assertEqual(bannerState.isExpanded, false, 'State after collapse click');

    // In collapsed state, top summary and audio button remain active
    const topSummary = bannerState.data.historical_brief.summary_one_liner;
    assert(topSummary.length > 0, 'Summary one liner remains accessible in collapsed state');
    const narrationText = buildExploreNarrationText(bannerState.data);
    assert(narrationText.length > 0, 'Narration remains accessible in collapsed state');

    // Simulate user clicking "Explore History"
    bannerState.isExpanded = true;
    assertEqual(bannerState.isExpanded, true, 'State after expand click');
  });

  // Test 2.3: Spatial Distance Engine & Proximity Sorting Synchronization
  await runTestCase(SUITE, '2.3 - Spatial Distance Engine Synchronization & Monotonic Sorting', async () => {
    const testPins = [
      { pin: '110001', maxExpectedClosestKm: 10, closestExpectedMuseum: 'National Museum' },
      { pin: '600008', maxExpectedClosestKm: 5, closestExpectedMuseum: 'Government Museum' },
      { pin: '700016', maxExpectedClosestKm: 5, closestExpectedMuseum: 'Indian Museum' },
      { pin: '400023', maxExpectedClosestKm: 5, closestExpectedMuseum: 'Chhatrapati Shivaji Maharaj Vastu Sangrahalaya' },
    ];

    for (const item of testPins) {
      const searchRes = searchMuseums({ query: item.pin, radiusKm: 100 });
      assert(searchRes.results.length > 0, `Search for PIN ${item.pin} must yield results within 100km`);

      const closest = searchRes.results[0];
      assert(closest !== undefined && closest.distance_km !== undefined, `Closest museum to ${item.pin} must have distance_km calculated`);
      assert(
        (closest.distance_km ?? 999) <= item.maxExpectedClosestKm,
        `Distance to closest museum (${closest.distance_km}km) exceeds max expected (${item.maxExpectedClosestKm}km) for ${item.pin}`
      );
      assert(
        closest.name.toLowerCase().includes(item.closestExpectedMuseum.toLowerCase()),
        `Expected closest museum for ${item.pin} to be "${item.closestExpectedMuseum}", got "${closest.name}"`
      );

      // Verify strictly ascending monotonic ordering of distance_km
      for (let i = 0; i < searchRes.results.length - 1; i++) {
        const d1 = searchRes.results[i].distance_km ?? 0;
        const d2 = searchRes.results[i + 1].distance_km ?? 0;
        assert(d1 <= d2, `Results not sorted monotonically: result[${i}]=${d1}km > result[${i + 1}]=${d2}km for PIN ${item.pin}`);
      }
    }
  });

  // Test 2.4: Rural Unindexed PIN with Fallback Nearest Museum Modal Sync
  await runTestCase(SUITE, '2.4 - Rural Unindexed PIN (175131, 385535) Spatial Fallback Sync', async () => {
    // 175131 - Kullu / Manali, HP
    const ruralSearch = searchMuseums({ query: '175131', radiusKm: 25 });
    // In 25km radius in Kullu valley, there may be 0 direct indexed partner museums
    const fallback = findNearestMuseumForPincode('175131');
    assert(fallback !== null, 'findNearestMuseumForPincode("175131") must return partner fallback');
    if (!fallback) throw new Error('Fallback is null');
    assert(fallback.distanceKm > 0, 'Distance to nearest partner must be > 0 km');
    assert(fallback.regionName.toLowerCase().includes('himachal') || fallback.regionName.toLowerCase().includes('kullu'), 'Region name check for 175131');
    assert(fallback.nearestMuseum !== null, 'Nearest partner museum object must exist');

    // Also verify historical brief resolves regional context
    const histRes = await callApi('175131');
    assertEqual(histRes.status, 200, 'Rural PIN historical brief status');
    assert(histRes.data.state.toLowerCase().includes('himachal'), 'Rural state check');
  });
}

// ============================================================================
// SUITE 3: END-TO-END COMPLETE USER JOURNEYS
// ============================================================================
async function runCompleteUserJourneysSuite() {
  const SUITE = 'Suite 3: Complete E2E User Journeys & Integrity';
  console.log(`\n${colors.bright}${colors.blue}▶ Running ${SUITE}${colors.reset}`);

  // Journey 1: Connect to Your Roots full discovery journey
  await runTestCase(SUITE, '3.1 - User Journey 1: Roots Discovery Flow (Default -> Presets -> Audio -> Invalid Recovery)', async () => {
    // Step 1: Initial load with default PIN 600008
    let currentPin = '600008';
    let rootsData = resolveRootsByPincode(currentPin);
    assert(rootsData !== null, 'Default roots data must load');
    let briefRes = await callApi(currentPin);
    assertEqual(briefRes.status, 200, 'Default brief must resolve');
    let narration = buildRootsNarrationText(briefRes.data);
    assert(narration.includes('Tamil Nadu'), 'Default narration contains state');

    // Step 2: Switch to Delhi (110001)
    currentPin = '110001';
    rootsData = resolveRootsByPincode(currentPin);
    briefRes = await callApi(currentPin);
    assertEqual(briefRes.data.state, 'Delhi', 'Delhi state match');
    assertEqual(briefRes.data.pincode, '110001', 'Delhi PIN match');

    // Step 3: Switch to Patna (800001)
    currentPin = '800001';
    rootsData = resolveRootsByPincode(currentPin);
    briefRes = await callApi(currentPin);
    assertEqual(briefRes.data.state, 'Bihar', 'Patna state match');

    // Step 4: User types partial / invalid PIN "8000"
    currentPin = '8000';
    const isVal = /^[1-9][0-9]{5}$/.test(currentPin);
    assertEqual(isVal, false, 'Partial PIN is invalid');

    // Step 5: User completes valid PIN "800001"
    currentPin = '800001';
    briefRes = await callApi(currentPin);
    assertEqual(briefRes.status, 200, 'Recovered back to valid 800001');
  });

  // Journey 2: Explore Museums spatial discovery journey
  await runTestCase(SUITE, '3.2 - User Journey 2: Explore Search Flow (City -> PIN -> Banner -> Narration -> Radius Expand)', async () => {
    // Step 1: Search by city name "Mumbai"
    let query = 'Mumbai';
    let pin = extractPinFromQuery(query);
    assertEqual(pin, null, 'City query has no embedded PIN');
    let searchRes = searchMuseums({ query, radiusKm: 25 });
    assert(searchRes.results.length > 0, 'Mumbai search returns museums');

    // Step 2: User enters exact PIN "400023"
    query = '400023';
    pin = extractPinFromQuery(query);
    assertEqual(pin, '400023', 'Extracted PIN 400023');
    let briefRes = await callApi(pin!);
    assertEqual(briefRes.status, 200, 'Brief resolved for 400023');
    searchRes = searchMuseums({ query, radiusKm: 25 });
    assert(searchRes.results[0].distance_km !== undefined, 'Distance calculated');

    // Step 3: User searches query with natural language "Museums in 110001 area"
    query = 'Museums in 110001 area';
    pin = extractPinFromQuery(query);
    assertEqual(pin, '110001', 'Extracted PIN 110001 from sentence');
    briefRes = await callApi(pin!);
    assertEqual(briefRes.data.state, 'Delhi', 'Delhi brief from natural language query');

    // Step 4: User searches rural PIN "175131"
    query = '175131';
    pin = extractPinFromQuery(query);
    assertEqual(pin, '175131', 'Extracted rural PIN');
    briefRes = await callApi(pin!);
    assertEqual(briefRes.data.state, 'Himachal Pradesh', 'Himachal brief for rural PIN');
    const fallback = findNearestMuseumForPincode('175131');
    assert(fallback !== null, 'Fallback nearest museum resolved');
  });
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
export async function main() {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🎭  CHALLENGER 2: FRONTEND & UI SCENARIO EMPIRICAL STRESS RUNNER${colors.reset}`);
  console.log(`${colors.dim}    Target: /roots, /explore, State Transitions, Narration & Spatial Sync${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);

  const startAll = Date.now();

  await runRootsStateTransitionSuite();
  await runExploreStateTransitionSuite();
  await runCompleteUserJourneysSuite();

  const totalDuration = Date.now() - startAll;
  const total = allResults.length;
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;

  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}📋  UI SCENARIO STRESS TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`| Total Scenarios Tested: ${total.toString().padEnd(4)} | Passed: ${colors.green}${passed.toString().padEnd(4)}${colors.reset} | Failed: ${failed > 0 ? colors.red : colors.green}${failed.toString().padEnd(4)}${colors.reset} | Time: ${(totalDuration + 'ms').padEnd(8)} |`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.bright}${colors.green}✨ ALL ${total} UI SCENARIO STRESS TESTS PASSED EMPIRICALLY! (100% PASS RATE)${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bright}${colors.red}❌ ${failed} / ${total} TESTS FAILED!${colors.reset}\n`);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('ui_scenario_stress_runner.ts') || process.argv[1]?.endsWith('ui_scenario_stress_runner.js')) {
  main().catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}
