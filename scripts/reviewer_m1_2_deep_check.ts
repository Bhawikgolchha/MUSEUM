import * as fs from 'fs';
import * as path from 'path';
import {
  getAllMuseums,
  getMuseumById,
  searchMuseums,
  calculateHaversineDistance,
  isMuseumOpenToday,
  findNearestMuseumForPincode,
  POSTAL_PREFIX_CENTROIDS,
  KNOWN_INDIAN_LOCATIONS,
  Museum,
} from '../lib/museums';

console.log('========================================================================');
console.log('    REVIEWER_M1_2: INDEPENDENT GEOSPATIAL & INTEGRITY AUDIT');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function check(title: string, condition: boolean, message?: string) {
  if (condition) {
    passCount++;
    console.log(`[PASS] ${title}`);
  } else {
    failCount++;
    console.error(`[FAIL] ${title} --> ${message || 'Assertion failed'}`);
  }
}

// 1. DATASET GEOSPATIAL BOUNDS & REAL-WORLD ACCURACY
console.log('--- 1. Verification of 21 Museums Geospatial Accuracy ---');
const museums = getAllMuseums();
check('Museum count >= 18 (R2 requirement)', museums.length >= 18, `Got ${museums.length}`);
check('Museum count is 21', museums.length === 21, `Got ${museums.length}`);

// Real reference coordinate anchors for the 21 institutions
const realAnchors: Record<string, { lat: number; lon: number; state: string; pinPrefix: string }> = {
  'mus-in-del-001': { lat: 28.6118, lon: 77.2193, state: 'Delhi', pinPrefix: '11' },
  'mus-in-che-001': { lat: 13.0694, lon: 80.2569, state: 'Tamil Nadu', pinPrefix: '60' },
  'mus-in-pat-001': { lat: 25.6093, lon: 85.1235, state: 'Bihar', pinPrefix: '80' },
  'mus-in-sar-001': { lat: 25.3811, lon: 83.0227, state: 'Uttar Pradesh', pinPrefix: '22' },
  'mus-in-kol-001': { lat: 22.5579, lon: 88.3511, state: 'West Bengal', pinPrefix: '70' },
  'mus-in-mum-001': { lat: 18.9268, lon: 72.8327, state: 'Maharashtra', pinPrefix: '40' },
  'mus-in-blr-001': { lat: 12.9752, lon: 77.5963, state: 'Karnataka', pinPrefix: '56' },
  'mus-in-hyd-001': { lat: 17.3713, lon: 78.4804, state: 'Telangana', pinPrefix: '50' },
  'mus-in-jai-001': { lat: 26.9116, lon: 75.8195, state: 'Rajasthan', pinPrefix: '30' },
  'mus-in-ahm-001': { lat: 23.0573, lon: 72.5937, state: 'Gujarat', pinPrefix: '38' },
  'mus-in-trv-001': { lat: 8.5089, lon: 76.9554, state: 'Kerala', pinPrefix: '69' },
  'mus-in-pun-001': { lat: 18.5113, lon: 73.8542, state: 'Maharashtra', pinPrefix: '41' },
  'mus-in-uda-001': { lat: 24.5764, lon: 73.6835, state: 'Rajasthan', pinPrefix: '31' },
  'mus-in-shl-001': { lat: 25.5947, lon: 91.8906, state: 'Meghalaya', pinPrefix: '79' },
  'mus-in-pan-001': { lat: 15.4989, lon: 73.8278, state: 'Goa', pinPrefix: '40' },
  'mus-in-lot-001': { lat: 22.5222, lon: 72.2494, state: 'Gujarat', pinPrefix: '38' },
  'mus-in-jam-001': { lat: 32.7412, lon: 74.8717, state: 'Jammu & Kashmir', pinPrefix: '18' },
  'mus-in-bho-001': { lat: 23.2312, lon: 77.3860, state: 'Madhya Pradesh', pinPrefix: '46' },
  'mus-in-bhu-001': { lat: 20.2546, lon: 85.8390, state: 'Odisha', pinPrefix: '75' },
  'mus-in-guw-001': { lat: 26.1866, lon: 91.7516, state: 'Assam', pinPrefix: '78' },
  'mus-in-koc-001': { lat: 9.9529, lon: 76.3639, state: 'Kerala', pinPrefix: '68' },
};

for (const m of museums) {
  const { lat, lon } = m.coordinates;
  check(
    `Museum ${m.id} coordinates in bounds (lat: 8-38, lon: 68-98)`,
    lat >= 8.0 && lat <= 38.0 && lon >= 68.0 && lon <= 98.0,
    `Coordinates (${lat}, ${lon}) out of bounds`
  );

  const anchor = realAnchors[m.id];
  if (anchor) {
    const d = calculateHaversineDistance(lat, lon, anchor.lat, anchor.lon);
    check(`Museum ${m.id} matches reference location within 2 km (distance: ${d} km)`, d <= 2.0, `Distance ${d} km is too far`);
    check(
      `Museum ${m.id} PIN code prefix matches expected postal circle (${anchor.pinPrefix})`,
      m.pincode.startsWith(anchor.pinPrefix),
      `PIN ${m.pincode} does not start with ${anchor.pinPrefix}`
    );
  }
}

// 2. CHECK POSTAL_PREFIX_CENTROIDS BOUNDS & INTEGRITY
console.log('\n--- 2. Verification of POSTAL_PREFIX_CENTROIDS ---');
const centroidKeys = Object.keys(POSTAL_PREFIX_CENTROIDS);
check('POSTAL_PREFIX_CENTROIDS has >= 30 major circles', centroidKeys.length >= 30, `Found ${centroidKeys.length}`);

for (const [prefix, centroid] of Object.entries(POSTAL_PREFIX_CENTROIDS)) {
  check(
    `Centroid prefix "${prefix}" (${centroid.regionName}) within India bounds`,
    centroid.lat >= 8.0 && centroid.lat <= 38.0 && centroid.lon >= 68.0 && centroid.lon <= 98.0,
    `Centroid (${centroid.lat}, ${centroid.lon}) out of bounds`
  );
  check(
    `Centroid prefix "${prefix}" has valid regionName and state`,
    Boolean(centroid.regionName && centroid.state && centroid.regionName.trim().length > 0),
    `Incomplete region info for prefix ${prefix}`
  );
}

// 3. CHECK KNOWN_INDIAN_LOCATIONS BOUNDS & ACCURACY
console.log('\n--- 3. Verification of KNOWN_INDIAN_LOCATIONS ---');
for (const [city, coords] of Object.entries(KNOWN_INDIAN_LOCATIONS)) {
  check(
    `City "${city}" coordinates within India bounds`,
    coords.lat >= 8.0 && coords.lat <= 38.0 && coords.lon >= 68.0 && coords.lon <= 98.0,
    `City "${city}" coords (${coords.lat}, ${coords.lon}) out of bounds`
  );
}

// 4. HAVERSINE ACCURACY AND PRECISION CHECKS
console.log('\n--- 4. Haversine Math Verification ---');
// Analytical distance check between New Delhi (28.6139, 77.2090) and Mumbai (18.9220, 72.8347)
// Great-circle Haversine distance is 1165.7 km
const delMumDist = calculateHaversineDistance(28.6139, 77.2090, 18.9220, 72.8347);
check('Haversine Delhi-Mumbai ~ 1165.7 km (+/- 1 km)', Math.abs(delMumDist - 1165.7) <= 1.0, `Got ${delMumDist} km`);

// Distance between Chennai (13.0827, 80.2707) and Kolkata (22.5726, 88.3639)
// Great-circle distance is ~1366 km
const cheKolDist = calculateHaversineDistance(13.0827, 80.2707, 22.5726, 88.3639);
check('Haversine Chennai-Kolkata ~ 1366 km (+/- 15 km)', Math.abs(cheKolDist - 1366) <= 15, `Got ${cheKolDist} km`);

// Distance between identical points is strictly 0
check('Distance identical points is 0', calculateHaversineDistance(15.4989, 73.8278, 15.4989, 73.8278) === 0);

// 5. FUNCTION findNearestMuseumForPincode() STRESS & BEHAVIOR
console.log('\n--- 5. findNearestMuseumForPincode() Deep Tests ---');

// Exact PIN match returns exact museum and distance 0
const exactDelhi = findNearestMuseumForPincode('110011');
check('Exact PIN 110011 returns mus-in-del-001', exactDelhi?.nearestMuseum.id === 'mus-in-del-001');
check('Exact PIN 110011 distanceKm is 0', exactDelhi?.distanceKm === 0);

const exactJaipur = findNearestMuseumForPincode('302004');
check('Exact PIN 302004 returns mus-in-jai-001', exactJaipur?.nearestMuseum.id === 'mus-in-jai-001');
check('Exact PIN 302004 distanceKm is 0', exactJaipur?.distanceKm === 0);

// Unmatched PIN with valid 2-digit prefix (e.g., 302020 - Mansarovar, Jaipur)
const mansarovar = findNearestMuseumForPincode('302020');
check('Mansarovar PIN 302020 resolves nearest museum as Jaipur Albert Hall', mansarovar?.nearestMuseum.id === 'mus-in-jai-001');
check('Mansarovar distance is reasonable (<15 km)', (mansarovar?.distanceKm || 999) < 15);

// Unmatched PIN with unmapped 2-digit prefix falling back to zone (e.g. 599999 -> zone 5 -> South India)
const zone5 = findNearestMuseumForPincode('599999');
check('Zone 5 PIN resolves to a South Indian museum', ['mus-in-blr-001', 'mus-in-hyd-001', 'mus-in-che-001'].includes(zone5?.nearestMuseum.id || ''));

// Adversarial input formats: whitespace trimming, non-digits stripping
const spacedPin = findNearestMuseumForPincode(' 110011 ');
check('findNearestMuseumForPincode handles whitespace around PIN', spacedPin?.nearestMuseum.id === 'mus-in-del-001');

// Performance benchmark: 10,000 queries in < 200ms
const tStart = performance.now();
for (let i = 0; i < 10000; i++) {
  const pin = (110000 + (i % 800000)).toString();
  findNearestMuseumForPincode(pin);
}
const elapsed = performance.now() - tStart;
console.log(`10,000 PIN spatial queries executed in: ${elapsed.toFixed(2)} ms`);
check('10,000 queries execute under 200ms', elapsed < 200, `Took ${elapsed} ms`);

// 6. INTEGRITY AUDIT (NO CHEATS / NO FACADES)
console.log('\n--- 6. Integrity Audit ---');
const museumsCode = fs.readFileSync(path.join(__dirname, '../lib/museums.ts'), 'utf-8');
check('lib/museums.ts has genuine Haversine trigonometric calculation', museumsCode.includes('Math.sin(dLat / 2)') && museumsCode.includes('Math.atan2'));
check('No hardcoded mock test result bypasses detected in museums.ts', !museumsCode.includes('MOCK_TEST_BYPASS') && !museumsCode.includes('RETURN_FAKE'));

console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log('========================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
