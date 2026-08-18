import * as fs from 'fs';
import * as path from 'path';
import { getAllMuseums, getMuseumById, findNearestMuseumForPincode, calculateHaversineDistance, POSTAL_PREFIX_CENTROIDS, Museum } from '../lib/museums';

interface TestCaseResult {
  suite: string;
  testName: string;
  passed: boolean;
  message?: string;
}

const testResults: TestCaseResult[] = [];

function assert(condition: boolean, suite: string, testName: string, failureMessage: string) {
  if (!condition) {
    testResults.push({ suite, testName, passed: false, message: failureMessage });
    console.error(`❌ [FAIL] [${suite}] ${testName} --> ${failureMessage}`);
  } else {
    testResults.push({ suite, testName, passed: true });
    console.log(`✅ [PASS] [${suite}] ${testName}`);
  }
}

console.log('========================================================================');
console.log('       CHALLENGER M1.2: EMPIRICAL ADVERSARIAL DATASET AUDIT');
console.log('========================================================================\n');

// Load canonical dataset directly from filesystem
const dataFilePath = path.join(__dirname, '../data/indian-museums.json');
assert(fs.existsSync(dataFilePath), 'Dataset File', 'JSON File Existence', `File missing at ${dataFilePath}`);

const rawJson = fs.readFileSync(dataFilePath, 'utf-8');
let parsedMuseums: Museum[] = [];
try {
  parsedMuseums = JSON.parse(rawJson);
  assert(Array.isArray(parsedMuseums), 'Dataset File', 'JSON Root Array', 'Root of JSON is not an array');
} catch (e: any) {
  assert(false, 'Dataset File', 'JSON Parse Validity', `JSON parse failed: ${e.message}`);
}

const count = parsedMuseums.length;
assert(count === 21, 'Dataset Quantity', 'Exactly 21 Museum Records', `Expected exactly 21 records, found ${count}`);

// ========================================================================
// 1. UNIQUE IDS AND UNIQUE PIN CODES
// ========================================================================
console.log('\n--- 1. Unique IDs & Unique PIN Codes ---');
const seenIds = new Set<string>();
const duplicateIds: string[] = [];
const seenPins = new Set<string>();
const duplicatePins: string[] = [];
const pinRegex = /^[1-9][0-9]{5}$/;

for (const m of parsedMuseums) {
  if (seenIds.has(m.id)) {
    duplicateIds.push(m.id);
  }
  seenIds.add(m.id);

  if (seenPins.has(m.pincode)) {
    duplicatePins.push(m.pincode);
  }
  seenPins.add(m.pincode);

  assert(pinRegex.test(m.pincode), 'PIN Format', `PIN regex validation for ${m.id} (${m.name})`, `Invalid PIN format: "${m.pincode}"`);
}

assert(duplicateIds.length === 0, 'Uniqueness', 'Unique Museum IDs', `Duplicate IDs detected: ${duplicateIds.join(', ')}`);
assert(duplicatePins.length === 0, 'Uniqueness', 'Unique PIN Codes', `Duplicate PIN codes detected: ${duplicatePins.join(', ')}`);
assert(seenIds.size === 21, 'Uniqueness', '21 Unique IDs count', `Found ${seenIds.size} unique IDs`);
assert(seenPins.size === 21, 'Uniqueness', '21 Unique PINs count', `Found ${seenPins.size} unique PINs`);

// ========================================================================
// 2. STRICT LAT/LON BOUNDARY LIMITS WITHIN INDIA (8.0 <= lat <= 38.0, 68.0 <= lon <= 98.0)
// ========================================================================
console.log('\n--- 2. Strict Lat/Lon Geographic Boundary Checks ---');
for (const m of parsedMuseums) {
  const coords = m.coordinates;
  const hasCoords = coords && typeof coords.lat === 'number' && typeof coords.lon === 'number';
  assert(hasCoords, 'Coordinates', `Valid coordinate object for ${m.id}`, `Coordinates missing or invalid type for ${m.id}`);

  if (hasCoords) {
    const latInRange = coords.lat >= 8.0 && coords.lat <= 38.0;
    const lonInRange = coords.lon >= 68.0 && coords.lon <= 98.0;
    assert(latInRange, 'Geographic Bounds', `Latitude within India for ${m.id} (${coords.lat})`, `Latitude ${coords.lat} outside [8.0, 38.0] for ${m.id} (${m.name})`);
    assert(lonInRange, 'Geographic Bounds', `Longitude within India for ${m.id} (${coords.lon})`, `Longitude ${coords.lon} outside [68.0, 98.0] for ${m.id} (${m.name})`);
  }
}

// ========================================================================
// 3. NO EMPTY STRINGS IN REQUIRED FIELDS
// (name, address, city, state, pincode, description, timings, schedule)
// ========================================================================
console.log('\n--- 3. Required String Fields Non-Emptiness ---');
for (const m of parsedMuseums) {
  const checkNonEmpty = (field: string, val: any) => {
    const isValid = typeof val === 'string' && val.trim().length > 0;
    assert(isValid, 'Mandatory Fields', `Non-empty ${field} for ${m.id}`, `${field} is missing, not a string, or empty for ${m.id}`);
  };

  checkNonEmpty('name', m.name);
  checkNonEmpty('address', m.address);
  checkNonEmpty('city', m.city);
  checkNonEmpty('state', m.state);
  checkNonEmpty('pincode', m.pincode);
  checkNonEmpty('description', m.description);
  checkNonEmpty('category', m.category);
  checkNonEmpty('governance', m.governance);
  checkNonEmpty('source', m.source);
  checkNonEmpty('last_updated', m.last_updated);
  checkNonEmpty('thumbnail_url', m.thumbnail_url);

  // Opening hours fields
  assert(m.opening_hours !== undefined && m.opening_hours !== null, 'Opening Hours', `Opening hours exists for ${m.id}`, `opening_hours is null/undefined for ${m.id}`);
  if (m.opening_hours) {
    checkNonEmpty('opening_hours.schedule', m.opening_hours.schedule);
    checkNonEmpty('opening_hours.timings', m.opening_hours.timings);
    assert(Array.isArray(m.opening_hours.closed_on), 'Opening Hours', `closed_on array for ${m.id}`, `closed_on is not an array for ${m.id}`);
  }
}

// ========================================================================
// 4. NON-NEGATIVE NUMERIC TICKET PRICES (domestic_inr >= 0, foreign_inr >= 0)
// ========================================================================
console.log('\n--- 4. Ticket Pricing Sanity ---');
for (const m of parsedMuseums) {
  assert(m.entry_fee !== undefined && m.entry_fee !== null, 'Entry Fee', `Entry fee exists for ${m.id}`, `entry_fee missing for ${m.id}`);
  if (m.entry_fee) {
    const { is_free, domestic_inr, foreign_inr } = m.entry_fee;
    assert(typeof is_free === 'boolean', 'Entry Fee', `is_free is boolean for ${m.id}`, `is_free is not boolean for ${m.id}`);
    assert(typeof domestic_inr === 'number' && !Number.isNaN(domestic_inr), 'Entry Fee', `domestic_inr is valid number for ${m.id}`, `domestic_inr not a number for ${m.id}`);
    assert(typeof foreign_inr === 'number' && !Number.isNaN(foreign_inr), 'Entry Fee', `foreign_inr is valid number for ${m.id}`, `foreign_inr not a number for ${m.id}`);
    
    assert(domestic_inr >= 0, 'Pricing Bounds', `Non-negative domestic fee for ${m.id}`, `domestic_inr is negative (${domestic_inr}) for ${m.id}`);
    assert(foreign_inr >= 0, 'Pricing Bounds', `Non-negative foreign fee for ${m.id}`, `foreign_inr is negative (${foreign_inr}) for ${m.id}`);

    if (is_free) {
      assert(domestic_inr === 0 && foreign_inr === 0, 'Pricing Consistency', `Free museum zero fees for ${m.id}`, `is_free is true but fees are non-zero for ${m.id}`);
    }
  }
}

// ========================================================================
// 5. ACCESSIBILITY FEATURES NON-EMPTY ARRAY
// ========================================================================
console.log('\n--- 5. Accessibility Features ---');
for (const m of parsedMuseums) {
  const hasAcc = Array.isArray(m.accessibility_features) && m.accessibility_features.length > 0;
  assert(hasAcc, 'Accessibility', `Non-empty accessibility features for ${m.id}`, `accessibility_features is empty or not array for ${m.id}`);
  if (Array.isArray(m.accessibility_features)) {
    for (const feat of m.accessibility_features) {
      assert(typeof feat === 'string' && feat.trim().length > 0, 'Accessibility', `Valid accessibility item for ${m.id}`, `accessibility feature contains empty or non-string item for ${m.id}`);
    }
  }
}

// ========================================================================
// 6. POSITIVE ARTIFACT COUNT (> 0)
// ========================================================================
console.log('\n--- 6. Artifact Count Sanity ---');
for (const m of parsedMuseums) {
  const count = m.artifact_count_approx;
  const isPosNum = typeof count === 'number' && !Number.isNaN(count) && count > 0;
  assert(isPosNum, 'Artifact Count', `Positive artifact count for ${m.id}`, `artifact_count_approx is ${count} (expected > 0) for ${m.id}`);
}

// ========================================================================
// 7. ADVERSARIAL GEOSPATIAL & HAVERSINE STRESS TESTS (lib/museums.ts)
// ========================================================================
console.log('\n--- 7. Geospatial Resolver & Stress Testing ---');

// Test direct match PIN
for (const m of parsedMuseums) {
  const res = findNearestMuseumForPincode(m.pincode);
  assert(res !== null, 'Spatial Fallback', `findNearestMuseumForPincode resolves museum PIN ${m.pincode}`, `Null returned for direct PIN ${m.pincode}`);
  if (res) {
    assert(res.nearestMuseum.id === m.id, 'Spatial Fallback', `Direct PIN ${m.pincode} matches ${m.id}`, `Matched ${res.nearestMuseum.id} instead of ${m.id}`);
    assert(res.distanceKm === 0, 'Spatial Fallback', `Direct PIN distance is 0 km`, `Distance was ${res.distanceKm} km for exact PIN`);
  }
}

// Test unmapped PIN (e.g., Gurgaon 122001, Mysore 570001, Shimla 171001, Agartala 799001)
const testPins = [
  { pin: '122001', expectedNearby: 'mus-in-del-001' }, // Gurgaon near Delhi (~24 km)
  { pin: '570001', expectedNearby: 'mus-in-blr-001' }, // Mysore near Bangalore (~129 km)
  { pin: '171001', expectedNearby: 'mus-in-del-001' }, // Shimla is ~277 km from Delhi vs ~283 km from Jammu
  { pin: '799001', expectedNearby: 'mus-in-shl-001' }, // Tripura near Shillong (~226 km)
  { pin: '999999', expectValid: true },               // Extreme unmapped PIN
];

for (const tp of testPins) {
  const res = findNearestMuseumForPincode(tp.pin);
  assert(res !== null, 'Fallback Stress', `Valid fallback for PIN ${tp.pin}`, `Returned null for PIN ${tp.pin}`);
  if (res) {
    assert(res.distanceKm > 0, 'Fallback Stress', `Positive distance for unmatched PIN ${tp.pin}`, `Distance was 0 km for unmatched PIN ${tp.pin}`);
    assert(typeof res.regionName === 'string' && res.regionName.length > 0, 'Fallback Stress', `Region name present for ${tp.pin}`, `Missing region name`);
    if (tp.expectedNearby) {
      assert(res.nearestMuseum.id === tp.expectedNearby, 'Fallback Accuracy', `PIN ${tp.pin} routes to closest regional hub ${tp.expectedNearby}`, `PIN ${tp.pin} routed to ${res.nearestMuseum.id}`);
    }
  }
}

// Test Invalid PIN inputs (Adversarial)
const invalidPins = ['', '12345', '1234567', 'ABCDEF', '-11001', '011001', 'null', 'undefined', '<script>'];
for (const badPin of invalidPins) {
  const res = findNearestMuseumForPincode(badPin);
  assert(res === null, 'Adversarial Input', `Rejection of invalid PIN "${badPin}"`, `Expected null for invalid PIN "${badPin}", got result`);
}

// ========================================================================
// SUMMARY TABLE
// ========================================================================
console.log('\n========================================================================');
const total = testResults.length;
const passed = testResults.filter((t) => t.passed).length;
const failed = testResults.filter((t) => !t.passed).length;

console.log(`TOTAL ADVERSARIAL CHECKS: ${total}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('========================================================================');

if (failed > 0) {
  console.error('\n❌ CHALLENGER FINAL VERDICT: REQUEST_CHANGES');
  process.exit(1);
} else {
  console.log('\n🌟 CHALLENGER FINAL VERDICT: APPROVE');
  process.exit(0);
}
