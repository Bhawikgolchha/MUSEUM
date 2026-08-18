import variantsData from '@/data/variants.json';
import { getArtifactById } from './artifacts';
import { Persona, Variant } from './types';
import { getPersonaKey } from './personas';

const precomputedVariants: Record<string, Variant> = (variantsData || {}) as Record<string, Variant>;

export interface ResolveVariantResult {
  variant: Variant | null;
  isFallback: boolean;
  fallbackReason: string | null;
}

export function resolveVariant(
  artifactId: string,
  persona: Persona,
  forcedFail = false
): ResolveVariantResult {
  const artifact = getArtifactById(artifactId);
  if (!artifact) {
    return {
      variant: null,
      isFallback: true,
      fallbackReason: `Artifact ${artifactId} not found`,
    };
  }

  // Handle Forced Failure Demo Trigger
  if (forcedFail) {
    const failedClaims = artifact.claims.map((c, i) => ({
      id: c.id,
      status: i === 0 ? ('contradicted' as const) : ('covered' as const),
      span: i === 0 ? 'Contradictory assertion: Date altered without historical evidence.' : c.text,
      criticality: c.criticality,
      note: i === 0 ? 'Factual contradiction detected in generated text.' : undefined,
    }));

    const failedVariant: Variant = {
      artifactId: artifact.id,
      persona,
      attribution: `Based on the museum-provided description by ${artifact.museumName}.`,
      aiDisclosure: `Check failed. Falling back to the museum's verbatim text.`,
      tags: {
        tone: 'academic',
        level: 'grade_9',
        tier: 'T0',
      },
      readingTimeSeconds: 60,
      sections: [
        {
          heading: "Museum's Original Description (Safe Fallback)",
          body: artifact.canonicalText,
        },
      ],
      lookCloser: [],
      changelog: {
        operations: ['reverted_to_canonical_due_to_verification_failure'],
        claimsCovered: artifact.claims.slice(1).map((c) => c.id),
        claimsOmitted: [artifact.claims[0].id],
        claimsContradicted: [artifact.claims[0].id],
        hedgesPreserved: false,
      },
      fidelity: {
        verdict: 'fail',
        covered: artifact.claims.length - 1,
        total: artifact.claims.length,
        claims: failedClaims,
      },
    };

    return {
      variant: failedVariant,
      isFallback: true,
      fallbackReason: 'Claim verification failed: Factual contradiction detected. Reverting to museum canonical text.',
    };
  }

  const key = getPersonaKey(artifactId, persona.audience, persona.depth);
  const found = precomputedVariants[key];

  if (found) {
    if (found.fidelity && found.fidelity.verdict === 'fail') {
      return {
        variant: found,
        isFallback: true,
        fallbackReason: 'Fidelity audit failed. Showing museum canonical text.',
      };
    }

    return {
      variant: found,
      isFallback: false,
      fallbackReason: null,
    };
  }

  // If variant not yet in static cache, return null so client can fetch from /api/muse
  return {
    variant: null,
    isFallback: false,
    fallbackReason: null,
  };
}
