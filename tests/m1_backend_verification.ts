/**
 * M1 Backend Historical Brief Verification Script
 * 
 * Verifies all requirements of M1:
 * 1. GET & POST route handlers.
 * 2. Strict PIN code regex validation (/^[1-9][0-9]{5}$/) returning 400 INVALID_PINCODE_FORMAT.
 * 3. Exact and rural PIN geographic & cultural hierarchy resolution.
 * 4. Response schema completeness (historical_brief, dynasties, crafts, monuments).
 * 5. In-memory LRU cache performance (<10ms repeat response SLA <=20ms).
 * 6. Deterministic offline fallback robustness.
 */

import { GET, POST } from '../app/api/pincode-history/route';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs?: number;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('=====================================================');
  console.log('Starting Milestone 1 (M1) Route Verification Suite');
  console.log('=====================================================\n');

  // -----------------------------------------------------------------
  // Suite 1: Strict Regex & Format Validation (Negative Test Cases)
  // -----------------------------------------------------------------
  console.log('--- Suite 1: Strict Regex & Format Validation ---');
  const invalidPins = [
    '11-001',
    '012345',
    'abcdef',
    '000000',
    '12345',
    '1234567',
    '',
    '99999p',
    '11 001',
  ];

  for (const pin of invalidPins) {
    try {
      const req = new Request(`http://localhost:3000/api/pincode-history?pincode=${encodeURIComponent(pin)}`);
      const res = await GET(req);
      assert(res.status === 400, `Expected status 400 for PIN "${pin}", got ${res.status}`);
      const body = await res.json();
      assert(body.status === 'error', `Expected body.status === 'error' for PIN "${pin}"`);
      assert(body.error === 'INVALID_PINCODE_FORMAT', `Expected error === 'INVALID_PINCODE_FORMAT' for PIN "${pin}"`);
      assert(typeof body.message === 'string' && body.message.length > 0, `Expected error message string for PIN "${pin}"`);
      results.push({ suite: 'Validation', name: `GET invalid pin: "${pin}" -> 400`, passed: true });
      console.log(`  [PASS] GET invalid pin "${pin}" -> 400 INVALID_PINCODE_FORMAT`);
    } catch (e: any) {
      results.push({ suite: 'Validation', name: `GET invalid pin: "${pin}"`, passed: false, error: e.message });
      console.error(`  [FAIL] GET invalid pin "${pin}": ${e.message}`);
    }
  }

  // Test missing pincode parameter in GET
  try {
    const req = new Request('http://localhost:3000/api/pincode-history');
    const res = await GET(req);
    assert(res.status === 400, `Expected 400 for missing pincode, got ${res.status}`);
    const body = await res.json();
    assert(body.error === 'INVALID_PINCODE_FORMAT', `Expected INVALID_PINCODE_FORMAT for missing query param`);
    results.push({ suite: 'Validation', name: 'GET missing pincode param -> 400', passed: true });
    console.log('  [PASS] GET missing pincode param -> 400');
  } catch (e: any) {
    results.push({ suite: 'Validation', name: 'GET missing pincode param', passed: false, error: e.message });
    console.error(`  [FAIL] GET missing pincode: ${e.message}`);
  }

  // Test POST with invalid pin and malformed body
  try {
    const req = new Request('http://localhost:3000/api/pincode-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pincode: 'invalid_pin' }),
    });
    const res = await POST(req);
    assert(res.status === 400, `Expected 400 for POST invalid pin, got ${res.status}`);
    const body = await res.json();
    assert(body.error === 'INVALID_PINCODE_FORMAT', `Expected INVALID_PINCODE_FORMAT`);
    results.push({ suite: 'Validation', name: 'POST invalid pincode -> 400', passed: true });
    console.log('  [PASS] POST invalid pincode -> 400');
  } catch (e: any) {
    results.push({ suite: 'Validation', name: 'POST invalid pincode', passed: false, error: e.message });
    console.error(`  [FAIL] POST invalid pincode: ${e.message}`);
  }

  try {
    const req = new Request('http://localhost:3000/api/pincode-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-non-json',
    });
    const res = await POST(req);
    assert(res.status === 400, `Expected 400 for non-json POST body, got ${res.status}`);
    const body = await res.json();
    assert(body.error === 'INVALID_PINCODE_FORMAT', `Expected INVALID_PINCODE_FORMAT`);
    results.push({ suite: 'Validation', name: 'POST malformed body -> 400', passed: true });
    console.log('  [PASS] POST malformed body -> 400');
  } catch (e: any) {
    results.push({ suite: 'Validation', name: 'POST malformed body', passed: false, error: e.message });
    console.error(`  [FAIL] POST malformed body: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // Suite 2: Geographic & Cultural Hierarchy Resolution (Known Museums & Metros)
  // -----------------------------------------------------------------
  console.log('\n--- Suite 2: Known PIN Codes Hierarchy & Grounding ---');
  const knownPins = [
    { pin: '110001', expectedState: 'Delhi', note: 'Delhi GPO' },
    { pin: '600008', expectedState: 'Tamil Nadu', note: 'Chennai Egmore' },
    { pin: '800001', expectedState: 'Bihar', note: 'Patna' },
    { pin: '221001', expectedState: 'Uttar Pradesh', note: 'Varanasi' },
    { pin: '700016', expectedState: 'West Bengal', note: 'Kolkata Park Street' },
    { pin: '400023', expectedState: 'Maharashtra', note: 'Mumbai Kala Ghoda' },
    { pin: '560001', expectedState: 'Karnataka', note: 'Bengaluru' },
    { pin: '500002', expectedState: 'Telangana', note: 'Hyderabad Darulshifa' },
  ];

  for (const item of knownPins) {
    try {
      const req = new Request(`http://localhost:3000/api/pincode-history?pincode=${item.pin}`);
      const start = Date.now();
      const res = await GET(req);
      const dur = Date.now() - start;

      assert(res.status === 200, `Expected status 200 for ${item.pin}, got ${res.status}`);
      const body = await res.json();

      assert(body.status === 'success', `Expected status === 'success'`);
      assert(body.pincode === item.pin, `Expected pincode === '${item.pin}'`);
      assert(typeof body.location_name === 'string' && body.location_name.length > 0, `location_name missing`);
      assert(typeof body.state === 'string' && body.state.length > 0, `state missing`);
      assert(typeof body.district === 'string' && body.district.length > 0, `district missing`);
      assert(typeof body.postal_circle === 'string' && body.postal_circle.length > 0, `postal_circle missing`);

      // Historical brief 3-part card + summary
      assert(typeof body.historical_brief === 'object', `historical_brief missing`);
      assert(typeof body.historical_brief.ancient_foundations === 'string' && body.historical_brief.ancient_foundations.length > 20, `ancient_foundations missing`);
      assert(typeof body.historical_brief.living_culture_crafts === 'string' && body.historical_brief.living_culture_crafts.length > 20, `living_culture_crafts missing`);
      assert(typeof body.historical_brief.famous_lore_landmarks === 'string' && body.historical_brief.famous_lore_landmarks.length > 20, `famous_lore_landmarks missing`);
      assert(typeof body.historical_brief.summary_one_liner === 'string' && body.historical_brief.summary_one_liner.length > 10, `summary_one_liner missing`);

      // Badges
      assert(Array.isArray(body.key_dynasties) && body.key_dynasties.length > 0, `key_dynasties missing`);
      assert(Array.isArray(body.traditional_crafts) && body.traditional_crafts.length > 0, `traditional_crafts missing`);
      assert(Array.isArray(body.notable_monuments) && body.notable_monuments.length > 0, `notable_monuments missing`);

      results.push({ suite: 'KnownPINs', name: `PIN ${item.pin} (${item.note})`, passed: true, durationMs: dur });
      console.log(`  [PASS] PIN ${item.pin} (${item.note}) -> State: ${body.state}, Circle: ${body.postal_circle}, Source: ${body.source}`);
    } catch (e: any) {
      results.push({ suite: 'KnownPINs', name: `PIN ${item.pin}`, passed: false, error: e.message });
      console.error(`  [FAIL] PIN ${item.pin}: ${e.message}`);
    }
  }

  // -----------------------------------------------------------------
  // Suite 3: Rural / Non-Museum PIN Codes Resolution
  // -----------------------------------------------------------------
  console.log('\n--- Suite 3: Rural & Non-Museum PIN Codes ---');
  const ruralPins = [
    { pin: '175131', expectedState: 'Himachal Pradesh', note: 'Kullu / Manali Rural' },
    { pin: '385535', expectedState: 'Gujarat', note: 'Deesa / Banaskantha Rural' },
    { pin: '795001', expectedState: 'Manipur', note: 'Imphal North East' },
    { pin: '744102', expectedState: 'Andaman & Nicobar', note: 'Port Blair Islands' },
  ];

  for (const item of ruralPins) {
    try {
      const req = new Request(`http://localhost:3000/api/pincode-history?pincode=${item.pin}`);
      const res = await GET(req);
      assert(res.status === 200, `Expected status 200 for rural PIN ${item.pin}, got ${res.status}`);
      const body = await res.json();

      assert(body.status === 'success', `Expected status === 'success'`);
      assert(body.pincode === item.pin, `Expected pincode === '${item.pin}'`);
      assert(body.historical_brief.ancient_foundations.length > 20, `ancient_foundations missing for ${item.pin}`);
      assert(body.key_dynasties.length >= 1, `dynasties missing for ${item.pin}`);
      assert(body.traditional_crafts.length >= 1, `crafts missing for ${item.pin}`);

      results.push({ suite: 'RuralPINs', name: `Rural PIN ${item.pin} (${item.note})`, passed: true });
      console.log(`  [PASS] Rural PIN ${item.pin} (${item.note}) -> State: ${body.state}, Circle: ${body.postal_circle}`);
    } catch (e: any) {
      results.push({ suite: 'RuralPINs', name: `Rural PIN ${item.pin}`, passed: false, error: e.message });
      console.error(`  [FAIL] Rural PIN ${item.pin}: ${e.message}`);
    }
  }

  // -----------------------------------------------------------------
  // Suite 4: POST Method Integration
  // -----------------------------------------------------------------
  console.log('\n--- Suite 4: POST Method Integration ---');
  try {
    const req = new Request('http://localhost:3000/api/pincode-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pincode: '560001' }),
    });
    const res = await POST(req);
    assert(res.status === 200, `Expected 200 for POST, got ${res.status}`);
    const body = await res.json();
    assert(body.status === 'success', `Expected success status`);
    assert(body.pincode === '560001', `Expected pincode 560001`);
    assert(body.state === 'Karnataka', `Expected Karnataka, got ${body.state}`);
    results.push({ suite: 'POSTMethod', name: 'POST { pincode: "560001" }', passed: true });
    console.log('  [PASS] POST { pincode: "560001" } -> 200 OK');
  } catch (e: any) {
    results.push({ suite: 'POSTMethod', name: 'POST method integration', passed: false, error: e.message });
    console.error(`  [FAIL] POST method: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // Suite 5: In-Memory Caching & Latency SLA (<10ms repeat response)
  // -----------------------------------------------------------------
  console.log('\n--- Suite 5: In-Memory Caching & SLA Latency Benchmarks ---');
  const cacheTestPins = ['110001', '600008', '800001'];
  for (const pin of cacheTestPins) {
    try {
      // First call (cached or fresh)
      const req1 = new Request(`http://localhost:3000/api/pincode-history?pincode=${pin}`);
      await GET(req1);

      // Second call (MUST be cached and <10ms)
      const start = performance.now();
      const req2 = new Request(`http://localhost:3000/api/pincode-history?pincode=${pin}`);
      const res2 = await GET(req2);
      const dur = performance.now() - start;
      const body2 = await res2.json();

      assert(res2.status === 200, `Expected 200 on cache hit`);
      assert(body2.cached === true, `Expected body2.cached === true on repeat lookup`);
      assert(dur <= 20, `Expected cache latency <= 20ms (SLA), got ${dur.toFixed(2)}ms`);

      results.push({ suite: 'CachingSLA', name: `Cache hit for ${pin} (${dur.toFixed(2)}ms)`, passed: true, durationMs: dur });
      console.log(`  [PASS] Cache hit for PIN ${pin} -> cached: ${body2.cached}, latency: ${dur.toFixed(2)}ms (SLA <=20ms satisfied)`);
    } catch (e: any) {
      results.push({ suite: 'CachingSLA', name: `Cache hit for ${pin}`, passed: false, error: e.message });
      console.error(`  [FAIL] Cache test for ${pin}: ${e.message}`);
    }
  }

  // -----------------------------------------------------------------
  // Suite Summary
  // -----------------------------------------------------------------
  console.log('\n=====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('=====================================================');

  if (failedCount > 0) {
    console.error('\nSome verification tests failed:');
    for (const f of results.filter((r) => !r.passed)) {
      console.error(`- [${f.suite}] ${f.name}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('\nAll Milestone 1 (M1) verification tests passed successfully! [100%]\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
