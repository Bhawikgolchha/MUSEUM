/**
 * Unit Test Suite for Geocoding & Postal PIN Hierarchy Service (Milestone 1)
 * Run with: npx tsx tests/unit/geocoding.test.ts
 */

import {
  validatePincode,
  resolvePincode,
  clearGeocodingCache,
  getGeocodingCacheStats,
  LRUCache,
  parseAddressFromLocationName,
} from '../../lib/services/geocoding';

// ==========================================
// Test Runner Harness
// ==========================================

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string): void {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  const isMatch = JSON.stringify(actual) === JSON.stringify(expected);
  assert(isMatch, `${message} (Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)})`);
}

async function runTestSuite(): Promise<void> {
  console.log('\n======================================================');
  console.log('  MILESTONE 1: GEOCODING & POSTAL PIN UNIT TESTS');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // Suite 1: Strict Regex & Format Validation
  // ----------------------------------------------------
  console.log('Suite 1: Strict Regex & Format Validation');

  const validPins = ['110011', '600008', '800001', '221007', '560034', '400001', '302004', '700016'];
  for (const pin of validPins) {
    const res = validatePincode(pin);
    assert(res.isValid === true && res.cleanPin === pin && !res.error, `Valid PIN '${pin}' is accepted`);
  }

  // Trailing / leading whitespace should be trimmed
  const paddedRes = validatePincode('  110011  ');
  assert(paddedRes.isValid === true && paddedRes.cleanPin === '110011', 'Whitespace padded PIN is trimmed and accepted');

  // Invalid PIN formats
  const invalidPins = [
    { input: '11001', reason: '5 digits (too short)' },
    { input: '1100110', reason: '7 digits (too long)' },
    { input: '011001', reason: 'leading zero not allowed' },
    { input: '11001A', reason: 'alphanumeric character' },
    { input: '110 011', reason: 'embedded space' },
    { input: '110-011', reason: 'embedded hyphen' },
    { input: '<script>alert(1)</script>', reason: 'XSS script injection' },
    { input: '', reason: 'empty string' },
    { input: 'ABCDEF', reason: 'pure letters' },
    { input: '!@#$%^', reason: 'special symbols' },
  ];

  for (const item of invalidPins) {
    const res = validatePincode(item.input);
    assert(
      res.isValid === false &&
        res.error?.code === 'INVALID_PINCODE_FORMAT' &&
        res.error?.retryable === false,
      `Invalid PIN '${item.input}' (${item.reason}) is rejected with INVALID_PINCODE_FORMAT`
    );
  }

  // Non-string inputs
  const nonString1 = validatePincode(null);
  assert(nonString1.isValid === false && nonString1.error?.code === 'INVALID_PINCODE_FORMAT', 'Null input is rejected');
  const nonString2 = validatePincode(undefined);
  assert(nonString2.isValid === false && nonString2.error?.code === 'INVALID_PINCODE_FORMAT', 'Undefined input is rejected');
  const nonString3 = validatePincode(110011 as unknown as string);
  assert(nonString3.isValid === false && nonString3.error?.code === 'INVALID_PINCODE_FORMAT', 'Number input is rejected');

  // ----------------------------------------------------
  // Suite 2: Tier 1 - In-Memory / Database Lookup
  // ----------------------------------------------------
  console.log('\nSuite 2: Tier 1 - In-Memory / Database Lookup');
  clearGeocodingCache();

  // Test National Museum PIN (110011)
  const tier1Res1 = await resolvePincode('110011');
  assert(tier1Res1.success === true, '110011 resolves successfully');
  assert(tier1Res1.status === 'success', '110011 has status success');
  assertEqual(tier1Res1.location?.source_tier, 'in_memory_db', '110011 source_tier is in_memory_db');
  assertEqual(tier1Res1.location?.pincode, '110011', '110011 pincode matched');
  assert(
    Math.abs((tier1Res1.location?.lat ?? 0) - 28.6118) < 0.01 &&
      Math.abs((tier1Res1.location?.lng ?? 0) - 77.2193) < 0.01,
    '110011 coordinates match Central Secretariat / National Museum'
  );
  assertEqual(tier1Res1.location?.city, 'New Delhi', '110011 city is New Delhi');

  // Test Chennai Egmore PIN (600008)
  const tier1Res2 = await resolvePincode('600008');
  assert(tier1Res2.success === true, '600008 resolves successfully');
  assertEqual(tier1Res2.location?.source_tier, 'in_memory_db', '600008 source_tier is in_memory_db');
  assertEqual(tier1Res2.location?.city, 'Chennai', '600008 city is Chennai');
  assertEqual(tier1Res2.location?.state, 'Tamil Nadu', '600008 state is Tamil Nadu');

  // Test Sarnath Museum PIN (221007)
  const tier1Res3 = await resolvePincode('221007');
  assert(tier1Res3.success === true, '221007 resolves successfully');
  assertEqual(tier1Res3.location?.source_tier, 'in_memory_db', '221007 source_tier is in_memory_db');
  assertEqual(tier1Res3.location?.city, 'Varanasi', '221007 city is Varanasi');
  assertEqual(tier1Res3.location?.state, 'Uttar Pradesh', '221007 state is Uttar Pradesh');

  // ----------------------------------------------------
  // Suite 3: Tier 2 - National Postal Directory Lookup
  // ----------------------------------------------------
  console.log('\nSuite 3: Tier 2 - National Postal Directory Lookup');

  // Test 3-digit district prefix (Faridabad - 121001)
  const tier2District = await resolvePincode('121001');
  assert(tier2District.success === true, '121001 resolves successfully');
  assertEqual(tier2District.location?.source_tier, 'national_directory', '121001 source_tier is national_directory');
  assert(tier2District.location?.city.includes('Faridabad') === true, '121001 city contains Faridabad');
  assertEqual(tier2District.location?.state, 'Haryana', '121001 state is Haryana');

  // Test 3-digit district prefix (Indore - 452010)
  const tier2District2 = await resolvePincode('452010');
  assert(tier2District2.success === true, '452010 resolves successfully');
  assertEqual(tier2District2.location?.source_tier, 'national_directory', '452010 source_tier is national_directory');
  assert(tier2District2.location?.city.includes('Indore') === true, '452010 city contains Indore');
  assertEqual(tier2District2.location?.state, 'Madhya Pradesh', '452010 state is Madhya Pradesh');

  // Test 2-digit circle fallback for arbitrary unindexed PIN in Rajasthan (340099)
  const tier2Circle = await resolvePincode('340099');
  assert(tier2Circle.success === true, '340099 resolves successfully');
  assertEqual(tier2Circle.location?.source_tier, 'national_directory', '340099 source_tier is national_directory');
  assertEqual(tier2Circle.location?.state, 'Rajasthan', '340099 state is Rajasthan');

  // ----------------------------------------------------
  // Suite 4: Multi-Match Candidate Disambiguation
  // ----------------------------------------------------
  console.log('\nSuite 4: Multi-Match Candidate Disambiguation');

  // Koramangala multi-match PIN (560034)
  const multiMatchRes = await resolvePincode('560034');
  assert(multiMatchRes.success === true, '560034 resolves successfully');
  assertEqual(multiMatchRes.status, 'partial', '560034 status is partial');
  assert(
    Array.isArray(multiMatchRes.location?.location_candidates) &&
      (multiMatchRes.location?.location_candidates?.length ?? 0) >= 2,
    '560034 returns multiple location_candidates'
  );
  assert(
    typeof multiMatchRes.location?.disambiguation_hint === 'string' &&
      multiMatchRes.location.disambiguation_hint.length > 0,
    '560034 returns disambiguation_hint'
  );
  assertEqual(multiMatchRes.location?.city, 'Bengaluru', '560034 primary centroid city is Bengaluru');
  assertEqual(multiMatchRes.location?.state, 'Karnataka', '560034 state is Karnataka');

  // Connaught Place single-match PIN (110001)
  const singleMatchRes2 = await resolvePincode('110001');
  assertEqual(singleMatchRes2.status, 'success', '110001 status is success');
  assertEqual(singleMatchRes2.location?.location_candidates, null, '110001 candidates are null');

  // Single-match PIN (110011) should have null candidates
  const singleMatchRes = await resolvePincode('110011');
  assertEqual(singleMatchRes.status, 'success', '110011 has status success');
  assertEqual(singleMatchRes.location?.location_candidates, null, '110011 candidates are null');
  assertEqual(singleMatchRes.location?.disambiguation_hint, null, '110011 disambiguation_hint is null');

  // ----------------------------------------------------
  // Suite 5: Tier 3 - External Geocoder & Error Handling
  // ----------------------------------------------------
  console.log('\nSuite 5: Tier 3 - External Geocoder & Error Handling');

  // Mock custom fetch for external geocoding (using unmapped prefix PIN 901234)
  const mockExternalFetch: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes('postalcode=901234')) {
      return new Response(
        JSON.stringify([
          {
            lat: '34.0500',
            lon: '74.8000',
            display_name: 'Baramulla Rural Centroid, Jammu & Kashmir, India',
            importance: 0.88,
            address: {
              suburb: 'Baramulla Sector A',
              town: 'Baramulla',
              state: 'Jammu and Kashmir',
              country: 'India',
            },
          },
          {
            lat: '34.0600',
            lon: '74.8100',
            display_name: 'Baramulla Sector B, Jammu & Kashmir, India',
            importance: 0.75,
            address: {
              suburb: 'Baramulla Sector B',
              town: 'Baramulla',
              state: 'Jammu and Kashmir',
              country: 'India',
            },
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.includes('postalcode=999999')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify([]), { status: 404 });
  };

  const extRes = await resolvePincode('901234', {
    customFetch: mockExternalFetch,
    bypassCache: true,
  });

  assert(extRes.success === true, '901234 resolves via Tier 3 external geocoder');
  assertEqual(extRes.status, 'partial', '901234 multi-match external response is partial');
  assertEqual(extRes.location?.source_tier, 'external_geocoder', '901234 source_tier is external_geocoder');
  assertEqual(extRes.location?.state, 'Jammu and Kashmir', '901234 state is Jammu and Kashmir');
  assert((extRes.location?.location_candidates?.length ?? 0) === 2, '901234 returns 2 candidates');

  // Test Non-Existent PIN (999999) with mock returning 0 items
  const nonExistentRes = await resolvePincode('999999', {
    customFetch: mockExternalFetch,
    bypassCache: true,
  });

  assert(nonExistentRes.success === false, '999999 returns failure');
  assertEqual(nonExistentRes.status, 'error', '999999 status is error');
  assertEqual(nonExistentRes.error?.code, 'PINCODE_NOT_FOUND', '999999 error code is PINCODE_NOT_FOUND');
  assertEqual(nonExistentRes.error?.retryable, false, '999999 is not retryable');

  // ----------------------------------------------------
  // Suite 6: In-Memory LRU Cache & Latency Guarantee
  // ----------------------------------------------------
  console.log('\nSuite 6: In-Memory LRU Cache & Latency Guarantee');
  clearGeocodingCache();

  // First resolution (cache miss)
  const startMiss = performance.now();
  await resolvePincode('110011');
  const missLatency = performance.now() - startMiss;
  console.log(`    First lookup (miss + populate) latency: ${missLatency.toFixed(2)}ms`);

  // Subsequent 100 cached lookups (SLA: <=100ms total, actual < 1ms per lookup)
  const start100 = performance.now();
  for (let i = 0; i < 100; i++) {
    const res = await resolvePincode('110011');
    if (!res.success) {
      assert(false, 'Cached lookup failed');
    }
  }
  const total100Latency = performance.now() - start100;
  const avgLatency = total100Latency / 100;
  console.log(`    100 cached lookups total latency: ${total100Latency.toFixed(2)}ms (avg: ${avgLatency.toFixed(3)}ms/req)`);

  assert(total100Latency < 100, `100 cached lookups took ${total100Latency.toFixed(2)}ms (Guaranteed <=100ms SLA)`);
  assert(avgLatency < 1.0, `Average cached lookup latency is ${avgLatency.toFixed(3)}ms (< 1ms)`);

  const stats = getGeocodingCacheStats();
  assert(stats.hits >= 100, `Cache hits tracked correctly (${stats.hits} hits)`);
  assert(stats.hitRatio > 0.95, `Cache hit ratio is high (${(stats.hitRatio * 100).toFixed(1)}%)`);

  // Test custom LRU cache eviction
  const miniCache = new LRUCache<string, string>(3, 10000);
  miniCache.set('a', '1');
  miniCache.set('b', '2');
  miniCache.set('c', '3');
  // Access 'a' to make 'b' the oldest
  miniCache.get('a');
  // Insert 'd', should evict 'b'
  miniCache.set('d', '4');

  assertEqual(miniCache.get('b'), undefined, 'LRU cache evicted oldest key "b"');
  assertEqual(miniCache.get('a'), '1', 'Key "a" retained in cache');
  assertEqual(miniCache.get('c'), '3', 'Key "c" retained in cache');
  assertEqual(miniCache.get('d'), '4', 'Key "d" present in cache');

  // Test custom LRU TTL expiry
  const ttlCache = new LRUCache<string, string>(10, 50); // 50ms TTL
  ttlCache.set('temp', 'val', 50);
  assertEqual(ttlCache.get('temp'), 'val', 'Key exists before TTL expiry');
  await new Promise((resolve) => setTimeout(resolve, 60));
  assertEqual(ttlCache.get('temp'), undefined, 'Key expired after TTL');

  // ----------------------------------------------------
  // Suite 7: Address Parser Utility
  // ----------------------------------------------------
  console.log('\nSuite 7: Address Parser Utility');

  const addr1 = parseAddressFromLocationName('Central Secretariat / Janpath, New Delhi', '110011');
  assertEqual(addr1.area, 'Central Secretariat / Janpath', 'addr1 area parsed');
  assertEqual(addr1.city, 'New Delhi', 'addr1 city parsed');
  assertEqual(addr1.state, 'Delhi', 'addr1 state parsed');

  const addr2 = parseAddressFromLocationName('Egmore, Chennai, Tamil Nadu', '600008');
  assertEqual(addr2.area, 'Egmore', 'addr2 area parsed');
  assertEqual(addr2.city, 'Chennai', 'addr2 city parsed');
  assertEqual(addr2.state, 'Tamil Nadu', 'addr2 state parsed');

  const addr3 = parseAddressFromLocationName('Kala Ghoda, Fort, Mumbai, Maharashtra', '400023');
  assertEqual(addr3.area, 'Kala Ghoda, Fort', 'addr3 area parsed');
  assertEqual(addr3.city, 'Mumbai', 'addr3 city parsed');
  assertEqual(addr3.state, 'Maharashtra', 'addr3 state parsed');

  // ----------------------------------------------------
  // Final Summary
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error running unit test suite:', err);
  process.exit(1);
});
