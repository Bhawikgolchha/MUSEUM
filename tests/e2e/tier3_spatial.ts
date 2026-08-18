/**
 * Tier 3: Cross-Feature Combinations & Haversine Distance Test Suite
 * Validates Geodesic Mathematical Precision, City Pairs, Nearest Museum Resolutions
 */

import fs from 'fs';
import path from 'path';
import {
  TestResult,
  runTest,
  assert,
  assertEqual,
  assertInRange,
  dynamicImport,
} from './types';
import { calculateHaversineDistance, Museum } from '@/lib/museums';

const TIER = 'Tier 3: Spatial & Haversine Distance';

export async function runTier3Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // -------------------------------------------------------------
  // Test 3.1: Haversine Distance Precision & Mathematical Properties
  // -------------------------------------------------------------
  results.push(
    await runTest(TIER, 'Haversine: Mathematical Symmetry & Zero Distance for Self', async () => {
      const lat = 28.6139;
      const lon = 77.209;

      const selfDist = calculateHaversineDistance(lat, lon, lat, lon);
      assertEqual(selfDist, 0, 'Distance from coordinate to itself must be 0.0 km');

      // Symmetry check
      const d1 = calculateHaversineDistance(28.6139, 77.209, 13.0827, 80.2707);
      const d2 = calculateHaversineDistance(13.0827, 80.2707, 28.6139, 77.209);
      assertEqual(d1, d2, 'Haversine distance must be symmetric d(A,B) === d(B,A)');
    })
  );

  results.push(
    await runTest(TIER, 'Haversine: Accurate Geodesic Distances Across Known Indian City Pairs', async () => {
      // Verified geodesic benchmarks on WGS84 / Spherical Earth (R=6371km)
      const benchmarks = [
        {
          name: 'Delhi to Jaipur',
          from: { lat: 28.6139, lon: 77.209 },
          to: { lat: 26.9124, lon: 75.7873 },
          expectedKm: 238.5,
          toleranceKm: 15,
        },
        {
          name: 'Mumbai to Pune',
          from: { lat: 18.922, lon: 72.8347 },
          to: { lat: 18.5204, lon: 73.8567 },
          expectedKm: 120.0,
          toleranceKm: 12,
        },
        {
          name: 'Kolkata to Bhubaneswar',
          from: { lat: 22.5726, lon: 88.3639 },
          to: { lat: 20.2961, lon: 85.8245 },
          expectedKm: 365.0,
          toleranceKm: 18,
        },
        {
          name: 'Delhi to Chennai',
          from: { lat: 28.6139, lon: 77.209 },
          to: { lat: 13.0827, lon: 80.2707 },
          expectedKm: 1757.0,
          toleranceKm: 35,
        },
        {
          name: 'Patna to Varanasi',
          from: { lat: 25.5941, lon: 85.1376 },
          to: { lat: 25.3176, lon: 82.9739 },
          expectedKm: 220.0,
          toleranceKm: 15,
        },
      ];

      for (const b of benchmarks) {
        const computed = calculateHaversineDistance(b.from.lat, b.from.lon, b.to.lat, b.to.lon);
        assertInRange(
          computed,
          b.expectedKm - b.toleranceKm,
          b.expectedKm + b.toleranceKm,
          `Haversine calculation error for ${b.name}: got ${computed}km, expected ~${b.expectedKm}km`
        );
      }
    })
  );

  results.push(
    await runTest(TIER, 'Haversine: Triangle Inequality Verification', async () => {
      // Points: Delhi (A), Jaipur (B), Mumbai (C)
      const A = { lat: 28.6139, lon: 77.209 };
      const B = { lat: 26.9124, lon: 75.7873 };
      const C = { lat: 18.922, lon: 72.8347 };

      const dAC = calculateHaversineDistance(A.lat, A.lon, C.lat, C.lon);
      const dAB = calculateHaversineDistance(A.lat, A.lon, B.lat, B.lon);
      const dBC = calculateHaversineDistance(B.lat, B.lon, C.lat, C.lon);

      assert(
        dAC <= dAB + dBC + 0.1,
        `Triangle inequality violated: d(A,C)=${dAC} > d(A,B)+d(B,C)=${dAB + dBC}`
      );
    })
  );

  // -------------------------------------------------------------
  // Test 3.2: Nearest Museum Calculation for Arbitrary Unindexed PINs
  // -------------------------------------------------------------
  results.push(
    await runTest(TIER, 'Nearest Fallback: Resolution for Unindexed Rajasthan PIN 302001 -> Albert Hall Jaipur', async () => {
      const pinPath = path.join(process.cwd(), 'lib', 'pincodes.ts');
      if (!fs.existsSync(pinPath)) {
        throw new Error(`M3 pending: ${pinPath} not yet created`);
      }

      const { resolvePinToCoordinates, findNearestMuseum } = await dynamicImport('lib/pincodes.ts');
      const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
      const allMuseums: Museum[] = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

      const resolved = resolvePinToCoordinates('302001');
      assert(Boolean(resolved), 'Must resolve coordinates for PIN 302001');

      const nearest = findNearestMuseum(resolved!.coords, allMuseums);
      assert(Boolean(nearest), 'findNearestMuseum must return nearest museum');
      assert(
        nearest.nearestMuseum.id.includes('jai') || nearest.nearestMuseum.city.toLowerCase() === 'jaipur',
        `Expected nearest museum in Jaipur, got: ${nearest.nearestMuseum.name} (${nearest.nearestMuseum.id})`
      );
      assert(
        nearest.distanceKm < 15,
        `Expected distance < 15km for Jaipur GPO PIN 302001, got ${nearest.distanceKm}km`
      );
    })
  );

  results.push(
    await runTest(TIER, 'Nearest Fallback: Resolution for Unindexed Maharashtra PIN 411001 -> Kelkar Pune', async () => {
      const pinPath = path.join(process.cwd(), 'lib', 'pincodes.ts');
      if (!fs.existsSync(pinPath)) {
        throw new Error(`M3 pending: ${pinPath} not yet created`);
      }

      const { resolvePinToCoordinates, findNearestMuseum } = await dynamicImport('lib/pincodes.ts');
      const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
      const allMuseums: Museum[] = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

      const resolved = resolvePinToCoordinates('411001');
      assert(Boolean(resolved), 'Must resolve coordinates for PIN 411001');

      const nearest = findNearestMuseum(resolved!.coords, allMuseums);
      assert(
        nearest.nearestMuseum.id.includes('pun') || nearest.nearestMuseum.city.toLowerCase() === 'pune',
        `Expected nearest museum in Pune, got: ${nearest.nearestMuseum.name}`
      );
      assert(
        nearest.distanceKm < 15,
        `Expected distance < 15km for Pune GPO PIN 411001, got ${nearest.distanceKm}km`
      );
    })
  );

  results.push(
    await runTest(TIER, 'Nearest Fallback: Resolution for Unindexed Kerala PIN 695001 -> Napier Thiruvananthapuram', async () => {
      const pinPath = path.join(process.cwd(), 'lib', 'pincodes.ts');
      if (!fs.existsSync(pinPath)) {
        throw new Error(`M3 pending: ${pinPath} not yet created`);
      }

      const { resolvePinToCoordinates, findNearestMuseum } = await dynamicImport('lib/pincodes.ts');
      const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
      const allMuseums: Museum[] = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

      const resolved = resolvePinToCoordinates('695001');
      assert(Boolean(resolved), 'Must resolve coordinates for PIN 695001');

      const nearest = findNearestMuseum(resolved!.coords, allMuseums);
      assert(
        nearest.nearestMuseum.city.toLowerCase().includes('thiruvananthapuram') ||
          nearest.nearestMuseum.city.toLowerCase().includes('trivandrum') ||
          nearest.nearestMuseum.id.includes('tvr') ||
          nearest.nearestMuseum.id.includes('thi'),
        `Expected nearest museum in Thiruvananthapuram, got: ${nearest.nearestMuseum.name}`
      );
      assert(
        nearest.distanceKm < 15,
        `Expected distance < 15km for Trivandrum GPO PIN 695001, got ${nearest.distanceKm}km`
      );
    })
  );

  results.push(
    await runTest(TIER, 'Nearest Fallback: Resolution for Unindexed J&K PIN 180001 -> Dogra Art Jammu', async () => {
      const pinPath = path.join(process.cwd(), 'lib', 'pincodes.ts');
      if (!fs.existsSync(pinPath)) {
        throw new Error(`M3 pending: ${pinPath} not yet created`);
      }

      const { resolvePinToCoordinates, findNearestMuseum } = await dynamicImport('lib/pincodes.ts');
      const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
      const allMuseums: Museum[] = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

      const resolved = resolvePinToCoordinates('180001');
      assert(Boolean(resolved), 'Must resolve coordinates for PIN 180001');

      const nearest = findNearestMuseum(resolved!.coords, allMuseums);
      assert(
        nearest.nearestMuseum.city.toLowerCase().includes('jammu') ||
          nearest.nearestMuseum.id.includes('jam') ||
          nearest.nearestMuseum.id.includes('jk'),
        `Expected nearest museum in Jammu, got: ${nearest.nearestMuseum.name}`
      );
      assert(
        nearest.distanceKm < 15,
        `Expected distance < 15km for Jammu GPO PIN 180001, got ${nearest.distanceKm}km`
      );
    })
  );

  results.push(
    await runTest(TIER, 'Nearest Fallback: Resolution for Unindexed Assam PIN 781001 -> Assam State Museum', async () => {
      const pinPath = path.join(process.cwd(), 'lib', 'pincodes.ts');
      if (!fs.existsSync(pinPath)) {
        throw new Error(`M3 pending: ${pinPath} not yet created`);
      }

      const { resolvePinToCoordinates, findNearestMuseum } = await dynamicImport('lib/pincodes.ts');
      const dataFilePath = path.join(process.cwd(), 'data', 'indian-museums.json');
      const allMuseums: Museum[] = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

      const resolved = resolvePinToCoordinates('781001');
      assert(Boolean(resolved), 'Must resolve coordinates for PIN 781001');

      const nearest = findNearestMuseum(resolved!.coords, allMuseums);
      assert(
        nearest.nearestMuseum.city.toLowerCase().includes('guwahati') ||
          nearest.nearestMuseum.id.includes('guw') ||
          nearest.nearestMuseum.id.includes('ass'),
        `Expected nearest museum in Guwahati, got: ${nearest.nearestMuseum.name}`
      );
      assert(
        nearest.distanceKm < 15,
        `Expected distance < 15km for Guwahati GPO PIN 781001, got ${nearest.distanceKm}km`
      );
    })
  );

  return results;
}
