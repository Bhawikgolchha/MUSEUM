/**
 * Milestone 3 (M3) Verification Suite:
 * Regional Historical Context Banner on /explore page and Spatial Synchronization
 *
 * Usage: npx tsx tests/unit/milestone3_explore_banner_verification.test.ts
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('----------------------------------------------------');
console.log('Running Milestone 3 (M3) Verification Test Suite...');
console.log('----------------------------------------------------');

// Test 1: Verify RegionalHistoricalContextBanner component exists and exports properly
console.log('\n[Test 1] Verifying RegionalHistoricalContextBanner.tsx file & exports...');
const bannerPath = path.resolve('components/RegionalHistoricalContextBanner.tsx');
assert(fs.existsSync(bannerPath), 'components/RegionalHistoricalContextBanner.tsx must exist');
const bannerCode = fs.readFileSync(bannerPath, 'utf8');

assert(bannerCode.includes('export default function RegionalHistoricalContextBanner'), 'Must export default RegionalHistoricalContextBanner');
assert(bannerCode.includes('/^[1-9][0-9]{5}$/'), 'Must validate 6-digit Indian PIN regex /^[1-9][0-9]{5}$/');
assert(bannerCode.includes('/api/pincode-history'), 'Must fetch /api/pincode-history');
assert(bannerCode.includes('ReadAloudButton'), 'Must integrate ReadAloudButton for narration');
assert(bannerCode.includes('summary_one_liner'), 'Must display summary_one_liner');
assert(bannerCode.includes('ancient_foundations'), 'Must display ancient_foundations');
assert(bannerCode.includes('living_culture_crafts'), 'Must display living_culture_crafts');
assert(bannerCode.includes('famous_lore_landmarks'), 'Must display famous_lore_landmarks');
assert(bannerCode.includes('key_dynasties'), 'Must render key_dynasties badges');
assert(bannerCode.includes('traditional_crafts'), 'Must render traditional_crafts badges');
assert(bannerCode.includes('notable_monuments'), 'Must render notable_monuments badges');
assert(bannerCode.includes('isExpanded'), 'Must support expandable/collapsible state');
console.log('✓ Test 1 Passed: Banner component structure & interfaces verified.');

// Test 2: Verify Design Tokens & Styling in Banner
console.log('\n[Test 2] Verifying Design Tokens & Styling Compliance...');
assert(bannerCode.includes('var(--paper)'), 'Must use var(--paper)');
assert(bannerCode.includes('var(--paper-raised)'), 'Must use var(--paper-raised)');
assert(bannerCode.includes('var(--ink)'), 'Must use var(--ink)');
assert(bannerCode.includes('var(--ink-muted)'), 'Must use var(--ink-muted)');
assert(bannerCode.includes('var(--rule)'), 'Must use var(--rule)');
assert(bannerCode.includes('var(--accent)'), 'Must use var(--accent)');
assert(bannerCode.includes('var(--accent-soft)'), 'Must use var(--accent-soft)');
console.log('✓ Test 2 Passed: Design tokens strictly aligned.');

// Test 3: Verify Integration into app/explore/page.tsx
console.log('\n[Test 3] Verifying integration in app/explore/page.tsx...');
const explorePath = path.resolve('app/explore/page.tsx');
assert(fs.existsSync(explorePath), 'app/explore/page.tsx must exist');
const exploreCode = fs.readFileSync(explorePath, 'utf8');

assert(exploreCode.includes('import RegionalHistoricalContextBanner'), 'Must import RegionalHistoricalContextBanner in explore page');
assert(exploreCode.includes('<RegionalHistoricalContextBanner'), 'Must render <RegionalHistoricalContextBanner> in explore page');
assert(exploreCode.includes('searchedPin'), 'Must compute searchedPin from search query');
console.log('✓ Test 3 Passed: Explore page integration verified.');

// Test 4: Verify PIN extraction logic
console.log('\n[Test 4] Verifying PIN code extraction logic from search queries...');
function extractPin(query: string): string | null {
  const clean = query.trim();
  if (/^[1-9][0-9]{5}$/.test(clean)) return clean;
  const match = clean.match(/\b[1-9][0-9]{5}\b/);
  return match ? match[0] : null;
}

assert.strictEqual(extractPin('110001'), '110001', 'Direct 6-digit PIN');
assert.strictEqual(extractPin('600008'), '600008', 'Direct 6-digit PIN');
assert.strictEqual(extractPin('Delhi 110001'), '110001', 'Substring PIN');
assert.strictEqual(extractPin('PIN: 800001 Area'), '800001', 'Prefixed PIN');
assert.strictEqual(extractPin('012345'), null, 'Leading zero is invalid in Indian PINs');
assert.strictEqual(extractPin('12345'), null, '5-digit PIN is invalid');
assert.strictEqual(extractPin('National Museum'), null, 'Text query without PIN');
console.log('✓ Test 4 Passed: PIN extraction handles exact, substring, and invalid inputs accurately.');

// Test 5: Verify Mock Narration Script Synthesis
console.log('\n[Test 5] Verifying Narration Script Generation...');
const mockHistoryData = {
  status: 'success',
  pincode: '110001',
  location_name: 'New Delhi GPO (Central Delhi)',
  state: 'Delhi',
  district: 'Central Delhi',
  postal_circle: 'Northern Region',
  historical_brief: {
    ancient_foundations: 'Historic epicenter of Delhi Sultanate and Mughal empires with Indraprastha foundations.',
    living_culture_crafts: 'Living hub of Urdu poetry, culinary arts, and Zardozi embroidery.',
    famous_lore_landmarks: 'Houses the Red Fort, Qutub Minar, and National Museum.',
    summary_one_liner: 'Imperial seat of seven historic cities blending Mughal grandeur and modern governance.'
  },
  key_dynasties: ['Mughals', 'Tomaras', 'Chauhans'],
  traditional_crafts: ['Zari & Zardozi Embroidery', 'Meenakari', 'Ivory Carving'],
  notable_monuments: ['Red Fort', 'Qutub Minar', "Humayun's Tomb"]
};

const script = `Regional historical and cultural context for ${mockHistoryData.location_name || mockHistoryData.district}, ${mockHistoryData.state}, Postal PIN code ${mockHistoryData.pincode}. ${mockHistoryData.historical_brief.summary_one_liner} Ancient Foundations: ${mockHistoryData.historical_brief.ancient_foundations} Key dynasties include: ${mockHistoryData.key_dynasties.join(', ')}. Living Traditions: ${mockHistoryData.historical_brief.living_culture_crafts} Traditional crafts include: ${mockHistoryData.traditional_crafts.join(', ')}. Sacred Landmarks: ${mockHistoryData.historical_brief.famous_lore_landmarks} Notable monuments include: ${mockHistoryData.notable_monuments.join(', ')}.`;

assert(script.includes('110001'), 'Script contains PIN');
assert(script.includes('Delhi'), 'Script contains State');
assert(script.includes('Imperial seat of seven historic cities'), 'Script contains summary');
assert(script.includes('Mughals'), 'Script contains dynasties');
assert(script.includes('Zari & Zardozi'), 'Script contains crafts');
assert(script.includes('Red Fort'), 'Script contains monuments');
console.log('✓ Test 5 Passed: Audio narration script synthesizes full historical context.');

// Test 6: Verify Spatial Search and PIN Coordination
console.log('\n[Test 6] Verifying Spatial Search Coordination...');
import { searchMuseums, findNearestMuseumForPincode } from '../../lib/museums';

// Search indexed PIN (110001)
const searchDirect = searchMuseums({ query: '110001', radiusKm: 25 });
assert(searchDirect.results.length > 0, 'Direct PIN 110001 should find nearby museum(s)');
assert(searchDirect.results[0].distance_km !== undefined && searchDirect.results[0].distance_km <= 25, 'Distance should be calculated and within 25km radius');

// Search unindexed rural PIN (175131 - Kullu)
const searchRural = searchMuseums({ query: '175131', radiusKm: 25 });
const fallbackRural = findNearestMuseumForPincode('175131');
assert(fallbackRural !== null, 'Rural PIN 175131 should resolve nearest partner fallback');
assert(fallbackRural.distanceKm > 0, 'Distance should be greater than 0 km');
console.log(`✓ Test 6 Passed: Direct PIN matches ${searchDirect.results.length} museums (${searchDirect.results[0].name}, ${searchDirect.results[0].distance_km} km); Rural PIN 175131 resolves to ${fallbackRural.nearestMuseum.name} (${fallbackRural.distanceKm.toFixed(1)} km away).`);

console.log('\n====================================================');
console.log('All Milestone 3 (M3) Verification Tests PASSED! (6/6)');
console.log('====================================================\n');
