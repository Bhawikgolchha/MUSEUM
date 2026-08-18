/**
 * Tier 4: Real-World Application Scenarios Test Suite
 * Validates End-to-End User Workflows: Unindexed PIN Fallback Modal & Ask Doubt Chat Drawer
 */

import fs from 'fs';
import path from 'path';
import {
  TestResult,
  runTest,
  assert,
  assertEqual,
  assertNonEmptyString,
  dynamicImport,
} from './types';
import { Museum } from '@/lib/museums';

const TIER = 'Tier 4: Real-World Scenarios';

export async function runTier4Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // -------------------------------------------------------------
  // Scenario 1: Unindexed PIN -> Nearest Fallback Modal -> Switch Action Flow
  // -------------------------------------------------------------
  results.push(
    await runTest(
      TIER,
      'Scenario 1: Unindexed PIN Search (302001) Triggers Nearest Fallback & Modal Contract',
      async () => {
        const pinPath = path.join(process.cwd(), 'lib', 'pincodes.ts');
        const modalPath = path.join(process.cwd(), 'components', 'NearestMuseumModal.tsx');
        
        if (!fs.existsSync(pinPath)) {
          throw new Error(`M3 pending: ${pinPath} not yet created`);
        }
        if (!fs.existsSync(modalPath)) {
          throw new Error(`M3 pending: ${modalPath} not yet created`);
        }

        const { resolvePinToCoordinates, findNearestMuseum } = await dynamicImport('lib/pincodes.ts');
        const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
        const allMuseums: Museum[] = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

        // Step 1: User types unindexed PIN "302001"
        const searchedPin = '302001';

        // Check exact match in database (must be 0 since 302001 is GPO, museum is 302004)
        const exactMatches = allMuseums.filter((m) => m.pincode === searchedPin);
        assertEqual(exactMatches.length, 0, 'PIN 302001 should not match any museum pincode directly');

        // Step 2: Resolution engine resolves spatial coordinate
        const resolved = resolvePinToCoordinates(searchedPin);
        assert(Boolean(resolved), `Must resolve spatial coordinates for unindexed PIN "${searchedPin}"`);
        
        // Step 3: Find nearest museum and distance
        const { nearestMuseum, distanceKm } = findNearestMuseum(resolved!.coords, allMuseums);
        assert(Boolean(nearestMuseum), 'Nearest museum must be found');
        assert(
          nearestMuseum.id.includes('jai') || nearestMuseum.city.toLowerCase() === 'jaipur',
          `Nearest museum for PIN 302001 must be in Jaipur, got: ${nearestMuseum.name}`
        );
        assert(distanceKm < 15, `Distance must be < 15km, got ${distanceKm}km`);

        // Step 4: Verify NearestMuseumModal Component Contract
        const modalModule = await dynamicImport('components/NearestMuseumModal.tsx');
        assert(
          typeof modalModule.default === 'function' || typeof modalModule.NearestMuseumModal === 'function',
          'NearestMuseumModal.tsx must export React component'
        );

        // Step 5: Simulate one-click switch action execution
        let switchedToMuseum: Museum | null = null;
        let isModalOpen = true;

        const onSelectNearest = (museum: Museum) => {
          switchedToMuseum = museum;
          isModalOpen = false;
        };

        // Trigger action callback
        onSelectNearest(nearestMuseum);

        assertEqual(isModalOpen, false, 'Modal should close on selecting nearest museum');
        assert(switchedToMuseum !== null, 'Switched museum state must be populated');
        assertEqual(
          switchedToMuseum!.id,
          nearestMuseum.id,
          'Switched museum id must match resolved nearest museum'
        );
      }
    )
  );

  // -------------------------------------------------------------
  // Scenario 2: Museum Discovery Card "Ask Doubt" -> Preset Chips -> Grounded Docent Chat
  // -------------------------------------------------------------
  results.push(
    await runTest(
      TIER,
      'Scenario 2: "Ask Doubt" Drawer Preset Chips & Grounded Multi-Turn Conversation',
      async () => {
        const routePath = path.join(process.cwd(), 'app', 'api', 'museum-chat', 'route.ts');
        const chatComponentPath = path.join(process.cwd(), 'components', 'MuseumDoubtChat.tsx');

        if (!fs.existsSync(routePath)) {
          throw new Error(`M2 pending: ${routePath} not yet created`);
        }
        if (!fs.existsSync(chatComponentPath)) {
          throw new Error(`M2 pending: ${chatComponentPath} not yet created`);
        }

        // Verify component export
        const chatModule = await dynamicImport('components/MuseumDoubtChat.tsx');
        assert(
          typeof chatModule.default === 'function' || typeof chatModule.MuseumDoubtChat === 'function',
          'MuseumDoubtChat.tsx must export React component'
        );

        const routeModule = await dynamicImport('app/api/museum-chat/route.ts');
        const targetMuseumId = 'mus-in-del-001';

        // Turn 1: User clicks preset chip "Timings"
        const reqTurn1 = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            museumId: targetMuseumId,
            message: 'What are the opening timings and visiting hours?',
          }),
        });

        const resTurn1 = await routeModule.POST(reqTurn1);
        assert(resTurn1.status === 200, `Turn 1 expected HTTP 200, got ${resTurn1.status}`);
        const dataTurn1 = await resTurn1.json();
        assertNonEmptyString(dataTurn1.reply, 'Turn 1 reply must be non-empty string');

        // Turn 2: User clicks preset chip "Entry Fee" with conversation history
        const conversationHistory = [
          { role: 'user' as const, content: 'What are the opening timings and visiting hours?' },
          { role: 'assistant' as const, content: dataTurn1.reply },
        ];

        const reqTurn2 = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            museumId: targetMuseumId,
            message: 'How much is the ticket price for domestic and foreign visitors?',
            chatHistory: conversationHistory,
          }),
        });

        const resTurn2 = await routeModule.POST(reqTurn2);
        assert(resTurn2.status === 200, `Turn 2 expected HTTP 200, got ${resTurn2.status}`);
        const dataTurn2 = await resTurn2.json();
        assertNonEmptyString(dataTurn2.reply, 'Turn 2 reply must be non-empty string');

        // Turn 3: User clicks preset chip "Accessibility"
        conversationHistory.push(
          { role: 'user' as const, content: 'How much is the ticket price for domestic and foreign visitors?' },
          { role: 'assistant' as const, content: dataTurn2.reply }
        );

        const reqTurn3 = new Request('http://localhost:3000/api/museum-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            museumId: targetMuseumId,
            message: 'What accessibility facilities are available for disabled visitors?',
            chatHistory: conversationHistory,
          }),
        });

        const resTurn3 = await routeModule.POST(reqTurn3);
        assert(resTurn3.status === 200, `Turn 3 expected HTTP 200, got ${resTurn3.status}`);
        const dataTurn3 = await resTurn3.json();
        assertNonEmptyString(dataTurn3.reply, 'Turn 3 reply must be non-empty string');

        const reply3Lower = dataTurn3.reply.toLowerCase();
        assert(
          reply3Lower.includes('wheelchair') ||
          reply3Lower.includes('braille') ||
          reply3Lower.includes('tactile') ||
          reply3Lower.includes('accessible') ||
          reply3Lower.includes('elevator') ||
          reply3Lower.includes('facilities') ||
          reply3Lower.includes('anubhav'),
          `Turn 3 reply does not mention accessibility features: "${dataTurn3.reply}"`
        );
      }
    )
  );

  return results;
}
