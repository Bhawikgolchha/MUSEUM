import {
  getAllMuseums,
  getMuseumById,
  searchMuseums,
  findNearestMuseumForPincode,
  POSTAL_PREFIX_CENTROIDS,
  KNOWN_INDIAN_LOCATIONS,
} from '../lib/museums';
import { resolveRootsByPincode, POSTAL_CIRCLE_MAP } from '../lib/roots';

console.log('Testing M1 Modules Integration...\n');

// 1. Check getAllMuseums
const all = getAllMuseums();
console.log(`1. Total museums loaded: ${all.length}`);
if (all.length !== 21) {
  throw new Error(`Expected 21 museums, got ${all.length}`);
}

// 2. Check getMuseumById
const testIds = [
  'mus-in-del-001',
  'mus-in-jai-001',
  'mus-in-ahm-001',
  'mus-in-trv-001',
  'mus-in-pun-001',
  'mus-in-uda-001',
  'mus-in-shl-001',
  'mus-in-pan-001',
  'mus-in-lot-001',
  'mus-in-jam-001',
  'mus-in-bho-001',
  'mus-in-bhu-001',
  'mus-in-guw-001',
  'mus-in-koc-001',
];

for (const id of testIds) {
  const m = getMuseumById(id);
  if (!m) throw new Error(`Failed to find museum by id: ${id}`);
  console.log(`✓ getMuseumById: ${id} -> ${m.name}`);
}

// 3. Check searchMuseums by City
const cityTests = [
  { q: 'Jaipur', expectedId: 'mus-in-jai-001' },
  { q: 'Ahmedabad', expectedId: 'mus-in-ahm-001' },
  { q: 'Thiruvananthapuram', expectedId: 'mus-in-trv-001' },
  { q: 'Pune', expectedId: 'mus-in-pun-001' },
  { q: 'Udaipur', expectedId: 'mus-in-uda-001' },
  { q: 'Shillong', expectedId: 'mus-in-shl-001' },
  { q: 'Panaji', expectedId: 'mus-in-pan-001' },
  { q: 'Lothal', expectedId: 'mus-in-lot-001' },
  { q: 'Jammu', expectedId: 'mus-in-jam-001' },
  { q: 'Bhopal', expectedId: 'mus-in-bho-001' },
  { q: 'Bhubaneswar', expectedId: 'mus-in-bhu-001' },
  { q: 'Guwahati', expectedId: 'mus-in-guw-001' },
  { q: 'Kochi', expectedId: 'mus-in-koc-001' },
];

for (const { q, expectedId } of cityTests) {
  const res = searchMuseums({ query: q });
  const found = res.results.some((m) => m.id === expectedId);
  if (!found) {
    throw new Error(`Search for "${q}" did not contain expected museum ${expectedId}. Found: ${res.results.map((r) => r.id).join(', ')}`);
  }
  console.log(`✓ searchMuseums ("${q}") -> found ${expectedId} (${res.results.length} total results)`);
}

// 4. Check findNearestMuseumForPincode (Geospatial & Fallback Resolver)
console.log('\n4. Testing findNearestMuseumForPincode...');
const pinTests = [
  { pin: '110011', expectedId: 'mus-in-del-001', maxDistKm: 1 }, // Exact match
  { pin: '682301', expectedId: 'mus-in-koc-001', maxDistKm: 1 }, // Exact match
  { pin: '110001', expectedId: 'mus-in-del-001', maxDistKm: 15 }, // Delhi centroid
  { pin: '302001', expectedId: 'mus-in-jai-001', maxDistKm: 15 }, // Jaipur centroid
  { pin: '380001', expectedId: 'mus-in-ahm-001', maxDistKm: 15 }, // Ahmedabad centroid
  { pin: '411001', expectedId: 'mus-in-pun-001', maxDistKm: 15 }, // Pune centroid
  { pin: '793001', expectedId: 'mus-in-shl-001', maxDistKm: 15 }, // Shillong centroid
];

for (const { pin, expectedId, maxDistKm } of pinTests) {
  const result = findNearestMuseumForPincode(pin);
  if (!result) throw new Error(`findNearestMuseumForPincode returned null for valid PIN ${pin}`);
  if (result.nearestMuseum.id !== expectedId) {
    throw new Error(`PIN ${pin} resolved to ${result.nearestMuseum.id}, expected ${expectedId}`);
  }
  if (result.distanceKm > maxDistKm) {
    throw new Error(`PIN ${pin} distance ${result.distanceKm}km exceeded max ${maxDistKm}km`);
  }
  console.log(`✓ findNearestMuseumForPincode(${pin}) -> ${result.nearestMuseum.name} (${result.distanceKm} km, Region: ${result.regionName})`);
}

// Invalid PIN handling
if (findNearestMuseumForPincode('123') !== null) throw new Error('Failed to reject short PIN');
if (findNearestMuseumForPincode('abcdef') !== null) throw new Error('Failed to reject non-numeric PIN');
if (findNearestMuseumForPincode('012345') !== null) throw new Error('Failed to reject PIN starting with 0');
console.log('✓ Invalid PIN code handling verified (returns null).');

// 5. Check Roots Postal Circle Resolution
console.log('\n5. Testing Roots Postal Circle Resolution...');
const rootTests = [
  { pin: '302004', expectedMuseum: 'mus-in-jai-001', desc: 'Jaipur / Rajasthan' },
  { pin: '380004', expectedMuseum: 'mus-in-ahm-001', desc: 'Ahmedabad / Gujarat' },
  { pin: '695033', expectedMuseum: 'mus-in-trv-001', desc: 'Thiruvananthapuram / Kerala' },
  { pin: '411002', expectedMuseum: 'mus-in-pun-001', desc: 'Pune / Maharashtra' },
  { pin: '313001', expectedMuseum: 'mus-in-uda-001', desc: 'Udaipur / Rajasthan' },
  { pin: '793008', expectedMuseum: 'mus-in-shl-001', desc: 'Shillong / Meghalaya' },
  { pin: '180001', expectedMuseum: 'mus-in-jam-001', desc: 'Jammu / J&K' },
  { pin: '462013', expectedMuseum: 'mus-in-bho-001', desc: 'Bhopal / MP' },
  { pin: '751014', expectedMuseum: 'mus-in-bhu-001', desc: 'Bhubaneswar / Odisha' },
  { pin: '781001', expectedMuseum: 'mus-in-guw-001', desc: 'Guwahati / Assam' },
];

for (const { pin, expectedMuseum, desc } of rootTests) {
  const root = resolveRootsByPincode(pin);
  const foundMuseum = root.nearbyMuseums[0]?.id;
  if (foundMuseum !== expectedMuseum) {
    throw new Error(`Roots for ${pin} (${desc}) expected ${expectedMuseum}, got ${foundMuseum}`);
  }
  console.log(`✓ resolveRootsByPincode (${pin} - ${desc}) -> ${root.state} | Museum: ${foundMuseum}`);
}

console.log('\nALL MODULE INTEGRATION CHECKS PASSED!');
