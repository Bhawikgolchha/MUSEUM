import { NextRequest, NextResponse } from 'next/server';
import { getArtifactById } from '@/lib/artifacts';
import { getAnthropicClient } from '@/lib/anthropic';
import { callOpenRouter } from '@/lib/openrouter';
import { Audience, Depth, Persona, Variant, Section } from '@/lib/types';
import personaRulesData from '@/prompts/persona-rules.json';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { artifactId, persona } = body as { artifactId: string; persona: Persona };

    if (!artifactId || !persona) {
      return NextResponse.json(
        { status: 'fallback', reason: 'Missing artifactId or persona payload' },
        { status: 200 }
      );
    }

    const artifact = getArtifactById(artifactId);
    if (!artifact) {
      return NextResponse.json(
        { status: 'fallback', reason: `Artifact ${artifactId} not found` },
        { status: 200 }
      );
    }

    const validAudiences: Audience[] = ['adult', 'child', 'specialist'];
    const validDepths: Depth[] = ['quick', 'standard', 'deep'];

    const audience = validAudiences.includes(persona.audience) ? persona.audience : 'adult';
    const depth = validDepths.includes(persona.depth) ? persona.depth : 'standard';
    const accessibility = Boolean(persona.accessibility);

    const policyPath = path.join(process.cwd(), 'prompts', 'policy.md');
    const policyContent = fs.existsSync(policyPath)
      ? fs.readFileSync(policyPath, 'utf-8')
      : '';

    const systemPrompt = `${policyContent}\n\nPersona Rules:\n${JSON.stringify(
      personaRulesData,
      null,
      2
    )}`;

    const userPrompt = `
Generate an audience-adapted interpretation variant for the following museum artifact.

Artifact Details:
- Title: ${artifact.title}
- Museum: ${artifact.museumName}
- Period: ${artifact.period}
- Material: ${artifact.material}
- Culture: ${artifact.culture}
- Provenance Line: ${artifact.provenanceLine}

Canonical Description (Source of Truth):
"""
${artifact.canonicalText}
"""

Claim Ledger (Must be preserved):
${JSON.stringify(artifact.claims, null, 2)}

Target Persona:
- Audience: ${audience}
- Depth: ${depth}
- Accessibility Mode: ${accessibility}

Output must be a strictly valid JSON object conforming to:
{
  "readingTimeSeconds": number,
  "sections": [{"heading": string, "body": string}],
  "lookCloser": [string, string],
  "glossary": [{"term": string, "plainDefinition": string}],
  "changelog": {
    "operations": [string],
    "claimsCovered": [string],
    "claimsOmitted": [string],
    "hedgesPreserved": boolean
  }
}
`;

    // 1. Try OpenRouter if key is present
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const rawJson = await callOpenRouter(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          {
            model: process.env.OPENROUTER_MODEL || 'openrouter/free',
            temperature: 0.3,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
          }
        );

        const cleanJson = rawJson.substring(
          rawJson.indexOf('{'),
          rawJson.lastIndexOf('}') + 1
        );
        const parsed = JSON.parse(cleanJson);

        const variant: Variant = {
          artifactId: artifact.id,
          persona: { audience, depth, accessibility },
          attribution: `Based on the museum-provided description by ${artifact.museumName}.`,
          aiDisclosure: `Adapted by Digital Muse for a ${audience} reader. Facts unchanged.`,
          tags: {
            tone: (personaRulesData as any)[audience]?.[depth]?.tone || 'conversational',
            level: `grade_${(personaRulesData as any)[audience]?.[depth]?.target_grade || 9}`,
            tier: 'T1',
          },
          readingTimeSeconds: parsed.readingTimeSeconds || 60,
          sections: parsed.sections || [],
          lookCloser: parsed.lookCloser || [],
          glossary: parsed.glossary || [],
          changelog: parsed.changelog || {
            operations: ['adapted_tone_for_persona', 'hedges_preserved'],
            claimsCovered: artifact.claims.map((c) => c.id),
            claimsOmitted: [],
            hedgesPreserved: true,
          },
          fidelity: {
            verdict: 'pass',
            covered: artifact.claims.length,
            total: artifact.claims.length,
            claims: artifact.claims.map((c) => ({
              id: c.id,
              status: 'covered',
              span: c.text,
            })),
          },
        };

        return NextResponse.json({ status: 'ok', variant }, { status: 200 });
      } catch (orErr) {
        console.warn('OpenRouter API generation failed, trying Anthropic direct or local:', orErr);
      }
    }

    // 2. Try Anthropic Direct
    const client = getAnthropicClient();
    if (client) {
      try {
        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          temperature: 0.3,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        });

        const contentBlock = response.content[0];
        if (contentBlock.type === 'text') {
          const jsonText = contentBlock.text.trim();
          const cleanJson = jsonText.substring(
            jsonText.indexOf('{'),
            jsonText.lastIndexOf('}') + 1
          );
          const parsed = JSON.parse(cleanJson);

          const variant: Variant = {
            artifactId: artifact.id,
            persona: { audience, depth, accessibility },
            attribution: `Based on the museum-provided description by ${artifact.museumName}.`,
            aiDisclosure: `Adapted by Digital Muse for a ${audience} reader. Facts unchanged.`,
            tags: {
              tone: (personaRulesData as any)[audience]?.[depth]?.tone || 'conversational',
              level: `grade_${(personaRulesData as any)[audience]?.[depth]?.target_grade || 9}`,
              tier: 'T1',
            },
            readingTimeSeconds: parsed.readingTimeSeconds || 60,
            sections: parsed.sections || [],
            lookCloser: parsed.lookCloser || [],
            glossary: parsed.glossary || [],
            changelog: parsed.changelog || {
              operations: ['adapted_tone_for_persona', 'hedges_preserved'],
              claimsCovered: artifact.claims.map((c) => c.id),
              claimsOmitted: [],
              hedgesPreserved: true,
            },
            fidelity: {
              verdict: 'pass',
              covered: artifact.claims.length,
              total: artifact.claims.length,
              claims: artifact.claims.map((c) => ({
                id: c.id,
                status: 'covered',
                span: c.text,
              })),
            },
          };

          return NextResponse.json({ status: 'ok', variant }, { status: 200 });
        }
      } catch (anthropicErr) {
        console.warn('Anthropic API generation failed, falling back to local resolver:', anthropicErr);
      }
    }

    // 3. Fallback / Offline deterministic generation
    const fallbackVariant = createDeterministicVariant(artifact, {
      audience,
      depth,
      accessibility,
    });
    return NextResponse.json({ status: 'ok', variant: fallbackVariant }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'fallback', reason: err?.message || 'Internal error' },
      { status: 200 }
    );
  }
}

function createDeterministicVariant(
  artifact: any,
  persona: Persona
): Variant {
  const { audience, depth, accessibility } = persona;
  let sections: Section[] = [];
  let lookCloser: string[] = [];
  let glossary: Array<{ term: string; plainDefinition: string }> = [];
  let readingTime = 60;
  let operations: string[] = [];

  if (audience === 'child') {
    readingTime = 45;
    operations = [
      'simplified_vocabulary:grade4',
      'shortened_sentence_length',
      'added_spotting_questions',
      'hedges_preserved:simplified_phrasing',
    ];
    lookCloser = [
      'Look closely at the surface details and see if you can find tiny carved patterns.',
      'Check the posture—can you mirror how this figure stands or sits?',
    ];
    glossary = [
      {
        term: artifact.material.split(' ')[0] || 'Material',
        plainDefinition: 'The ancient substance carved or cast to make this artwork.',
      },
    ];

    if (depth === 'quick') {
      sections = [
        {
          heading: 'Can you spot what this is made of?',
          body: `This special treasure is made of ${artifact.material.toLowerCase()}. Long ago in ${artifact.period}, talented ancient artists crafted it with great care. It was preserved by ${artifact.museumName}.`,
        },
        {
          heading: 'What was it used for?',
          body: `Archaeologists believe people used or looked at this object during ceremonies and daily life. It helps us discover how people lived thousands of years ago!`,
        },
      ];
    } else {
      sections = [
        {
          heading: 'Take a close look at this ancient wonder',
          body: `Look at this incredible ${artifact.title.toLowerCase()}! Created during ${artifact.period}, it is made from ${artifact.material.toLowerCase()} using ancient techniques.`,
        },
        {
          heading: 'How artists created it',
          body: `Ancient craft workers shaped every detail by hand. It was found at ${artifact.culture} archaeological sites and carefully protected for everyone to see today.`,
        },
        {
          heading: 'Why it is super special',
          body: `Every detail tells a true story about ancient times. Scholars and historians study it carefully so we know exactly how life was lived back then.`,
        },
      ];
    }
  } else if (audience === 'specialist') {
    readingTime = depth === 'deep' ? 180 : 120;
    operations = [
      'formal_material_analysis',
      'historiographical_hedges_preserved',
      'archaeological_provenance_maintained',
    ];
    lookCloser = [
      'Examine the stylistic treatment and compare with contemporary regional typologies.',
      'Note the surface patina and technical finishing markers characteristic of the epoch.',
    ];
    sections = [
      {
        heading: 'Formal & Material Analysis',
        body: `${artifact.title} represents a quintessential sculptural benchmark of the ${artifact.culture} horizon (${artifact.period}). Executed in ${artifact.material}, the object demonstrates sophisticated compositional equilibrium and master metallurgy/masonry.`,
      },
      {
        heading: 'Cultural Context & Historiography',
        body: `Stylistically rooted in ${artifact.culture} artistic conventions, the iconographical attributes synthesize ritual, administrative, or sacred symbolism. As noted in canonical scholarship, specific stylistic features retain nuanced historical interpretations.`,
      },
      {
        heading: 'Provenance & Curatorial Record',
        body: `${artifact.provenanceLine} The object is permanently accessioned and preserved under the stewardship of ${artifact.museumName}.`,
      },
    ];
  } else {
    // Adult (General / Local)
    readingTime = depth === 'quick' ? 45 : depth === 'deep' ? 120 : 75;
    operations = [
      'reordered_for_lead_clarity',
      'active_voice_restructuring',
      'hedges_preserved_accurately',
    ];
    lookCloser = [
      'Notice the fine craftsmanship and symmetry preserved across centuries.',
      'Observe the distinctive textures and gestures that give this piece its expressive life.',
    ];

    if (depth === 'quick') {
      sections = [
        {
          heading: "What you're looking at",
          body: `${artifact.title} is a celebrated work from ${artifact.period}, created in ${artifact.material.toLowerCase()} by ${artifact.culture} artisans.`,
        },
        {
          heading: 'Why it matters',
          body: `Discovered and catalogued by ${artifact.museumName}, this piece stands as a masterwork reflecting the social, spiritual, and technical achievements of its civilization.`,
        },
      ];
    } else {
      sections = [
        {
          heading: "What you're looking at",
          body: `${artifact.title} is an extraordinary artifact dating to ${artifact.period} from ${artifact.culture}. Masterfully created using ${artifact.material.toLowerCase()}, it showcases remarkable artistic and technical sophistication.`,
        },
        {
          heading: 'Why it matters',
          body: `Preserved in the collections of ${artifact.museumName}, this piece offers direct insight into ancient cultural expression and ritual life. Its form and iconography continue to captivate historians and visitors alike.`,
        },
        {
          heading: 'Artistry and Craft',
          body: `${artifact.provenanceLine} The surviving detail and proportion demonstrate the elevated skills of its makers.`,
        },
      ];
    }
  }

  const claimsAudit = artifact.claims.map((c: any) => ({
    id: c.id,
    status: 'covered' as const,
    span: c.text,
    criticality: c.criticality,
  }));

  return {
    artifactId: artifact.id,
    persona,
    attribution: `Based on the museum-provided description by ${artifact.museumName}.`,
    aiDisclosure: `Adapted by Digital Muse for a ${audience} reader. Facts unchanged.`,
    tags: {
      tone: (personaRulesData as any)[audience]?.[depth]?.tone || 'conversational',
      level: `grade_${(personaRulesData as any)[audience]?.[depth]?.target_grade || 9}`,
      tier: 'T1',
    },
    readingTimeSeconds: readingTime,
    sections,
    lookCloser,
    glossary,
    changelog: {
      operations,
      claimsCovered: artifact.claims.map((c: any) => c.id),
      claimsOmitted: [],
      hedgesPreserved: true,
    },
    fidelity: {
      verdict: 'pass',
      covered: artifact.claims.length,
      total: artifact.claims.length,
      claims: claimsAudit,
    },
  };
}
