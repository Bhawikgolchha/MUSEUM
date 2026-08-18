/**
 * Digital Muse Comprehensive E2E Test Suite Runner
 * Executes Tiers 1-4, aggregates metrics, and generates execution reports.
 * 
 * Usage: npx tsx tests/e2e/e2e_runner.ts
 */

import { runTier1Tests } from './tier1_features';
import { runTier2Tests } from './tier2_boundaries';
import { runTier3Tests } from './tier3_spatial';
import { runTier4Tests } from './tier4_scenarios';
import { runTier5Tests } from './tier5_adversarial';
import { colors, TierSummary, TestResult } from './types';

async function main() {
  const startTime = Date.now();

  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🏛️   DIGITAL MUSE - AUTOMATED END-TO-END (E2E) TEST SUITE RUNNER${colors.reset}`);
  console.log(`${colors.dim}    Framework: Next.js 16 | React 19 | TypeScript 5 | Node.js E2E Harness${colors.reset}`);
  console.log(`${colors.dim}    Track: M-E2E Specification & Adversarial Verification Suite${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

  const tiers: TierSummary[] = [];

  // Define tiers to execute
  const tierRunners = [
    {
      name: 'Tier 1: Feature Coverage',
      desc: 'R1 Chat API Contract, R2 Dataset Validation (>=18 Museums), R3 PIN Resolution',
      runner: runTier1Tests,
    },
    {
      name: 'Tier 2: Boundary & Corner Cases',
      desc: 'Invalid PINs, Empty Queries, Missing Keys, Coordinate Extremes, Fee/Schedules',
      runner: runTier2Tests,
    },
    {
      name: 'Tier 3: Spatial & Haversine Distance',
      desc: 'Haversine Geodesic Precision, Indian City Pairs, Arbitrary PIN Resolution',
      runner: runTier3Tests,
    },
    {
      name: 'Tier 4: Real-World Scenarios',
      desc: 'Unindexed PIN Fallback Modal Flow, Museum Card Ask Doubt Multi-Turn Drawer',
      runner: runTier4Tests,
    },
    {
      name: 'Tier 5: Adversarial Hardening',
      desc: 'API Fuzzing, SQLi/XSS Injection, Vernacular Unicode/Emoji, Micro/Antipodal Geodesics, 12-Museum Simulation',
      runner: runTier5Tests,
    },
  ];

  for (const tierConfig of tierRunners) {
    console.log(`${colors.bright}${colors.blue}▶ Running ${tierConfig.name}${colors.reset}`);
    console.log(`${colors.dim}  Scope: ${tierConfig.desc}${colors.reset}`);

    const tierStart = Date.now();
    let results: TestResult[] = [];

    try {
      results = await tierConfig.runner();
    } catch (err: unknown) {
      console.error(`${colors.red}  ✗ Fatal error executing ${tierConfig.name}:${colors.reset}`, err);
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

  const totalDuration = Date.now() - startTime;
  const totalTests = tiers.reduce((acc, t) => acc + t.total, 0);
  const totalPassed = tiers.reduce((acc, t) => acc + t.passed, 0);
  const totalFailed = tiers.reduce((acc, t) => acc + t.failed, 0);

  // Print Summary Table
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}📋  TEST EXECUTION SUMMARY REPORT${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`| ${'Tier'.padEnd(36)} | ${'Total'.padEnd(6)} | ${'Pass'.padEnd(6)} | ${'Fail'.padEnd(6)} | ${'Time'.padEnd(8)} |`);
  console.log(`|${'-'.repeat(38)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(10)}|`);

  for (const t of tiers) {
    const passColor = t.passed === t.total ? colors.green : colors.yellow;
    const failColor = t.failed > 0 ? colors.red : colors.green;
    console.log(
      `| ${t.tier.padEnd(36)} | ${t.total.toString().padEnd(6)} | ${passColor}${t.passed.toString().padEnd(6)}${colors.reset} | ${failColor}${t.failed.toString().padEnd(6)}${colors.reset} | ${(t.durationMs + 'ms').padEnd(8)} |`
    );
  }

  console.log(`|${'-'.repeat(38)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(8)}|${'-'.repeat(10)}|`);
  console.log(
    `| ${'OVERALL SUITE TOTALS'.padEnd(36)} | ${totalTests.toString().padEnd(6)} | ${colors.green}${totalPassed.toString().padEnd(6)}${colors.reset} | ${totalFailed > 0 ? colors.red : colors.green}${totalFailed.toString().padEnd(6)}${colors.reset} | ${(totalDuration + 'ms').padEnd(8)} |`
  );
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

  if (totalFailed === 0) {
    console.log(`${colors.bright}${colors.green}✨ ALL ${totalTests} TESTS PASSED SUCCESSFULLY! (100% PASS RATE)${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bright}${colors.yellow}⚠️  ${totalFailed} / ${totalTests} TESTS FAILED OR PENDING IMPLEMENTATION${colors.reset}`);
    console.log(`${colors.dim}   (Check failing tier errors above for required milestone implementations)${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${colors.red}Unhandled Exception in E2E Runner:${colors.reset}`, err);
  process.exit(1);
});
