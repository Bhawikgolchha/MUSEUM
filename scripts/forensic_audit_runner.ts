import { getAllMuseums, getMuseumById, calculateHaversineDistance, isMuseumOpenToday, findNearestMuseumForPincode, searchMuseums, POSTAL_PREFIX_CENTROIDS, KNOWN_INDIAN_LOCATIONS } from '../lib/museums';
import { resolveDeterministicMuseumDoubt } from '../app/api/museum-chat/route';
import { PRESET_DOUBT_CHIPS } from '../components/MuseumDoubtChat';

interface AuditResult {
  check: string;
  passed: boolean;
  details: string;
  evidence?: any;
}

const auditResults: AuditResult[] = [];

function record(check: string, passed: boolean, details: string, evidence?: any) {
  auditResults.push({ check, passed, details, evidence });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${check}]: ${details}`);
}

console.log('====================================================');
console.log('STARTING FINAL FORENSIC INTEGRITY AUDIT');
console.log('====================================================\n');

// ----------------------------------------------------
// 1. DATASET INTEGRITY & AUTHENTICITY AUDIT
// ----------------------------------------------------
const museums = getAllMuseums();
record('Dataset: Total Museum Count', museums.length === 21, `Found ${museums.length} museums (Required: >= 18)`);

// Check unique IDs and unique PIN codes
const ids = new Set<string>();
const duplicateIds: string[] = [];
museums.forEach(m => {
  if (ids.has(m.id)) duplicateIds.push(m.id);
  ids.add(m.id);
});
record('Dataset: Unique IDs', duplicateIds.length === 0, `Duplicate IDs: ${duplicateIds.length ? duplicateIds.join(', ') : 'None'}`);

// Validate all 21 museums schema and coordinate bounds in India
let invalidCoords: string[] = [];
let invalidPins: string[] = [];
let invalidFees: string[] = [];
let invalidTimings: string[] = [];
let invalidAccessibility: string[] = [];
let invalidDescriptions: string[] = [];

// Geographic bounding box for India roughly: Lat [8.0, 37.5], Lon [68.0, 97.5]
museums.forEach(m => {
  if (!m.coordinates || typeof m.coordinates.lat !== 'number' || typeof m.coordinates.lon !== 'number' ||
      m.coordinates.lat < 8.0 || m.coordinates.lat > 37.5 ||
      m.coordinates.lon < 68.0 || m.coordinates.lon > 97.5) {
    invalidCoords.push(`${m.name} (${m.coordinates?.lat}, ${m.coordinates?.lon})`);
  }

  if (!/^[1-9][0-9]{5}$/.test(m.pincode)) {
    invalidPins.push(`${m.name} (PIN: ${m.pincode})`);
  }

  if (!m.entry_fee || typeof m.entry_fee.is_free !== 'boolean' || 
      typeof m.entry_fee.domestic_inr !== 'number' || typeof m.entry_fee.foreign_inr !== 'number' ||
      m.entry_fee.domestic_inr < 0 || m.entry_fee.foreign_inr < 0) {
    invalidFees.push(m.name);
  }

  if (!m.opening_hours || !m.opening_hours.schedule || !m.opening_hours.timings || !Array.isArray(m.opening_hours.closed_on)) {
    invalidTimings.push(m.name);
  }

  if (!Array.isArray(m.accessibility_features) || m.accessibility_features.length === 0) {
    invalidAccessibility.push(m.name);
  }

  if (!m.description || m.description.length < 30) {
    invalidDescriptions.push(m.name);
  }
});

record('Dataset: Coordinates within India', invalidCoords.length === 0, `Invalid coords: ${invalidCoords.length ? invalidCoords.join(', ') : 'None'}`);
record('Dataset: PIN codes valid 6-digit format', invalidPins.length === 0, `Invalid PINs: ${invalidPins.length ? invalidPins.join(', ') : 'None'}`);
record('Dataset: Entry fee schema validity', invalidFees.length === 0, `Invalid fee structures: ${invalidFees.length ? invalidFees.join(', ') : 'None'}`);
record('Dataset: Opening hours schema validity', invalidTimings.length === 0, `Invalid opening hours: ${invalidTimings.length ? invalidTimings.join(', ') : 'None'}`);
record('Dataset: Accessibility features populated', invalidAccessibility.length === 0, `Missing accessibility: ${invalidAccessibility.length ? invalidAccessibility.join(', ') : 'None'}`);
record('Dataset: Curatorial descriptions substantive', invalidDescriptions.length === 0, `Inadequate descriptions: ${invalidDescriptions.length ? invalidDescriptions.join(', ') : 'None'}`);

// ----------------------------------------------------
// 2. MATHEMATICAL & HAVERSINE GEOSPATIAL ENGINE AUDIT
// ----------------------------------------------------
// Check Haversine distance with known ground-truth distances:
// Delhi (28.6139, 77.2090) to Mumbai (18.9220, 72.8347) is ~1148 km
const distDelhiMumbai = calculateHaversineDistance(28.6139, 77.2090, 18.9220, 72.8347);
record('Haversine: Known Distance Test (Delhi -> Mumbai)', Math.abs(distDelhiMumbai - 1148) < 20, `Calculated: ${distDelhiMumbai} km (Expected: ~1148 km)`);

// Chennai (13.0827, 80.2707) to Bengaluru (12.9716, 77.5946) is ~290 km
const distChennaiBlr = calculateHaversineDistance(13.0827, 80.2707, 12.9716, 77.5946);
record('Haversine: Known Distance Test (Chennai -> Bengaluru)', Math.abs(distChennaiBlr - 290) < 15, `Calculated: ${distChennaiBlr} km (Expected: ~290 km)`);

// Same point distance must be 0
const distZero = calculateHaversineDistance(28.6118, 77.2193, 28.6118, 77.2193);
record('Haversine: Zero Distance Test', distZero === 0, `Calculated: ${distZero} km (Expected: 0 km)`);

// ----------------------------------------------------
// 3. PIN CODE CENTROID & FALLBACK RESOLVER AUDIT
// ----------------------------------------------------
// Test exact PIN match for National Museum New Delhi (110011)
const exactMatch = findNearestMuseumForPincode('110011');
record('PIN Fallback: Exact PIN Match', exactMatch !== null && exactMatch.distanceKm === 0 && exactMatch.nearestMuseum.id === 'mus-in-del-001', 
  `Exact PIN 110011 resolved to ${exactMatch?.nearestMuseum.name} with distance ${exactMatch?.distanceKm} km`);

// Test remote unindexed PIN: 194101 (Leh, Ladakh - prefix 194) -> nearest should be Dogra Art Museum Jammu or similar northern museum
const lehFallback = findNearestMuseumForPincode('194101');
record('PIN Fallback: Ladakh Leh PIN (194101)', lehFallback !== null && lehFallback.nearestMuseum.id === 'mus-in-jam-001' && lehFallback.distanceKm > 200,
  `Leh PIN 194101 resolved to ${lehFallback?.nearestMuseum.name} (${lehFallback?.distanceKm} km, Region: ${lehFallback?.regionName})`);

// Test unindexed PIN: 737101 (Sikkim Gangtok - prefix 737) -> nearest should be Don Bosco Shillong or Assam State Museum
const sikkimFallback = findNearestMuseumForPincode('737101');
record('PIN Fallback: Sikkim PIN (737101)', sikkimFallback !== null && (sikkimFallback.nearestMuseum.id === 'mus-in-guw-001' || sikkimFallback.nearestMuseum.id === 'mus-in-shl-001'),
  `Sikkim PIN 737101 resolved to ${sikkimFallback?.nearestMuseum.name} (${sikkimFallback?.distanceKm} km, Region: ${sikkimFallback?.regionName})`);

// Test unindexed PIN: 403002 (Goa) -> nearest should be Goa State Museum
const goaFallback = findNearestMuseumForPincode('403002');
record('PIN Fallback: Goa PIN (403002)', goaFallback !== null && goaFallback.nearestMuseum.id === 'mus-in-pan-001' && goaFallback.distanceKm < 20,
  `Goa PIN 403002 resolved to ${goaFallback?.nearestMuseum.name} (${goaFallback?.distanceKm} km)`);

// Test invalid PIN format: '123' or 'ABCDEF' or '012345'
const invalidPinResult1 = findNearestMuseumForPincode('123');
const invalidPinResult2 = findNearestMuseumForPincode('ABCDEF');
const invalidPinResult3 = findNearestMuseumForPincode('012345');
record('PIN Fallback: Invalid PIN rejection', invalidPinResult1 === null && invalidPinResult2 === null && invalidPinResult3 === null,
  `Invalid PIN queries properly rejected as null`);

// ----------------------------------------------------
// 4. SPATIAL SEARCH ENGINE AUDIT
// ----------------------------------------------------
const delhiSearch = searchMuseums({ query: 'Delhi' });
record('Search: Query "Delhi"', delhiSearch.results.length >= 1 && delhiSearch.results.some(m => m.id === 'mus-in-del-001'),
  `Found ${delhiSearch.results.length} museums for "Delhi"`);

const freeSearch = searchMuseums({ freeOnly: true });
record('Search: Free Only Filter', freeSearch.results.length > 0 && freeSearch.results.every(m => m.entry_fee.is_free),
  `Found ${freeSearch.results.length} free museums (Calico, Goa State Museum, etc.)`);

const accessSearch = searchMuseums({ accessibilityOnly: true });
record('Search: Accessibility Only Filter', accessSearch.results.length === museums.length,
  `Found ${accessSearch.results.length} accessible museums`);

// ----------------------------------------------------
// 5. DETERMINISTIC OFFLINE KNOWLEDGE ENGINE AUDIT
// ----------------------------------------------------
const csmvs = getMuseumById('mus-in-mum-001')!;
const timingsQuery = resolveDeterministicMuseumDoubt(csmvs, 'What are the visiting hours and open days?');
record('Docent Offline: Visiting Hours Grounding', timingsQuery.reply.includes(csmvs.opening_hours.timings) || timingsQuery.reply.includes(csmvs.opening_hours.schedule),
  `Timings query response correctly ground on opening hours: "${timingsQuery.reply.substring(0, 80)}..."`);

const feeQuery = resolveDeterministicMuseumDoubt(csmvs, 'How much are the entry tickets for domestic and foreigners?');
record('Docent Offline: Ticket Fee Grounding', feeQuery.reply.includes('150') && feeQuery.reply.includes('700'),
  `Fee query correctly ground on ₹150 domestic and ₹700 foreign: "${feeQuery.reply.substring(0, 80)}..."`);

const accessQuery = resolveDeterministicMuseumDoubt(csmvs, 'Is wheelchair available for elderly visitors?');
record('Docent Offline: Accessibility Grounding', accessQuery.reply.toLowerCase().includes('wheelchair') || accessQuery.reply.toLowerCase().includes('ramps'),
  `Accessibility query correctly ground on features: "${accessQuery.reply.substring(0, 80)}..."`);

const unknownQuery = resolveDeterministicMuseumDoubt(csmvs, 'What is the cafeteria menu and locker service?');
record('Docent Offline: Unknown Details Graceful Admission', unknownQuery.reply.includes('specific tariff schedules or detailed menus') || unknownQuery.reply.includes('not listed in the official directory'),
  `Unknown query properly admits lack of uncatalogued specifics: "${unknownQuery.reply.substring(0, 80)}..."`);

// ----------------------------------------------------
// 6. PRESET DOUBT CHIPS AUDIT
// ----------------------------------------------------
record('UI: Preset Doubt Chips Count', PRESET_DOUBT_CHIPS.length === 5, `Preset chips count: ${PRESET_DOUBT_CHIPS.length}`);

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
const totalChecks = auditResults.length;
const passedChecks = auditResults.filter(r => r.passed).length;
const failedChecks = auditResults.filter(r => !r.passed).length;

console.log('\n====================================================');
console.log(`AUDIT SUMMARY: ${passedChecks}/${totalChecks} PASSED (${failedChecks} FAILED)`);
console.log('====================================================');

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log('ALL FORENSIC CHECKS PASSED EMPIRICALLY.');
}
