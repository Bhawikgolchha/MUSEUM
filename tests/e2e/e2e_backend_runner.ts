/**
 * Digital Muse - Heritage Backend Service E2E Test Suite Runner
 * Executes all 4 tiers of backend tests, aggregates metrics, and outputs structured execution reports.
 *
 * Usage: npx tsx tests/e2e/e2e_backend_runner.ts
 */

import {
  initializeTestHarness,
  runTier1FeatureTests,
  runTier2BoundaryTests,
  runTier3CombinatorialTests,
  runTier4ScenarioTests,
} from './backend_service.test';
import { colors, TestResult, TierSummary } from './types';
import { restoreFetchMock } from '../mocks/fetch_interceptor';

async function main() {
  const startTime = Date.now();

  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🏛️   MUSEUM DISCOVERY - BACKEND HERITAGE SERVICE E2E TEST RUNNER${colors.reset}`);
  console.log(`${colors.dim}    Framework: Next.js 16 | TypeScript 5 | Node.js Hermetic E2E Harness${colors.reset}`);
  console.log(`${colors.dim}    Track: Postal PIN Resolution, Strict Artifacts, PII & IG API TTS${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

  await initializeTestHarness();

  const tiers: TierSummary[] = [];

  const tierConfigs = [
    {
      name: 'Tier 1: Feature Coverage',
      desc: 'PIN Validation, Multi-Tier Geocoding, Artifact Retrieval, Zero-Match, Modes, Key Masking, Audit Hash, Error Taxonomy',
      runner: runTier1FeatureTests,
    },
    {
      name: 'Tier 2: Boundary & Corner Cases',
      desc: 'Malformed PINs, Non-existent PINs, Incomplete data_quality, PII Redaction, TTS 429/500/503 Retries, Key Validation',
      runner: runTier2BoundaryTests,
    },
    {
      name: 'Tier 3: Cross-Feature Interactions',
      desc: 'Pairwise Combinatorial Matrix (Valid/Invalid PIN, 0/Multi Artifacts, text/tts/both modes, Auth/Retry States)',
      runner: runTier3CombinatorialTests,
    },
    {
      name: 'Tier 4: Real-World Scenarios',
      desc: 'Authentic Indian PIN Audio Guides: 110001 (Delhi), 700016 (Kolkata), 400001 (Mumbai), 500002 (Hyderabad), 600008 (Chennai)',
      runner: runTier4ScenarioTests,
    },
  ];

  try {
    for (const tierConfig of tierConfigs) {
      console.log(`${colors.bright}${colors.blue}▶ Running ${tierConfig.name}${colors.reset}`);
      console.log(`${colors.dim}  Scope: ${tierConfig.desc}${colors.reset}`);

      const tierStart = Date.now();
      let results: TestResult[] = [];

      try {
        results = await tierConfig.runner();
      } catch (err: unknown) {
        console.error(`${colors.red}  ✗ Fatal execution error in ${tierConfig.name}:${colors.reset}`, err);
        results.push({
          tier: tierConfig.name,
          name: 'Suite Execution Harness',
          passed: false,
          durationMs: Date.now() - tierStart,
          error: String(err),
        });
      }

      const tierPassed = results.filter((r) => r.passed).length;
      const tierFailed = results.filter((r) => !r.passed).length;

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

      const tierSummary: TierSummary = {
        tier: tierConfig.name,
        description: tierConfig.desc,
        total: results.length,
        passed: tierPassed,
        failed: tierFailed,
        durationMs: Date.now() - tierStart,
        results,
      };

      tiers.push(tierSummary);
      console.log();
    }
  } finally {
    restoreFetchMock();
  }

  const totalDuration = Date.now() - startTime;
  const totalTests = tiers.reduce((acc, t) => acc + t.total, 0);
  const totalPassed = tiers.reduce((acc, t) => acc + t.passed, 0);
  const totalFailed = tiers.reduce((acc, t) => acc + t.failed, 0);

  // Print Summary Table
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}📋  BACKEND HERITAGE SERVICE TEST EXECUTION SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`| ${'Tier'.padEnd(38)} | ${'Total'.padEnd(6)} | ${'Pass'.padEnd(6)} | ${'Fail'.padEnd(6)} | ${'Time'.padEnd(8)} |`);
  console.log(`|${'-'.repeat(40)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(10)}|`);

  for (const t of tiers) {
    const passColor = t.passed === t.total ? colors.green : colors.yellow;
    const failColor = t.failed > 0 ? colors.red : colors.green;
    console.log(
      `| ${t.tier.padEnd(38)} | ${t.total.toString().padEnd(6)} | ${passColor}${t.passed.toString().padEnd(6)}${colors.reset} | ${failColor}${t.failed.toString().padEnd(6)}${colors.reset} | ${(t.durationMs + 'ms').padEnd(8)} |`
    );
  }

  console.log(`|${'-'.repeat(40)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(10)}|`);
  console.log(
    `| ${'OVERALL BACKEND SERVICE TOTALS'.padEnd(38)} | ${totalTests.toString().padEnd(6)} | ${colors.green}${totalPassed.toString().padEnd(6)}${colors.reset} | ${totalFailed > 0 ? colors.red : colors.green}${totalFailed.toString().padEnd(6)}${colors.reset} | ${(totalDuration + 'ms').padEnd(8)} |`
  );
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

  if (totalFailed === 0) {
    console.log(`${colors.bright}${colors.green}✨ ALL ${totalTests} TESTS PASSED SUCCESSFULLY! (100% PASS RATE)${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bright}${colors.yellow}⚠️  ${totalFailed} / ${totalTests} TESTS FAILED OR PENDING IMPLEMENTATION${colors.reset}`);
    console.log(`${colors.dim}   (Review failing test diagnostics above to complete subsystem implementations)${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${colors.red}Unhandled Exception in Backend Service E2E Runner:${colors.reset}`, err);
  process.exit(1);
});
