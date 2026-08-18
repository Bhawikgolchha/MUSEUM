/**
 * Artifact Retrieval & Schema Normalization Service
 * Provides strict exact-PIN artifact lookup, schema normalization,
 * data quality metadata auditing, and PII sanitization.
 */

import rawMuseums from '@/data/indian-museums.json';
import rawArtifacts from '@/data/artifacts.json';
import {
  StandardizedArtifact,
  LicensingInfo,
  DataQuality,
} from './types';
import { redactPII } from './pii-redactor';

export interface ArtifactQueryResult {
  artifacts: StandardizedArtifact[];
  museum_linked_artifacts: StandardizedArtifact[];
  total_artifacts_found: number;
  totalFound: number;
  pincodeMatched: boolean;
  explicitNoMatchMessage?: string | null;
  message?: string | null;
}

export interface ArtifactQueryOptions {
  max_artifacts?: number;
  customMuseums?: any[];
  customArtifacts?: any[];
  sanitizePII?: boolean;
}

export const EXPLICIT_NO_MATCH_INDICATOR = 'no museum-linked artifacts found for this pincode';

/**
 * Curated metadata enrichments for museum masterworks in the catalog
 */
const KNOWN_CATALOG_ENRICHMENTS: Record<
  string,
  {
    exhibit_location: string;
    licensing_info: LicensingInfo;
    provenance_date?: string;
  }
> = {
  'art-001': {
    exhibit_location: 'Archaeology Gallery, Ground Floor',
    licensing_info: {
      license: 'CC-BY-SA 4.0',
      attribution_required: true,
      rights_holder: 'National Museum, New Delhi',
      url: 'https://nationalmuseumindia.gov.in',
    },
    provenance_date: 'c. 2300–1750 BCE',
  },
  'art-002': {
    exhibit_location: 'Bronze Gallery, Main Building',
    licensing_info: {
      license: 'CC-BY 4.0',
      attribution_required: true,
      rights_holder: 'Government Museum Chennai (Egmore)',
      url: 'https://govtmuseumchennai.org',
    },
    provenance_date: 'c. 10th–11th Century CE',
  },
  'art-003': {
    exhibit_location: 'Sculpture Gallery, Wing A',
    licensing_info: {
      license: 'CC-BY-SA 4.0',
      attribution_required: true,
      rights_holder: 'Bihar Museum, Patna',
      url: 'https://biharmuseum.org',
    },
    provenance_date: 'c. 3rd–2nd Century BCE',
  },
  'art-004': {
    exhibit_location: 'Main Central Hall',
    licensing_info: {
      license: 'Government Open Data / Public Domain',
      attribution_required: true,
      rights_holder: 'Archaeological Survey of India',
      url: 'https://asi.nic.in',
    },
    provenance_date: 'c. 250 BCE',
  },
  'art-005': {
    exhibit_location: 'Gupta Sculptural Gallery',
    licensing_info: {
      license: 'Government Open Data / Public Domain',
      attribution_required: true,
      rights_holder: 'Archaeological Survey of India',
      url: 'https://asi.nic.in',
    },
    provenance_date: 'c. 5th Century CE',
  },
  'art-006': {
    exhibit_location: 'Round Room, Gallery 33',
    licensing_info: {
      license: 'CC0 1.0 Universal',
      attribution_required: false,
      rights_holder: 'Birmingham Museums Trust',
      url: 'https://www.birminghammuseums.org.uk',
    },
    provenance_date: 'c. 500–700 CE',
  },
  'art-007': {
    exhibit_location: 'Bharhut Gallery, Ground Floor',
    licensing_info: {
      license: 'Government Open Data / Public Domain',
      attribution_required: true,
      rights_holder: 'Indian Museum, Kolkata',
      url: 'https://indianmuseumkolkata.org',
    },
    provenance_date: 'c. 2nd Century BCE',
  },
  'art-008': {
    exhibit_location: 'Gandhara Sculptural Gallery',
    licensing_info: {
      license: 'Government Open Data / Public Domain',
      attribution_required: true,
      rights_holder: 'Indian Museum, Kolkata',
      url: 'https://indianmuseumkolkata.org',
    },
    provenance_date: 'c. 2nd–3rd Century CE',
  },
  'art-009': {
    exhibit_location: 'European Marble Gallery, First Floor',
    licensing_info: {
      license: 'CC-BY-SA 4.0',
      attribution_required: true,
      rights_holder: 'Salar Jung Museum, Hyderabad',
      url: 'https://salarjungmuseum.in',
    },
    provenance_date: '1876 CE',
  },
  'art-010': {
    exhibit_location: 'Mughal Armory & Jade Gallery',
    licensing_info: {
      license: 'CC-BY-SA 4.0',
      attribution_required: true,
      rights_holder: 'Salar Jung Museum, Hyderabad',
      url: 'https://salarjungmuseum.in',
    },
    provenance_date: 'c. 1620 CE',
  },
};

/**
 * Clamps max_artifacts integer between 1 and 50 (default: 10).
 */
export function clampMaxArtifacts(max?: number): number {
  if (typeof max !== 'number' || isNaN(max)) {
    return 10;
  }
  return Math.max(1, Math.min(50, Math.floor(max)));
}

/**
 * Audits artifact record against required fields:
 * ['artifact_id', 'title', 'description', 'museum_name', 'museum_id', 'pincode', 'exhibit_location', 'digital_asset_urls', 'provenance_date', 'licensing_info']
 */
export function auditDataQuality(artifact: Partial<StandardizedArtifact>): DataQuality {
  const missing_fields: string[] = [];

  if (!artifact.artifact_id || typeof artifact.artifact_id !== 'string' || artifact.artifact_id.trim() === '') {
    missing_fields.push('artifact_id');
  }

  if (!artifact.title || typeof artifact.title !== 'string' || artifact.title.trim() === '') {
    missing_fields.push('title');
  }

  if (!artifact.description || typeof artifact.description !== 'string' || artifact.description.trim() === '') {
    missing_fields.push('description');
  }

  if (!artifact.museum_name || typeof artifact.museum_name !== 'string' || artifact.museum_name.trim() === '') {
    missing_fields.push('museum_name');
  }

  if (!artifact.museum_id || typeof artifact.museum_id !== 'string' || artifact.museum_id.trim() === '') {
    missing_fields.push('museum_id');
  }

  if (!artifact.pincode || typeof artifact.pincode !== 'string' || artifact.pincode.trim() === '') {
    missing_fields.push('pincode');
  }

  if (
    !artifact.exhibit_location ||
    typeof artifact.exhibit_location !== 'string' ||
    artifact.exhibit_location.trim() === ''
  ) {
    missing_fields.push('exhibit_location');
  }

  if (
    !Array.isArray(artifact.digital_asset_urls) ||
    artifact.digital_asset_urls.length === 0 ||
    artifact.digital_asset_urls.some((url) => !url || typeof url !== 'string' || url.trim() === '')
  ) {
    missing_fields.push('digital_asset_urls');
  }

  if (
    !artifact.provenance_date ||
    typeof artifact.provenance_date !== 'string' ||
    artifact.provenance_date.trim() === ''
  ) {
    missing_fields.push('provenance_date');
  }

  if (
    !artifact.licensing_info ||
    typeof artifact.licensing_info !== 'object' ||
    !artifact.licensing_info.license ||
    typeof artifact.licensing_info.license !== 'string' ||
    artifact.licensing_info.license.trim() === '' ||
    !artifact.licensing_info.rights_holder ||
    typeof artifact.licensing_info.rights_holder !== 'string' ||
    artifact.licensing_info.rights_holder.trim() === ''
  ) {
    missing_fields.push('licensing_info');
  }

  return {
    is_complete: missing_fields.length === 0,
    missing_fields,
  };
}

/**
 * Normalizes raw artifact and linked museum data into the standard schema.
 * Applies PII redaction and runs data quality auditing.
 */
export function normalizeArtifact(
  rawArtifact: any,
  museum?: any,
  options?: { sanitizePII?: boolean }
): StandardizedArtifact {
  const shouldSanitize = options?.sanitizePII !== false;
  const artifactId = rawArtifact.id || rawArtifact.artifact_id || '';
  const enrichment = KNOWN_CATALOG_ENRICHMENTS[artifactId];

  // 1. Title & Description
  let rawTitle = rawArtifact.title || 'Untitled Artifact';
  let rawDesc =
    rawArtifact.canonicalText ||
    rawArtifact.description ||
    rawArtifact.curatorAltText ||
    '';

  if (shouldSanitize) {
    rawTitle = redactPII(rawTitle);
    rawDesc = redactPII(rawDesc);
  }

  // 2. Museum Details
  const museumName =
    museum?.name ||
    rawArtifact.museumName ||
    rawArtifact.museum_name ||
    '';
  const museumId =
    museum?.id ||
    rawArtifact.museum_id ||
    rawArtifact.museumId ||
    '';
  const pincode =
    museum?.pincode ||
    rawArtifact.pincode ||
    '';

  // 3. Exhibit Location
  const exhibitLocation =
    rawArtifact.exhibit_location ||
    rawArtifact.exhibitLocation ||
    enrichment?.exhibit_location ||
    '';

  // 4. Digital Asset URLs
  let digitalAssetUrls: string[] = [];
  if (Array.isArray(rawArtifact.digital_asset_urls)) {
    digitalAssetUrls = rawArtifact.digital_asset_urls.filter(Boolean);
  } else if (Array.isArray(rawArtifact.digitalAssetUrls)) {
    digitalAssetUrls = rawArtifact.digitalAssetUrls.filter(Boolean);
  } else if (rawArtifact.imageUrl && typeof rawArtifact.imageUrl === 'string') {
    digitalAssetUrls = [rawArtifact.imageUrl];
  } else if (museum?.gallery_urls && Array.isArray(museum.gallery_urls) && museum.gallery_urls.length > 0) {
    digitalAssetUrls = museum.gallery_urls.filter(Boolean);
  } else if (museum?.thumbnail_url && typeof museum.thumbnail_url === 'string') {
    digitalAssetUrls = [museum.thumbnail_url];
  }

  // 5. Provenance Date
  let provenanceDate =
    rawArtifact.period ||
    rawArtifact.provenance_date ||
    rawArtifact.provenanceDate ||
    rawArtifact.date ||
    enrichment?.provenance_date ||
    '';
  if (shouldSanitize && provenanceDate) {
    provenanceDate = redactPII(provenanceDate);
  }

  // 6. Licensing Info
  let licensingInfo: LicensingInfo;
  if (rawArtifact.licensing_info && typeof rawArtifact.licensing_info === 'object') {
    licensingInfo = {
      license: rawArtifact.licensing_info.license || '',
      attribution_required: Boolean(rawArtifact.licensing_info.attribution_required),
      rights_holder: rawArtifact.licensing_info.rights_holder || '',
      url: rawArtifact.licensing_info.url,
    };
  } else if (rawArtifact.licensingInfo && typeof rawArtifact.licensingInfo === 'object') {
    licensingInfo = {
      license: rawArtifact.licensing_info.license || '',
      attribution_required: Boolean(rawArtifact.licensing_info.attribution_required),
      rights_holder: rawArtifact.licensing_info.rights_holder || '',
      url: rawArtifact.licensing_info.url,
    };
  } else if (enrichment?.licensing_info) {
    licensingInfo = { ...enrichment.licensing_info };
  } else if (museum) {
    licensingInfo = {
      license: 'CC-BY-SA 4.0',
      attribution_required: true,
      rights_holder: museum.name || 'Museum Repository',
      url: museum.contact?.website,
    };
  } else {
    licensingInfo = {
      license: '',
      attribution_required: false,
      rights_holder: '',
    };
  }

  // Intermediate standardized artifact
  const unverified: Omit<StandardizedArtifact, 'data_quality'> = {
    artifact_id: artifactId,
    title: rawTitle,
    description: rawDesc,
    museum_name: museumName,
    museum_id: museumId,
    pincode,
    exhibit_location: exhibitLocation,
    digital_asset_urls: digitalAssetUrls,
    provenance_date: provenanceDate,
    licensing_info: licensingInfo,
  };

  // Perform data quality audit
  const quality = auditDataQuality(unverified);

  return {
    ...unverified,
    data_quality: quality,
  };
}

/**
 * Builds the standard explicit zero-match reporting string.
 */
export function buildNoMatchMessage(pincode?: string): string {
  return EXPLICIT_NO_MATCH_INDICATOR;
}

/**
 * Queries museum and artifact repositories strictly matching the requested PIN code.
 * ZERO fuzzy, nearest-neighbor, or distance-based fallback.
 */
export function getArtifactsForPincode(
  pincode: string,
  options?: ArtifactQueryOptions
): ArtifactQueryResult {
  const museums = (options?.customMuseums || rawMuseums) as any[];
  const artifacts = (options?.customArtifacts || rawArtifacts) as any[];

  if (!pincode || typeof pincode !== 'string') {
    return {
      artifacts: [],
      museum_linked_artifacts: [],
      total_artifacts_found: 0,
      totalFound: 0,
      pincodeMatched: false,
      explicitNoMatchMessage: EXPLICIT_NO_MATCH_INDICATOR,
      message: EXPLICIT_NO_MATCH_INDICATOR,
    };
  }

  const cleanPin = pincode.trim();
  const isValidFormat = /^[1-9][0-9]{5}$/.test(cleanPin);
  if (!isValidFormat) {
    return {
      artifacts: [],
      museum_linked_artifacts: [],
      total_artifacts_found: 0,
      totalFound: 0,
      pincodeMatched: false,
      explicitNoMatchMessage: EXPLICIT_NO_MATCH_INDICATOR,
      message: EXPLICIT_NO_MATCH_INDICATOR,
    };
  }

  // 1. Find all museums located at this exact PIN code
  const matchedMuseums = museums.filter((m) => m.pincode === cleanPin);

  // 2. Find artifacts directly associated with matching museums or having matching pincode
  const matchedArtifacts: StandardizedArtifact[] = [];
  const seenArtifactIds = new Set<string>();

  for (const museum of matchedMuseums) {
    // Artifacts linked to this museum
    const linked = artifacts.filter((art) => {
      if (art.museum_id && art.museum_id === museum.id) return true;
      if (art.museumId && art.museumId === museum.id) return true;
      if (museum.featured_artifacts && Array.isArray(museum.featured_artifacts) && museum.featured_artifacts.includes(art.id)) {
        return true;
      }
      if (museum.muse_collection_id && museum.muse_collection_id === art.id) return true;
      if (art.museumName && museum.name && art.museumName.toLowerCase().trim() === museum.name.toLowerCase().trim()) {
        return true;
      }
      return false;
    });

    for (const rawArt of linked) {
      const artId = rawArt.id || rawArt.artifact_id || '';
      if (!seenArtifactIds.has(artId)) {
        seenArtifactIds.add(artId);
        matchedArtifacts.push(
          normalizeArtifact(rawArt, museum, { sanitizePII: options?.sanitizePII ?? true })
        );
      }
    }
  }

  // Also check if any standalone artifact has pincode matching cleanPin
  const standaloneMatches = artifacts.filter((art) => {
    const artPin = art.pincode || art.pin_code;
    return artPin === cleanPin && !seenArtifactIds.has(art.id || art.artifact_id);
  });

  for (const rawArt of standaloneMatches) {
    const artId = rawArt.id || rawArt.artifact_id || '';
    seenArtifactIds.add(artId);
    matchedArtifacts.push(
      normalizeArtifact(rawArt, undefined, { sanitizePII: options?.sanitizePII ?? true })
    );
  }

  const totalFound = matchedArtifacts.length;

  // STRICT ZERO-MATCH: If no artifacts matched, return explicit zero-match response
  if (totalFound === 0) {
    return {
      artifacts: [],
      museum_linked_artifacts: [],
      total_artifacts_found: 0,
      totalFound: 0,
      pincodeMatched: matchedMuseums.length > 0,
      explicitNoMatchMessage: EXPLICIT_NO_MATCH_INDICATOR,
      message: EXPLICIT_NO_MATCH_INDICATOR,
    };
  }

  // Apply max_artifacts limit
  const maxLimit = clampMaxArtifacts(options?.max_artifacts);
  const slicedArtifacts = matchedArtifacts.slice(0, maxLimit);

  return {
    artifacts: slicedArtifacts,
    museum_linked_artifacts: slicedArtifacts,
    total_artifacts_found: totalFound,
    totalFound,
    pincodeMatched: true,
    explicitNoMatchMessage: null,
    message: null,
  };
}

/**
 * Alias for getArtifactsForPincode
 */
export const queryArtifactsByPincode = getArtifactsForPincode;

/**
 * Retrieves all standardized artifacts in the catalog.
 */
export function getAllStandardizedArtifacts(options?: { sanitizePII?: boolean }): StandardizedArtifact[] {
  const artifacts = rawArtifacts as any[];
  const museums = rawMuseums as any[];

  return artifacts.map((rawArt) => {
    const matchingMuseum = museums.find((m) => {
      if (rawArt.museum_id && rawArt.museum_id === m.id) return true;
      if (rawArt.museumId && rawArt.museumId === m.id) return true;
      if (m.featured_artifacts && m.featured_artifacts.includes(rawArt.id)) return true;
      if (m.muse_collection_id && m.muse_collection_id === rawArt.id) return true;
      if (rawArt.museumName && m.name && rawArt.museumName.toLowerCase().trim() === m.name.toLowerCase().trim()) return true;
      return false;
    });

    return normalizeArtifact(rawArt, matchingMuseum, options);
  });
}

/**
 * Retrieves a single standardized artifact by ID.
 */
export function getArtifactById(id: string, options?: { sanitizePII?: boolean }): StandardizedArtifact | null {
  const all = getAllStandardizedArtifacts(options);
  return all.find((a) => a.artifact_id === id) || null;
}
