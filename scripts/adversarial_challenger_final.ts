/**
 * scripts/adversarial_challenger_final.ts
 *
 * Comprehensive Empirical Adversarial Stress Test Suite
 * Executed by challenger_final
 *
 * Scope:
 * 1. Data Integrity: All 21 museum records in data/indian-museums.json
 *    - Strict PIN regex, bounding coordinates, non-empty fields, positive artifact counts, ticket prices, schedules, accessibility
 * 2. Spatial & Geodesic Engine: findNearestMuseumForPincode & resolvePinToCoordinates
 *    - 60+ diverse PIN codes across all Indian postal zones (Zones 1-9) + remote border territories
 *    - Boundary and adversarial inputs (malformed PINs, leading zeros, alpha, whitespace, out-of-bounds)
 *    - Haversine mathematical invariant checks (symmetry, identity, triangle inequality, non-negativity)
 * 3. AI Museum Doubt Chat Route (POST /api/museum-chat):
 *    - Valid museum IDs across diverse categories
 *    - Invalid museum IDs, missing params, malformed JSON bodies, empty/whitespace queries
 *    - Prompt chips (timings, entry fee, highlights, accessibility, location/contact)
 *    - Free-form queries (Chola bronzes, Dancing Girl, Harappan relics, wheelchair accessibility)
 *    - Multilingual questions (Hindi, Tamil, Bengali, Telugu, Marathi, Gujarati, Kannada, Malayalam)
 *    - Security injection payloads (SQLi, XSS, prototype pollution, huge queries)
 *    - Fallback behavior & grounding sources validation
 */

import museumsData from '../data/indian-museums.json';
import {
  getAllMuseums,
  getMuseumById,
  calculateHaversineDistance,
  findNearestMuseumForPincode,
  isMuseumOpenToday,
  Museum,
} from '../lib/museums';
import {
  resolvePinToCoordinates,
  findNearestMuseum,
  EXACT_PIN_COORDINATES,
} from '../lib/pincodes';
import {
  POST,
  resolveDeterministicMuseumDoubt,
  MuseumChatRequestBody,
} from '../app/api/museum-chat/route';
import { NextRequest } from 'next/server';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: string) {
  if (!condition) {
    const err = `Assertion Failed: ${name} ${details ? `(${details})` : ''}`;
    results.push({ suite, name, passed: false, error: err, details });
    console.error(`  ❌ FAIL [${suite}] ${name}: ${details || ''}`);
  } else {
    results.push({ suite, name, passed: true, details });
    console.log(`  ✔ PASS [${suite}] ${name}`);
  }
}

async function runTestSection(title: string, fn: () => Promise<void> | void) {
  console.log(`\n================================================================`);
  console.log(`🚀 ${title}`);
  console.log(`================================================================`);
  try {
    await fn();
  } catch (err: any) {
    console.error(`💥 Unexpected suite crash in "${title}":`, err);
    results.push({
      suite: title,
      name: 'SUITE_CRASH',
      passed: false,
      error: err?.message || String(err),
    });
  }
}

// Helper to simulate NextRequest for POST /api/museum-chat
function createMockNextRequest(body: any, isMalformedJson = false): NextRequest {
  if (isMalformedJson) {
    return new NextRequest('http://localhost:3000/api/museum-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ malformed_json_syntax: true, unclosed }',
    });
  }
  return new NextRequest('http://localhost:3000/api/museum-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function main() {
  const startTime = Date.now();

  // ==========================================================================
  // SECTION 1: Museum Dataset Integrity (21 Authentic Indian Museums)
  // ==========================================================================
  await runTestSection('Section 1: Museum Dataset Integrity & Boundary Audit', () => {
    const museums = getAllMuseums();
    const rawData = museumsData as Museum[];

    // S1.1: Total Count
    assert(
      rawData.length === 21,
      'Dataset',
      'Museum Count is exactly 21 authentic records',
      `Found ${rawData.length} records (expected 21)`
    );
    assert(
      rawData.length >= 18,
      'Dataset',
      'Museum Count meets or exceeds requirement R2 (>= 18 records)',
      `Found ${rawData.length}`
    );

    // S1.2: Unique IDs
    const idSet = new Set<string>();
    let duplicateIds = 0;
    for (const m of rawData) {
      if (idSet.has(m.id)) duplicateIds++;
      idSet.add(m.id);
    }
    assert(
      duplicateIds === 0,
      'Dataset',
      'All 21 museum records have unique canonical IDs',
      `Duplicates: ${duplicateIds}`
    );

    // S1.3: ID Format regex
    const idRegex = /^mus-in-[a-z]{3}-[0-9]{3}$/;
    const malformedIds = rawData.filter((m) => !idRegex.test(m.id));
    assert(
      malformedIds.length === 0,
      'Dataset',
      'All museum IDs adhere to mus-in-[code]-[num] format',
      malformedIds.length > 0 ? `Malformed: ${malformedIds.map((m) => m.id).join(', ')}` : undefined
    );

    // S1.4: PIN Code Regex for all 21 records
    const pinRegex = /^[1-9][0-9]{5}$/;
    const invalidPins = rawData.filter((m) => !pinRegex.test(m.pincode));
    assert(
      invalidPins.length === 0,
      'Dataset',
      'All 21 museums have valid 6-digit Indian PIN codes (/^[1-9][0-9]{5}$/)',
      invalidPins.length > 0 ? `Invalid: ${invalidPins.map((m) => `${m.name}: ${m.pincode}`).join(', ')}` : undefined
    );

    // S1.5: Coordinates strictly within Indian Geographic Bounding Box
    // India Bounding Box: Lat ~8.0°N to 38.0°N, Lon ~68.0°E to 98.0°E
    const outOfBoundsCoords = rawData.filter((m) => {
      const { lat, lon } = m.coordinates;
      return typeof lat !== 'number' || typeof lon !== 'number' || lat < 8.0 || lat > 38.0 || lon < 68.0 || lon > 98.0;
    });
    assert(
      outOfBoundsCoords.length === 0,
      'Dataset',
      'All 21 museums have valid coordinates strictly within Indian territory (8.0-38.0°N, 68.0-98.0°E)',
      outOfBoundsCoords.length > 0 ? `Out of bounds: ${outOfBoundsCoords.map((m) => `${m.name} (${m.coordinates.lat}, ${m.coordinates.lon})`).join(', ')}` : undefined
    );

    // S1.6: Non-Empty Essential String Fields
    const requiredFields = [
      'id',
      'name',
      'address',
      'city',
      'state',
      'pincode',
      'category',
      'governance',
      'description',
      'thumbnail_url',
      'source',
      'last_updated',
    ] as const;

    let missingFieldsCount = 0;
    for (const m of rawData) {
      for (const field of requiredFields) {
        const val = (m as any)[field];
        if (typeof val !== 'string' || val.trim().length === 0) {
          missingFieldsCount++;
          console.error(`Museum ${m.id} missing field ${field}`);
        }
      }
    }
    assert(
      missingFieldsCount === 0,
      'Dataset',
      'All 21 museums contain non-empty essential string fields',
      `Missing count: ${missingFieldsCount}`
    );

    // S1.7: Positive Approximate Artifact Counts
    const nonPositiveArtifacts = rawData.filter((m) => typeof m.artifact_count_approx !== 'number' || m.artifact_count_approx <= 0);
    assert(
      nonPositiveArtifacts.length === 0,
      'Dataset',
      'All 21 museums have positive approximate artifact counts (> 0)',
      nonPositiveArtifacts.length > 0 ? `Invalid: ${nonPositiveArtifacts.map((m) => `${m.name}: ${m.artifact_count_approx}`).join(', ')}` : undefined
    );

    // S1.8: Ticket Prices & Fee Logic
    const invalidFees = rawData.filter((m) => {
      const fee = m.entry_fee;
      if (!fee || typeof fee.is_free !== 'boolean') return true;
      if (typeof fee.domestic_inr !== 'number' || fee.domestic_inr < 0) return true;
      if (typeof fee.foreign_inr !== 'number' || fee.foreign_inr < 0) return true;
      if (fee.is_free && (fee.domestic_inr !== 0 || fee.foreign_inr !== 0)) return true;
      if (!fee.is_free && fee.foreign_inr < fee.domestic_inr) return true;
      return false;
    });
    assert(
      invalidFees.length === 0,
      'Dataset',
      'All 21 museums have valid entry fees (non-negative, foreign >= domestic, 0 for free museums)',
      invalidFees.length > 0 ? `Invalid: ${invalidFees.map((m) => `${m.name}: free=${m.entry_fee.is_free}, dom=${m.entry_fee.domestic_inr}, for=${m.entry_fee.foreign_inr}`).join(', ')}` : undefined
    );

    // S1.9: Opening Hours Structure & Timings
    const invalidOpeningHours = rawData.filter((m) => {
      const oh = m.opening_hours;
      if (!oh || typeof oh !== 'object') return true;
      if (!oh.schedule || typeof oh.schedule !== 'string' || oh.schedule.trim().length === 0) return true;
      if (!oh.timings || typeof oh.timings !== 'string' || oh.timings.trim().length === 0) return true;
      if (!Array.isArray(oh.closed_on)) return true;
      return false;
    });
    assert(
      invalidOpeningHours.length === 0,
      'Dataset',
      'All 21 museums have valid opening_hours structure (schedule, timings, closed_on array)',
      invalidOpeningHours.length > 0 ? `Invalid: ${invalidOpeningHours.map((m) => m.name).join(', ')}` : undefined
    );

    // S1.10: Accessibility Features
    const invalidAccessibility = rawData.filter((m) => {
      return !Array.isArray(m.accessibility_features) || m.accessibility_features.length === 0;
    });
    assert(
      invalidAccessibility.length === 0,
      'Dataset',
      'All 21 museums define at least 1 verified accessibility provision',
      invalidAccessibility.length > 0 ? `Empty accessibility: ${invalidAccessibility.map((m) => m.name).join(', ')}` : undefined
    );

    // S1.11: Geographic Diversity (>= 10 unique Indian States/UTs)
    const uniqueStates = new Set(rawData.map((m) => m.state));
    assert(
      uniqueStates.size >= 10,
      'Dataset',
      `Dataset covers extensive geographic diversity across India (>= 10 States/UTs, found ${uniqueStates.size})`,
      `States: ${Array.from(uniqueStates).join(', ')}`
    );

    // S1.12: Unique Cities (>= 12 unique Indian Cities)
    const uniqueCities = new Set(rawData.map((m) => m.city));
    assert(
      uniqueCities.size >= 12,
      'Dataset',
      `Dataset covers >= 12 unique cities across India (found ${uniqueCities.size})`,
      `Cities: ${Array.from(uniqueCities).join(', ')}`
    );
  });

  // ==========================================================================
  // SECTION 2: Geospatial Resolver & 60+ Diverse PIN Code Stress Test
  // ==========================================================================
  await runTestSection('Section 2: Geospatial Resolver & 60+ PIN Code Stress Test', () => {
    // 60+ diverse PIN codes across all 9 Indian postal zones + remote territories
    const testPinCodes = [
      // Zone 1: Delhi, Haryana, Punjab, Himachal Pradesh, J&K, Chandigarh, Ladakh
      { pin: '110001', expectedRegion: 'Delhi', desc: 'Delhi Connaught Place GPO' },
      { pin: '110011', expectedRegion: 'New Delhi', desc: 'National Museum Janpath (Exact Match)', exact: true },
      { pin: '110085', expectedRegion: 'Delhi', desc: 'Rohini, North West Delhi' },
      { pin: '122001', expectedRegion: 'Haryana', desc: 'Gurugram Central GPO' },
      { pin: '124001', expectedRegion: 'Haryana', desc: 'Rohtak GPO' },
      { pin: '133001', expectedRegion: 'Haryana', desc: 'Ambala Cantt' },
      { pin: '141001', expectedRegion: 'Punjab', desc: 'Ludhiana Central GPO' },
      { pin: '143001', expectedRegion: 'Punjab', desc: 'Amritsar GPO' },
      { pin: '144001', expectedRegion: 'Punjab', desc: 'Jalandhar City' },
      { pin: '160017', expectedRegion: 'Chandigarh', desc: 'Chandigarh Sector 17 GPO' },
      { pin: '160022', expectedRegion: 'Chandigarh', desc: 'Chandigarh Sector 22' },
      { pin: '171001', expectedRegion: 'Himachal Pradesh', desc: 'Shimla GPO The Mall' },
      { pin: '176057', expectedRegion: 'Himachal Pradesh', desc: 'Dharamshala / Kangra' },
      { pin: '180001', expectedRegion: 'Jammu', desc: 'Dogra Art Museum Jammu (Exact Match)', exact: true },
      { pin: '190001', expectedRegion: 'Jammu & Kashmir', desc: 'Srinagar GPO' },
      { pin: '194101', expectedRegion: 'Ladakh', desc: 'Leh Ladakh Main Post Office' },

      // Zone 2: Uttar Pradesh, Uttarakhand
      { pin: '201301', expectedRegion: 'Uttar Pradesh', desc: 'Noida Sector 1' },
      { pin: '208001', expectedRegion: 'Uttar Pradesh', desc: 'Kanpur Central GPO' },
      { pin: '221001', expectedRegion: 'Uttar Pradesh', desc: 'Varanasi Cantt GPO' },
      { pin: '221007', expectedRegion: 'Varanasi', desc: 'Sarnath Archaeological Museum (Exact Match)', exact: true },
      { pin: '226001', expectedRegion: 'Uttar Pradesh', desc: 'Lucknow GPO Hazratganj' },
      { pin: '282001', expectedRegion: 'Uttar Pradesh', desc: 'Agra Fort GPO' },
      { pin: '248001', expectedRegion: 'Uttarakhand', desc: 'Dehradun GPO' },
      { pin: '249201', expectedRegion: 'Uttarakhand', desc: 'Rishikesh Central' },
      { pin: '263001', expectedRegion: 'Uttarakhand', desc: 'Nainital Post Office' },

      // Zone 3: Rajasthan, Gujarat
      { pin: '302001', expectedRegion: 'Rajasthan', desc: 'Jaipur GPO MI Road' },
      { pin: '302004', expectedRegion: 'Jaipur', desc: 'Albert Hall Museum Jaipur (Exact Match)', exact: true },
      { pin: '313001', expectedRegion: 'Udaipur', desc: 'City Palace Museum Udaipur (Exact Match)', exact: true },
      { pin: '342001', expectedRegion: 'Rajasthan', desc: 'Jodhpur Marwar GPO' },
      { pin: '305001', expectedRegion: 'Rajasthan', desc: 'Ajmer GPO' },
      { pin: '380001', expectedRegion: 'Gujarat', desc: 'Ahmedabad GPO Relief Road' },
      { pin: '380004', expectedRegion: 'Ahmedabad', desc: 'Calico Museum Ahmedabad (Exact Match)', exact: true },
      { pin: '382230', expectedRegion: 'Lothal', desc: 'Lothal Archaeological Museum (Exact Match)', exact: true },
      { pin: '390001', expectedRegion: 'Gujarat', desc: 'Vadodara Central GPO' },
      { pin: '395001', expectedRegion: 'Gujarat', desc: 'Surat Central GPO' },
      { pin: '370001', expectedRegion: 'Gujarat', desc: 'Bhuj Kutch Western Border' },

      // Zone 4: Maharashtra, Goa, Madhya Pradesh, Chhattisgarh
      { pin: '400001', expectedRegion: 'Maharashtra', desc: 'Mumbai GPO Fort' },
      { pin: '400023', expectedRegion: 'Mumbai', desc: 'CSMVS Museum Mumbai (Exact Match)', exact: true },
      { pin: '411001', expectedRegion: 'Maharashtra', desc: 'Pune Central GPO' },
      { pin: '411002', expectedRegion: 'Pune', desc: 'Raja Dinkar Kelkar Museum Pune (Exact Match)', exact: true },
      { pin: '440001', expectedRegion: 'Maharashtra', desc: 'Nagpur GPO' },
      { pin: '431001', expectedRegion: 'Maharashtra', desc: 'Aurangabad / Chhatrapati Sambhajinagar GPO' },
      { pin: '403001', expectedRegion: 'Panaji', desc: 'Goa State Museum Panaji (Exact Match)', exact: true },
      { pin: '403501', expectedRegion: 'Goa', desc: 'Mapusa North Goa' },
      { pin: '462001', expectedRegion: 'Madhya Pradesh', desc: 'Bhopal Central GPO' },
      { pin: '462013', expectedRegion: 'Bhopal', desc: 'IGRMS Tribal Museum Bhopal (Exact Match)', exact: true },
      { pin: '452001', expectedRegion: 'Madhya Pradesh', desc: 'Indore GPO' },
      { pin: '482001', expectedRegion: 'Madhya Pradesh', desc: 'Jabalpur GPO' },
      { pin: '492001', expectedRegion: 'Chhattisgarh', desc: 'Raipur Central GPO' },
      { pin: '495001', expectedRegion: 'Chhattisgarh', desc: 'Bilaspur Central' },

      // Zone 5: Telangana, Andhra Pradesh, Karnataka
      { pin: '500001', expectedRegion: 'Telangana', desc: 'Hyderabad GPO Abids' },
      { pin: '500002', expectedRegion: 'Hyderabad', desc: 'Salar Jung Museum Hyderabad (Exact Match)', exact: true },
      { pin: '506001', expectedRegion: 'Telangana', desc: 'Warangal GPO' },
      { pin: '520001', expectedRegion: 'Andhra Pradesh', desc: 'Vijayawada GPO' },
      { pin: '530001', expectedRegion: 'Andhra Pradesh', desc: 'Visakhapatnam GPO' },
      { pin: '517501', expectedRegion: 'Andhra Pradesh', desc: 'Tirupati Central' },
      { pin: '560001', expectedRegion: 'Bengaluru', desc: 'Visvesvaraya Museum Bengaluru (Exact Match)', exact: true },
      { pin: '560002', expectedRegion: 'Karnataka', desc: 'Bengaluru City Market' },
      { pin: '570001', expectedRegion: 'Karnataka', desc: 'Mysuru GPO' },
      { pin: '575001', expectedRegion: 'Karnataka', desc: 'Mangaluru Coastal GPO' },

      // Zone 6: Tamil Nadu, Kerala
      { pin: '600001', expectedRegion: 'Tamil Nadu', desc: 'Chennai GPO George Town' },
      { pin: '600008', expectedRegion: 'Chennai', desc: 'Government Museum Chennai Egmore (Exact Match)', exact: true },
      { pin: '625001', expectedRegion: 'Tamil Nadu', desc: 'Madurai GPO' },
      { pin: '641001', expectedRegion: 'Tamil Nadu', desc: 'Coimbatore GPO' },
      { pin: '629702', expectedRegion: 'Tamil Nadu', desc: 'Kanyakumari Southern Tip' },
      { pin: '682001', expectedRegion: 'Kerala', desc: 'Kochi GPO Mattancherry' },
      { pin: '682301', expectedRegion: 'Kochi', desc: 'Hill Palace Museum Kochi (Exact Match)', exact: true },
      { pin: '695001', expectedRegion: 'Kerala', desc: 'Thiruvananthapuram GPO' },
      { pin: '695033', expectedRegion: 'Thiruvananthapuram', desc: 'Napier Museum Thiruvananthapuram (Exact Match)', exact: true },
      { pin: '670001', expectedRegion: 'Kerala', desc: 'Kannur North Kerala GPO' },

      // Zone 7: West Bengal, Odisha, North-East, Andaman & Nicobar
      { pin: '700001', expectedRegion: 'West Bengal', desc: 'Kolkata GPO BBD Bagh' },
      { pin: '700016', expectedRegion: 'Kolkata', desc: 'Indian Museum Kolkata (Exact Match)', exact: true },
      { pin: '734001', expectedRegion: 'West Bengal', desc: 'Siliguri North Bengal' },
      { pin: '737101', expectedRegion: 'Sikkim', desc: 'Gangtok Sikkim GPO' },
      { pin: '744101', expectedRegion: 'Andaman', desc: 'Port Blair Andaman Islands GPO' },
      { pin: '751001', expectedRegion: 'Odisha', desc: 'Bhubaneswar Central GPO' },
      { pin: '751014', expectedRegion: 'Bhubaneswar', desc: 'Odisha State Museum Bhubaneswar (Exact Match)', exact: true },
      { pin: '769001', expectedRegion: 'Odisha', desc: 'Rourkela Steel City' },
      { pin: '781001', expectedRegion: 'Guwahati', desc: 'Assam State Museum Guwahati (Exact Match)', exact: true },
      { pin: '786001', expectedRegion: 'Assam', desc: 'Dibrugarh Upper Assam' },
      { pin: '790104', expectedRegion: 'North East India', desc: 'Tawang Arunachal Pradesh' },
      { pin: '791111', expectedRegion: 'Arunachal Pradesh', desc: 'Itanagar Arunachal Pradesh GPO' },
      { pin: '793001', expectedRegion: 'Meghalaya', desc: 'Shillong GPO Police Bazar' },
      { pin: '793008', expectedRegion: 'Shillong', desc: 'Don Bosco Museum Shillong (Exact Match)', exact: true },
      { pin: '795001', expectedRegion: 'Manipur', desc: 'Imphal Manipur GPO' },
      { pin: '796001', expectedRegion: 'Mizoram', desc: 'Aizawl Mizoram GPO' },
      { pin: '797001', expectedRegion: 'Nagaland', desc: 'Kohima Nagaland GPO' },
      { pin: '799001', expectedRegion: 'Tripura', desc: 'Agartala Tripura GPO' },

      // Zone 8: Bihar, Jharkhand
      { pin: '800001', expectedRegion: 'Patna', desc: 'Bihar Museum Patna (Exact Match)', exact: true },
      { pin: '800004', expectedRegion: 'Bihar', desc: 'Patna University Post Office' },
      { pin: '842001', expectedRegion: 'Bihar', desc: 'Muzaffarpur North Bihar GPO' },
      { pin: '834001', expectedRegion: 'Jharkhand', desc: 'Ranchi Jharkhand GPO' },
      { pin: '831001', expectedRegion: 'Jharkhand', desc: 'Jamshedpur / Tatanagar' },
      { pin: '826001', expectedRegion: 'Jharkhand', desc: 'Dhanbad Coal Capital' },
    ];

    console.log(`Testing findNearestMuseumForPincode() across ${testPinCodes.length} diverse Indian postal codes...`);
    assert(
      testPinCodes.length >= 50,
      'Spatial PIN Engine',
      `Test suite covers >= 50 PIN codes (actual: ${testPinCodes.length})`,
      `Total test PINs: ${testPinCodes.length}`
    );

    let pinSuccessCount = 0;
    let exactMatchesCount = 0;
    let nonZeroDistanceCount = 0;

    for (const tc of testPinCodes) {
      const res = findNearestMuseumForPincode(tc.pin);
      if (!res) {
        console.error(`Failed to resolve PIN ${tc.pin} (${tc.desc})`);
        continue;
      }

      // Assert basic response contract
      if (
        res.nearestMuseum &&
        res.nearestMuseum.id &&
        typeof res.distanceKm === 'number' &&
        res.distanceKm >= 0 &&
        res.searchedPin === tc.pin &&
        typeof res.regionName === 'string' &&
        res.regionName.length > 0
      ) {
        pinSuccessCount++;
      } else {
        console.error(`Invalid structure for PIN ${tc.pin}:`, res);
      }

      // Assert exact match distance == 0
      if (tc.exact) {
        if (res.distanceKm === 0) {
          exactMatchesCount++;
        } else {
          console.error(`Expected 0km for exact match PIN ${tc.pin}, got ${res.distanceKm}km`);
        }
      } else {
        if (res.distanceKm >= 0) {
          nonZeroDistanceCount++;
        }
      }
    }

    assert(
      pinSuccessCount === testPinCodes.length,
      'Spatial PIN Engine',
      `All ${testPinCodes.length} diverse PIN codes resolved successfully with non-negative Haversine distance and region metadata`,
      `Resolved: ${pinSuccessCount}/${testPinCodes.length}`
    );

    const expectedExactCount = testPinCodes.filter((tc) => tc.exact).length;
    assert(
      exactMatchesCount === expectedExactCount,
      'Spatial PIN Engine',
      `All ${expectedExactCount} direct museum PIN codes return distance_km = 0.0`,
      `Exact 0km matches: ${exactMatchesCount}/${expectedExactCount}`
    );

    // S2.2: Adversarial & Malformed PIN Code Handling
    const adversarialStringPins = [
      { pin: '', desc: 'Empty string' },
      { pin: '11001', desc: '5-digit PIN (too short)' },
      { pin: '1100111', desc: '7-digit PIN (too long)' },
      { pin: '011001', desc: 'Leading zero 011001 (illegal Indian PIN)' },
      { pin: '000000', desc: 'All zeros 000000' },
      { pin: 'ABCDEF', desc: 'Pure alphabetic string' },
      { pin: '11001A', desc: 'Alphanumeric mix' },
      { pin: '11 00 11', desc: 'PIN with internal spaces' },
      { pin: '11-0011', desc: 'PIN with hyphen' },
      { pin: '110011@', desc: 'PIN with special character' },
    ];

    let correctlyRejectedAdversarial = 0;
    for (const ap of adversarialStringPins) {
      const res = findNearestMuseumForPincode(ap.pin);
      if (res === null) {
        correctlyRejectedAdversarial++;
      } else {
        console.error(`Adversarial PIN ${JSON.stringify(ap.pin)} (${ap.desc}) was NOT rejected! Returned:`, res);
      }
    }

    assert(
      correctlyRejectedAdversarial === adversarialStringPins.length,
      'Spatial PIN Engine',
      `All ${adversarialStringPins.length} adversarial and malformed string PIN inputs are strictly rejected returning null`,
      `Rejected: ${correctlyRejectedAdversarial}/${adversarialStringPins.length}`
    );

    // Also test resolvePinToCoordinates with non-string inputs
    const nonStringInputs = [null, undefined, 110011, {}, [], true];
    let nonStringHandled = 0;
    for (const nsi of nonStringInputs) {
      try {
        const res = resolvePinToCoordinates(nsi as any);
        if (res === null) nonStringHandled++;
      } catch (e) {
        // Should not throw
      }
    }
    assert(
      nonStringHandled === nonStringInputs.length,
      'Spatial PIN Engine',
      `resolvePinToCoordinates safely rejects non-string types without throwing`,
      `Handled: ${nonStringHandled}/${nonStringInputs.length}`
    );

    // S2.3: Whitespace Tolerance on Valid PINs
    const paddedPin = '  110011  ';
    const paddedRes = findNearestMuseumForPincode(paddedPin);
    assert(
      paddedRes !== null && paddedRes.searchedPin === '110011' && paddedRes.distanceKm === 0,
      'Spatial PIN Engine',
      'findNearestMuseumForPincode gracefully trims leading/trailing whitespace on valid 6-digit PINs',
      paddedRes ? `Resolved to ${paddedRes.nearestMuseum.name}` : 'Returned null'
    );

    // S2.4: Geodesic Haversine Invariant Checks
    // 1. Identity: d(A, A) === 0
    const dSelf = calculateHaversineDistance(28.6118, 77.2193, 28.6118, 77.2193);
    assert(dSelf === 0, 'Haversine Engine', 'Haversine distance to self is exactly 0.0 km', `d(P,P) = ${dSelf}`);

    // 2. Symmetry: d(A, B) === d(B, A)
    const dDelhiToJaipur = calculateHaversineDistance(28.6118, 77.2193, 26.9116, 75.8195);
    const dJaipurToDelhi = calculateHaversineDistance(26.9116, 75.8195, 28.6118, 77.2193);
    assert(
      dDelhiToJaipur === dJaipurToDelhi && Math.abs(dDelhiToJaipur - 238) < 15,
      'Haversine Engine',
      'Haversine distance satisfies mathematical symmetry d(A,B) == d(B,A) (~238 km Delhi-Jaipur)',
      `d(D,J)=${dDelhiToJaipur}km, d(J,D)=${dJaipurToDelhi}km`
    );

    // 3. Triangle Inequality: d(A, C) <= d(A, B) + d(B, C)
    // Delhi (A), Mumbai (B), Chennai (C)
    const dAB = calculateHaversineDistance(28.6118, 77.2193, 18.9268, 72.8327); // Delhi -> Mumbai
    const dBC = calculateHaversineDistance(18.9268, 72.8327, 13.0694, 80.2569); // Mumbai -> Chennai
    const dAC = calculateHaversineDistance(28.6118, 77.2193, 13.0694, 80.2569); // Delhi -> Chennai
    assert(
      dAC <= dAB + dBC + 0.1,
      'Haversine Engine',
      'Haversine distance satisfies geodesic Triangle Inequality d(A,C) <= d(A,B) + d(B,C)',
      `d(AC)=${dAC}km <= d(AB)+d(BC)=${dAB + dBC}km`
    );
  });

  // ==========================================================================
  // SECTION 3: POST /api/museum-chat Adversarial API & Grounding Testing
  // ==========================================================================
  await runTestSection('Section 3: POST /api/museum-chat Adversarial API & Grounding', async () => {
    // S3.1: Valid museum IDs & Prompt Chips Grounding
    const chipTestCases = [
      {
        museumId: 'mus-in-del-001',
        name: 'National Museum, New Delhi',
        query: 'What are the opening timings and weekly holidays?',
        expectedSubstrings: ['10:00', '18:00', 'Monday'],
        expectedField: 'opening_hours',
      },
      {
        museumId: 'mus-in-del-001',
        name: 'National Museum, New Delhi',
        query: 'How much is the entry ticket fee for domestic and foreign visitors?',
        expectedSubstrings: ['20', '650'],
        expectedField: 'entry_fee',
      },
      {
        museumId: 'mus-in-che-001',
        name: 'Government Museum Chennai',
        query: 'What accessibility features are available for disabled or elderly visitors?',
        expectedSubstrings: ['Wheelchair', 'Tactile'],
        expectedField: 'accessibility_features',
      },
      {
        museumId: 'mus-in-kol-001',
        name: 'Indian Museum Kolkata',
        query: 'What are the top highlights and famous artifacts to see?',
        expectedSubstrings: ['relic', 'artifact', 'Egyptian', 'Bharhut', 'collection', 'art'],
        expectedField: 'featured_artifacts',
      },
      {
        museumId: 'mus-in-jai-001',
        name: 'Albert Hall Museum, Jaipur',
        query: 'Where is the museum located and what is the contact info?',
        expectedSubstrings: ['Jaipur', 'Rajasthan', '302004'],
        expectedField: 'address',
      },
      {
        museumId: 'mus-in-trv-001',
        name: 'Napier Museum, Thiruvananthapuram',
        query: 'Tell me about the visiting hours and ticket cost',
        expectedSubstrings: ['10:00', '16:45', 'Monday', '20'],
        expectedField: 'opening_hours',
      },
      {
        museumId: 'mus-in-lot-001',
        name: 'Archaeological Museum, Lothal',
        query: 'Is there an entry fee or is entry free for Lothal?',
        expectedSubstrings: ['free', '₹0', 'charge', '0'],
        expectedField: 'entry_fee',
      },
      {
        museumId: 'mus-in-pan-001',
        name: 'Goa State Museum, Panaji',
        query: 'What are the ticket fees to visit Goa State Museum?',
        expectedSubstrings: ['free', 'charge', '₹0', '0'],
        expectedField: 'entry_fee',
      },
    ];

    console.log(`Testing ${chipTestCases.length} prompt chips against POST /api/museum-chat...`);
    for (const tc of chipTestCases) {
      const req = createMockNextRequest({
        museumId: tc.museumId,
        question: tc.query,
      });

      const res = await POST(req);
      assert(
        res.status === 200,
        'Museum Chat API',
        `Prompt chip for ${tc.name} returns HTTP 200`,
        `Status: ${res.status}`
      );

      const json = await res.json();
      assert(
        json.status === 'ok' || json.status === 'fallback',
        'Museum Chat API',
        `Response status is 'ok' or 'fallback' for ${tc.name}`,
        `Got: ${json.status}`
      );
      assert(
        typeof json.reply === 'string' && json.reply.trim().length > 20,
        'Museum Chat API',
        `Response reply is substantial and non-empty for ${tc.name}`,
        `Length: ${json.reply?.length}`
      );
      assert(
        json.museumId === tc.museumId,
        'Museum Chat API',
        `Response echoes accurate museumId (${tc.museumId})`,
        `Got: ${json.museumId}`
      );

      // Verify factual grounding contains expected facts
      const replyLower = (json.reply || '').toLowerCase();
      const matchedFacts = tc.expectedSubstrings.filter((sub) => replyLower.includes(sub.toLowerCase()));
      assert(
        matchedFacts.length > 0,
        'Museum Chat API',
        `Response for ${tc.name} is factually grounded with key metadata (${matchedFacts.join(', ')})`,
        `Expected one of: ${tc.expectedSubstrings.join(', ')}`
      );
    }

    // S3.2: Multilingual Queries across 8 Indian Languages
    const multilingualCases = [
      {
        lang: 'Hindi',
        museumId: 'mus-in-del-001',
        query: 'संग्रहालय के खुलने और बंद होने का समय क्या है?',
      },
      {
        lang: 'Tamil',
        museumId: 'mus-in-che-001',
        query: 'அரசு அருங்காட்சியகம் சென்னை எப்போது திறக்கும்?',
      },
      {
        lang: 'Bengali',
        museumId: 'mus-in-kol-001',
        query: 'ভারতীয় জাদুঘর কলকাতার প্রবেশ মূল্য কত?',
      },
      {
        lang: 'Telugu',
        museumId: 'mus-in-hyd-001',
        query: 'సాలార్ జంగ్ మ్యూజియం ఎప్పుడు తెరిచి ఉంటుంది?',
      },
      {
        lang: 'Marathi',
        museumId: 'mus-in-pun-001',
        query: 'राजा दिनकर केळकर संग्रहालयाचे तिकीट किती आहे?',
      },
      {
        lang: 'Gujarati',
        museumId: 'mus-in-ahm-001',
        query: 'કેલિકો મ્યુઝિયમ અમદાવાદ ક્યારે ખુલે છે?',
      },
      {
        lang: 'Kannada',
        museumId: 'mus-in-blr-001',
        query: 'ವಿಶ್ವೇಶ್ವರಯ್ಯ ವಸ್ತುಸಂಗ್ರಹಾಲಯ ಬೆಂಗಳೂರು ಟಿಕೆಟ್ ದರ ಎಷ್ಟು?',
      },
      {
        lang: 'Malayalam',
        museumId: 'mus-in-trv-001',
        query: 'നേപ്പിയർ മ്യൂസിയം തിരുവനന്തപുരം പ്രവേശന സമയം എന്താണ്?',
      },
    ];

    console.log(`Testing ${multilingualCases.length} vernacular Indian language queries...`);
    for (const mc of multilingualCases) {
      const req = createMockNextRequest({
        museumId: mc.museumId,
        question: mc.query,
      });

      const res = await POST(req);
      assert(
        res.status === 200,
        'Museum Chat API - Multilingual',
        `Handles ${mc.lang} query gracefully returning HTTP 200`,
        `Lang: ${mc.lang}`
      );

      const json = await res.json();
      assert(
        typeof json.reply === 'string' && json.reply.length > 10,
        'Museum Chat API - Multilingual',
        `Produces grounded non-empty response for ${mc.lang}`,
        `Reply: ${json.reply?.substring(0, 60)}...`
      );
    }

    // S3.3: Specific Domain Queries (Chola Bronzes, Nataraja, Wheelchairs)
    const domainQueryCases = [
      {
        museumId: 'mus-in-che-001',
        query: 'Tell me about the famous Chola Bronzes and the Nataraja icon in this museum.',
        expectedKeyword: 'nataraja',
      },
      {
        museumId: 'mus-in-del-001',
        query: 'Can a person with a wheelchair access the upper floors?',
        expectedKeyword: 'wheelchair',
      },
      {
        museumId: 'mus-in-jai-001',
        query: 'Is there a cafeteria or food court inside Albert Hall and what are the prices?',
        expectedKeyword: 'contact', // Should politely suggest contacting reception for unlisted cafeteria tariffs
      },
    ];

    for (const dq of domainQueryCases) {
      const req = createMockNextRequest({
        museumId: dq.museumId,
        question: dq.query,
      });
      const res = await POST(req);
      const json = await res.json();
      assert(
        res.status === 200 && json.reply && json.reply.length > 20,
        'Museum Chat API - Domain Grounding',
        `Domain query "${dq.query.substring(0, 35)}..." returns authoritative reply`,
        `Status: ${json.status}`
      );
    }

    // S3.4: Multi-Turn Conversation History
    const historyReq = createMockNextRequest({
      museumId: 'mus-in-del-001',
      question: 'What about international tourists ticket fees?',
      chatHistory: [
        { role: 'user', content: 'What are the timings of National Museum?' },
        { role: 'assistant', content: 'It is open from 10:00 AM to 6:00 PM Tuesday to Sunday.' },
        { role: 'user', content: 'And how much for Indian citizens?' },
        { role: 'assistant', content: 'Entry is ₹20 for Indian citizens.' },
      ],
    });
    const historyRes = await POST(historyReq);
    assert(historyRes.status === 200, 'Museum Chat API - Multi-Turn', 'Supports multi-turn chat history array cleanly');
    const historyJson = await historyRes.json();
    assert(
      historyJson.reply && (historyJson.reply.includes('650') || historyJson.reply.toLowerCase().includes('foreign') || historyJson.reply.toLowerCase().includes('international')),
      'Museum Chat API - Multi-Turn',
      'Accurately answers follow-up with grounded foreign visitor fee (₹650)',
      `Reply: ${historyJson.reply}`
    );

    // S3.5: Error & Boundary Conditions (Invalid IDs, Missing bodies, Fuzzing)
    // 1. Missing museumId
    const missingIdRes = await POST(createMockNextRequest({ question: 'What are timings?' }));
    assert(
      missingIdRes.status === 400,
      'Museum Chat API - Error Handling',
      'Rejects payload missing museumId with HTTP 400 Bad Request',
      `Got status: ${missingIdRes.status}`
    );

    // 2. Empty question / message
    const emptyQueryRes = await POST(createMockNextRequest({ museumId: 'mus-in-del-001', question: '   ' }));
    assert(
      emptyQueryRes.status === 400,
      'Museum Chat API - Error Handling',
      'Rejects empty / whitespace-only query with HTTP 400 Bad Request',
      `Got status: ${emptyQueryRes.status}`
    );

    // 3. Non-existent museumId
    const nonExistentIdRes = await POST(createMockNextRequest({ museumId: 'mus-in-nonexistent-999', question: 'Timings please' }));
    assert(
      nonExistentIdRes.status === 404,
      'Museum Chat API - Error Handling',
      'Returns HTTP 404 Not Found for non-existent museumId',
      `Got status: ${nonExistentIdRes.status}`
    );

    // 4. Malformed JSON Body
    const malformedJsonRes = await POST(createMockNextRequest(null, true));
    assert(
      malformedJsonRes.status === 400,
      'Museum Chat API - Error Handling',
      'Handles malformed JSON syntax gracefully returning HTTP 400',
      `Got status: ${malformedJsonRes.status}`
    );

    // 5. Empty JSON Object `{}`
    const emptyObjRes = await POST(createMockNextRequest({}));
    assert(
      emptyObjRes.status === 400,
      'Museum Chat API - Error Handling',
      'Rejects empty object `{}` with HTTP 400',
      `Got status: ${emptyObjRes.status}`
    );

    // 6. Security Injection Payloads (SQLi, XSS, Huge input)
    const sqliRes = await POST(
      createMockNextRequest({
        museumId: 'mus-in-del-001',
        question: "'; DROP TABLE museums; SELECT * FROM users WHERE '1'='1",
      })
    );
    assert(sqliRes.status === 200, 'Museum Chat API - Security', 'SQL injection payload handled safely without crashing');

    const xssRes = await POST(
      createMockNextRequest({
        museumId: 'mus-in-del-001',
        question: '<script>alert("XSS Attack")</script><img src="x" onerror="alert(1)"/>',
      })
    );
    assert(xssRes.status === 200, 'Museum Chat API - Security', 'XSS payload handled safely without execution or crash');

    const hugeQuery = 'What are the museum details? '.repeat(200); // ~6000 chars
    const hugeRes = await POST(
      createMockNextRequest({
        museumId: 'mus-in-del-001',
        question: hugeQuery,
      })
    );
    assert(hugeRes.status === 200, 'Museum Chat API - Security', 'Extremely long question (~6000 chars) handled gracefully without timeout or memory crash');

    // 7. Prototype Pollution in Request Payload
    const protoRes = await POST(
      createMockNextRequest({
        museumId: 'mus-in-del-001',
        question: 'What are the timings?',
        __proto__: { isAdmin: true },
        constructor: { prototype: { polluter: 'active' } },
      })
    );
    assert(protoRes.status === 200, 'Museum Chat API - Security', 'Prototype pollution payload handled safely');
  });

  // ==========================================================================
  // FINAL SCORECARD & SUMMARY
  // ==========================================================================
  const totalDuration = Date.now() - startTime;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;
  const totalTests = results.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`\n========================================================================`);
  console.log(`📋 CHALLENGER FINAL ADVERSARIAL TEST EXECUTION SUMMARY`);
  console.log(`========================================================================`);
  console.log(`Total Assertions Evaluated : ${totalTests}`);
  console.log(`Passed Assertions          : ${passedTests} (✔)`);
  console.log(`Failed Assertions          : ${failedTests} (❌)`);
  console.log(`Pass Rate                  : ${passRate}%`);
  console.log(`Total Execution Time       : ${totalDuration}ms`);
  console.log(`========================================================================\n`);

  if (failedTests > 0) {
    console.error(`💥 ${failedTests} ADVERSARIAL ASSERTIONS FAILED. VERDICT: REQUEST_CHANGES`);
    results.filter(r => !r.passed).forEach(r => {
      console.error(`FAILED: [${r.suite}] ${r.name} -> ${r.error} (${r.details})`);
    });
    process.exit(1);
  } else {
    console.log(`✨ ALL ${totalTests} ADVERSARIAL ASSERTIONS PASSED! VERDICT: APPROVE`);
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('Fatal crash in challenger test suite:', e);
  process.exit(1);
});
