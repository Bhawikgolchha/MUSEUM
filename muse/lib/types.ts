export type ClaimType =
  | 'material'
  | 'date'
  | 'provenance'
  | 'function'
  | 'attribution'
  | 'interpretation'
  | 'measurement'
  | 'cultural_significance';

export type ClaimCriticality = 'must_include' | 'optional' | 'must_not_simplify';

export type ClaimStatus = 'covered' | 'omitted' | 'contradicted';

export type FidelityVerdict = 'pass' | 'fail' | 'unverified';

export interface Claim {
  id: string;
  text: string;
  type: ClaimType;
  criticality: ClaimCriticality;
  hedge: string | null;
}

export interface Artifact {
  id: string;
  museumName: string;
  title: string;
  imageUrl: string;
  curatorAltText: string;
  period: string;
  material: string;
  culture: string;
  provenanceLine: string;
  canonicalText: string;
  sensitivityFlags: string[];
  contentNoticeText: string | null;
  claims: Claim[];
}

export type Audience = 'adult' | 'child' | 'specialist';
export type Depth = 'quick' | 'standard' | 'deep';

export interface Persona {
  audience: Audience;
  depth: Depth;
  accessibility: boolean;
}

export interface Section {
  heading: string;
  body: string;
}

export interface GlossaryTerm {
  term: string;
  plainDefinition: string;
}

export interface Changelog {
  operations: string[];
  claimsCovered: string[];
  claimsOmitted: Array<{ id: string; reason?: string } | string>;
  claimsContradicted?: string[];
  hedgesPreserved?: boolean;
}

export interface ClaimAuditItem {
  id: string;
  status: ClaimStatus;
  span?: string;
  criticality?: ClaimCriticality;
  note?: string;
}

export interface FidelityReport {
  verdict: FidelityVerdict;
  covered: number;
  total: number;
  claims: ClaimAuditItem[];
}

export interface Variant {
  artifactId: string;
  persona: Persona;
  attribution: string;
  aiDisclosure: string;
  tags: {
    tone: string;
    level: string;
    tier?: string;
  };
  readingTimeSeconds: number;
  sections: Section[];
  lookCloser: string[];
  glossary?: GlossaryTerm[];
  changelog: Changelog;
  fidelity: FidelityReport;
  highContrastHints?: {
    keyTerms?: string[];
    emphasisSpans?: string[];
  };
}
