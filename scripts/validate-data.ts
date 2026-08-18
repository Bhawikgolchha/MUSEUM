import fs from 'fs';
import path from 'path';
import artifactsData from '../data/artifacts.json';
import { Artifact } from '../lib/types';

function validate() {
  console.log('--- Validating Museum Artifact Dataset ---');
  const artifacts = artifactsData as Artifact[];
  let errors = 0;
  let hedgedCount = 0;

  if (!Array.isArray(artifacts) || artifacts.length < 6) {
    console.error(`❌ Expected at least 6 artifacts, found ${artifacts?.length || 0}`);
    errors++;
  } else {
    console.log(`✓ Total Artifacts: ${artifacts.length}`);
  }

  for (const art of artifacts) {
    console.log(`\nValidating [${art.id}] ${art.title}...`);

    if (!art.id || !art.museumName || !art.title || !art.canonicalText) {
      console.error(`❌ [${art.id}] Missing core required metadata fields.`);
      errors++;
    }

    const wordCount = art.canonicalText.trim().split(/\s+/).length;
    if (wordCount < 40) {
      console.error(`❌ [${art.id}] Canonical text too short (${wordCount} words < 40 words).`);
      errors++;
    } else {
      console.log(`  ✓ Canonical word count: ${wordCount} words`);
    }

    if (!Array.isArray(art.claims) || art.claims.length < 4) {
      console.error(`❌ [${art.id}] Expected at least 4 claims, found ${art.claims?.length || 0}`);
      errors++;
    } else {
      console.log(`  ✓ Claims count: ${art.claims.length}`);
    }

    const mustInclude = art.claims.filter((c) => c.criticality === 'must_include');
    if (mustInclude.length === 0) {
      console.error(`❌ [${art.id}] Must have at least one must_include claim.`);
      errors++;
    } else {
      console.log(`  ✓ Must-include claims: ${mustInclude.length}`);
    }

    const hedged = art.claims.filter((c) => c.hedge !== null);
    hedgedCount += hedged.length;
    if (hedged.length > 0) {
      console.log(`  ✓ Hedged claims: ${hedged.map((h) => `${h.id} (${h.hedge})`).join(', ')}`);
    }

    // Check image file existence
    const imageRelPath = art.imageUrl.startsWith('/') ? art.imageUrl.slice(1) : art.imageUrl;
    const imageFullPath = path.join(process.cwd(), 'public', imageRelPath);
    if (!fs.existsSync(imageFullPath)) {
      console.error(`❌ [${art.id}] Image file not found at ${imageFullPath}`);
      errors++;
    } else {
      console.log(`  ✓ Image file verified: ${art.imageUrl}`);
    }
  }

  console.log('\n------------------------------------------');
  console.log(`Total Hedged Claims in dataset: ${hedgedCount}`);
  if (hedgedCount < 2) {
    console.error(`❌ Expected at least 2 hedged claims across dataset, found ${hedgedCount}`);
    errors++;
  } else {
    console.log(`✓ Hedge preservation testable across ${hedgedCount} claims.`);
  }

  if (errors > 0) {
    console.error(`\n❌ Validation FAILED with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log('\n✓ ALL DATA VALIDATION CHECKS PASSED PERFECTLY!');
  }
}

validate();
