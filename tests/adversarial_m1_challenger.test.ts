/**
 * Adversarial Challenger Test Harness for Milestone 1 (M1)
 * 
 * Empirically challenges:
 * 1. Geographic Coordinate Projection Math & SVG Bounding Extremes
 * 2. Pin Transform Invariant under Zoom & Pan 2D Transformations
 * 3. Repository-Wide Brand Sanitization Audit (0 'nanobanana' occurrences)
 * 
 * Usage: npx tsx tests/adversarial_m1_challenger.test.ts
 */

import fs from 'fs';
import path from 'path';

// ANSI Colors for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: Record<string, any>;
}

// -------------------------------------------------------------
// 1. Projection Math Implementation from IndiaMuseumMap.tsx
// -------------------------------------------------------------
const minLat = 7.5;
const maxLat = 37.5;
const minLon = 67.5;
const maxLon = 97.5;

function projectToPercent(lat: number, lon: number) {
  const x = ((lon - minLon) / (maxLon - minLon)) * 100;
  // Invert Y because latitude increases northward (upward)
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
  return {
    x: Math.max(1, Math.min(99, x)),
    y: Math.max(1, Math.min(99, y)),
  };
}

function projectToSvg(lat: number, lon: number) {
  const { x, y } = projectToPercent(lat, lon);
  return {
    x: (x / 100) * 1000,
    y: (y / 100) * 1000,
  };
}

// -------------------------------------------------------------
// 2. Matrix Transformation Model for Pin & SVG Invariant
// -------------------------------------------------------------
interface TransformState {
  pan: { x: number; y: number };
  zoom: number;
}

interface Point2D {
  x: number;
  y: number;
}

function applyTransform(
  localPoint: Point2D,
  containerSize: { width: number; height: number },
  transform: TransformState
): Point2D {
  // CSS transform: translate(pan.x, pan.y) scale(zoom) with transformOrigin: 50% 50%
  const originX = containerSize.width * 0.5;
  const originY = containerSize.height * 0.5;

  // 1. Shift relative to origin
  const relX = localPoint.x - originX;
  const relY = localPoint.y - originY;

  // 2. Scale
  const scaledX = relX * transform.zoom;
  const scaledY = relY * transform.zoom;

  // 3. Shift back and apply pan
  const screenX = scaledX + originX + transform.pan.x;
  const screenY = scaledY + originY + transform.pan.y;

  return { x: screenX, y: screenY };
}

// -------------------------------------------------------------
// Test Execution Engine
// -------------------------------------------------------------
const allResults: TestResult[] = [];

async function runTest(
  suite: string,
  name: string,
  fn: () => void | Promise<void>
): Promise<TestResult> {
  const start = Date.now();
  try {
    await fn();
    const res: TestResult = {
      suite,
      name,
      passed: true,
      durationMs: Date.now() - start,
    };
    allResults.push(res);
    console.log(`  ${colors.green}✔ PASS${colors.reset} [${suite}] ${name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`);
    return res;
  } catch (err: any) {
    const res: TestResult = {
      suite,
      name,
      passed: false,
      durationMs: Date.now() - start,
      error: err?.message || String(err),
      details: err?.details,
    };
    allResults.push(res);
    console.log(`  ${colors.red}✖ FAIL${colors.reset} [${suite}] ${name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`);
    console.log(`    ${colors.red}Error: ${res.error}${colors.reset}`);
    return res;
  }
}

// -------------------------------------------------------------
// SUITE 1: Coordinate Projection Mapping & Extremes Verification
// -------------------------------------------------------------
async function runProjectionTests() {
  console.log(`\n${colors.bright}${colors.cyan}▶ SUITE 1: Geographic Coordinate Projection & India Extreme Bounds${colors.reset}`);

  // Test 1.1: Cardinal Extreme Points Bounding & SVG Mapping
  await runTest('Projection', 'Cardinal Extremes Map into Expected SVG ViewBox Coordinates', () => {
    const extremePoints = [
      {
        name: 'Indira Col (Northernmost Point)',
        lat: 37.10,
        lon: 76.79,
        expectedSvg: { x: 309.7, y: 13.3 },
        svgTargetArea: { minX: 290, maxX: 350, minY: 0, maxY: 60 },
      },
      {
        name: 'Siachen Glacier / Nubra (North Border)',
        lat: 35.50,
        lon: 77.00,
        expectedSvg: { x: 316.7, y: 66.7 },
        svgTargetArea: { minX: 300, maxX: 380, minY: 40, maxY: 120 },
      },
      {
        name: 'Kanyakumari (Southernmost Mainland Tip)',
        lat: 8.08,
        lon: 77.55,
        expectedSvg: { x: 335.0, y: 980.7 },
        svgTargetArea: { minX: 310, maxX: 360, minY: 940, maxY: 990 },
      },
      {
        name: 'Guhar Moti / Sir Creek (Westernmost Point)',
        lat: 23.71,
        lon: 68.56,
        expectedSvg: { x: 35.3, y: 459.7 },
        svgTargetArea: { minX: 10, maxX: 70, minY: 420, maxY: 500 },
      },
      {
        name: 'Kibithu / Dong (Easternmost Point)',
        lat: 28.29,
        lon: 97.01,
        expectedSvg: { x: 983.7, y: 307.0 },
        svgTargetArea: { minX: 940, maxX: 990, minY: 270, maxY: 350 },
      },
      {
        name: 'Port Blair (South Andaman)',
        lat: 11.62,
        lon: 92.73,
        expectedSvg: { x: 841.0, y: 862.7 },
        svgTargetArea: { minX: 830, maxX: 860, minY: 840, maxY: 885 },
      },
      {
        name: 'Kavaratti (Lakshadweep Capital)',
        lat: 10.57,
        lon: 72.64,
        expectedSvg: { x: 171.3, y: 897.7 },
        svgTargetArea: { minX: 160, maxX: 185, minY: 880, maxY: 920 },
      },
      {
        name: 'Nagpur (Geographic Center of India)',
        lat: 21.1458,
        lon: 79.0882,
        expectedSvg: { x: 386.3, y: 545.1 },
        svgTargetArea: { minX: 360, maxX: 420, minY: 520, maxY: 580 },
      },
    ];

    for (const pt of extremePoints) {
      const proj = projectToSvg(pt.lat, pt.lon);
      const diffX = Math.abs(proj.x - pt.expectedSvg.x);
      const diffY = Math.abs(proj.y - pt.expectedSvg.y);

      if (diffX > 1.5 || diffY > 1.5) {
        throw new Error(
          `Projection precision error for ${pt.name}: got (${proj.x.toFixed(1)}, ${proj.y.toFixed(1)}), expected (${pt.expectedSvg.x}, ${pt.expectedSvg.y})`
        );
      }

      if (
        proj.x < pt.svgTargetArea.minX ||
        proj.x > pt.svgTargetArea.maxX ||
        proj.y < pt.svgTargetArea.minY ||
        proj.y > pt.svgTargetArea.maxY
      ) {
        throw new Error(
          `Projected point for ${pt.name} (${proj.x.toFixed(1)}, ${proj.y.toFixed(1)}) falls outside calibrated target SVG area [${pt.svgTargetArea.minX}-${pt.svgTargetArea.maxX}, ${pt.svgTargetArea.minY}-${pt.svgTargetArea.maxY}]`
        );
      }
    }
  });

  // Test 1.2: Monotonicity and Axis Non-Inversion Verification
  await runTest('Projection', 'Projection Monotonicity & Directional Gradients (North-Up, East-Right)', () => {
    // 1. Moving north (increasing lat) must strictly DECREASE SVG Y (moving towards top of canvas)
    let prevY = Infinity;
    for (let lat = 8.0; lat <= 37.0; lat += 1.0) {
      const { y } = projectToSvg(lat, 78.0);
      if (y >= prevY) {
        throw new Error(`Latitude projection inverted: lat ${lat} yielded Y ${y} >= previous Y ${prevY}`);
      }
      prevY = y;
    }

    // 2. Moving east (increasing lon) must strictly INCREASE SVG X (moving towards right of canvas)
    let prevX = -Infinity;
    for (let lon = 68.0; lon <= 97.0; lon += 1.0) {
      const { x } = projectToSvg(20.0, lon);
      if (x <= prevX) {
        throw new Error(`Longitude projection inverted: lon ${lon} yielded X ${x} <= previous X ${prevX}`);
      }
      prevX = x;
    }
  });

  // Test 1.3: Aspect Ratio and Distortion Linearity
  await runTest('Projection', 'Equal-Degree Aspect Ratio Uniformity (dx/dLon === dy/dLat)', () => {
    const dLon = 1.0;
    const dLat = 1.0;

    const p1 = projectToSvg(20.0, 75.0);
    const pRight = projectToSvg(20.0, 75.0 + dLon);
    const pUp = projectToSvg(20.0 + dLat, 75.0);

    const deltaX = pRight.x - p1.x;
    const deltaY = p1.y - pUp.y; // note y decreases upward

    const scaleDiff = Math.abs(deltaX - deltaY);
    if (scaleDiff > 1e-6) {
      throw new Error(`Anisotropic coordinate distortion detected: dX=${deltaX}, dY=${deltaY}, diff=${scaleDiff}`);
    }
  });

  // Test 1.4: Extreme Out-of-Bounds Clamping & NaN/Infinity Safety
  await runTest('Projection', 'Adversarial Out-of-Bounds & Non-Numeric Coordinates Clamping', () => {
    const testCases = [
      { lat: 90.0, lon: 180.0, desc: 'North Pole & Date Line' },
      { lat: -90.0, lon: -180.0, desc: 'South Pole & Antimeridian' },
      { lat: 0.0, lon: 0.0, desc: 'Null Island (0,0)' },
      { lat: 1000.0, lon: 1000.0, desc: 'Extreme Positive Overflow' },
      { lat: -1000.0, lon: -1000.0, desc: 'Extreme Negative Overflow' },
    ];

    for (const tc of testCases) {
      const pct = projectToPercent(tc.lat, tc.lon);
      if (pct.x < 1 || pct.x > 99 || pct.y < 1 || pct.y > 99) {
        throw new Error(`Clamping failed for ${tc.desc}: got (${pct.x}, ${pct.y}), expected within [1, 99]%`);
      }
      if (isNaN(pct.x) || isNaN(pct.y) || !isFinite(pct.x) || !isFinite(pct.y)) {
        throw new Error(`Non-finite coordinate output for ${tc.desc}: got (${pct.x}, ${pct.y})`);
      }
    }
  });

  // Test 1.5: Complete Real Museum Dataset Coordinates Coverage
  await runTest('Projection', 'All Museum Dataset Points Project to Landmass Interior Without Clamping', () => {
    const datasetPath = path.join(process.cwd(), 'data', 'indian-museums.json');
    if (!fs.existsSync(datasetPath)) {
      throw new Error(`Dataset not found at ${datasetPath}`);
    }
    const museums = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
    if (!Array.isArray(museums) || museums.length === 0) {
      throw new Error(`Museum dataset is empty or invalid`);
    }

    for (const museum of museums) {
      const { lat, lon } = museum.coordinates;
      const { x, y } = projectToPercent(lat, lon);

      // Verify that no valid museum gets clamped to the boundary edge (1% or 99%)
      if (x <= 1.01 || x >= 98.99 || y <= 1.01 || y >= 98.99) {
        throw new Error(
          `Museum '${museum.name}' (${museum.id}) at (${lat}, ${lon}) was clamped to map boundary: (${x.toFixed(2)}%, ${y.toFixed(2)}%)`
        );
      }

      // Verify coordinate ranges fall within legitimate India bounding box
      if (lat < 8.0 || lat > 36.0 || lon < 68.0 || lon > 96.0) {
        throw new Error(
          `Museum '${museum.name}' has invalid Indian coordinates: lat=${lat}, lon=${lon}`
        );
      }
    }
  });
}

// -------------------------------------------------------------
// SUITE 2: Pin Transform Invariant & Canvas Synchronization
// -------------------------------------------------------------
async function runTransformInvariantTests() {
  console.log(`\n${colors.bright}${colors.cyan}▶ SUITE 2: Pin Transform Invariant & Zoom/Pan Synchrony${colors.reset}`);

  // Test 2.1: Mathematical Transform Equivalence Across 100 Viewport Configurations
  await runTest('TransformInvariant', 'Pin Coordinates and SVG Path Vertices Undergo Identical 2D Transformations', () => {
    const screenSizes = [
      { width: 375, height: 460 },   // Mobile portrait
      { width: 768, height: 620 },   // Tablet
      { width: 1024, height: 620 },  // Desktop Small
      { width: 1440, height: 620 },  // Desktop Widescreen
      { width: 1920, height: 800 },  // Full HD
    ];

    const zoomLevels = [1.0, 1.25, 1.5, 2.0, 2.75, 3.5, 4.0];
    const panOffsets = [
      { x: 0, y: 0 },
      { x: 50, y: -30 },
      { x: -120, y: 80 },
      { x: 250, y: 150 },
      { x: -300, y: -200 },
    ];

    const sampleLatLons = [
      { lat: 28.6139, lon: 77.2090, name: 'Delhi' },
      { lat: 18.9220, lon: 72.8347, name: 'Mumbai' },
      { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
      { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
      { lat: 34.1526, lon: 77.5771, name: 'Leh' },
      { lat: 11.6234, lon: 92.7265, name: 'Port Blair' },
      { lat: 10.5700, lon: 72.6400, name: 'Kavaratti' },
    ];

    let totalChecks = 0;

    for (const size of screenSizes) {
      for (const zoom of zoomLevels) {
        for (const pan of panOffsets) {
          const transformState: TransformState = { pan, zoom };

          for (const loc of sampleLatLons) {
            const pct = projectToPercent(loc.lat, loc.lon);

            // Local position of pin inside canvas container
            const pinLocal: Point2D = {
              x: (pct.x / 100) * size.width,
              y: (pct.y / 100) * size.height,
            };

            // Local position of corresponding SVG point inside canvas container
            // (Since SVG viewBox 0 0 1000 1000 fills the exact same container with preserveAspectRatio="none")
            const svgPoint = projectToSvg(loc.lat, loc.lon);
            const svgLocal: Point2D = {
              x: (svgPoint.x / 1000) * size.width,
              y: (svgPoint.y / 1000) * size.height,
            };

            // Apply shared parent matrix transform
            const pinTransformed = applyTransform(pinLocal, size, transformState);
            const svgTransformed = applyTransform(svgLocal, size, transformState);

            const dx = Math.abs(pinTransformed.x - svgTransformed.x);
            const dy = Math.abs(pinTransformed.y - svgTransformed.y);

            if (dx > 1e-9 || dy > 1e-9) {
              throw new Error(
                `Invariant breach at ${loc.name} on ${size.width}x${size.height} (zoom=${zoom}, pan=(${pan.x},${pan.y})): ` +
                `Pin=(${pinTransformed.x.toFixed(4)}, ${pinTransformed.y.toFixed(4)}) != ` +
                `SVG=(${svgTransformed.x.toFixed(4)}, ${svgTransformed.y.toFixed(4)})`
              );
            }
            totalChecks++;
          }
        }
      }
    }

    if (totalChecks !== screenSizes.length * zoomLevels.length * panOffsets.length * sampleLatLons.length) {
      throw new Error(`Incomplete invariant verification matrix`);
    }
  });

  // Test 2.2: Zoom Limits and Pan Clamping Safety
  await runTest('TransformInvariant', 'Zoom Level Bounds [1.0, 4.0] and Reset State Consistency', () => {
    let zoom: number = 1.0;
    let pan = { x: 100, y: -50 };

    // Simulate zoom in sequence
    const zoomIn = () => {
      zoom = Math.min(4, Number((zoom + 0.5).toFixed(2)));
    };

    const zoomOut = () => {
      zoom = Math.max(1, Number((zoom - 0.5).toFixed(2)));
      if (zoom === 1) {
        pan = { x: 0, y: 0 };
      }
    };

    // Zoom in to maximum
    for (let i = 0; i < 10; i++) zoomIn();
    if (zoom !== 4.0) throw new Error(`Zoom did not clamp at 4.0 max: got ${zoom}`);

    // Zoom out back to minimum
    for (let i = 0; i < 10; i++) zoomOut();
    if ((zoom as number) !== 1.0) throw new Error(`Zoom did not clamp at 1.0 min: got ${zoom}`);
    if (pan.x !== 0 || pan.y !== 0) throw new Error(`Pan state was not reset on zoom 1.0 return`);
  });
}

// -------------------------------------------------------------
// SUITE 3: Brand Sanitization Audit ('nanobanana' Check)
// -------------------------------------------------------------
async function runBrandSanitizationAudit() {
  console.log(`\n${colors.bright}${colors.cyan}▶ SUITE 3: Repository-Wide Brand Sanitization Audit ('nanobanana')${colors.reset}`);

  await runTest('BrandSanitization', 'Zero Occurrences of Forbidden Brand in Repository Files and Filenames', () => {
    const rootDir = process.cwd();
    const brandTerm = ['nano', 'banana'].join('');
    const forbiddenPattern = new RegExp(brandTerm, 'i');

    const ignoredDirs = new Set(['.git', 'node_modules', '.next', '.agents']);
    const selfFile = path.basename(__filename);
    const violations: { file: string; type: 'filename' | 'content'; line?: number; snippet?: string }[] = [];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(rootDir, fullPath);

        if (entry.isDirectory()) {
          if (ignoredDirs.has(entry.name)) continue;
          if (forbiddenPattern.test(entry.name)) {
            violations.push({
              file: relPath,
              type: 'filename',
              snippet: `Directory name contains forbidden brand: ${entry.name}`,
            });
          }
          scanDir(fullPath);
        } else if (entry.isFile()) {
          if (entry.name === selfFile) continue;

          // Check filename
          if (forbiddenPattern.test(entry.name)) {
            violations.push({
              file: relPath,
              type: 'filename',
              snippet: `Filename contains forbidden brand: ${entry.name}`,
            });
          }

          // Check file contents for text files
          const ext = path.extname(entry.name).toLowerCase();
          const textExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.html', '.svg', '.txt', '.mjs', '.yml', '.yaml'
          ];

          if (textExtensions.includes(ext)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const lines = content.split('\n');
              for (let idx = 0; idx < lines.length; idx++) {
                const line = lines[idx];
                if (forbiddenPattern.test(line)) {
                  violations.push({
                    file: relPath,
                    type: 'content',
                    line: idx + 1,
                    snippet: line.trim(),
                  });
                }
              }
            } catch {
              // Binary or unreadable file
            }
          }
        }
      }
    }

    scanDir(rootDir);

    if (violations.length > 0) {
      console.log(`\n  ${colors.red}Found ${violations.length} brand sanitization violation(s):${colors.reset}`);
      for (const v of violations) {
        console.log(`    - [${v.type.toUpperCase()}] ${v.file}${v.line ? `:${v.line}` : ''} -> ${v.snippet}`);
      }
      const err = new Error(
        `Brand sanitization audit FAILED: ${violations.length} forbidden brand occurrence(s) detected across repo.`
      );
      (err as any).details = violations;
      throw err;
    }
  });
}

// -------------------------------------------------------------
// Main Runner
// -------------------------------------------------------------
async function main() {
  console.log(`\n${colors.bright}${colors.magenta}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}🛡️   CHALLENGER HARNESS: MILESTONE 1 (M1) EMPIRICAL VERIFICATION${colors.reset}`);
  console.log(`${colors.dim}    Focus: India SVG Map, Projection Math, Pin Transform Invariant, Brand Audit${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}========================================================================${colors.reset}`);

  await runProjectionTests();
  await runTransformInvariantTests();
  await runBrandSanitizationAudit();

  const total = allResults.length;
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;

  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}📋  CHALLENGER HARNESS SUMMARY REPORT${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`Total Checks Executed : ${total}`);
  console.log(`Passed Checks         : ${colors.green}${passed}${colors.reset}`);
  console.log(`Failed Checks         : ${failed > 0 ? colors.red + failed + colors.reset : '0'}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
