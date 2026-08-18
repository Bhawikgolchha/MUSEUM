import fs from 'fs';
import path from 'path';

function runM2Verification() {
  console.log('====================================================');
  console.log('M2 Roots UI & Speech Narration Verification Runner');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
    }
  }

  // 1. Check components/AiHistoricalBrief.tsx exists
  const aiBriefPath = path.join(process.cwd(), 'components', 'AiHistoricalBrief.tsx');
  assert(fs.existsSync(aiBriefPath), 'AiHistoricalBrief.tsx file exists on disk');

  if (fs.existsSync(aiBriefPath)) {
    const aiBriefContent = fs.readFileSync(aiBriefPath, 'utf8');

    // 2. Check props interface
    assert(
      aiBriefContent.includes('export interface AiHistoricalBriefProps') &&
        aiBriefContent.includes('pincode: string'),
      'AiHistoricalBrief accepts pincode: string prop'
    );

    // 3. Check fetch to /api/pincode-history with cancellation
    assert(
      aiBriefContent.includes('/api/pincode-history?pincode=') &&
        aiBriefContent.includes('AbortController') &&
        aiBriefContent.includes('signal'),
      'AiHistoricalBrief fetches /api/pincode-history with AbortController cancellation'
    );

    // 4. Check 3-part structured card
    assert(
      aiBriefContent.includes('Ancient Foundations &amp; Dynastic Heritage') ||
        aiBriefContent.includes('Ancient Foundations & Dynastic Heritage'),
      'Renders Part 1: Ancient Foundations & Dynastic Heritage'
    );
    assert(
      aiBriefContent.includes('Living Traditions &amp; Craft Roots') ||
        aiBriefContent.includes('Living Traditions & Craft Roots'),
      'Renders Part 2: Living Traditions & Craft Roots'
    );
    assert(
      aiBriefContent.includes('Sacred Landmarks &amp; Historical Lore') ||
        aiBriefContent.includes('Sacred Landmarks & Historical Lore'),
      'Renders Part 3: Sacred Landmarks & Historical Lore'
    );

    // 5. Check Badge tag clusters
    assert(aiBriefContent.includes('Key Dynasties'), 'Renders Key Dynasties badge tag cluster');
    assert(aiBriefContent.includes('Traditional Crafts'), 'Renders Traditional Crafts badge tag cluster');
    assert(aiBriefContent.includes('Notable Landmarks'), 'Renders Notable Landmarks badge tag cluster');

    // 6. Check summary one-liner banner
    assert(
      aiBriefContent.includes('summary_one_liner') && aiBriefContent.includes('Civilizational Essence'),
      'Renders summary one-liner banner'
    );

    // 7. Check Web Speech Read Aloud button integration
    assert(
      aiBriefContent.includes('ReadAloudButton') && aiBriefContent.includes('buildNarrationText'),
      'Integrates ReadAloudButton with complete structured brief narration'
    );

    // 8. Check loading skeleton shimmer state
    assert(
      aiBriefContent.includes('isLoading') &&
        aiBriefContent.includes('animate-pulse') &&
        aiBriefContent.includes('aria-busy="true"'),
      'Provides clean shimmer skeleton loading states'
    );

    // 9. Check error recovery state & retry button
    assert(
      aiBriefContent.includes('error') &&
        aiBriefContent.includes('handleRetry') &&
        aiBriefContent.includes('Retry Generation'),
      'Includes graceful error recovery state with retry button'
    );

    // 10. Check design tokens
    assert(
      aiBriefContent.includes('var(--paper)') &&
        aiBriefContent.includes('var(--paper-raised)') &&
        aiBriefContent.includes('var(--ink)') &&
        aiBriefContent.includes('var(--accent)'),
      'Adheres strictly to design tokens'
    );
  }

  // 11. Check app/roots/page.tsx integration
  const rootsPagePath = path.join(process.cwd(), 'app', 'roots', 'page.tsx');
  assert(fs.existsSync(rootsPagePath), 'app/roots/page.tsx exists on disk');

  if (fs.existsSync(rootsPagePath)) {
    const rootsContent = fs.readFileSync(rootsPagePath, 'utf8');

    assert(
      rootsContent.includes("import AiHistoricalBrief from '@/components/AiHistoricalBrief'"),
      'app/roots/page.tsx imports AiHistoricalBrief'
    );

    assert(
      rootsContent.includes('<AiHistoricalBrief pincode={pincode} />'),
      'app/roots/page.tsx renders <AiHistoricalBrief pincode={pincode} />'
    );
  }

  console.log(`\n====================================================`);
  console.log(`Verification Summary: ${passedTests}/${totalTests} Tests Passed`);
  console.log(`====================================================`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runM2Verification();
