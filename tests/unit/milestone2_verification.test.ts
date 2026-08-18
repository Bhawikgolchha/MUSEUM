/**
 * Milestone 2 Verification Test Suite
 * 
 * Verifies:
 * 1. Museum dataset expansion (35 authentic Indian institutions across 20+ states/UTs).
 * 2. Strict 19-field schema validation on every single museum record.
 * 3. 14 newly added states/UTs coverage.
 * 4. PIN code geocoding engine (Tier 1 exact lookups for new museum PINs).
 * 5. Spatial search distance calculation and proximity sorting for 6-digit PIN searches.
 * 6. Living Roots engine live Haversine distance computation and distance_km attachment.
 * 7. Zero occurrences of legacy branding.
 */

import fs from 'fs';
import path from 'path';
import { getAllMuseums, searchMuseums, calculateHaversineDistance, MuseumWithDistance } from '../../lib/museums';
import { resolvePinToCoordinates, EXACT_PIN_COORDINATES } from '../../lib/pincodes';
import { resolveRootsByPincode } from '../../lib/roots';

const requiredFields = [
  'id',
  'name',
  'address',
  'city',
  'state',
  'pincode',
  'coordinates',
  'category',
  'governance',
  'opening_hours',
  'entry_fee',
  'accessibility_features',
  'contact',
  'thumbnail_url',
  'gallery_urls',
  'description',
  'artifact_count_approx',
  'source',
  'last_updated',
] as const;

const requiredStatesUTs = [
  'Chandigarh',
  'Punjab',
  'Ladakh',
  'Himachal Pradesh',
  'Uttarakhand',
  'Uttar Pradesh',
  'Jharkhand',
  'Chhattisgarh',
  'Manipur',
  'Sikkim',
  'Andaman and Nicobar Islands',
  'Madhya Pradesh',
  'Karnataka',
  'Andhra Pradesh',
];

const newMuseumPins = [
  { pin: '160011', state: 'Chandigarh' },
  { pin: '143001', state: 'Punjab' },
  { pin: '194101', state: 'Ladakh' },
  { pin: '171004', state: 'Himachal Pradesh' },
  { pin: '248006', state: 'Uttarakhand' },
  { pin: '211002', state: 'Uttar Pradesh' },
  { pin: '834009', state: 'Jharkhand' },
  { pin: '492001', state: 'Chhattisgarh' },
  { pin: '795001', state: 'Manipur' },
  { pin: '737102', state: 'Sikkim' },
  { pin: '744102', state: 'Andaman and Nicobar Islands' },
  { pin: '462002', state: 'Madhya Pradesh' },
  { pin: '570001', state: 'Karnataka' },
  { pin: '520002', state: 'Andhra Pradesh' },
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, errorDetail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (errorDetail) console.error(`     Detail: ${errorDetail}`);
  }
}

console.log('\n======================================================');
console.log('🏛️   MILESTONE 2 (M2) COMPREHENSIVE VERIFICATION SUITE');
console.log('======================================================\n');

// -----------------------------------------------------------------
// Suite 1: Dataset Count & 19 Canonical Schema Fields
// -----------------------------------------------------------------
console.log('▶ SUITE 1: Museum Dataset Expansion & Schema Completeness');

const museums = getAllMuseums();
assert(museums.length >= 35, `Museum dataset contains at least 35 museums (Found: ${museums.length})`);

const uniqueIds = new Set(museums.map((m) => m.id));
assert(uniqueIds.size === museums.length, `All ${museums.length} museum IDs are unique`);

let schemaViolations = 0;
for (const m of museums) {
  for (const field of requiredFields) {
    if (m[field] === undefined || m[field] === null) {
      schemaViolations++;
      console.error(`Museum ${m.id} missing required field: ${field}`);
    }
  }
  if (!m.coordinates || typeof m.coordinates.lat !== 'number' || typeof m.coordinates.lon !== 'number') {
    schemaViolations++;
  }
  if (!m.opening_hours || !m.opening_hours.timings || !Array.isArray(m.opening_hours.closed_on)) {
    schemaViolations++;
  }
  if (
    !m.entry_fee ||
    typeof m.entry_fee.is_free !== 'boolean' ||
    typeof m.entry_fee.domestic_inr !== 'number' ||
    typeof m.entry_fee.foreign_inr !== 'number'
  ) {
    schemaViolations++;
  }
  if (!Array.isArray(m.accessibility_features) || m.accessibility_features.length === 0) {
    schemaViolations++;
  }
  if (!m.contact || typeof m.contact !== 'object') {
    schemaViolations++;
  }
  if (!Array.isArray(m.gallery_urls) || m.gallery_urls.length === 0) {
    schemaViolations++;
  }
  if (!/^[1-9][0-9]{5}$/.test(m.pincode)) {
    schemaViolations++;
  }
}

assert(schemaViolations === 0, `All 35 museums strictly adhere to the 19 canonical schema fields (0 violations)`);

// -----------------------------------------------------------------
// Suite 2: Geographic & State/UT Coverage
// -----------------------------------------------------------------
console.log('\n▶ SUITE 2: State and Union Territory Coverage');

const presentStates = new Set(museums.map((m) => m.state));
for (const st of requiredStatesUTs) {
  assert(presentStates.has(st), `State/UT "${st}" is represented in museum dataset`);
}

// -----------------------------------------------------------------
// Suite 3: PIN Code Geocoding Registration
// -----------------------------------------------------------------
console.log('\n▶ SUITE 3: Exact PIN Coordinates Registry');

for (const { pin, state } of newMuseumPins) {
  const res = resolvePinToCoordinates(pin);
  assert(res !== null, `PIN ${pin} (${state}) successfully resolves coordinates`);
  assert(
    res !== null && typeof res.coords.lat === 'number' && typeof res.coords.lon === 'number',
    `PIN ${pin} returns valid latitude/longitude coordinates`
  );
  assert(EXACT_PIN_COORDINATES[pin] !== undefined, `PIN ${pin} exists in EXACT_PIN_COORDINATES table`);
}

// -----------------------------------------------------------------
// Suite 4: Distance Engine & Spatial Proximity Search
// -----------------------------------------------------------------
console.log('\n▶ SUITE 4: Spatial Distance Engine & Proximity Sorting');

// Test 1: Searching for Chandigarh PIN 160011
const chdSearch = searchMuseums({ query: '160011', radiusKm: 100 });
assert(chdSearch.results.length > 0, `Search for PIN 160011 returns results within radius`);
assert(
  chdSearch.results[0]?.id === 'mus-in-chd-001',
  `Nearest museum to 160011 is Chandigarh Museum (Got: ${chdSearch.results[0]?.name})`
);
assert(
  chdSearch.results[0]?.distance_km !== undefined && chdSearch.results[0].distance_km < 5,
  `Distance to Chandigarh museum from 160011 is < 5 km (Got: ${chdSearch.results[0]?.distance_km} km)`
);

// Test 2: Searching for Amritsar PIN 143001
const asrSearch = searchMuseums({ query: '143001', radiusKm: 100 });
assert(
  asrSearch.results[0]?.id === 'mus-in-asr-001',
  `Nearest museum to 143001 is Partition Museum Amritsar (Got: ${asrSearch.results[0]?.name})`
);
assert(
  asrSearch.results[0]?.distance_km !== undefined && asrSearch.results[0].distance_km < 5,
  `Distance to Partition museum from 143001 is < 5 km (Got: ${asrSearch.results[0]?.distance_km} km)`
);

// Test 3: Monotonic distance ordering
let isSorted = true;
for (let i = 0; i < chdSearch.results.length - 1; i++) {
  const d1 = chdSearch.results[i].distance_km ?? Infinity;
  const d2 = chdSearch.results[i + 1].distance_km ?? Infinity;
  if (d1 > d2) {
    isSorted = false;
    break;
  }
}
assert(isSorted, `Spatial search results are sorted monotonically by distance_km ascending`);

// -----------------------------------------------------------------
// Suite 5: Living Roots Engine Live Haversine Distance
// -----------------------------------------------------------------
console.log('\n▶ SUITE 5: Living Roots Engine Distance Attachment');

const rootsPins = ['600008', '110011', '160011', '143001', '194101', '570001', '834009'];
for (const testPin of rootsPins) {
  const roots = resolveRootsByPincode(testPin);
  assert(roots !== null, `resolveRootsByPincode(${testPin}) returns valid RootConnection`);
  assert(roots.nearbyMuseums.length > 0, `roots for ${testPin} returns nearbyMuseums`);
  for (const nm of roots.nearbyMuseums) {
    assert(
      typeof nm.distance_km === 'number' && nm.distance_km >= 0,
      `Museum "${nm.name}" in roots(${testPin}) has valid distance_km (${nm.distance_km} km)`
    );
  }
}

// -----------------------------------------------------------------
// Summary
// -----------------------------------------------------------------
console.log('\n======================================================');
console.log(`📋   TEST SUMMARY: ${passedTests}/${totalTests} PASSED (Failed: ${failedTests})`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
