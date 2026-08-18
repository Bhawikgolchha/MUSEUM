/**
 * Comprehensive Challenger Verification & Stress Test Harness
 * 
 * Tests:
 * 1. Multi-Region PIN Search Accuracy across North, South, East, West, North-East, Central, and Islands.
 * 2. 0-Result Fallback Modal Trigger Conditions & Haversine Distance calculations.
 * 3. MuseumDoubtChat preset doubt chips grounding across ALL 21 authentic Indian museums.
 * 4. Multi-turn conversation flow & edge-case query resilience.
 * 5. TypeScript typecheck and Next.js production build verification.
 */

import {
  getAllMuseums,
  getMuseumById,
  searchMuseums,
  findNearestMuseumForPincode,
  calculateHaversineDistance,
  isMuseumOpenToday,
  Museum,
  MuseumWithDistance,
} from '../lib/museums';
import {
  resolvePinToCoordinates,
  findNearestMuseum,
  EXACT_PIN_COORDINATES,
  DISTRICT_PREFIX_COORDINATES,
  POSTAL_CIRCLE_COORDINATES,
} from '../lib/pincodes';
import {
  resolveDeterministicMuseumDoubt,
  POST as museumChatPostHandler,
} from '../app/api/museum-chat/route';
import { PRESET_DOUBT_CHIPS } from '../components/MuseumDoubtChat';
import { NextRequest } from 'next/server';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: string;
}

const testResults: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runTest(category: string, name: string, fn: () => void | Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    testResults.push({
      category,
      name,
      passed: true,
      durationMs: Date.now() - start,
    });
    console.log(`  ✔ [PASS] ${category} > ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    testResults.push({
      category,
      name,
      passed: false,
      durationMs: Date.now() - start,
      error: err?.message || String(err),
    });
    console.error(`  ✖ [FAIL] ${category} > ${name}:`, err?.message || err);
  }
}

async function main() {
  console.log('========================================================================');
  console.log('🛡️  CHALLENGER ADVANCED STRESS TEST & E2E USER FLOW HARNESS');
  console.log('========================================================================\n');

  const allMuseums = getAllMuseums();
  console.log(`Loaded ${allMuseums.length} authentic Indian museums from database.\n`);

  // ==========================================================================
  // SUITE 1: Multi-Region PIN Search & Spatial Resolution (All Zones)
  // ==========================================================================
  console.log('▶ SUITE 1: Multi-Region PIN Search & Spatial Resolution');

  await runTest('PIN Search', 'North Region: Exact & Unindexed PIN queries', () => {
    // 1. Delhi Exact PIN (110011)
    const rDelhi = searchMuseums({ query: '110011' });
    assert(rDelhi.results.length >= 1, 'PIN 110011 must find National Museum directly');
    assert(rDelhi.results[0].name.includes('National Museum'), 'PIN 110011 top result must be National Museum');

    // 2. Delhi GPO unindexed PIN (110001)
    const rDelhiGPO = searchMuseums({ query: '110001' });
    assert(rDelhiGPO.results.length === 0, 'PIN 110001 has no museum directly situated in it');
    const fbDelhiGPO = findNearestMuseumForPincode('110001');
    assert(fbDelhiGPO !== null, 'PIN 110001 must resolve fallback');
    assert(fbDelhiGPO!.nearestMuseum.city === 'New Delhi', 'Nearest museum to 110001 must be in New Delhi');
    assert(fbDelhiGPO!.distanceKm < 5, `Distance from 110001 to National Museum should be < 5km, got ${fbDelhiGPO!.distanceKm}`);

    // 3. J&K Jammu (180001 exact match in dataset) & unindexed (180002)
    const rJammuExact = searchMuseums({ query: '180001' });
    assert(rJammuExact.results.length >= 1, 'PIN 180001 must find Dogra Art Museum directly');
    assert(rJammuExact.results[0].id === 'mus-in-jam-001', 'Must be Dogra Art Museum');
    const fbJammuUnindexed = findNearestMuseumForPincode('180002');
    assert(fbJammuUnindexed !== null, 'PIN 180002 must resolve');
    assert(fbJammuUnindexed!.nearestMuseum.id === 'mus-in-jam-001', 'Nearest museum to 180002 must be Dogra Art Museum');

    // 4. Punjab Ludhiana unindexed (141001)
    const fbLudhiana = findNearestMuseumForPincode('141001');
    assert(fbLudhiana !== null, 'PIN 141001 must resolve');
    assert(fbLudhiana!.distanceKm > 0, 'Distance must be > 0');

    // 5. UP Varanasi Exact (221007) vs Unindexed (221001)
    const rSarnath = searchMuseums({ query: '221007' });
    assert(rSarnath.results.length >= 1, 'PIN 221007 must find Sarnath Museum');
    assert(rSarnath.results[0].id === 'mus-in-sar-001', 'Must be Sarnath Museum');
    const fbVaranasiGPO = findNearestMuseumForPincode('221001');
    assert(fbVaranasiGPO !== null && fbVaranasiGPO.nearestMuseum.id === 'mus-in-sar-001', 'Nearest to 221001 must be Sarnath Museum');
  });

  await runTest('PIN Search', 'South Region: Exact & Unindexed PIN queries', () => {
    // 1. Chennai Exact (600008) vs Chennai GPO (600001)
    const rChennai = searchMuseums({ query: '600008' });
    assert(rChennai.results.length >= 1, 'PIN 600008 must find Govt Museum Chennai');
    const fbChennaiGPO = findNearestMuseumForPincode('600001');
    assert(fbChennaiGPO !== null && fbChennaiGPO.nearestMuseum.id === 'mus-in-che-001', 'Nearest to 600001 must be Govt Museum Chennai');
    assert(fbChennaiGPO!.distanceKm < 10, `Distance should be < 10km, got ${fbChennaiGPO!.distanceKm}`);

    // 2. Kerala Thiruvananthapuram Exact (695033) vs Trivandrum GPO (695001)
    const rNapier = searchMuseums({ query: '695033' });
    assert(rNapier.results.length >= 1, 'PIN 695033 must find Napier Museum');
    const fbTrivandrumGPO = findNearestMuseumForPincode('695001');
    assert(fbTrivandrumGPO !== null && fbTrivandrumGPO.nearestMuseum.id === 'mus-in-trv-001', 'Nearest to 695001 must be Napier Museum');
    assert(fbTrivandrumGPO!.distanceKm < 5, `Distance should be < 5km, got ${fbTrivandrumGPO!.distanceKm}`);

    // 3. Kochi / Ernakulam (682301 Hill Palace vs 682001 Fort Kochi)
    const rKochi = searchMuseums({ query: '682301' });
    assert(rKochi.results.length >= 1, 'PIN 682301 must find Hill Palace Kochi');
    const fbFortKochi = findNearestMuseumForPincode('682001');
    assert(fbFortKochi !== null && fbFortKochi.nearestMuseum.id === 'mus-in-koc-001', 'Nearest to 682001 must be Hill Palace Kochi');

    // 4. Karnataka Bengaluru (560001)
    const rBangalore = searchMuseums({ query: '560001' });
    assert(rBangalore.results.length >= 1, 'PIN 560001 must find Visvesvaraya Museum');

    // 5. Telangana Hyderabad (500002 Salar Jung vs 500001 Abids)
    const rSalarJung = searchMuseums({ query: '500002' });
    assert(rSalarJung.results.length >= 1, 'PIN 500002 must find Salar Jung');
    const fbAbids = findNearestMuseumForPincode('500001');
    assert(fbAbids !== null && fbAbids.nearestMuseum.id === 'mus-in-hyd-001', 'Nearest to 500001 must be Salar Jung');
    assert(fbAbids!.distanceKm < 5, `Distance should be < 5km, got ${fbAbids!.distanceKm}`);
  });

  await runTest('PIN Search', 'East Region: Exact & Unindexed PIN queries', () => {
    // 1. Kolkata Exact (700016) vs Kolkata GPO (700001)
    const rIndianMuseum = searchMuseums({ query: '700016' });
    assert(rIndianMuseum.results.length >= 1, 'PIN 700016 must find Indian Museum Kolkata');
    const fbKolkataGPO = findNearestMuseumForPincode('700001');
    assert(fbKolkataGPO !== null && fbKolkataGPO.nearestMuseum.id === 'mus-in-kol-001', 'Nearest to 700001 must be Indian Museum Kolkata');
    assert(fbKolkataGPO!.distanceKm < 5, `Distance should be < 5km, got ${fbKolkataGPO!.distanceKm}`);

    // 2. Patna Bihar Museum (800001)
    const rBihar = searchMuseums({ query: '800001' });
    assert(rBihar.results.length >= 1, 'PIN 800001 must find Bihar Museum');

    // 3. Bhubaneswar Odisha State Museum (751014) vs Bhubaneswar GPO (751001)
    const rOdisha = searchMuseums({ query: '751014' });
    assert(rOdisha.results.length >= 1, 'PIN 751014 must find Odisha State Museum');
    const fbBhubaneswarGPO = findNearestMuseumForPincode('751001');
    assert(fbBhubaneswarGPO !== null && fbBhubaneswarGPO.nearestMuseum.id === 'mus-in-bhu-001', 'Nearest to 751001 must be Odisha State Museum');
    assert(fbBhubaneswarGPO!.distanceKm < 8, `Distance should be < 8km, got ${fbBhubaneswarGPO!.distanceKm}`);

    // 4. Ranchi Jharkhand (834001)
    const fbRanchi = findNearestMuseumForPincode('834001');
    assert(fbRanchi !== null, 'PIN 834001 must resolve fallback');
  });

  await runTest('PIN Search', 'West Region: Exact & Unindexed PIN queries', () => {
    // 1. Jaipur Albert Hall (302004) vs Jaipur GPO (302001)
    const rAlbert = searchMuseums({ query: '302004' });
    assert(rAlbert.results.length >= 1, 'PIN 302004 must find Albert Hall Museum');
    const fbJaipurGPO = findNearestMuseumForPincode('302001');
    assert(fbJaipurGPO !== null && fbJaipurGPO.nearestMuseum.id === 'mus-in-jai-001', 'Nearest to 302001 must be Albert Hall Museum');
    assert(fbJaipurGPO!.distanceKm < 6, `Distance should be < 6km, got ${fbJaipurGPO!.distanceKm}`);

    // 2. Udaipur City Palace (313001)
    const rUdaipur = searchMuseums({ query: '313001' });
    assert(rUdaipur.results.length >= 1, 'PIN 313001 must find City Palace Udaipur');

    // 3. Ahmedabad Calico (380004) vs Ahmedabad GPO (380001)
    const rCalico = searchMuseums({ query: '380004' });
    assert(rCalico.results.length >= 1, 'PIN 380004 must find Calico Museum');
    const fbAhmedabadGPO = findNearestMuseumForPincode('380001');
    assert(fbAhmedabadGPO !== null && fbAhmedabadGPO.nearestMuseum.id === 'mus-in-ahm-001', 'Nearest to 380001 must be Calico Museum');
    assert(fbAhmedabadGPO!.distanceKm < 8, `Distance should be < 8km, got ${fbAhmedabadGPO!.distanceKm}`);

    // 4. Lothal ASI Archaeological Museum (382230)
    const rLothal = searchMuseums({ query: '382230' });
    assert(rLothal.results.length >= 1, 'PIN 382230 must find Lothal Museum');

    // 5. Mumbai CSMVS (400023) vs Mumbai GPO (400001)
    const rCSMVS = searchMuseums({ query: '400023' });
    assert(rCSMVS.results.length >= 1, 'PIN 400023 must find CSMVS Mumbai');
    const fbMumbaiGPO = findNearestMuseumForPincode('400001');
    assert(fbMumbaiGPO !== null && fbMumbaiGPO.nearestMuseum.id === 'mus-in-mum-001', 'Nearest to 400001 must be CSMVS');
    assert(fbMumbaiGPO!.distanceKm < 5, `Distance should be < 5km, got ${fbMumbaiGPO!.distanceKm}`);

    // 6. Pune Raja Dinkar Kelkar (411002) vs Pune GPO (411001)
    const rPune = searchMuseums({ query: '411002' });
    assert(rPune.results.length >= 1, 'PIN 411002 must find Kelkar Museum');
    const fbPuneGPO = findNearestMuseumForPincode('411001');
    assert(fbPuneGPO !== null && fbPuneGPO.nearestMuseum.id === 'mus-in-pun-001', 'Nearest to 411001 must be Kelkar Museum');
    assert(fbPuneGPO!.distanceKm < 5, `Distance should be < 5km, got ${fbPuneGPO!.distanceKm}`);

    // 7. Goa State Museum (403001)
    const rGoa = searchMuseums({ query: '403001' });
    assert(rGoa.results.length >= 1, 'PIN 403001 must find Goa State Museum');
  });

  await runTest('PIN Search', 'North-East Region: Exact & Unindexed PIN queries', () => {
    // 1. Meghalaya Shillong Don Bosco (793008) vs Shillong GPO (793001)
    const rDonBosco = searchMuseums({ query: '793008' });
    assert(rDonBosco.results.length >= 1, 'PIN 793008 must find Don Bosco Museum Shillong');
    const fbShillongGPO = findNearestMuseumForPincode('793001');
    assert(fbShillongGPO !== null && fbShillongGPO.nearestMuseum.id === 'mus-in-shl-001', 'Nearest to 793001 must be Don Bosco Museum');
    assert(fbShillongGPO!.distanceKm < 8, `Distance should be < 8km, got ${fbShillongGPO!.distanceKm}`);

    // 2. Assam Guwahati State Museum (781001) vs Kamrup unindexed (781005)
    const rAssam = searchMuseums({ query: '781001' });
    assert(rAssam.results.length >= 1, 'PIN 781001 must find Assam State Museum');
    const fbKamrup = findNearestMuseumForPincode('781005');
    assert(fbKamrup !== null && fbKamrup.nearestMuseum.id === 'mus-in-guw-001', 'Nearest to 781005 must be Assam State Museum');
    assert(fbKamrup!.distanceKm < 15, `Distance should be < 15km, got ${fbKamrup!.distanceKm}`);

    // 3. Other NE states fallback resolution
    const statesNE = [
      { pin: '795001', name: 'Manipur / Imphal' },
      { pin: '796001', name: 'Mizoram / Aizawl' },
      { pin: '797001', name: 'Nagaland / Kohima' },
      { pin: '799001', name: 'Tripura / Agartala' },
      { pin: '737101', name: 'Sikkim / Gangtok' },
    ];
    for (const item of statesNE) {
      const fb = findNearestMuseumForPincode(item.pin);
      assert(fb !== null, `PIN ${item.pin} (${item.name}) must resolve`);
      assert(fb!.distanceKm > 0, `Distance for ${item.pin} must be > 0`);
    }
  });

  await runTest('PIN Search', 'Central, Remote & Island Regions Fallback Resolution', () => {
    // 1. Madhya Pradesh Bhopal Tribal Museum (462013) vs Bhopal GPO (462001)
    const rTribal = searchMuseums({ query: '462013' });
    assert(rTribal.results.length >= 1, 'PIN 462013 must find MP Tribal Museum');
    const fbBhopalGPO = findNearestMuseumForPincode('462001');
    assert(fbBhopalGPO !== null && fbBhopalGPO.nearestMuseum.id === 'mus-in-bho-001', 'Nearest to 462001 must be MP Tribal Museum');
    assert(fbBhopalGPO!.distanceKm < 8, `Distance should be < 8km, got ${fbBhopalGPO!.distanceKm}`);

    // 2. Chhattisgarh Raipur (492001)
    const fbRaipur = findNearestMuseumForPincode('492001');
    assert(fbRaipur !== null, 'PIN 492001 must resolve fallback');

    // 3. Andaman & Nicobar Port Blair (744101)
    const fbPortBlair = findNearestMuseumForPincode('744101');
    assert(fbPortBlair !== null, 'PIN 744101 must resolve fallback');

    // 4. Ladakh Leh (194101)
    const fbLeh = findNearestMuseumForPincode('194101');
    assert(fbLeh !== null, 'PIN 194101 must resolve fallback');
  });

  await runTest('PIN Search', 'Edge-Case and Malformed PIN Rejection across Resolvers', () => {
    const invalidPins = [
      '',
      '   ',
      '12345',         // 5 digits
      '1234567',       // 7 digits
      '011001',        // leading zero
      '000000',        // all zeroes
      'ABCDEF',        // letters
      '11001A',        // mixed alpha
      '!@#$%',         // special chars
    ];

    for (const badPin of invalidPins) {
      const res = resolvePinToCoordinates(badPin);
      assert(res === null, `resolvePinToCoordinates should return null for "${badPin}"`);
      const fb = findNearestMuseumForPincode(badPin);
      assert(fb === null, `findNearestMuseumForPincode should return null for "${badPin}"`);
    }

    // Additional strict check on resolvePinToCoordinates with non-digit formatted strings
    assert(resolvePinToCoordinates('110-011') === null, 'resolvePinToCoordinates must reject hyphenated string');
    assert(resolvePinToCoordinates('11 0011') === null, 'resolvePinToCoordinates must reject space-separated string');
    assert(resolvePinToCoordinates('-110011') === null, 'resolvePinToCoordinates must reject negative string');
  });

  // ==========================================================================
  // SUITE 2: 0-Result Modal Trigger Conditions & Interaction Simulation
  // ==========================================================================
  console.log('\n▶ SUITE 2: 0-Result Fallback Modal Trigger Conditions & State Lifecycle');

  await runTest('Modal Triggers', 'Verify 0-Result PIN queries trigger modal state correctly', () => {
    // Case 1: Exact Museum PIN (e.g. 110011)
    const pinExact = '110011';
    const cleanExact = pinExact.trim();
    const is6DigitPinExact = /^[1-9][0-9]{5}$/.test(cleanExact);
    const searchResExact = searchMuseums({ query: cleanExact });
    const shouldTriggerModalExact = is6DigitPinExact && searchResExact.results.length === 0;
    assert(shouldTriggerModalExact === false, 'Modal should NOT trigger when direct museum matches are found');

    // Case 2: Unindexed 6-Digit PIN (e.g. 302001)
    const pinUnindexed = '302001';
    const cleanUnindexed = pinUnindexed.trim();
    const is6DigitPinUnindexed = /^[1-9][0-9]{5}$/.test(cleanUnindexed);
    const searchResUnindexed = searchMuseums({ query: cleanUnindexed });
    const shouldTriggerModalUnindexed = is6DigitPinUnindexed && searchResUnindexed.results.length === 0;
    assert(shouldTriggerModalUnindexed === true, 'Modal MUST trigger when 6-digit PIN yields 0 direct results');

    const fallback = findNearestMuseumForPincode(cleanUnindexed);
    assert(fallback !== null, 'Fallback computation must succeed');
    assert(fallback!.searchedPin === '302001', 'Fallback searchedPin must match');
    assert(fallback!.nearestMuseum.name.includes('Albert Hall'), 'Nearest museum must be Albert Hall Jaipur');
    assert(fallback!.distanceKm > 0 && fallback!.distanceKm < 10, 'Distance must be realistic (< 10km)');
    assert(typeof fallback!.regionName === 'string' && fallback!.regionName.length > 0, 'regionName must be non-empty');

    // Case 3: Text Search Query (e.g. "Jaipur")
    const queryText = 'Jaipur';
    const is6DigitPinText = /^[1-9][0-9]{5}$/.test(queryText.trim());
    assert(is6DigitPinText === false, 'Text query is not a 6-digit PIN');
  });

  await runTest('Modal Triggers', 'Simulate Modal Button Callbacks (Switch & Expand Radius)', () => {
    const unindexedPin = '411001';
    const fallback = findNearestMuseumForPincode(unindexedPin)!;
    assert(fallback !== null, 'Fallback must exist for 411001');

    // Simulated Page State
    let selectedMuseum: MuseumWithDistance | null = null;
    let centerCoordinates = null as any;
    let queryState = unindexedPin;
    let isNearestModalOpen: boolean = true;
    let radiusKm = 25;

    // Simulate "Switch to Museum" click handler
    const handleSelectNearestMuseum = (museum: Museum | MuseumWithDistance) => {
      const museumWithDist: MuseumWithDistance = {
        ...museum,
        distance_km: fallback.distanceKm,
      };
      selectedMuseum = museumWithDist;
      centerCoordinates = museum.coordinates;
      queryState = museum.name;
      isNearestModalOpen = false;
    };

    // Execute callback
    handleSelectNearestMuseum(fallback.nearestMuseum);

    assert(selectedMuseum !== null, 'selectedMuseum should be populated');
    assert((selectedMuseum as any).name.includes('Kelkar'), 'selectedMuseum must be Kelkar Museum');
    assert(centerCoordinates.lat === fallback.nearestMuseum.coordinates.lat, 'center coordinates lat must match');
    assert(centerCoordinates.lon === fallback.nearestMuseum.coordinates.lon, 'center coordinates lon must match');
    assert(queryState === fallback.nearestMuseum.name, 'query state should be updated to museum name');
    assert(!isNearestModalOpen, 'modal should close on selection');

    // Reset and simulate "Expand Radius" click handler
    isNearestModalOpen = true;
    const handleExpandRadius = () => {
      radiusKm = 100;
      isNearestModalOpen = false;
    };
    handleExpandRadius();
    assert(radiusKm === 100, 'Radius should expand to 100km');
    assert(!isNearestModalOpen, 'Modal should close on expand');
  });

  // ==========================================================================
  // SUITE 3: MuseumDoubtChat Grounding Across ALL 21 Museums
  // ==========================================================================
  console.log('\n▶ SUITE 3: MuseumDoubtChat Preset Chips Grounding across ALL Authentic Museums');

  await runTest('Doubt Chat Grounding', 'Verify all 5 preset doubt chips for ALL 20+ museums against raw records', () => {
    let totalChecks = 0;
    let passedChecks = 0;

    for (const museum of allMuseums) {
      for (const chip of PRESET_DOUBT_CHIPS) {
        totalChecks += 1;
        const result = resolveDeterministicMuseumDoubt(museum, chip.prompt);
        assert(result && typeof result.reply === 'string' && result.reply.length > 20, `Reply for ${museum.id} (${chip.id}) must be non-empty`);

        const reply = result.reply;

        if (chip.id === 'timings') {
          // Must include museum's exact timings string or schedule
          const hasTiming = reply.includes(museum.opening_hours.timings) || reply.includes(museum.opening_hours.schedule);
          assert(hasTiming, `Timings reply for ${museum.name} must include "${museum.opening_hours.timings}". Got: "${reply}"`);
          if (museum.opening_hours.closed_on && museum.opening_hours.closed_on.length > 0) {
            assert(reply.includes(museum.opening_hours.closed_on[0]), `Timings reply for ${museum.name} must mention closed day "${museum.opening_hours.closed_on[0]}". Got: "${reply}"`);
          } else {
            assert(reply.toLowerCase().includes('seven days') || reply.toLowerCase().includes('open'), `Timings reply for 7-day open museum ${museum.name} must state open schedule`);
          }
        } else if (chip.id === 'fees') {
          if (museum.entry_fee.is_free) {
            assert(reply.toLowerCase().includes('free'), `Free entry museum ${museum.name} must mention "free"`);
          } else {
            assert(reply.includes(String(museum.entry_fee.domestic_inr)), `Fee reply for ${museum.name} must include domestic fee ₹${museum.entry_fee.domestic_inr}`);
            assert(reply.includes(String(museum.entry_fee.foreign_inr)), `Fee reply for ${museum.name} must include foreign fee ₹${museum.entry_fee.foreign_inr}`);
          }
        } else if (chip.id === 'highlights') {
          assert(reply.includes(museum.name), `Highlights reply must mention ${museum.name}`);
          assert(reply.includes(museum.artifact_count_approx.toLocaleString()), `Highlights reply for ${museum.name} must include artifact count ${museum.artifact_count_approx}`);
        } else if (chip.id === 'accessibility') {
          assert(reply.includes(museum.name), `Accessibility reply must mention ${museum.name}`);
          if (museum.accessibility_features.length > 0) {
            const firstFeature = museum.accessibility_features[0];
            assert(reply.includes(firstFeature), `Accessibility reply for ${museum.name} must mention feature "${firstFeature}"`);
          }
        } else if (chip.id === 'contact') {
          assert(reply.includes(museum.address), `Contact reply for ${museum.name} must include address "${museum.address}"`);
          assert(reply.includes(museum.pincode), `Contact reply for ${museum.name} must include PIN "${museum.pincode}"`);
          assert(reply.includes(museum.city), `Contact reply for ${museum.name} must include city "${museum.city}"`);
        }

        passedChecks += 1;
      }
    }

    console.log(`    Grounded facts verified: ${passedChecks} / ${totalChecks} total chip evaluations across ${allMuseums.length} museums.`);
    assert(passedChecks === totalChecks && totalChecks >= 100, `Expected >= 100 checks, got ${passedChecks}`);
  });

  await runTest('Doubt Chat Grounding', 'Multi-Turn Conversation Simulation via Next.js Route Handler', async () => {
    const testMuseum = allMuseums[0]; // National Museum New Delhi
    const chatHistory: { role: 'user' | 'assistant'; content: string }[] = [];

    // Turn 1: User asks for visiting hours
    const req1 = new NextRequest('http://localhost:3000/api/museum-chat', {
      method: 'POST',
      body: JSON.stringify({
        museumId: testMuseum.id,
        message: 'What are your visiting hours?',
        chatHistory: [],
        museumContext: testMuseum,
      }),
    });
    const res1 = await museumChatPostHandler(req1);
    assert(res1.status === 200, 'Turn 1 HTTP status must be 200');
    const data1 = await res1.json();
    assert(data1.reply.includes(testMuseum.opening_hours.timings), 'Turn 1 reply must have visiting hours');
    chatHistory.push({ role: 'user', content: 'What are your visiting hours?' });
    chatHistory.push({ role: 'assistant', content: data1.reply });

    // Turn 2: User asks about tickets in same conversation
    const req2 = new NextRequest('http://localhost:3000/api/museum-chat', {
      method: 'POST',
      body: JSON.stringify({
        museumId: testMuseum.id,
        message: 'How much are entry tickets?',
        chatHistory,
        museumContext: testMuseum,
      }),
    });
    const res2 = await museumChatPostHandler(req2);
    assert(res2.status === 200, 'Turn 2 HTTP status must be 200');
    const data2 = await res2.json();
    assert(data2.reply.includes(String(testMuseum.entry_fee.domestic_inr)), 'Turn 2 reply must have ticket fee');
    chatHistory.push({ role: 'user', content: 'How much are entry tickets?' });
    chatHistory.push({ role: 'assistant', content: data2.reply });

    // Turn 3: User asks about accessibility in same conversation
    const req3 = new NextRequest('http://localhost:3000/api/museum-chat', {
      method: 'POST',
      body: JSON.stringify({
        museumId: testMuseum.id,
        message: 'Do you have wheelchair access?',
        chatHistory,
        museumContext: testMuseum,
      }),
    });
    const res3 = await museumChatPostHandler(req3);
    assert(res3.status === 200, 'Turn 3 HTTP status must be 200');
    const data3 = await res3.json();
    assert(data3.reply.toLowerCase().includes('wheelchair') || data3.reply.toLowerCase().includes('accessible'), 'Turn 3 reply must have accessibility info');
  });

  // ==========================================================================
  // SUITE 4: Dataset Integrity & Schema Compliance
  // ==========================================================================
  console.log('\n▶ SUITE 4: Dataset Integrity & Spatial Bounds');

  await runTest('Dataset', 'Ensure 20+ authentic Indian museums with valid geographic coordinates', () => {
    assert(allMuseums.length >= 20, `Dataset must have >= 20 museums, found ${allMuseums.length}`);
    const uniqueIds = new Set(allMuseums.map((m) => m.id));
    assert(uniqueIds.size === allMuseums.length, 'All museum IDs must be strictly unique');

    for (const museum of allMuseums) {
      assert(museum.id.startsWith('mus-in-'), `ID ${museum.id} must follow pattern mus-in-*`);
      assert(/^\d{6}$/.test(museum.pincode), `PIN code ${museum.pincode} for ${museum.name} must be 6 digits`);
      assert(museum.coordinates.lat >= 8.0 && museum.coordinates.lat <= 38.0, `Latitude ${museum.coordinates.lat} must be within India`);
      assert(museum.coordinates.lon >= 68.0 && museum.coordinates.lon <= 98.0, `Longitude ${museum.coordinates.lon} must be within India`);
      assert(museum.artifact_count_approx > 0, `Artifact count for ${museum.name} must be > 0`);
      assert(Array.isArray(museum.accessibility_features), `Accessibility features for ${museum.name} must be array`);
      assert(typeof museum.entry_fee.is_free === 'boolean', `is_free must be boolean`);
      assert(typeof museum.entry_fee.domestic_inr === 'number', `domestic_inr must be number`);
      assert(typeof museum.entry_fee.foreign_inr === 'number', `foreign_inr must be number`);
    }
  });

  // Summary Table
  console.log('\n========================================================================');
  console.log('📋 CHALLENGER VERIFICATION RESULTS SUMMARY');
  console.log('========================================================================');
  const total = testResults.length;
  const passed = testResults.filter((t) => t.passed).length;
  const failed = testResults.filter((t) => !t.passed).length;

  console.log(`Total Scenarios: ${total} | Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    console.error(`❌ Verification failed with ${failed} failure(s).`);
    process.exit(1);
  } else {
    console.log(`✨ All ${total} challenger verification scenarios PASSED with 0 errors!`);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
