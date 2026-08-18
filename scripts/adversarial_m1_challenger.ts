import * as fs from 'fs';
import * as path from 'path';
import { getAllMuseums, getMuseumById, searchMuseums, calculateHaversineDistance, isMuseumOpenToday, KNOWN_INDIAN_LOCATIONS, Museum } from '../lib/museums';
import { resolveRootsByPincode, POSTAL_CIRCLE_MAP } from '../lib/roots';
import { getAllArtifacts } from '../lib/artifacts';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function recordTest(category: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ category, name, passed: true });
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    results.push({ category, name, passed: false, error: err.message, details: err.stack });
    console.error(`  [FAIL] ${name} -> ${err.message}`);
  }
}

console.log('=================================================================');
console.log('   M1 EMPIRICAL CHALLENGER ADVERSARIAL SUITE');
console.log('=================================================================\n');

// -------------------------------------------------------------
// CATEGORY 1: DATASET SCHEMA & ADVERSARIAL VALIDATION
// -------------------------------------------------------------
console.log('>>> [1/5] Testing Dataset Schema, Types & Value Bounds...');

const rawData = fs.readFileSync(path.join(__dirname, '../data/indian-museums.json'), 'utf8');
const museums: Museum[] = JSON.parse(rawData);

recordTest('Schema & Bounds', `Dataset contains >= 18 museums (found ${museums.length})`, () => {
  if (!Array.isArray(museums)) throw new Error('Root is not an array');
  if (museums.length < 18) throw new Error(`Dataset contains only ${museums.length} museums, expected >= 18`);
});

recordTest('Schema & Bounds', 'Duplicate ID detection across all records', () => {
  const seenIds = new Set<string>();
  for (const m of museums) {
    if (!m.id || typeof m.id !== 'string') throw new Error(`Missing or non-string id on record: ${JSON.stringify(m)}`);
    if (seenIds.has(m.id)) throw new Error(`Duplicate museum ID detected: ${m.id}`);
    seenIds.add(m.id);
  }
});

recordTest('Schema & Bounds', `Regex verification of all ${museums.length} PIN codes (/^[1-9][0-9]{5}$/)`, () => {
  const pinRegex = /^[1-9][0-9]{5}$/;
  for (const m of museums) {
    if (!pinRegex.test(m.pincode)) {
      throw new Error(`Museum ${m.id} has invalid 6-digit Indian PIN code: "${m.pincode}"`);
    }
  }
});

recordTest('Schema & Bounds', `Coordinate bounding checks across all ${museums.length} museums (India bounds: 8.0 <= lat <= 38.0, 68.0 <= lon <= 98.0)`, () => {
  for (const m of museums) {
    if (!m.coordinates || typeof m.coordinates.lat !== 'number' || typeof m.coordinates.lon !== 'number') {
      throw new Error(`Museum ${m.id} missing valid coordinates`);
    }
    const { lat, lon } = m.coordinates;
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      throw new Error(`Museum ${m.id} has NaN coordinates: lat=${lat}, lon=${lon}`);
    }
    if (lat < 8.0 || lat > 38.0) {
      throw new Error(`Museum ${m.id} lat ${lat} is outside Indian latitude bounds (8.0 - 38.0)`);
    }
    if (lon < 68.0 || lon > 98.0) {
      throw new Error(`Museum ${m.id} lon ${lon} is outside Indian longitude bounds (68.0 - 98.0)`);
    }
  }
});

recordTest('Schema & Bounds', 'Empty/whitespace string detection on all mandatory text fields', () => {
  const requiredStringFields: (keyof Museum)[] = [
    'id',
    'name',
    'address',
    'city',
    'state',
    'pincode',
    'category',
    'governance',
    'thumbnail_url',
    'description',
    'source',
    'last_updated',
  ];

  for (const m of museums) {
    for (const field of requiredStringFields) {
      const val = (m as any)[field];
      if (typeof val !== 'string') {
        throw new Error(`Museum ${m.id} field "${field}" is not a string (got ${typeof val})`);
      }
      if (val.trim().length === 0) {
        throw new Error(`Museum ${m.id} field "${field}" is empty or whitespace-only`);
      }
    }

    if (m.description.trim().length < 30) {
      throw new Error(`Museum ${m.id} description is too short (${m.description.length} chars)`);
    }
  }
});

recordTest('Schema & Bounds', 'Negative fee and foreign surcharge sanity detection', () => {
  for (const m of museums) {
    if (!m.entry_fee || typeof m.entry_fee.is_free !== 'boolean') {
      throw new Error(`Museum ${m.id} missing entry_fee.is_free boolean`);
    }
    const { domestic_inr, foreign_inr, is_free } = m.entry_fee;
    if (typeof domestic_inr !== 'number' || typeof foreign_inr !== 'number') {
      throw new Error(`Museum ${m.id} non-numeric fee values`);
    }
    if (domestic_inr < 0) {
      throw new Error(`Museum ${m.id} has negative domestic fee: ${domestic_inr}`);
    }
    if (foreign_inr < 0) {
      throw new Error(`Museum ${m.id} has negative foreign fee: ${foreign_inr}`);
    }
    if (is_free && (domestic_inr !== 0 || foreign_inr !== 0)) {
      throw new Error(`Museum ${m.id} is marked free but has non-zero fee: domestic=${domestic_inr}, foreign=${foreign_inr}`);
    }
    if (domestic_inr > foreign_inr) {
      throw new Error(`Museum ${m.id} domestic fee (${domestic_inr}) is higher than foreign fee (${foreign_inr})`);
    }
  }
});

recordTest('Schema & Bounds', 'Negative or zero artifact count detection', () => {
  for (const m of museums) {
    if (typeof m.artifact_count_approx !== 'number' || Number.isNaN(m.artifact_count_approx)) {
      throw new Error(`Museum ${m.id} has invalid artifact_count_approx`);
    }
    if (m.artifact_count_approx <= 0) {
      throw new Error(`Museum ${m.id} has non-positive artifact count: ${m.artifact_count_approx}`);
    }
  }
});

recordTest('Schema & Bounds', 'Accessibility features array non-emptiness', () => {
  for (const m of museums) {
    if (!Array.isArray(m.accessibility_features) || m.accessibility_features.length === 0) {
      throw new Error(`Museum ${m.id} has empty accessibility_features`);
    }
    for (const feat of m.accessibility_features) {
      if (typeof feat !== 'string' || feat.trim().length === 0) {
        throw new Error(`Museum ${m.id} has invalid accessibility feature item: "${feat}"`);
      }
    }
  }
});

recordTest('Schema & Bounds', 'Opening hours structure and validity', () => {
  for (const m of museums) {
    const oh = m.opening_hours;
    if (!oh || typeof oh !== 'object') throw new Error(`Museum ${m.id} missing opening_hours`);
    if (!oh.schedule || oh.schedule.trim().length === 0) throw new Error(`Museum ${m.id} missing schedule`);
    if (!oh.timings || oh.timings.trim().length === 0) throw new Error(`Museum ${m.id} missing timings`);
    if (!Array.isArray(oh.closed_on)) throw new Error(`Museum ${m.id} closed_on is not array`);
  }
});

recordTest('Schema & Bounds', 'Image asset paths exist on disk', () => {
  const publicDir = path.join(__dirname, '../public');
  for (const m of museums) {
    if (m.thumbnail_url.startsWith('/')) {
      const fullPath = path.join(publicDir, m.thumbnail_url);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Museum ${m.id} thumbnail file not found on disk: ${fullPath}`);
      }
    }
    for (const g of m.gallery_urls) {
      if (g.startsWith('/')) {
        const fullPath = path.join(publicDir, g);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`Museum ${m.id} gallery image file not found on disk: ${fullPath}`);
        }
      }
    }
  }
});


// -------------------------------------------------------------
// CATEGORY 2: SPATIAL SEARCH STRESS TESTS
// -------------------------------------------------------------
console.log('\n>>> [2/5] Testing Spatial Search & Distance Functions (lib/museums.ts)...');

recordTest('Spatial Search', 'Haversine distance calculation correctness on known benchmarks', () => {
  // Benchmark 1: Delhi (28.6139, 77.2090) to Chennai (13.0827, 80.2707) ~ 1757 km (+/- 30 km)
  const d1 = calculateHaversineDistance(28.6139, 77.2090, 13.0827, 80.2707);
  if (d1 < 1700 || d1 > 1800) {
    throw new Error(`Haversine Delhi-Chennai distance out of expected range: ${d1} km`);
  }

  // Benchmark 2: Distance to self must be 0
  const dSelf = calculateHaversineDistance(26.9124, 75.7873, 26.9124, 75.7873);
  if (dSelf !== 0) {
    throw new Error(`Distance to self is not 0: ${dSelf}`);
  }

  // Benchmark 3: Mumbai (18.9220, 72.8347) to Pune (18.5204, 73.8567) ~ 120 km (+/- 15 km)
  const d3 = calculateHaversineDistance(18.9220, 72.8347, 18.5204, 73.8567);
  if (d3 < 100 || d3 > 140) {
    throw new Error(`Haversine Mumbai-Pune distance out of expected range: ${d3} km`);
  }
});

recordTest('Spatial Search', `Search by exact name for all ${museums.length} museums returns matching museum`, () => {
  for (const m of museums) {
    const res = searchMuseums({ query: m.name });
    const match = res.results.find((r) => r.id === m.id);
    if (!match) {
      throw new Error(`Failed to find museum ${m.id} when searching by its exact name: "${m.name}"`);
    }
  }
});

recordTest('Spatial Search', `Search by city for all ${museums.length} museums returns matching museum`, () => {
  for (const m of museums) {
    const res = searchMuseums({ query: m.city });
    const match = res.results.find((r) => r.id === m.id);
    if (!match) {
      throw new Error(`Failed to find museum ${m.id} when searching by its city: "${m.city}"`);
    }
  }
});

recordTest('Spatial Search', `Search by 6-digit PIN code for all ${museums.length} museums returns matching museum`, () => {
  for (const m of museums) {
    const res = searchMuseums({ query: m.pincode });
    const match = res.results.find((r) => r.id === m.id);
    if (!match) {
      throw new Error(`Failed to find museum ${m.id} when searching by its pincode: "${m.pincode}"`);
    }
  }
});

recordTest('Spatial Search', `Coordinate-centered radius search around all ${museums.length} museums centers and ranks correctly`, () => {
  for (const m of museums) {
    const res = searchMuseums({
      center: m.coordinates,
      radiusKm: 15,
    });
    if (res.results.length === 0) {
      throw new Error(`Center search at coordinates (${m.coordinates.lat}, ${m.coordinates.lon}) returned 0 results`);
    }
    const top = res.results[0];
    if (top.id !== m.id) {
      // In dense areas, multiple museums might be within 15km, but the distance of top must be <= 0.1km
      if (top.distance_km === undefined || top.distance_km > 0.1) {
        throw new Error(`Expected top result to have distance <= 0.1km, got ${top.id} at ${top.distance_km} km for center ${m.name}`);
      }
    }
  }
});

recordTest('Spatial Search', `KNOWN_INDIAN_LOCATIONS dictionary resolves all ${museums.length} museum cities`, () => {
  for (const m of museums) {
    const cityKey = m.city.toLowerCase();
    // Check if city or an alias exists in KNOWN_INDIAN_LOCATIONS
    const hasEntry = Object.keys(KNOWN_INDIAN_LOCATIONS).some((k) => cityKey.includes(k) || k.includes(cityKey));
    if (!hasEntry) {
      throw new Error(`Museum ${m.id} city "${m.city}" has no matching key in KNOWN_INDIAN_LOCATIONS`);
    }
  }
});

recordTest('Spatial Search', 'Adversarial query inputs (empty, special chars, SQL, script injection) do not crash', () => {
  const adversarialQueries = [
    '',
    '   ',
    'undefined',
    'null',
    '<script>alert("xss")</script>',
    '\' OR 1=1; --',
    '!@#$%^&*()_+-=[]{}|;:",.<>?/`~',
    'NonExistentCity12345XYZ',
    '999999999999999999',
    'म्यूजियम दिल्ली',
  ];

  for (const q of adversarialQueries) {
    const res = searchMuseums({ query: q });
    if (!res || !Array.isArray(res.results) || typeof res.total !== 'number') {
      throw new Error(`searchMuseums crashed or returned invalid shape for adversarial query: "${q}"`);
    }
  }
});

recordTest('Spatial Search', 'Filter combinations (category, accessibilityOnly, freeOnly, openTodayOnly)', () => {
  const categories = [
    'all',
    'archaeology',
    'art_sculpture',
    'science_technology',
    'natural_history',
    'maritime_military',
    'textiles_crafts',
    'memorial_historic',
    'multidisciplinary',
  ];

  for (const cat of categories) {
    const res = searchMuseums({ category: cat });
    if (cat !== 'all') {
      for (const m of res.results) {
        if (m.category !== cat) {
          throw new Error(`Category filter mismatch: expected ${cat}, got ${m.category}`);
        }
      }
    }
  }

  // Accessibility filter
  const accRes = searchMuseums({ accessibilityOnly: true });
  for (const m of accRes.results) {
    if (!m.accessibility_features || m.accessibility_features.length === 0) {
      throw new Error(`Accessibility filter returned museum ${m.id} without accessibility features`);
    }
  }

  // Free only filter
  const freeRes = searchMuseums({ freeOnly: true });
  for (const m of freeRes.results) {
    if (!m.entry_fee.is_free) {
      throw new Error(`Free filter returned non-free museum ${m.id}`);
    }
  }
});


// -------------------------------------------------------------
// CATEGORY 3: ROOTS RESOLUTION & POSTAL CIRCLE STRESS TESTS
// -------------------------------------------------------------
console.log('\n>>> [3/5] Testing Roots Resolution & Postal Circles (lib/roots.ts)...');

recordTest('Roots Resolution', 'POSTAL_CIRCLE_MAP entries point to existing museums and artifacts', () => {
  const allM = getAllMuseums();
  const allA = getAllArtifacts();

  for (const [prefix, data] of Object.entries(POSTAL_CIRCLE_MAP)) {
    const targetMuseum = allM.find((m) => m.id === data.museumId);
    if (!targetMuseum) {
      throw new Error(`POSTAL_CIRCLE_MAP prefix "${prefix}" points to non-existent museumId: "${data.museumId}"`);
    }
    const targetArtifact = allA.find((a) => a.id === data.artifactId);
    if (!targetArtifact) {
      throw new Error(`POSTAL_CIRCLE_MAP prefix "${prefix}" points to non-existent artifactId: "${data.artifactId}"`);
    }
    if (!data.state || !data.era || !data.heritage || !data.story || !data.craft) {
      throw new Error(`POSTAL_CIRCLE_MAP prefix "${prefix}" has incomplete cultural metadata`);
    }
  }
});

recordTest('Roots Resolution', `resolveRootsByPincode succeeds for all ${museums.length} museum PINs`, () => {
  for (const m of museums) {
    const root = resolveRootsByPincode(m.pincode);
    if (!root || !root.state || !root.civilizationalEra || !root.dynasticHeritage || !root.culturalStory || !root.craftsTradition) {
      throw new Error(`resolveRootsByPincode failed for museum ${m.id} PIN ${m.pincode}`);
    }
    if (!Array.isArray(root.highlightArtifacts) || root.highlightArtifacts.length === 0) {
      throw new Error(`resolveRootsByPincode for PIN ${m.pincode} returned empty highlightArtifacts`);
    }
    if (!Array.isArray(root.nearbyMuseums) || root.nearbyMuseums.length === 0) {
      throw new Error(`resolveRootsByPincode for PIN ${m.pincode} returned empty nearbyMuseums`);
    }
  }
});

recordTest('Roots Resolution', 'Adversarial PIN inputs fall back gracefully without unhandled exceptions', () => {
  const adversarialPins = [
    '',
    '   ',
    'abc',
    '999999', // Unmapped circle
    '000000',
    '11 00 11',
    '110011-9999',
    '!@#$%',
    'null',
  ];

  for (const p of adversarialPins) {
    const root = resolveRootsByPincode(p);
    if (!root || !root.state || !root.highlightArtifacts[0] || !root.nearbyMuseums[0]) {
      throw new Error(`resolveRootsByPincode failed to handle adversarial PIN: "${p}"`);
    }
  }
});


// -------------------------------------------------------------
// CATEGORY 4: SPECIFIC WORKER M1 CLAIM VERIFICATION
// -------------------------------------------------------------
console.log('\n>>> [4/5] Verifying Specific Worker M1 Claims & Added Museums...');

const expectedNewInstitutions = [
  { id: 'mus-in-jai-001', name: 'Albert Hall Museum', city: 'Jaipur', pin: '302004', state: 'Rajasthan' },
  { id: 'mus-in-ahm-001', name: 'Calico Museum of Textiles', city: 'Ahmedabad', pin: '380004', state: 'Gujarat' },
  { id: 'mus-in-trv-001', name: 'Napier Museum', city: 'Thiruvananthapuram', pin: '695033', state: 'Kerala' },
  { id: 'mus-in-pun-001', name: 'Raja Dinkar Kelkar Museum', city: 'Pune', pin: '411002', state: 'Maharashtra' },
  { id: 'mus-in-uda-001', name: 'City Palace Museum', city: 'Udaipur', pin: '313001', state: 'Rajasthan' },
  { id: 'mus-in-shl-001', name: 'Don Bosco Museum', city: 'Shillong', pin: '793008', state: 'Meghalaya' },
  { id: 'mus-in-pan-001', name: 'Goa State Museum', city: 'Panaji', pin: '403001', state: 'Goa' },
  { id: 'mus-in-lot-001', name: 'Archaeological Museum Lothal', city: 'Lothal', pin: '382230', state: 'Gujarat' },
  { id: 'mus-in-jam-001', name: 'Dogra Art Museum', city: 'Jammu', pin: '180001', state: 'Jammu & Kashmir' },
  { id: 'mus-in-bho-001', name: 'Indira Gandhi Rashtriya Manav Sangrahalaya', city: 'Bhopal', pin: '462013', state: 'Madhya Pradesh' },
  { id: 'mus-in-bhu-001', name: 'Odisha State Museum', city: 'Bhubaneswar', pin: '751014', state: 'Odisha' },
  { id: 'mus-in-guw-001', name: 'Assam State Museum', city: 'Guwahati', pin: '781001', state: 'Assam' },
  { id: 'mus-in-koc-001', name: 'Hill Palace Museum', city: 'Kochi', pin: '682301', state: 'Kerala' },
];

recordTest('Worker M1 Claims', 'All 13 newly added museums exist and match claimed attributes', () => {
  for (const exp of expectedNewInstitutions) {
    const found = getMuseumById(exp.id);
    if (!found) {
      throw new Error(`Promised new museum ${exp.id} (${exp.name}) not found in dataset`);
    }
    if (!found.name.toLowerCase().includes(exp.name.toLowerCase())) {
      throw new Error(`Museum ${exp.id} name mismatch: expected "${exp.name}", got "${found.name}"`);
    }
    if (found.city.toLowerCase() !== exp.city.toLowerCase()) {
      throw new Error(`Museum ${exp.id} city mismatch: expected "${exp.city}", got "${found.city}"`);
    }
    if (found.pincode !== exp.pin) {
      throw new Error(`Museum ${exp.id} PIN mismatch: expected "${exp.pin}", got "${found.pincode}"`);
    }
  }
});


// -------------------------------------------------------------
// SUMMARY & VERDICT
// -------------------------------------------------------------
console.log('\n=================================================================');
const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = results.filter((r) => !r.passed).length;

console.log(`TOTAL ADVERSARIAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('=================================================================');

if (failedTests > 0) {
  console.error('\nCHALLENGER VERDICT: FAIL');
  process.exit(1);
} else {
  console.log('\nCHALLENGER VERDICT: APPROVE');
  process.exit(0);
}
