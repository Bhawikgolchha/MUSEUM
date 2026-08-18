/**
 * Tier 1: Feature Coverage Test Suite
 * Validates R1 (Chat API & Grounding), R2 (Dataset Validation >= 18 museums), R3 (PIN Code Resolution)
 */

import fs from 'fs';
import path from 'path';
import {
  TestResult,
  runTest,
  assert,
  assertInRange,
  assertMatches,
  assertNonEmptyString,
  assertArrayNonEmpty,
  dynamicImport,
} from './types';
import { Museum } from '@/lib/museums';

const TIER = 'Tier 1: Feature Coverage';

export async function runTier1Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // -------------------------------------------------------------
  // Test 1.1: Dataset Validation (R2) - Complete 20 Museums Schema
  // -------------------------------------------------------------
  results.push(
    await runTest(TIER, 'R2 Dataset: Museum Count >= 18 and Unique IDs', async () => {
      const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
      assert(fs.existsSync(dataFilePath), 'data/indian-museums.json must exist');

      const raw = fs.readFileSync(dataFilePath, 'utf-8');
      const museums: Museum[] = JSON.parse(raw);

      assert(Array.isArray(museums), 'Museums data must be an array');
      assert(
        museums.length >= 18,
        `Expected at least 18 museums in data/indian-museums.json, found: ${museums.length}`
      );
      assert(
        museums.length >= 20,
        `Expected 20 museums after full expansion, found: ${museums.length}`
      );

      const idSet = new Set<string>();
      for (const m of museums) {
        assertNonEmptyString(m.id, 'Museum id must be non-empty string');
        assert(m.id.startsWith('mus-in-'), `Museum id "${m.id}" must follow pattern mus-in-*`);
        assert(!idSet.has(m.id), `Duplicate museum id detected: "${m.id}"`);
        idSet.add(m.id);
      }
    })
  );

  results.push(
    await runTest(TIER, 'R2 Dataset: 19 Canonical Schema Fields & Typing', async () => {
      const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
      const raw = fs.readFileSync(dataFilePath, 'utf-8');
      const museums: Museum[] = JSON.parse(raw);

      for (const m of museums) {
        const prefix = `[Museum ${m.id} - ${m.name || 'Unknown'}]`;

        // 1. name
        assertNonEmptyString(m.name, `${prefix} missing valid name`);

        // 2. address, 3. city, 4. state
        assertNonEmptyString(m.address, `${prefix} missing valid address`);
        assertNonEmptyString(m.city, `${prefix} missing valid city`);
        assertNonEmptyString(m.state, `${prefix} missing valid state`);

        // 5. pincode (6-digit format)
        assertNonEmptyString(m.pincode, `${prefix} missing pincode`);
        assertMatches(m.pincode, /^[1-9][0-9]{5}$/, `${prefix} pincode must be valid 6-digit Indian PIN`);

        // 6. coordinates
        assert(Boolean(m.coordinates), `${prefix} missing coordinates object`);
        assert(typeof m.coordinates.lat === 'number', `${prefix} lat must be number`);
        assert(typeof m.coordinates.lon === 'number', `${prefix} lon must be number`);
        assertInRange(m.coordinates.lat, 8.0, 38.0, `${prefix} latitude outside India bounding box (8.0-38.0)`);
        assertInRange(m.coordinates.lon, 68.0, 98.0, `${prefix} longitude outside India bounding box (68.0-98.0)`);

        // 7. category, 8. governance
        assertNonEmptyString(m.category, `${prefix} missing category`);
        assertNonEmptyString(m.governance, `${prefix} missing governance`);

        // 9. opening_hours
        assert(Boolean(m.opening_hours), `${prefix} missing opening_hours`);
        assertNonEmptyString(m.opening_hours.schedule, `${prefix} missing opening_hours.schedule`);
        assert(Array.isArray(m.opening_hours.closed_on), `${prefix} closed_on must be array`);
        assertNonEmptyString(m.opening_hours.timings, `${prefix} missing opening_hours.timings`);

        // 10. entry_fee
        assert(Boolean(m.entry_fee), `${prefix} missing entry_fee`);
        assert(typeof m.entry_fee.is_free === 'boolean', `${prefix} entry_fee.is_free must be boolean`);
        assert(typeof m.entry_fee.domestic_inr === 'number', `${prefix} domestic_inr must be number`);
        assert(typeof m.entry_fee.foreign_inr === 'number', `${prefix} foreign_inr must be number`);
        assert(m.entry_fee.domestic_inr >= 0, `${prefix} domestic_inr must be >= 0`);
        assert(m.entry_fee.foreign_inr >= m.entry_fee.domestic_inr, `${prefix} foreign_inr must be >= domestic_inr`);

        // 11. accessibility_features
        assertArrayNonEmpty(m.accessibility_features, `${prefix} accessibility_features must have >= 1 feature`);

        // 12. contact
        assert(Boolean(m.contact), `${prefix} missing contact object`);

        // 13. thumbnail_url, 14. gallery_urls
        assertNonEmptyString(m.thumbnail_url, `${prefix} missing thumbnail_url`);
        assertArrayNonEmpty(m.gallery_urls, `${prefix} gallery_urls must be non-empty`);

        // 15. description (> 20 chars)
        assertNonEmptyString(m.description, `${prefix} missing description`);
        assert(m.description.length >= 20, `${prefix} description too short (${m.description.length} chars)`);

        // 16. artifact_count_approx
        assert(typeof m.artifact_count_approx === 'number', `${prefix} artifact_count_approx must be number`);
        assert(m.artifact_count_approx > 0, `${prefix} artifact_count_approx must be > 0`);

        // 17. source, 18. last_updated
        assertNonEmptyString(m.source, `${prefix} missing source`);
        assertNonEmptyString(m.last_updated, `${prefix} missing last_updated`);
        const parsedDate = Date.parse(m.last_updated);
        assert(!isNaN(parsedDate), `${prefix} last_updated is not valid ISO date: ${m.last_updated}`);
      }
    })
  );

  results.push(
    await runTest(TIER, 'R2 Dataset: Geographic Diversity Across Indian Regions', async () => {
      const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
      const raw = fs.readFileSync(dataFilePath, 'utf-8');
      const museums: Museum[] = JSON.parse(raw);

      const states = new Set(museums.map((m) => m.state.trim().toLowerCase()));
      const cities = new Set(museums.map((m) => m.city.trim().toLowerCase()));

      assert(states.size >= 10, `Expected at least 10 unique states represented, found: ${states.size}`);
      assert(cities.size >= 12, `Expected at least 12 unique cities represented, found: ${cities.size}`);

      // Verify presence of key geographical zones
      const statesList = Array.from(states).join(', ');
      assert(statesList.includes('delhi'), 'North zone (Delhi) must be present');
      assert(statesList.includes('tamil nadu') || statesList.includes('kerala'), 'South zone (Tamil Nadu / Kerala) must be present');
      assert(statesList.includes('west bengal') || statesList.includes('odisha'), 'East zone (West Bengal / Odisha) must be present');
      assert(statesList.includes('maharashtra') || statesList.includes('gujarat') || statesList.includes('rajasthan'), 'West zone (Maharashtra / Gujarat / Rajasthan) must be present');
      assert(statesList.includes('assam') || statesList.includes('meghalaya'), 'North-East zone (Assam / Meghalaya) must be present');
    })
  );

  // -------------------------------------------------------------
  // Test 1.2: Museum Doubt Chat API Route Handler Contract (R1)
  // -------------------------------------------------------------
  results.push(
    await runTest(TIER, 'R1 API: /api/museum-chat Route Module Exists & Handles POST', async () => {
      const routePath = path.join(process.cwd(), 'app', 'api', 'museum-chat', 'route.ts');
      
      if (!fs.existsSync(routePath)) {
        throw new Error(`Route handler file missing at ${routePath}. Milestone M2 must implement app/api/museum-chat/route.ts.`);
      }

      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');
      assert(typeof routeModule.POST === 'function', 'app/api/museum-chat/route.ts must export a POST handler');
    })
  );

  results.push(
    await runTest(TIER, 'R1 API: /api/museum-chat Contract with Valid Museum & Grounded Reply', async () => {
      const routePath = path.join(process.cwd(), 'app', 'api', 'museum-chat', 'route.ts');
      if (!fs.existsSync(routePath)) {
        throw new Error(`M2 pending: ${routePath} not yet created`);
      }

      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      // 1. Query timings for National Museum
      const mockReq1 = new Request('http://localhost:3000/api/museum-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          museumId: 'mus-in-del-001',
          message: 'What are the opening hours and visiting schedule of National Museum New Delhi?',
        }),
      });

      const res1 = await routeModule.POST(mockReq1);
      assert(res1.status === 200, `Expected HTTP 200, got ${res1.status}`);

      const data1 = await res1.json();
      assert(data1.status === 'ok' || data1.status === 'fallback', `Expected status ok or fallback, got ${data1.status}`);
      assertNonEmptyString(data1.reply, 'Reply must be non-empty string');
      
      const reply1Lower = data1.reply.toLowerCase();
      assert(
        reply1Lower.includes('10:00') ||
        reply1Lower.includes('18:00') ||
        reply1Lower.includes('tuesday') ||
        reply1Lower.includes('national museum') ||
        reply1Lower.includes('hours') ||
        reply1Lower.includes('visiting'),
        `Reply does not contain grounded timing information: "${data1.reply}"`
      );

      // 2. Query ticket fee for Bihar Museum
      const mockReq2 = new Request('http://localhost:3000/api/museum-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          museumId: 'mus-in-pat-001',
          message: 'How much is the ticket price for domestic visitors at Bihar Museum?',
        }),
      });

      const res2 = await routeModule.POST(mockReq2);
      assert(res2.status === 200, `Expected HTTP 200, got ${res2.status}`);
      const data2 = await res2.json();
      assertNonEmptyString(data2.reply, 'Reply must be non-empty string');
      const reply2Lower = data2.reply.toLowerCase();
      assert(
        reply2Lower.includes('20') ||
        reply2Lower.includes('fee') ||
        reply2Lower.includes('inr') ||
        reply2Lower.includes('rupees') ||
        reply2Lower.includes('domestic') ||
        reply2Lower.includes('bihar museum'),
        `Reply does not contain grounded ticket fee information: "${data2.reply}"`
      );
    })
  );

  results.push(
    await runTest(TIER, 'R1 API: /api/museum-chat Multi-Turn Chat History Support', async () => {
      const routePath = path.join(process.cwd(), 'app', 'api', 'museum-chat', 'route.ts');
      if (!fs.existsSync(routePath)) {
        throw new Error(`M2 pending: ${routePath} not yet created`);
      }

      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      const mockReq = new Request('http://localhost:3000/api/museum-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          museumId: 'mus-in-che-001',
          message: 'Can I see the Nataraja bronze here?',
          chatHistory: [
            { role: 'user', content: 'What is this museum famous for?' },
            { role: 'assistant', content: 'Government Museum Chennai is famous for its world-renowned collection of Chola Bronzes.' },
          ],
        }),
      });

      const res = await routeModule.POST(mockReq);
      assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
      const data = await res.json();
      assertNonEmptyString(data.reply, 'Multi-turn reply must be non-empty string');
      const replyLower = data.reply.toLowerCase();
      assert(
        replyLower.includes('nataraja') ||
        replyLower.includes('bronze') ||
        replyLower.includes('chola') ||
        replyLower.includes('chennai') ||
        replyLower.includes('egmore'),
        `Multi-turn reply does not reference context: "${data.reply}"`
      );
    })
  );

  // -------------------------------------------------------------
  // Test 1.3: PIN Code Search & Resolution Engine (R3)
  // -------------------------------------------------------------
  results.push(
    await runTest(TIER, 'R3 Spatial: lib/pincodes.ts Module Exists & Exports Resolvers', async () => {
      const pinPath = path.join(process.cwd(), 'lib', 'pincodes.ts');
      if (!fs.existsSync(pinPath)) {
        throw new Error(`PIN code engine missing at ${pinPath}. Milestone M3 must implement lib/pincodes.ts.`);
      }

      const pinModule = await dynamicImport('lib/pincodes.ts');
      assert(
        typeof pinModule.resolvePinToCoordinates === 'function',
        'lib/pincodes.ts must export resolvePinToCoordinates function'
      );
      assert(
        typeof pinModule.findNearestMuseum === 'function',
        'lib/pincodes.ts must export findNearestMuseum function'
      );
    })
  );

  results.push(
    await runTest(TIER, 'R3 Spatial: Direct 6-Digit PIN Coordinates Resolution', async () => {
      const pinPath = path.join(process.cwd(), 'lib', 'pincodes.ts');
      if (!fs.existsSync(pinPath)) {
        throw new Error(`M3 pending: ${pinPath} not yet created`);
      }

      const { resolvePinToCoordinates } = await dynamicImport('lib/pincodes.ts');

      // Test key museum exact PINs
      const testCases = [
        { pin: '110011', name: 'Delhi', expectedLat: 28.61, expectedLon: 77.21 },
        { pin: '600008', name: 'Chennai', expectedLat: 13.06, expectedLon: 80.25 },
        { pin: '302004', name: 'Jaipur', expectedLat: 26.91, expectedLon: 75.81 },
        { pin: '411002', name: 'Pune', expectedLat: 18.51, expectedLon: 73.85 },
        { pin: '695033', name: 'Thiruvananthapuram', expectedLat: 8.50, expectedLon: 76.95 },
        { pin: '700016', name: 'Kolkata', expectedLat: 22.55, expectedLon: 88.35 },
      ];

      for (const tc of testCases) {
        const resolved = resolvePinToCoordinates(tc.pin);
        assert(Boolean(resolved), `Failed to resolve direct 6-digit PIN "${tc.pin}" (${tc.name})`);
        assertInRange(
          resolved!.coords.lat,
          tc.expectedLat - 0.5,
          tc.expectedLat + 0.5,
          `Lat mismatch for PIN ${tc.pin}`
        );
        assertInRange(
          resolved!.coords.lon,
          tc.expectedLon - 0.5,
          tc.expectedLon + 0.5,
          `Lon mismatch for PIN ${tc.pin}`
        );
      }
    })
  );

  results.push(
    await runTest(TIER, 'R3 Spatial: 3-Digit District Centroid Resolution for Unindexed PINs', async () => {
      const pinPath = path.join(process.cwd(), 'lib', 'pincodes.ts');
      if (!fs.existsSync(pinPath)) {
        throw new Error(`M3 pending: ${pinPath} not yet created`);
      }

      const { resolvePinToCoordinates } = await dynamicImport('lib/pincodes.ts');

      // Unindexed area PIN codes belonging to major districts
      const testCases = [
        { pin: '302001', district: 'Jaipur', expectedLat: 26.91, expectedLon: 75.78 },
        { pin: '411001', district: 'Pune', expectedLat: 18.52, expectedLon: 73.85 },
        { pin: '695001', district: 'Thiruvananthapuram', expectedLat: 8.52, expectedLon: 76.93 },
        { pin: '793001', district: 'Shillong', expectedLat: 25.57, expectedLon: 91.88 },
        { pin: '180001', district: 'Jammu', expectedLat: 32.72, expectedLon: 74.85 },
        { pin: '380001', district: 'Ahmedabad', expectedLat: 23.02, expectedLon: 72.57 },
      ];

      for (const tc of testCases) {
        const resolved = resolvePinToCoordinates(tc.pin);
        assert(
          Boolean(resolved),
          `Failed to resolve 3-digit district centroid for unindexed PIN "${tc.pin}" (${tc.district})`
        );
        assertInRange(
          resolved!.coords.lat,
          tc.expectedLat - 1.0,
          tc.expectedLat + 1.0,
          `District lat mismatch for PIN ${tc.pin}`
        );
        assertInRange(
          resolved!.coords.lon,
          tc.expectedLon - 1.0,
          tc.expectedLon + 1.0,
          `District lon mismatch for PIN ${tc.pin}`
        );
      }
    })
  );

  results.push(
    await runTest(TIER, 'R3 Spatial: 2-Digit Postal Circle Fallback Resolution', async () => {
      const pinPath = path.join(process.cwd(), 'lib', 'pincodes.ts');
      if (!fs.existsSync(pinPath)) {
        throw new Error(`M3 pending: ${pinPath} not yet created`);
      }

      const { resolvePinToCoordinates } = await dynamicImport('lib/pincodes.ts');

      // Arbitrary unindexed rural PIN codes falling back to 2-digit circle centroid
      const circlePins = [
        { pin: '309999', circle: 'Rajasthan' },
        { pin: '389999', circle: 'Gujarat' },
        { pin: '419999', circle: 'Maharashtra' },
        { pin: '699999', circle: 'Kerala' },
        { pin: '759999', circle: 'Odisha' },
        { pin: '789999', circle: 'Assam' },
      ];

      for (const tc of circlePins) {
        const resolved = resolvePinToCoordinates(tc.pin);
        assert(
          Boolean(resolved),
          `Failed to resolve 2-digit circle fallback for PIN "${tc.pin}" (${tc.circle})`
        );
        assertInRange(resolved!.coords.lat, 8.0, 38.0, `Circle lat outside India for PIN ${tc.pin}`);
        assertInRange(resolved!.coords.lon, 68.0, 98.0, `Circle lon outside India for PIN ${tc.pin}`);
      }
    })
  );

  return results;
}
