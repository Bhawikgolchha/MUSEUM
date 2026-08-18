/**
 * Challenger 2 Empirical Test Suite
 * 
 * Validates:
 * 1. Offline Deterministic Fallback Synthesis across /api/muse, /api/pincode-history, /api/museum-chat, /api/verify
 * 2. Response validation, schema conformity, error handling, performance SLA
 * 3. Mobile responsiveness constraints and layout inspection
 */

import { NextRequest } from 'next/server';
import { POST as musePost } from '../app/api/muse/route';
import { GET as pincodeGet, POST as pincodePost } from '../app/api/pincode-history/route';
import { POST as museumChatPost } from '../app/api/museum-chat/route';
import { POST as verifyPost } from '../app/api/verify/route';
import fs from 'fs';
import path from 'path';

// Force 100% offline environment by stripping any API keys
process.env.OPENROUTER_API_KEY = '';
process.env.ANTHROPIC_API_KEY = '';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    const msg = `  [FAIL] ${testName}${details ? ` -> ${details}` : ''}`;
    console.error(msg);
    failures.push(msg);
  }
}

async function runOfflineSynthesisTests() {
  console.log('\n======================================================');
  console.log('PART 1: Offline Deterministic Fallback Synthesis Tests');
  console.log('======================================================');

  // ---------------------------------------------------------
  // 1. /api/muse Offline Synthesis Tests
  // ---------------------------------------------------------
  console.log('\n--- 1. Testing /api/muse ---');

  // Test 1.1: Adult Persona
  {
    const req = new NextRequest('http://localhost:3000/api/muse', {
      method: 'POST',
      body: JSON.stringify({
        artifactId: 'art-001',
        persona: { audience: 'adult', depth: 'standard', accessibility: false },
      }),
    });
    const res = await musePost(req);
    const data = await res.json();
    assert(res.status === 200, 'muse: adult standard returns 200');
    assert(data.status === 'ok', 'muse: adult standard status is ok');
    assert(!!data.variant, 'muse: variant is present');
    assert(data.variant.sections.length >= 2, 'muse: variant has >= 2 sections');
    assert(data.variant.lookCloser.length >= 1, 'muse: lookCloser has items');
    assert(data.variant.fidelity.verdict === 'pass', 'muse: fidelity verdict is pass');
    assert(data.variant.fidelity.covered === data.variant.fidelity.total, 'muse: 100% claims covered');
  }

  // Test 1.2: Child Persona
  {
    const req = new NextRequest('http://localhost:3000/api/muse', {
      method: 'POST',
      body: JSON.stringify({
        artifactId: 'art-001',
        persona: { audience: 'child', depth: 'quick', accessibility: false },
      }),
    });
    const res = await musePost(req);
    const data = await res.json();
    assert(res.status === 200, 'muse: child quick returns 200');
    assert(data.status === 'ok', 'muse: child quick status is ok');
    assert(data.variant.sections.length >= 2, 'muse: child sections present');
    assert(data.variant.glossary.length >= 1, 'muse: child glossary present');
    assert(data.variant.changelog.operations.includes('simplified_vocabulary:grade4'), 'muse: child simplified vocabulary logged');
  }

  // Test 1.3: Specialist Persona
  {
    const req = new NextRequest('http://localhost:3000/api/muse', {
      method: 'POST',
      body: JSON.stringify({
        artifactId: 'art-002',
        persona: { audience: 'specialist', depth: 'deep', accessibility: false },
      }),
    });
    const res = await musePost(req);
    const data = await res.json();
    assert(res.status === 200, 'muse: specialist deep returns 200');
    assert(data.status === 'ok', 'muse: specialist deep status is ok');
    assert(data.variant.readingTimeSeconds === 180, 'muse: specialist deep reading time is 180s');
    assert(data.variant.sections.some((s: any) => s.heading.includes('Formal & Material Analysis')), 'muse: specialist formal analysis section present');
  }

  // Test 1.4: Missing or invalid payload fallback
  {
    const req = new NextRequest('http://localhost:3000/api/muse', {
      method: 'POST',
      body: JSON.stringify({ artifactId: 'invalid-id', persona: { audience: 'adult', depth: 'standard' } }),
    });
    const res = await musePost(req);
    const data = await res.json();
    assert(data.status === 'fallback', 'muse: invalid artifactId gracefully returns fallback status');
  }

  // ---------------------------------------------------------
  // 2. /api/pincode-history Offline Synthesis Tests
  // ---------------------------------------------------------
  console.log('\n--- 2. Testing /api/pincode-history ---');

  // Test 2.1: Valid PIN codes across all Indian postal zones
  const samplePincodes = [
    { pin: '110001', name: 'Delhi', state: 'Delhi' },
    { pin: '143001', name: 'Amritsar', state: 'Punjab' },
    { pin: '171001', name: 'Shimla', state: 'Himachal Pradesh' },
    { pin: '221001', name: 'Varanasi', state: 'Uttar Pradesh' },
    { pin: '302001', name: 'Jaipur', state: 'Rajasthan' },
    { pin: '400001', name: 'Mumbai', state: 'Maharashtra' },
    { pin: '560001', name: 'Bengaluru', state: 'Karnataka' },
    { pin: '600001', name: 'Chennai', state: 'Tamil Nadu' },
    { pin: '682001', name: 'Kochi', state: 'Kerala' },
    { pin: '700001', name: 'Kolkata', state: 'West Bengal' },
    { pin: '751001', name: 'Bhubaneswar', state: 'Odisha' },
    { pin: '781001', name: 'Guwahati', state: 'Assam' },
    { pin: '800001', name: 'Patna', state: 'Bihar' },
    { pin: '834001', name: 'Ranchi', state: 'Jharkhand' },
  ];

  for (const sample of samplePincodes) {
    const req = new NextRequest(`http://localhost:3000/api/pincode-history?pincode=${sample.pin}`);
    const res = await pincodeGet(req);
    const data = await res.json();
    assert(res.status === 200, `pincode-history: ${sample.pin} (${sample.name}) returns 200`);
    assert(data.status === 'success', `pincode-history: ${sample.pin} status is success`);
    assert(data.pincode === sample.pin, `pincode-history: ${sample.pin} echo matches`);
    assert(!!data.historical_brief.ancient_foundations, `pincode-history: ${sample.pin} ancient_foundations present`);
    assert(!!data.historical_brief.living_culture_crafts, `pincode-history: ${sample.pin} living_culture_crafts present`);
    assert(!!data.historical_brief.famous_lore_landmarks, `pincode-history: ${sample.pin} famous_lore_landmarks present`);
    assert(!!data.historical_brief.summary_one_liner, `pincode-history: ${sample.pin} summary_one_liner present`);
    assert(data.key_dynasties.length >= 2, `pincode-history: ${sample.pin} has >= 2 key dynasties`);
    assert(data.traditional_crafts.length >= 2, `pincode-history: ${sample.pin} has >= 2 traditional crafts`);
    assert(data.notable_monuments.length >= 2, `pincode-history: ${sample.pin} has >= 2 notable monuments`);
    assert(data.source === 'deterministic_offline_synthesis', `pincode-history: ${sample.pin} source is deterministic offline synthesis`);
  }

  // Test 2.2: Unmapped valid PIN code pan-Indian fallback (999999)
  {
    const req = new NextRequest('http://localhost:3000/api/pincode-history?pincode=999999');
    const res = await pincodeGet(req);
    const data = await res.json();
    assert(res.status === 200, 'pincode-history: 999999 unmapped pin returns 200');
    assert(data.status === 'success', 'pincode-history: 999999 returns valid success structure');
    assert(data.postal_circle.includes('National Postal Circle'), 'pincode-history: fallback to National Postal Circle');
  }

  // Test 2.3: POST method for pincode history
  {
    const req = new NextRequest('http://localhost:3000/api/pincode-history', {
      method: 'POST',
      body: JSON.stringify({ pincode: '560001' }),
    });
    const res = await pincodePost(req);
    const data = await res.json();
    assert(res.status === 200, 'pincode-history POST: 560001 returns 200');
    assert(data.status === 'success', 'pincode-history POST: status is success');
  }

  // Test 2.4: Invalid PIN format validation
  const invalidPins = ['12345', '1234567', '012345', 'ABCDEF', ''];
  for (const inv of invalidPins) {
    const req = new NextRequest(`http://localhost:3000/api/pincode-history?pincode=${inv}`);
    const res = await pincodeGet(req);
    const data = await res.json();
    assert(res.status === 400, `pincode-history: invalid PIN "${inv}" returns 400`);
    assert(data.status === 'error', `pincode-history: invalid PIN "${inv}" error status`);
  }

  // Test 2.5: In-memory LRU Cache latency benchmark
  {
    const t0 = performance.now();
    const req1 = new NextRequest('http://localhost:3000/api/pincode-history?pincode=110001');
    await pincodeGet(req1);
    const t1 = performance.now();
    const req2 = new NextRequest('http://localhost:3000/api/pincode-history?pincode=110001');
    const res2 = await pincodeGet(req2);
    const data2 = await res2.json();
    const t2 = performance.now();
    const cacheLatency = t2 - t1;
    assert(data2.cached === true, 'pincode-history: repeat query marked as cached');
    assert(cacheLatency < 10, `pincode-history: cache latency ${cacheLatency.toFixed(2)}ms satisfies SLA < 10ms`);
  }

  // ---------------------------------------------------------
  // 3. /api/museum-chat Offline Synthesis Tests
  // ---------------------------------------------------------
  console.log('\n--- 3. Testing /api/museum-chat ---');

  // Test 3.1: Specific artifact query (Nataraja Chola bronze)
  {
    const req = new NextRequest('http://localhost:3000/api/museum-chat', {
      method: 'POST',
      body: JSON.stringify({
        museumId: 'mus-in-che-001',
        question: 'Where can I see the famous Nataraja Chola bronze sculpture?',
      }),
    });
    const res = await museumChatPost(req);
    const data = await res.json();
    assert(res.status === 200, 'museum-chat: Nataraja query returns 200');
    assert(data.status === 'fallback', 'museum-chat: offline deterministic status is fallback');
    assert(data.reply.includes('Nataraja') && data.reply.includes('Chola'), 'museum-chat: reply contains Nataraja and Chola details');
    assert(data.modelUsed === 'deterministic-offline-engine', 'museum-chat: modelUsed is deterministic-offline-engine');
  }

  // Test 3.2: Visiting hours / timings query
  {
    const req = new NextRequest('http://localhost:3000/api/museum-chat', {
      method: 'POST',
      body: JSON.stringify({
        museumId: 'mus-in-del-001',
        question: 'What are the visiting hours and closed days for National Museum?',
      }),
    });
    const res = await museumChatPost(req);
    const data = await res.json();
    assert(res.status === 200, 'museum-chat: timings query returns 200');
    assert(data.reply.includes('open for visitors from'), 'museum-chat: reply details visiting timings');
    assert(data.groundingSources.fieldsReferenced.includes('opening_hours'), 'museum-chat: opening_hours grounded');
  }

  // Test 3.3: Ticket price query
  {
    const req = new NextRequest('http://localhost:3000/api/museum-chat', {
      method: 'POST',
      body: JSON.stringify({
        museumId: 'mus-in-del-001',
        question: 'How much does an entry ticket cost for Indian and foreign visitors?',
      }),
    });
    const res = await museumChatPost(req);
    const data = await res.json();
    assert(res.status === 200, 'museum-chat: ticket query returns 200');
    assert(data.reply.includes('₹'), 'museum-chat: reply details ticket fee in INR');
    assert(data.groundingSources.fieldsReferenced.includes('entry_fee'), 'museum-chat: entry_fee grounded');
  }

  // Test 3.4: Accessibility query
  {
    const req = new NextRequest('http://localhost:3000/api/museum-chat', {
      method: 'POST',
      body: JSON.stringify({
        museumId: 'mus-in-del-001',
        question: 'Are there wheelchair ramps and accessible facilities for elderly visitors?',
      }),
    });
    const res = await museumChatPost(req);
    const data = await res.json();
    assert(res.status === 200, 'museum-chat: accessibility query returns 200');
    assert(data.reply.toLowerCase().includes('wheelchair') || data.reply.toLowerCase().includes('accessible'), 'museum-chat: accessibility facilities detailed');
    assert(data.groundingSources.fieldsReferenced.includes('accessibility_features'), 'museum-chat: accessibility_features grounded');
  }

  // Test 3.5: Unknown facility query (canteen / parking / lockers)
  {
    const req = new NextRequest('http://localhost:3000/api/museum-chat', {
      method: 'POST',
      body: JSON.stringify({
        museumId: 'mus-in-del-001',
        question: 'What are the cafeteria canteen food options and vehicle parking tariffs?',
      }),
    });
    const res = await museumChatPost(req);
    const data = await res.json();
    assert(res.status === 200, 'museum-chat: unknown detail query returns 200');
    assert(data.reply.includes('not listed in the official directory'), 'museum-chat: admits unknown specifics gracefully');
  }
  {
    const req = new NextRequest('http://localhost:3000/api/museum-chat', {
      method: 'POST',
      body: JSON.stringify({
        museumId: 'mus-in-del-001',
        question: 'What is the locker dimension and luggage storage size?',
      }),
    });
    const res = await museumChatPost(req);
    const data = await res.json();
    assert(res.status === 200, 'museum-chat: locker dimension query returns 200');
    assert(data.reply.includes('not listed in the official directory'), 'museum-chat: admits locker dimensions not in official directory');
  }

  // Test 3.6: Invalid museumId error handling
  {
    const req = new NextRequest('http://localhost:3000/api/museum-chat', {
      method: 'POST',
      body: JSON.stringify({
        museumId: 'non-existent-museum',
        question: 'Hello?',
      }),
    });
    const res = await museumChatPost(req);
    assert(res.status === 404, 'museum-chat: non-existent museum returns 404');
  }

  // ---------------------------------------------------------
  // 4. /api/verify Offline Synthesis Tests
  // ---------------------------------------------------------
  console.log('\n--- 4. Testing /api/verify ---');

  // Test 4.1: Valid artifact & variant verification
  {
    const sampleVariant = {
      artifactId: 'art-001',
      persona: { audience: 'adult' as const, depth: 'standard' as const, accessibility: false },
      attribution: 'Based on museum description',
      aiDisclosure: 'Adapted for adult',
      tags: { tone: 'conversational', level: 'grade_9', tier: 'T1' as const },
      readingTimeSeconds: 60,
      sections: [
        { heading: 'Overview', body: 'The Dancing Girl of Mohenjo-daro is an iconic Indus Valley bronze sculpture dating to 2500 BCE.' },
        { heading: 'Significance', body: 'Discovered in Mohenjo-daro in 1926 by Ernest Mackay, cast using the lost-wax (cire perdue) process.' }
      ],
      lookCloser: ['Bangles on left arm', 'Slightly tilted head'],
      glossary: [],
      changelog: { operations: [], claimsCovered: ['c1', 'c2'], claimsOmitted: [], hedgesPreserved: true },
      fidelity: { verdict: 'pass' as const, covered: 6, total: 6, claims: [] }
    };

    const req = new NextRequest('http://localhost:3000/api/verify', {
      method: 'POST',
      body: JSON.stringify({
        artifactId: 'art-001',
        variant: sampleVariant,
      }),
    });
    const res = await verifyPost(req);
    const data = await res.json();
    assert(res.status === 200, 'verify: valid payload returns 200');
    assert(data.verdict === 'pass', 'verify: offline audit verdict is pass');
    assert(data.covered > 0, 'verify: covered claims > 0');
    assert(data.claims.length === data.total, 'verify: all claims listed in audit report');
  }

  // Test 4.2: Missing payload handling
  {
    const req = new NextRequest('http://localhost:3000/api/verify', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await verifyPost(req);
    const data = await res.json();
    assert(data.verdict === 'unverified', 'verify: missing payload returns unverified verdict');
  }
}

async function runResponsiveLayoutTests() {
  console.log('\n======================================================');
  console.log('PART 2: Mobile Responsiveness & Layout Constraint Audit');
  console.log('======================================================');

  const rootDir = path.resolve(__dirname, '..');

  // Check 1: globals.css overflow and responsive viewport setup
  const globalsCss = fs.readFileSync(path.join(rootDir, 'app', 'globals.css'), 'utf-8');
  assert(globalsCss.includes('overflow-x: hidden') || globalsCss.includes('overflow-x-hidden'), 'globals.css: contains overflow-x protection');
  assert(globalsCss.includes('--font-serif') && globalsCss.includes('--font-sans') && globalsCss.includes('--font-mono'), 'globals.css: typography CSS variables configured (--font-serif, --font-sans, --font-mono)');

  // Check 2: Root layout.tsx
  const layoutTsx = fs.readFileSync(path.join(rootDir, 'app', 'layout.tsx'), 'utf-8');
  assert(layoutTsx.includes('overflow-x-hidden'), 'layout.tsx: body has overflow-x-hidden class');
  assert(layoutTsx.includes('min-h-[100dvh]') || layoutTsx.includes('min-h-screen'), 'layout.tsx: body handles full dynamic viewport height');
  assert(layoutTsx.includes('px-4 sm:px-6 lg:px-8'), 'layout.tsx: main container defines responsive horizontal padding (px-4 sm:px-6 lg:px-8)');

  // Check 3: Page containers responsive padding and layout
  const pages = [
    { file: 'app/page.tsx', name: 'Gallery Showcase (Home)' },
    { file: 'app/explore/page.tsx', name: 'Spatial Heritage Canvas (Explore)' },
    { file: 'app/roots/page.tsx', name: 'Ancestral Roots (Roots)' },
    { file: 'app/add/page.tsx', name: 'Curator Ingestion Studio (Add)' },
    { file: 'components/ArtifactDetailClient.tsx', name: 'Artifact Detail & Auditor View' },
  ];

  for (const page of pages) {
    const pageContent = fs.readFileSync(path.join(rootDir, page.file), 'utf-8');
    const hasResponsivePadding =
      pageContent.includes('px-4') ||
      pageContent.includes('px-5') ||
      pageContent.includes('px-6') ||
      pageContent.includes('sm:px') ||
      pageContent.includes('p-4') ||
      pageContent.includes('p-5') ||
      pageContent.includes('p-6') ||
      pageContent.includes('space-y');
    assert(hasResponsivePadding, `${page.name} (${page.file}): has mobile-responsive padding/spacing`);
  }

  // Check 4: Dual-Column Exhibition Split (ArtifactDetailClient.tsx)
  const detailClient = fs.readFileSync(path.join(rootDir, 'components', 'ArtifactDetailClient.tsx'), 'utf-8');
  assert(
    detailClient.includes('grid-cols-1') && (detailClient.includes('lg:grid-cols-2') || detailClient.includes('md:grid-cols-2') || detailClient.includes('lg:grid-cols-12')),
    'ArtifactDetailClient.tsx: uses responsive 1-column mobile to multi-column desktop split grid'
  );
  assert(detailClient.includes('overflow-x-hidden') || detailClient.includes('overflow-hidden') || detailClient.includes('w-full'), 'ArtifactDetailClient.tsx: protected against horizontal viewport overflow');

  // Check 5: India SVG Map Responsiveness (IndiaMuseumMap.tsx)
  const mapComponent = fs.readFileSync(path.join(rootDir, 'components', 'IndiaMuseumMap.tsx'), 'utf-8');
  assert(mapComponent.includes('viewBox') || mapComponent.includes('w-full'), 'IndiaMuseumMap.tsx: SVG map uses responsive scaling / viewBox');
  assert(mapComponent.includes('overflow-hidden'), 'IndiaMuseumMap.tsx: map canvas container has overflow-hidden');

  // Check 6: Navbar and Footer Mobile Responsiveness
  const navbar = fs.readFileSync(path.join(rootDir, 'components', 'Navbar.tsx'), 'utf-8');
  assert(navbar.includes('px-4') && (navbar.includes('sm:px') || navbar.includes('md:px') || navbar.includes('max-w')), 'Navbar.tsx: has responsive container padding');

  const footer = fs.readFileSync(path.join(rootDir, 'components', 'Footer.tsx'), 'utf-8');
  assert(footer.includes('px-4') && (footer.includes('sm:px') || footer.includes('md:px') || footer.includes('max-w')), 'Footer.tsx: has responsive container padding');
}

async function main() {
  console.log('Starting Challenger 2 Empirical Test Suite...\n');
  const startTime = performance.now();

  try {
    await runOfflineSynthesisTests();
    await runResponsiveLayoutTests();
  } catch (err) {
    console.error('Fatal execution error during testing:', err);
    process.exit(1);
  }

  const duration = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (Failed: ${failedTests}) in ${duration}s`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    console.error(`FAILED TESTS (${failedTests}):`);
    failures.forEach((f) => console.error(f));
    process.exit(1);
  } else {
    console.log('ALL EMPIRICAL TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS.');
    process.exit(0);
  }
}

main();
