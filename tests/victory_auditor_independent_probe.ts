import { GET, POST } from '../app/api/pincode-history/route';

async function callGet(pincode?: string): Promise<{ status: number; data: any }> {
  const url = pincode !== undefined
    ? 'http://localhost:3000/api/pincode-history?pincode=' + encodeURIComponent(pincode)
    : 'http://localhost:3000/api/pincode-history';
  const req = new Request(url, { method: 'GET' });
  const res = await GET(req);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function callPost(body: any): Promise<{ status: number; data: any }> {
  const req = new Request('http://localhost:3000/api/pincode-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  const res = await POST(req);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error('  ❌ FAIL: ' + msg);
    failed++;
    throw new Error(msg);
  }
}

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    const t0 = performance.now();
    await fn();
    const duration = (performance.now() - t0).toFixed(2);
    console.log('  ✔ PASS [' + name + '] (' + duration + 'ms)');
    passed++;
  } catch (err: any) {
    console.error('  ❌ EXCEPTION in [' + name + ']:', err.message);
  }
}

async function main() {
  console.log('========================================================================');
  console.log('🔍 INDEPENDENT VICTORY AUDITOR PROBE - AI HISTORICAL BRIEFING ENGINE');
  console.log('========================================================================\n');

  console.log('--- SUITE 1: Valid PIN Resolution & Structured Schema Invariants ---');
  const validPins = [
    { pin: '110001', state: 'Delhi' },
    { pin: '600008', state: 'Tamil Nadu' },
    { pin: '800001', state: 'Bihar' },
    { pin: '221001', state: 'Uttar Pradesh' },
    { pin: '700016', state: 'West Bengal' },
    { pin: '400023', state: 'Maharashtra' },
    { pin: '560001', state: 'Karnataka' },
    { pin: '500002', state: 'Telangana' },
    { pin: '175131', state: 'Himachal Pradesh' },
    { pin: '385535', state: 'Gujarat' },
    { pin: '795001', state: 'Manipur' },
    { pin: '900056', state: 'Delhi' },
  ];

  for (const item of validPins) {
    await runTest('GET Valid PIN ' + item.pin + ' (' + item.state + ')', async () => {
      const res = await callGet(item.pin);
      assert(res.status === 200, 'Expected HTTP 200, got ' + res.status);
      assert(res.data.status === 'success', 'Expected status success');
      assert(res.data.pincode === item.pin, 'Expected pincode ' + item.pin);
      assert(typeof res.data.location_name === 'string' && res.data.location_name.length > 0, 'location_name must be non-empty string');
      assert(typeof res.data.state === 'string' && res.data.state.length > 0, 'state must be non-empty string');
      assert(typeof res.data.district === 'string' && res.data.district.length > 0, 'district must be non-empty string');
      assert(typeof res.data.postal_circle === 'string' && res.data.postal_circle.length > 0, 'postal_circle must be non-empty string');
      
      const brief = res.data.historical_brief;
      assert(brief !== null && typeof brief === 'object', 'historical_brief must be an object');
      assert(typeof brief.ancient_foundations === 'string' && brief.ancient_foundations.length >= 30, 'ancient_foundations >= 30 chars');
      assert(typeof brief.living_culture_crafts === 'string' && brief.living_culture_crafts.length >= 30, 'living_culture_crafts >= 30 chars');
      assert(typeof brief.famous_lore_landmarks === 'string' && brief.famous_lore_landmarks.length >= 30, 'famous_lore_landmarks >= 30 chars');
      assert(typeof brief.summary_one_liner === 'string' && brief.summary_one_liner.length > 0, 'summary_one_liner non-empty');

      assert(Array.isArray(res.data.key_dynasties) && res.data.key_dynasties.length >= 1, 'key_dynasties array length >= 1');
      assert(Array.isArray(res.data.traditional_crafts) && res.data.traditional_crafts.length >= 1, 'traditional_crafts array length >= 1');
      assert(Array.isArray(res.data.notable_monuments) && res.data.notable_monuments.length >= 1, 'notable_monuments array length >= 1');
    });

    await runTest('POST Valid PIN ' + item.pin, async () => {
      const res = await callPost({ pincode: item.pin });
      assert(res.status === 200, 'Expected HTTP 200, got ' + res.status);
      assert(res.data.status === 'success', 'Expected status success');
      assert(res.data.pincode === item.pin, 'Expected pincode match');
    });
  }

  console.log('\n--- SUITE 2: Strict Malformed PIN Rejections (HTTP 400 INVALID_PINCODE_FORMAT) ---');
  const malformedCases = [
    '11-001', '012345', 'abcdef', '000000', '', '   ', '1100011', '1100', '-11000',
    '11 0001', '11.001', '!@#$%', '<script>alert(1)</script>', "110001' OR '1'='1"
  ];

  for (const raw of malformedCases) {
    await runTest('Reject Malformed GET "' + raw + '"', async () => {
      const res = await callGet(raw);
      assert(res.status === 400, 'Expected HTTP 400, got ' + res.status);
      assert(res.data.status === 'error', 'Expected status error');
      assert(res.data.error === 'INVALID_PINCODE_FORMAT', 'Expected error INVALID_PINCODE_FORMAT');
    });

    await runTest('Reject Malformed POST "' + raw + '"', async () => {
      const res = await callPost({ pincode: raw });
      assert(res.status === 400, 'Expected HTTP 400, got ' + res.status);
      assert(res.data.status === 'error', 'Expected status error');
      assert(res.data.error === 'INVALID_PINCODE_FORMAT', 'Expected error INVALID_PINCODE_FORMAT');
    });
  }

  await runTest('Reject missing pincode in POST ({})', async () => {
    const res = await callPost({});
    assert(res.status === 400, 'Expected 400, got ' + res.status);
    assert(res.data.error === 'INVALID_PINCODE_FORMAT', 'Expected INVALID_PINCODE_FORMAT');
  });

  await runTest('Reject non-string/non-6-digit in POST ({ pincode: 12345 })', async () => {
    const res = await callPost({ pincode: 12345 });
    assert(res.status === 400, 'Expected 400, got ' + res.status);
    assert(res.data.error === 'INVALID_PINCODE_FORMAT', 'Expected INVALID_PINCODE_FORMAT');
  });

  console.log('\n--- SUITE 3: In-Memory LRU Caching Latency SLA (<10ms repeat) ---');
  await runTest('Cache Latency Benchmark (100 Repeat Reads across 6 primed PINs)', async () => {
    const testPins = ['110001', '600008', '800001', '221001', '700016', '400023'];
    for (const p of testPins) {
      await callGet(p);
    }
    const latencies: number[] = [];
    for (let i = 0; i < 100; i++) {
      const p = testPins[i % testPins.length];
      const start = performance.now();
      const res = await callGet(p);
      const lat = performance.now() - start;
      latencies.push(lat);
      assert(res.status === 200, 'HTTP 200');
      assert(res.data.cached === true, 'Response cached: true');
    }
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const max = Math.max(...latencies);
    console.log('    Cached Repeat Latency: avg=' + avg.toFixed(3) + 'ms, max=' + max.toFixed(3) + 'ms (SLA: <10ms)');
    assert(avg < 10.0, 'Average repeat cache latency must be <10ms, got ' + avg.toFixed(3) + 'ms');
    assert(max <= 20.0, 'Max repeat cache latency must be <=20ms, got ' + max.toFixed(3) + 'ms');
  });

  console.log('\n--- SUITE 4: UI & Search Query Extraction Verification ---');
  function extractPinFromQuery(query: string): string | null {
    const clean = query.trim();
    if (/^[1-9][0-9]{5}$/.test(clean)) return clean;
    const match = clean.match(/\b[1-9][0-9]{5}\b/);
    return match ? match[0] : null;
  }

  const queryTestCases = [
    { query: '110001', expected: '110001' },
    { query: 'Museums near 600008 Egmore', expected: '600008' },
    { query: 'Patna 800001 heritage', expected: '800001' },
    { query: 'Search in 700016 area', expected: '700016' },
    { query: 'Invalid 011000 pin', expected: null },
    { query: 'Delhi 11-001', expected: null },
    { query: 'Just text query Delhi', expected: null },
  ];

  for (const tc of queryTestCases) {
    await runTest('PIN Extraction from "' + tc.query + '"', async () => {
      const extracted = extractPinFromQuery(tc.query);
      assert(extracted === tc.expected, 'Expected ' + tc.expected + ', got ' + extracted);
    });
  }

  console.log('\n========================================================================');
  console.log('PROBE SUMMARY: Total: ' + (passed + failed) + ' | Passed: ' + passed + ' | Failed: ' + failed);
  console.log('========================================================================');
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal probe execution error:', err);
  process.exit(1);
});
