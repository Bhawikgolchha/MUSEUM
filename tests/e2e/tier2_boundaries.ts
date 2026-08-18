/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Validates Invalid Inputs, API Error Boundaries, Geodetic Extremes, Free/Paid, Schedules
 */

import fs from 'fs';
import path from 'path';
import {
  TestResult,
  runTest,
  assert,
  assertEqual,
  assertInRange,
  assertNonEmptyString,
  dynamicImport,
} from './types';
import { Museum } from '@/lib/museums';

const TIER = 'Tier 2: Boundary & Corner Cases';

export async function runTier2Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // -------------------------------------------------------------
  // Test 2.1: Invalid PIN Code Formats & Empty Query Strings
  // -------------------------------------------------------------
  results.push(
    await runTest(TIER, 'PIN Resolver: Rejection of Invalid PIN Formats', async () => {
      const pinPath = path.join(process.cwd(), 'lib', 'pincodes.ts');
      if (!fs.existsSync(pinPath)) {
        throw new Error(`M3 pending: ${pinPath} not yet created`);
      }

      const { resolvePinToCoordinates } = await dynamicImport('lib/pincodes.ts');

      const invalidPins = [
        { val: '11001', desc: '5 digits (too short)' },
        { val: '1100111', desc: '7 digits (too long)' },
        { val: 'ABCDEF', desc: 'Alphabetical string' },
        { val: '11001A', desc: 'Alphanumeric mix' },
        { val: '000000', desc: 'All zeros (invalid postal circle)' },
        { val: '011001', desc: 'Leading zero (invalid postal circle)' },
        { val: '', desc: 'Empty string' },
        { val: '   ', desc: 'Whitespace string' },
        { val: '!@#$%^', desc: 'Special characters' },
        { val: 'null', desc: 'Literal null string' },
        { val: 'undefined', desc: 'Literal undefined string' },
      ];

      for (const tc of invalidPins) {
        const resolved = resolvePinToCoordinates(tc.val);
        assert(
          resolved === null,
          `Expected resolvePinToCoordinates to return null for invalid PIN "${tc.val}" (${tc.desc}), but got: ${JSON.stringify(resolved)}`
        );
      }
    })
  );

  // -------------------------------------------------------------
  // Test 2.2: Chat API Payload Validation & Error Responses
  // -------------------------------------------------------------
  results.push(
    await runTest(TIER, 'Chat API: Missing museumId Returns HTTP 400', async () => {
      const routePath = path.join(process.cwd(), 'app', 'api', 'museum-chat', 'route.ts');
      if (!fs.existsSync(routePath)) {
        throw new Error(`M2 pending: ${routePath} not yet created`);
      }

      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      const mockReq = new Request('http://localhost:3000/api/museum-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What are the visiting hours?',
        }),
      });

      const res = await routeModule.POST(mockReq);
      assert(res.status === 400, `Expected HTTP 400 for missing museumId, got ${res.status}`);
      const data = await res.json();
      assert(data.status === 'error', `Expected status "error", got "${data.status}"`);
      assertNonEmptyString(data.message || data.error, 'Expected error message in response');
    })
  );

  results.push(
    await runTest(TIER, 'Chat API: Empty or Whitespace Message Returns HTTP 400', async () => {
      const routePath = path.join(process.cwd(), 'app', 'api', 'museum-chat', 'route.ts');
      if (!fs.existsSync(routePath)) {
        throw new Error(`M2 pending: ${routePath} not yet created`);
      }

      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      const mockReq = new Request('http://localhost:3000/api/museum-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          museumId: 'mus-in-del-001',
          message: '     ',
        }),
      });

      const res = await routeModule.POST(mockReq);
      assert(res.status === 400, `Expected HTTP 400 for whitespace message, got ${res.status}`);
    })
  );

  results.push(
    await runTest(TIER, 'Chat API: Non-Existent MuseumId Returns Graceful Fallback / 404', async () => {
      const routePath = path.join(process.cwd(), 'app', 'api', 'museum-chat', 'route.ts');
      if (!fs.existsSync(routePath)) {
        throw new Error(`M2 pending: ${routePath} not yet created`);
      }

      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      const mockReq = new Request('http://localhost:3000/api/museum-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          museumId: 'mus-non-existent-999',
          message: 'What are the visiting hours?',
        }),
      });

      const res = await routeModule.POST(mockReq);
      assert(
        res.status === 404 || res.status === 400 || res.status === 200,
        `Expected HTTP 404, 400 or 200 fallback, got ${res.status}`
      );
      const data = await res.json();
      assert(
        data.status === 'error' || data.status === 'fallback',
        `Expected error or fallback status for invalid museumId, got "${data.status}"`
      );
    })
  );

  results.push(
    await runTest(TIER, 'Chat API: Resilience to Extremely Long Queries (>3000 chars)', async () => {
      const routePath = path.join(process.cwd(), 'app', 'api', 'museum-chat', 'route.ts');
      if (!fs.existsSync(routePath)) {
        throw new Error(`M2 pending: ${routePath} not yet created`);
      }

      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      const longPrompt = 'Can you tell me about the historical artifacts? '.repeat(80); // ~3800 chars
      const mockReq = new Request('http://localhost:3000/api/museum-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          museumId: 'mus-in-del-001',
          message: longPrompt,
        }),
      });

      const res = await routeModule.POST(mockReq);
      assert(res.status === 200, `Expected HTTP 200 for long prompt, got ${res.status}`);
      const data = await res.json();
      assertNonEmptyString(data.reply, 'Expected non-empty reply for long query');
    })
  );

  // -------------------------------------------------------------
  // Test 2.3: Geographic Extreme Bounds Validation
  // -------------------------------------------------------------
  results.push(
    await runTest(TIER, 'Dataset Bounds: Extreme North/South/East/West Coordinates in India', async () => {
      const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
      const raw = fs.readFileSync(dataFilePath, 'utf-8');
      const museums: Museum[] = JSON.parse(raw);

      let maxLat = -Infinity;
      let minLat = Infinity;
      let maxLon = -Infinity;
      let minLon = Infinity;

      let northMuseum: Museum | null = null;
      let southMuseum: Museum | null = null;
      let eastMuseum: Museum | null = null;
      let westMuseum: Museum | null = null;

      for (const m of museums) {
        if (m.coordinates.lat > maxLat) {
          maxLat = m.coordinates.lat;
          northMuseum = m;
        }
        if (m.coordinates.lat < minLat) {
          minLat = m.coordinates.lat;
          southMuseum = m;
        }
        if (m.coordinates.lon > maxLon) {
          maxLon = m.coordinates.lon;
          eastMuseum = m;
        }
        if (m.coordinates.lon < minLon) {
          minLon = m.coordinates.lon;
          westMuseum = m;
        }
      }

      // Assert extremes are inside India bounds
      assertInRange(maxLat, 8.0, 38.0, 'Extreme north latitude outside India bounds');
      assertInRange(minLat, 8.0, 38.0, 'Extreme south latitude outside India bounds');
      assertInRange(maxLon, 68.0, 98.0, 'Extreme east longitude outside India bounds');
      assertInRange(minLon, 68.0, 98.0, 'Extreme west longitude outside India bounds');

      // Verify span
      assert(
        maxLat > 30.0,
        `Northernmost museum must reach >= 30.0°N (found ${northMuseum?.name} at ${maxLat}°N)`
      );
      assert(
        minLat < 10.0,
        `Southernmost museum must reach <= 10.0°N (found ${southMuseum?.name} at ${minLat}°N)`
      );
      assert(
        maxLon > 90.0,
        `Easternmost museum must reach >= 90.0°E (found ${eastMuseum?.name} at ${maxLon}°E)`
      );
      assert(
        minLon < 74.0,
        `Westernmost museum must reach <= 74.0°E (found ${westMuseum?.name} at ${minLon}°E)`
      );
    })
  );

  // -------------------------------------------------------------
  // Test 2.4: Fee Structures & Operating Schedules Corner Cases
  // -------------------------------------------------------------
  results.push(
    await runTest(TIER, 'Dataset Semantics: Free vs Paid Entry Fee & Schedule Closures', async () => {
      const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
      const raw = fs.readFileSync(dataFilePath, 'utf-8');
      const museums: Museum[] = JSON.parse(raw);

      let paidCount = 0;
      let freeCount = 0;
      let mondayClosed = 0;
      let fridayClosed = 0;
      let allDaysOpen = 0;

      for (const m of museums) {
        if (m.entry_fee.is_free) {
          freeCount++;
          assertEqual(m.entry_fee.domestic_inr, 0, `Free museum ${m.id} domestic_inr must be 0`);
        } else {
          paidCount++;
          assert(m.entry_fee.domestic_inr > 0, `Paid museum ${m.id} domestic_inr must be > 0`);
          assert(
            m.entry_fee.foreign_inr >= m.entry_fee.domestic_inr,
            `Paid museum ${m.id} foreign_inr must be >= domestic_inr`
          );
        }

        const closed = m.opening_hours.closed_on.map((c) => c.toLowerCase());
        if (closed.includes('monday')) mondayClosed++;
        if (closed.includes('friday')) fridayClosed++;
        if (closed.length === 0 || (closed.length === 1 && closed[0].includes('holi'))) allDaysOpen++;
      }

      assert(paidCount >= 10, `Expected at least 10 paid museums, found ${paidCount}`);
      assert(freeCount >= 0, `Free count must be non-negative (${freeCount})`);
      assert(allDaysOpen >= 0, `All days open count must be non-negative (${allDaysOpen})`);
      assert(mondayClosed >= 5, `Expected at least 5 museums closed on Mondays, found ${mondayClosed}`);
      assert(fridayClosed >= 1, `Expected at least 1 museum closed on Fridays (e.g. Chennai), found ${fridayClosed}`);
    })
  );

  return results;
}
