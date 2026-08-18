/**
 * PII Redactor Utility
 * Sanitizes personally identifiable information (curator names, donor names,
 * email addresses, phone/mobile numbers, personal ID numbers) from textual fields
 * and provenance descriptions.
 */

export const PII_TOKENS = {
  EMAIL: '[REDACTED_EMAIL]',
  PHONE: '[REDACTED_PHONE]',
  DONOR: '[REDACTED_DONOR]',
  CURATOR: '[REDACTED_CURATOR]',
  NAME: '[REDACTED_NAME]',
  ID: '[REDACTED_ID]',
} as const;

/**
 * Redacts email addresses matching standard RFC-compliant and common email formats.
 */
export function redactEmails(text: string): string {
  if (!text || typeof text !== 'string') return text;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  return text.replace(emailRegex, PII_TOKENS.EMAIL);
}

/**
 * Redacts personal identification numbers (Aadhaar, PAN, SSN, Passport).
 */
export function redactPersonalIds(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // Indian Aadhaar Number (12 digits with spaces or hyphens)
  result = result.replace(/\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g, PII_TOKENS.ID);

  // Indian PAN (Permanent Account Number: 5 letters, 4 digits, 1 letter)
  result = result.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, PII_TOKENS.ID);

  // US Social Security Number (SSN: 3 digits - 2 digits - 4 digits)
  result = result.replace(/\b\d{3}-\d{2}-\d{4}\b/g, PII_TOKENS.ID);

  // Labeled Passport number (e.g. "Passport: Z1234567" or "Passport No. A9876543")
  result = result.replace(
    /\b(passport(?:\s*(?:no|number|num))?[:\s]+)([A-Z][0-9]{7,8})\b/gi,
    `$1${PII_TOKENS.ID}`
  );

  return result;
}

/**
 * Redacts phone and mobile numbers (Indian & International formats).
 * Preserves 4-digit years, 6-digit postal PIN codes, and dimension measurements.
 */
export function redactPhones(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // 1. Explicitly labeled phone numbers (e.g. Phone: +91 11 2301 9272, Tel: 044-28193238, Mobile: 9876543210)
  const labeledPhoneRegex =
    /\b((?:phone|tel|telephone|mobile|cell|contact|fax)(?:\s*(?:no|number))?[:\s]+)(\+?\d[\d\s().-]{6,20}\d)\b/gi;
  result = result.replace(labeledPhoneRegex, (match, prefix) => `${prefix}${PII_TOKENS.PHONE}`);

  // 2. Specific high-confidence phone patterns:
  // - Explicit international: +91 followed by 10 digits or STD code
  result = result.replace(/\+91[\s.-]?[6-9]\d{4}[\s.-]?\d{5}\b/g, PII_TOKENS.PHONE);
  result = result.replace(/\+91[\s.-]?\d{2,4}[\s.-]?\d{6,8}\b/g, PII_TOKENS.PHONE);
  result = result.replace(/\+\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g, PII_TOKENS.PHONE);

  // - Standard Indian 10-digit mobile number starting with 6, 7, 8, 9 (e.g. 9876543210 or 98765-43210)
  result = result.replace(/\b[6-9]\d{4}[\s.-]?\d{5}\b/g, PII_TOKENS.PHONE);

  // - Standard US formatted (e.g. 123-456-7890 or (123) 456-7890)
  result = result.replace(/\b(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}\b/g, PII_TOKENS.PHONE);

  // - Landline with STD code (e.g. 011-23019272 or 044-28193238 or (011) 2301-9272)
  result = result.replace(/\b0\d{2,4}[\s.-]?\d{6,8}\b/g, PII_TOKENS.PHONE);
  result = result.replace(/\(0\d{2,4}\)[\s.-]?\d{6,8}\b/g, PII_TOKENS.PHONE);

  return result;
}

/**
 * Redacts donor, curator, and collector personal names from provenance/attribution patterns.
 */
export function redactDonorAndCuratorNames(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // Title prefix helper: Dr., Mr., Mrs., Ms., Prof., Sir, Lady, etc.
  const titlePrefix = '(?:(?:Dr\\.|Mr\\.|Mrs\\.|Ms\\.|Prof\\.|Sir|Lady|Shri|Smt\\.)\\s+)?';
  // Excluded noun words that commonly follow donor/curator/object descriptions
  const excludedWords =
    '(?!Artifact|Collection|Sculpture|Statue|Painting|Exhibition|Gallery|Museum|Temple|Manuscript|Bronze|Gold|Silver|Stone|Wood|Terracotta|Coins|Plate|Object|Piece|Work|Item|Masterwork|Heritage|Century|Period|Dynasty|BCE|CE|AD|BC|National|State|Regional)';
  const singleNameToken = '(?:[A-Z][a-z]+|[A-Z]\\.)';
  const namePattern = `(${titlePrefix}${excludedWords}${singleNameToken}(?:\\s+${excludedWords}${singleNameToken}){1,2})`;

  // 1. Donor patterns: "Donor: John Doe", "Donated by John Doe", "Gift of Mrs. Jane Smith", "Acquired from Robert Brown", "Bequest of John Doe"
  const donorRegex = new RegExp(
    `\\b(donated\\s+by|donor[:\\s]+|gift\\s+of|acquired\\s+from|bequest\\s+of|presented\\s+by)\\s+${namePattern}`,
    'gi'
  );
  result = result.replace(donorRegex, (match, prefix) => `${prefix} ${PII_TOKENS.DONOR}`);

  // 2. Curator patterns: "Curator: Alice Wonder", "Curated by Dr. Alice Wonder", "Curatorial Lead: Bob Smith"
  const curatorRegex = new RegExp(
    `\\b(curated\\s+by|curator[:\\s]+|curatorial\\s+lead[:\\s]+|chief\\s+curator[:\\s]+)\\s+${namePattern}`,
    'gi'
  );
  result = result.replace(curatorRegex, (match, prefix) => `${prefix} ${PII_TOKENS.CURATOR}`);

  // 3. Collector patterns: "Collector: Robert Brown", "Collected by Robert Brown"
  const collectorRegex = new RegExp(
    `\\b(collector[:\\s]+|collected\\s+by)\\s+${namePattern}`,
    'gi'
  );
  result = result.replace(collectorRegex, (match, prefix) => `${prefix} ${PII_TOKENS.DONOR}`);

  // 4. Contact person / submitter patterns: "Contact Person: Jane Doe", "Submitted by: John Smith"
  const contactPersonRegex = new RegExp(
    `\\b(contact\\s+person[:\\s]+|submitted\\s+by[:\\s]+|verified\\s+by[:\\s]+)\\s+${namePattern}`,
    'gi'
  );
  result = result.replace(contactPersonRegex, (match, prefix) => `${prefix} ${PII_TOKENS.NAME}`);

  return result;
}

/**
 * Full PII Sanitization Pipeline.
 * Deterministically scrubs emails, phone numbers, personal IDs, and donor/curator attributions.
 */
export function redactPII(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;
  sanitized = redactEmails(sanitized);
  sanitized = redactPersonalIds(sanitized);
  sanitized = redactPhones(sanitized);
  sanitized = redactDonorAndCuratorNames(sanitized);

  return sanitized;
}

/**
 * Detects occurrences of PII in a given string without modifying it.
 */
export function detectPII(text: string): Array<{ type: string; match: string; token: string }> {
  if (!text || typeof text !== 'string') return [];

  const detections: Array<{ type: string; match: string; token: string }> = [];

  // Emails
  const emailMatches = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g);
  if (emailMatches) {
    for (const m of emailMatches) {
      detections.push({ type: 'email', match: m, token: PII_TOKENS.EMAIL });
    }
  }

  // Phones
  const phoneMatches = text.match(/(?:\+91[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{4,5}\b/g);
  if (phoneMatches) {
    for (const m of phoneMatches) {
      if (m.replace(/\D/g, '').length >= 7) {
        detections.push({ type: 'phone', match: m, token: PII_TOKENS.PHONE });
      }
    }
  }

  // IDs
  const aadhaarMatches = text.match(/\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g);
  if (aadhaarMatches) {
    for (const m of aadhaarMatches) {
      detections.push({ type: 'aadhaar', match: m, token: PII_TOKENS.ID });
    }
  }

  const panMatches = text.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g);
  if (panMatches) {
    for (const m of panMatches) {
      detections.push({ type: 'pan', match: m, token: PII_TOKENS.ID });
    }
  }

  return detections;
}

/**
 * Returns true if the string contains detectable PII.
 */
export function hasPII(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const sanitized = redactPII(text);
  return sanitized !== text;
}

/**
 * Deeply traverses an object or array and applies PII redaction to all string properties.
 */
export function redactObjectPII<T>(target: T): T {
  if (target === null || target === undefined) return target;

  if (typeof target === 'string') {
    return redactPII(target) as unknown as T;
  }

  if (Array.isArray(target)) {
    return target.map((item) => redactObjectPII(item)) as unknown as T;
  }

  if (typeof target === 'object') {
    const copy: Record<string, any> = {};
    for (const [key, value] of Object.entries(target)) {
      copy[key] = redactObjectPII(value);
    }
    return copy as T;
  }

  return target;
}
