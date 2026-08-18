/**
 * Unit Test Suite for Milestone 2:
 * Artifact Retrieval, Schema Standardization, Data Quality Auditing & PII Redaction
 */

import {
  redactPII,
  redactEmails,
  redactPhones,
  redactPersonalIds,
  redactDonorAndCuratorNames,
  hasPII,
  detectPII,
  redactObjectPII,
  PII_TOKENS,
} from '../../lib/services/pii-redactor';

import {
  getArtifactsForPincode,
  queryArtifactsByPincode,
  normalizeArtifact,
  auditDataQuality,
  getAllStandardizedArtifacts,
  getArtifactById,
  clampMaxArtifacts,
  buildNoMatchMessage,
  EXPLICIT_NO_MATCH_INDICATOR,
} from '../../lib/services/artifacts';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message} | Expected: ${expectedStr}, got: ${actualStr}`);
  }
}

function test(suite: string, name: string, fn: () => void | Promise<void>): void {
  try {
    fn();
    results.push({ suite, name, passed: true });
  } catch (err: any) {
    results.push({ suite, name, passed: false, error: err.message || String(err) });
  }
}

console.log('====================================================');
console.log('Running Milestone 2 Unit Test Suite...');
console.log('====================================================\n');

// ---------------------------------------------------------------------------
// 1. PII Redactor Tests
// ---------------------------------------------------------------------------

test('PII Redactor', 'Email Redaction - basic and complex formats', () => {
  const input = 'Contact curator at curator.delhi@nationalmuseum.gov.in or admin@domain.co.in';
  const redacted = redactEmails(input);
  assertEqual(
    redacted,
    `Contact curator at ${PII_TOKENS.EMAIL} or ${PII_TOKENS.EMAIL}`,
    'Should redact all valid email addresses'
  );
});

test('PII Redactor', 'Phone Redaction - Indian mobile and landline formats', () => {
  const input1 = 'Call mobile: +91-9876543210 or landline: (011) 2301-9272 for details.';
  const redacted1 = redactPhones(input1);
  assert(redacted1.includes(PII_TOKENS.PHONE), 'Must contain [REDACTED_PHONE]');
  assert(!redacted1.includes('9876543210'), 'Raw phone must not be present');

  const input2 = 'Phone: +91 11 2301 9272; Tel: 044-28193238; Direct: 9876543210';
  const redacted2 = redactPhones(input2);
  assert(!redacted2.includes('2301'), 'Landline numbers should be redacted');
  assert(!redacted2.includes('28193238'), 'Chennai landline should be redacted');
});

test('PII Redactor', 'Personal ID Redaction - Aadhaar, PAN, SSN, Passport', () => {
  const input = 'Aadhaar: 1234 5678 9012, PAN: ABCDE1234F, SSN: 123-45-6789, Passport: Z1234567';
  const redacted = redactPersonalIds(input);
  assertEqual(
    redacted,
    `Aadhaar: ${PII_TOKENS.ID}, PAN: ${PII_TOKENS.ID}, SSN: ${PII_TOKENS.ID}, Passport: ${PII_TOKENS.ID}`,
    'All personal IDs must be replaced with [REDACTED_ID]'
  );
});

test('PII Redactor', 'Donor and Curator Name Redaction', () => {
  const input1 = 'Donor: John Doe; Curator: Dr. Alice Wonder; Gift of Mrs. Jane Smith; Acquired from Robert Brown';
  const redacted1 = redactDonorAndCuratorNames(input1);
  assert(redacted1.includes(PII_TOKENS.DONOR), 'Donor name must be redacted');
  assert(redacted1.includes(PII_TOKENS.CURATOR), 'Curator name must be redacted');
  assert(!redacted1.includes('John Doe'), 'Raw donor name must not be present');
  assert(!redacted1.includes('Alice Wonder'), 'Raw curator name must not be present');
  assert(!redacted1.includes('Jane Smith'), 'Raw gift donor name must not be present');
  assert(!redacted1.includes('Robert Brown'), 'Raw acquisition source must not be present');
});

test('PII Redactor', 'Full Pipeline Redaction - Mixed Provenance String', () => {
  const input = 'Excavated in 1926 by Ernest Mackay; Donor: John Doe (john@example.com, +91-9876543210)';
  const sanitized = redactPII(input);
  assertEqual(
    sanitized,
    'Excavated in 1926 by Ernest Mackay; Donor: [REDACTED_DONOR] ([REDACTED_EMAIL], [REDACTED_PHONE])',
    'Pipeline must match exact spec report example'
  );
});

test('PII Redactor', 'Preservation of Historical Years and Technical Dimensions', () => {
  const input = 'Discovered in 1926 at Mohenjo-daro, height 10.5 centimetres, weight 500 kilograms, dated c. 2300–1750 BCE.';
  const sanitized = redactPII(input);
  assertEqual(sanitized, input, 'Should not alter archaeological numbers, dates, or measurements');
});

test('PII Redactor', 'hasPII and detectPII helpers', () => {
  assert(hasPII('Contact us at test@domain.com') === true, 'Should detect email PII');
  assert(hasPII('No sensitive information here.') === false, 'Should return false for clean string');

  const detections = detectPII('Email: info@museum.org, Phone: +91 9876543210, Aadhaar: 1234 5678 9012');
  assert(detections.length >= 3, 'Should detect multiple PII entities');
  assert(detections.some((d) => d.type === 'email'), 'Should detect email');
  assert(detections.some((d) => d.type === 'phone'), 'Should detect phone');
  assert(detections.some((d) => d.type === 'aadhaar'), 'Should detect Aadhaar');
});

test('PII Redactor', 'redactObjectPII - Deep Object and Array Traversal', () => {
  const obj = {
    title: 'Artifact A',
    metadata: {
      curator: 'Curator: John Smith',
      contacts: ['support@museum.gov', '+91 9876543210'],
      numbers: 42,
    },
  };
  const sanitized = redactObjectPII(obj);
  assertEqual(sanitized.title, 'Artifact A', 'Clean fields should remain untouched');
  assert(sanitized.metadata.curator.includes(PII_TOKENS.CURATOR), 'Nested curator should be redacted');
  assertEqual(sanitized.metadata.contacts[0], PII_TOKENS.EMAIL, 'Array email should be redacted');
  assert(sanitized.metadata.contacts[1].includes(PII_TOKENS.PHONE), 'Array phone should be redacted');
  assertEqual(sanitized.metadata.numbers, 42, 'Non-string values should be preserved');
});

// ---------------------------------------------------------------------------
// 2. Strict Exact-PIN Artifact Retrieval Tests
// ---------------------------------------------------------------------------

test('Artifact Retrieval', 'Exact PIN Match - Single Artifact (PIN 110011 National Museum)', () => {
  const res = getArtifactsForPincode('110011');
  assert(res.pincodeMatched === true, 'Pincode should match');
  assertEqual(res.total_artifacts_found, 1, 'Total found must be 1');
  assertEqual(res.artifacts.length, 1, 'Artifacts length must be 1');
  assertEqual(res.museum_linked_artifacts.length, 1, 'museum_linked_artifacts length must be 1');

  const art = res.artifacts[0];
  assertEqual(art.artifact_id, 'art-001', 'Must be art-001');
  assertEqual(art.title, 'Dancing Girl of Mohenjo-daro', 'Title must match');
  assertEqual(art.museum_id, 'mus-in-del-001', 'Museum ID must match');
  assertEqual(art.pincode, '110011', 'PIN code must match queried PIN');
  assertEqual(art.exhibit_location, 'Archaeology Gallery, Ground Floor', 'Exhibit location must match');
  assert(art.digital_asset_urls.length > 0, 'Digital assets must be present');
  assertEqual(art.licensing_info.rights_holder, 'National Museum, New Delhi', 'Licensing rights holder must match');
  assertEqual(art.data_quality.is_complete, true, 'Standard catalog artifact should be complete');
  assertEqual(art.data_quality.missing_fields, [], 'Missing fields must be empty array');
});

test('Artifact Retrieval', 'Exact PIN Match - Multiple Artifacts (PIN 221007 Sarnath Museum)', () => {
  const res = getArtifactsForPincode('221007');
  assert(res.pincodeMatched === true, 'Pincode should match');
  assertEqual(res.total_artifacts_found, 2, 'Total found must be 2');
  assertEqual(res.artifacts.length, 2, 'Artifacts length must be 2');

  const ids = res.artifacts.map((a) => a.artifact_id);
  assert(ids.includes('art-004'), 'Must contain Lion Capital (art-004)');
  assert(ids.includes('art-005'), 'Must contain Standing Buddha (art-005)');
});

test('Artifact Retrieval', 'Strict Zero-Match Requirement - PIN 560034 (Koramangala, No Museum at PIN)', () => {
  const res = getArtifactsForPincode('560034');
  assertEqual(res.total_artifacts_found, 0, 'Total artifacts found must be 0');
  assertEqual(res.artifacts, [], 'Artifacts array must be empty');
  assertEqual(res.museum_linked_artifacts, [], 'museum_linked_artifacts array must be empty');
  assertEqual(res.explicitNoMatchMessage, EXPLICIT_NO_MATCH_INDICATOR, 'Must return explicit zero-match indicator');
  assertEqual(res.message, EXPLICIT_NO_MATCH_INDICATOR, 'Message must be explicit zero-match indicator');
});

test('Artifact Retrieval', 'Strict Zero-Match Requirement - PIN 110001 (Valid Location, 0 Linked Artifacts)', () => {
  const res = getArtifactsForPincode('110001');
  assertEqual(res.total_artifacts_found, 0, 'Total artifacts found must be 0');
  assertEqual(res.artifacts, [], 'Artifacts array must be empty');
  assertEqual(res.museum_linked_artifacts, [], 'museum_linked_artifacts array must be empty');
  assertEqual(res.explicitNoMatchMessage, EXPLICIT_NO_MATCH_INDICATOR, 'Must return explicit zero-match indicator');
});

test('Artifact Retrieval', 'Strict Zero-Match Requirement - Non-existent PIN 999999', () => {
  const res = getArtifactsForPincode('999999');
  assertEqual(res.total_artifacts_found, 0, 'Total artifacts found must be 0');
  assertEqual(res.artifacts.length, 0, 'Artifacts length must be 0');
  assertEqual(res.explicitNoMatchMessage, EXPLICIT_NO_MATCH_INDICATOR, 'Must return explicit zero-match indicator');
});

test('Artifact Retrieval', 'Malformed / Invalid PIN Inputs return Zero Matches safely', () => {
  const malformedInputs = ['11001', '1100110', '011001', '11001A', '', null as any, undefined as any];
  for (const input of malformedInputs) {
    const res = getArtifactsForPincode(input);
    assertEqual(res.total_artifacts_found, 0, `Input "${input}" must return 0 artifacts`);
    assertEqual(res.artifacts, [], `Input "${input}" must return empty array`);
    assertEqual(res.explicitNoMatchMessage, EXPLICIT_NO_MATCH_INDICATOR, `Input "${input}" must return no-match indicator`);
  }
});

// ---------------------------------------------------------------------------
// 3. Schema Standardization & Data Quality Auditing Tests
// ---------------------------------------------------------------------------

test('Schema & Data Quality', 'Data Quality Audit - Incomplete Record Detection', () => {
  const incompleteArtifact = {
    artifact_id: 'art-custom-001',
    title: 'Incomplete Sculpture',
    description: 'A sample description',
    museum_name: 'Test Museum',
    museum_id: 'mus-test-001',
    pincode: '110011',
    // Missing exhibit_location, digital_asset_urls, provenance_date, licensing_info
  };

  const audit = auditDataQuality(incompleteArtifact as any);
  assertEqual(audit.is_complete, false, 'Incomplete artifact must have is_complete: false');
  assert(audit.missing_fields.includes('exhibit_location'), 'Missing exhibit_location must be flagged');
  assert(audit.missing_fields.includes('digital_asset_urls'), 'Missing digital_asset_urls must be flagged');
  assert(audit.missing_fields.includes('provenance_date'), 'Missing provenance_date must be flagged');
  assert(audit.missing_fields.includes('licensing_info'), 'Missing licensing_info must be flagged');
});

test('Schema & Data Quality', 'normalizeArtifact - Correctly Flags Incomplete Fields', () => {
  const rawCustom = {
    id: 'art-custom-002',
    title: 'Partially Missing Artifact',
    canonicalText: 'Description text without curator PII.',
    pincode: '110011',
  };

  const normalized = normalizeArtifact(rawCustom);
  assertEqual(normalized.artifact_id, 'art-custom-002', 'Artifact ID should be normalized');
  assertEqual(normalized.data_quality.is_complete, false, 'Should be flagged as incomplete');
  assert(normalized.data_quality.missing_fields.length > 0, 'missing_fields should contain missing entries');
});

test('Schema & Data Quality', 'normalizeArtifact - Redacts PII in Custom Injected Artifacts', () => {
  const rawCustom = {
    id: 'art-custom-003',
    title: 'Donor: Jane Doe Artifact',
    canonicalText: 'Curated by Dr. Alice Wonder. Contact: info@sample.gov or +91-9876543210.',
    museumName: 'Test Museum',
    museumId: 'mus-test-002',
    pincode: '110011',
    exhibit_location: 'Main Gallery',
    digital_asset_urls: ['/images/sample.jpg'],
    provenance_date: '2020 CE',
    licensing_info: {
      license: 'CC-BY',
      attribution_required: true,
      rights_holder: 'Test Museum',
    },
  };

  const normalized = normalizeArtifact(rawCustom);
  assertEqual(normalized.title, 'Donor: [REDACTED_DONOR] Artifact', 'Title PII must be redacted');
  assert(normalized.description.includes(PII_TOKENS.CURATOR), 'Curator name in description must be redacted');
  assert(normalized.description.includes(PII_TOKENS.EMAIL), 'Email in description must be redacted');
  assert(normalized.description.includes(PII_TOKENS.PHONE), 'Phone in description must be redacted');
  assertEqual(normalized.data_quality.is_complete, true, 'All fields populated should result in is_complete: true');
});

// ---------------------------------------------------------------------------
// 4. Pagination / max_artifacts Limiting Tests
// ---------------------------------------------------------------------------

test('Pagination', 'max_artifacts Limit Parameter Slices Results while preserving total_artifacts_found', () => {
  // Sarnath Museum PIN 221007 has 2 artifacts (art-004, art-005)
  const res = getArtifactsForPincode('221007', { max_artifacts: 1 });
  assertEqual(res.total_artifacts_found, 2, 'total_artifacts_found must reflect 2 total available');
  assertEqual(res.artifacts.length, 1, 'artifacts array must be sliced to 1');
  assertEqual(res.museum_linked_artifacts.length, 1, 'museum_linked_artifacts array must be sliced to 1');
});

test('Pagination', 'clampMaxArtifacts - Bounds Clamping (1 to 50, default 10)', () => {
  assertEqual(clampMaxArtifacts(undefined), 10, 'Undefined should default to 10');
  assertEqual(clampMaxArtifacts(NaN), 10, 'NaN should default to 10');
  assertEqual(clampMaxArtifacts(-5), 1, 'Negative numbers should clamp to 1');
  assertEqual(clampMaxArtifacts(0), 1, 'Zero should clamp to 1');
  assertEqual(clampMaxArtifacts(25), 25, 'Valid in-range number should remain 25');
  assertEqual(clampMaxArtifacts(100), 50, 'Numbers above 50 should clamp to 50');
});

// ---------------------------------------------------------------------------
// 5. Global Catalog Helpers Tests
// ---------------------------------------------------------------------------

test('Catalog Helpers', 'getAllStandardizedArtifacts and getArtifactById', () => {
  const all = getAllStandardizedArtifacts();
  assert(all.length >= 6, 'Catalog must contain all masterworks');

  const art1 = getArtifactById('art-001');
  assert(art1 !== null, 'art-001 must exist');
  assertEqual(art1!.artifact_id, 'art-001', 'ID must match');

  const nonExistent = getArtifactById('art-non-existent');
  assertEqual(nonExistent, null, 'Non-existent ID must return null');
});

test('Catalog Helpers', 'buildNoMatchMessage returns standard string', () => {
  assertEqual(buildNoMatchMessage('560034'), EXPLICIT_NO_MATCH_INDICATOR, 'Must return standard no match message');
});

// ---------------------------------------------------------------------------
// Test Suite Summary Output
// ---------------------------------------------------------------------------

console.log('====================================================');
console.log('TEST SUITE EXECUTION SUMMARY');
console.log('====================================================\n');

const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;

for (const res of results) {
  if (res.passed) {
    console.log(`  \x1b[32mPASS\x1b[0m [${res.suite}] ${res.name}`);
  } else {
    console.log(`  \x1b[31mFAIL\x1b[0m [${res.suite}] ${res.name}`);
    console.log(`       Error: ${res.error}`);
  }
}

console.log(`\nTotal Tests: ${total} | Passed: ${passed} | Failed: ${failed}`);

if (failed > 0) {
  console.log('\n\x1b[31mSOME TESTS FAILED!\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\n\x1b[32mALL TESTS PASSED SUCCESSFULLY! (100% Pass Rate)\x1b[0m\n');
  process.exit(0);
}
