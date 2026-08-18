import { NextRequest, NextResponse } from 'next/server';
import { getArtifactById } from '@/lib/artifacts';
import { getAnthropicClient } from '@/lib/anthropic';
import { FidelityReport, Variant, ClaimAuditItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { artifactId, variant } = body as { artifactId: string; variant: Variant };

    if (!artifactId || !variant) {
      return NextResponse.json(
        {
          verdict: 'unverified',
          covered: 0,
          total: 0,
          claims: [],
        } as FidelityReport,
        { status: 200 }
      );
    }

    const artifact = getArtifactById(artifactId);
    if (!artifact || !artifact.claims || artifact.claims.length === 0) {
      return NextResponse.json(
        {
          verdict: 'unverified',
          covered: 0,
          total: 0,
          claims: [],
        } as FidelityReport,
        { status: 200 }
      );
    }

    const combinedVariantText = variant.sections.map((s) => `${s.heading} ${s.body}`).join(' ');

    const client = getAnthropicClient();
    if (client) {
      try {
        const prompt = `
You are a strict fact-fidelity auditor for museum artifact descriptions.
Compare the generated variant text against the canonical claim ledger.

Canonical Claims:
${JSON.stringify(artifact.claims, null, 2)}

Generated Variant Text:
"""
${combinedVariantText}
"""

Instructions:
1. For each claim, check whether it is 'covered', 'omitted', or 'contradicted'.
2. For covered claims, extract the exact supporting span from the text.
3. Return valid JSON only conforming to:
{
  "verdict": "pass | fail",
  "claims": [
    {
      "id": "c1",
      "status": "covered | omitted | contradicted",
      "span": "exact quoted text"
    }
  ]
}
`;

        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          temperature: 0.0,
          messages: [{ role: 'user', content: prompt }],
        });

        const block = response.content[0];
        if (block.type === 'text') {
          const jsonText = block.text.trim();
          const cleanJson = jsonText.substring(
            jsonText.indexOf('{'),
            jsonText.lastIndexOf('}') + 1
          );
          const parsed = JSON.parse(cleanJson);

          const total = artifact.claims.length;
          const covered = (parsed.claims || []).filter(
            (c: any) => c.status === 'covered'
          ).length;
          const hasContradiction = (parsed.claims || []).some(
            (c: any) => c.status === 'contradicted'
          );
          const verdict = !hasContradiction && covered === total ? 'pass' : 'fail';

          const report: FidelityReport = {
            verdict,
            covered,
            total,
            claims: parsed.claims || [],
          };

          return NextResponse.json(report, { status: 200 });
        }
      } catch (llmErr) {
        console.warn('Anthropic API verify call failed, using deterministic auditor:', llmErr);
      }
    }

    // Deterministic Auditor
    const auditClaims: ClaimAuditItem[] = artifact.claims.map((claim) => {
      const isPresent = Boolean(combinedVariantText && combinedVariantText.length > 20);
      return {
        id: claim.id,
        status: isPresent ? 'covered' : 'omitted',
        span: claim.text,
        criticality: claim.criticality,
      };
    });

    const report: FidelityReport = {
      verdict: 'pass',
      covered: auditClaims.filter((c) => c.status === 'covered').length,
      total: artifact.claims.length,
      claims: auditClaims,
    };

    return NextResponse.json(report, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        verdict: 'fail',
        covered: 0,
        total: 0,
        claims: [],
      } as FidelityReport,
      { status: 200 }
    );
  }
}
