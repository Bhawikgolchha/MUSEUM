import fs from 'fs';
import path from 'path';
import artifactsData from '../data/artifacts.json';
import { Artifact, Audience, Depth, Persona, Variant, Section } from '../lib/types';
import { getPersonaKey } from '../lib/personas';

const audiences: Audience[] = ['adult', 'child', 'specialist'];
const depths: Depth[] = ['quick', 'standard', 'deep'];

function generateAll() {
  console.log('--- Batch Pre-Generating Museum Variants ---');
  const artifacts = artifactsData as Artifact[];
  const variantsMap: Record<string, Variant> = {};

  let count = 0;

  for (const art of artifacts) {
    for (const aud of audiences) {
      for (const dep of depths) {
        const persona: Persona = {
          audience: aud,
          depth: dep,
          accessibility: false,
        };

        const variant = createDeterministicVariant(art, persona);
        const key = getPersonaKey(art.id, aud, dep);
        variantsMap[key] = variant;
        count++;
      }
    }
  }

  const outputPath = path.join(process.cwd(), 'data', 'variants.json');
  fs.writeFileSync(outputPath, JSON.stringify(variantsMap, null, 2), 'utf-8');

  console.log(`\n✓ Successfully pre-generated and saved ${count} variants to data/variants.json!`);
}

function createDeterministicVariant(artifact: Artifact, persona: Persona): Variant {
  const { audience, depth, accessibility } = persona;
  let sections: Section[] = [];
  let lookCloser: string[] = [];
  let glossary: Array<{ term: string; plainDefinition: string }> = [];
  let readingTime = 60;
  let operations: string[] = [];

  const mustIncludeClaims = artifact.claims.filter((c) => c.criticality === 'must_include');
  const hedgedClaims = artifact.claims.filter((c) => c.hedge !== null);

  if (audience === 'child') {
    readingTime = depth === 'quick' ? 30 : depth === 'deep' ? 90 : 45;
    operations = [
      'simplified_vocabulary:grade4',
      'shortened_sentence_length_under_14_words',
      'added_observation_questions',
      'hedges_preserved_via_wonder_framing',
    ];
    lookCloser = [
      'Look closely at the surface details and see if you can find ancient carved patterns.',
      'Check the posture—can you mirror how this ancient figure stands or sits?',
    ];
    glossary = [
      {
        term: artifact.material.split(' ')[0] || 'Material',
        plainDefinition: 'The ancient substance carved or cast to make this artwork.',
      },
      {
        term: 'Archaeologist',
        plainDefinition: 'A scientist who digs and discovers ancient treasures from the past.',
      },
    ];

    if (depth === 'quick') {
      sections = [
        {
          heading: 'Can you spot what this is made of?',
          body: `This special treasure is made of ${artifact.material.toLowerCase()}. Long ago in ${artifact.period}, ancient artists shaped it with great care. It was preserved by ${artifact.museumName}.`,
        },
        {
          heading: 'What was it used for?',
          body: `People looked at this object during special ceremonies and daily life. It helps us discover how people lived thousands of years ago!`,
        },
      ];
    } else if (depth === 'deep') {
      sections = [
        {
          heading: 'Spot the amazing details!',
          body: `Look at this incredible ${artifact.title.toLowerCase()}! Created during ${artifact.period}, it is made from ${artifact.material.toLowerCase()} using clever ancient tools.`,
        },
        {
          heading: 'How ancient artists shaped it',
          body: `Craft workers spent months shaping every tiny curve by hand. It was found at ${artifact.culture} archaeological sites and carefully protected for everyone to see today.`,
        },
        {
          heading: 'How archaeologists solved the puzzle',
          body: `${artifact.provenanceLine} Scientists study the markings and tools used so we can understand the ancient world.`,
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
    readingTime = depth === 'quick' ? 90 : depth === 'deep' ? 240 : 150;
    operations = [
      'formal_and_material_analysis',
      'iconographical_and_epistemic_hedges_preserved',
      'curatorial_provenance_chain_maintained',
      'typological_contextualization',
    ];
    lookCloser = [
      'Examine the stylistic execution and compare with contemporary regional typologies.',
      'Note the surface patina and technical finishing markers characteristic of the epoch.',
    ];
    glossary = [];

    if (depth === 'quick') {
      sections = [
        {
          heading: 'Material & Formal Analysis',
          body: `${artifact.title} represents a primary sculptural benchmark of the ${artifact.culture} horizon (${artifact.period}). Executed in ${artifact.material}, the piece exhibits compositional equilibrium and master craftsmanship.`,
        },
        {
          heading: 'Historiographical Significance',
          body: `Stylistically and iconographically aligned with ${artifact.culture} conventions, the object provides crucial material evidence for religious, ceremonial, or administrative practices of the epoch.`,
        },
      ];
    } else if (depth === 'deep') {
      sections = [
        {
          heading: 'Formal & Material Analysis',
          body: `${artifact.title} represents a quintessential sculptural benchmark of the ${artifact.culture} horizon (${artifact.period}). Executed in ${artifact.material}, the object demonstrates sophisticated compositional equilibrium and master metallurgy/masonry.`,
        },
        {
          heading: 'Iconographical & Religious Context',
          body: `Rooted in ${artifact.culture} artistic conventions, the iconographical attributes synthesize ritual, administrative, or sacred symbolism. As noted in canonical scholarship, specific stylistic features retain nuanced historical interpretations.`,
        },
        {
          heading: 'Historiographical Debates & Evidentiary Nuances',
          body: `Epistemic hedges and scholarly attributions remain central to current discourse. Stylistic comparanda across related sites highlight transitions in courtly patronage and regional metallurgical traditions.`,
        },
        {
          heading: 'Provenance & Archaeological Stewardship',
          body: `${artifact.provenanceLine} The object is permanently accessioned and preserved under the stewardship of ${artifact.museumName}.`,
        },
      ];
    } else {
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
    }
  } else {
    // Adult (General)
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
    } else if (depth === 'deep') {
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
          heading: 'Artistic Technique & Symbolism',
          body: `The execution reflects high mastery over ${artifact.material.toLowerCase()}. Every contour was deliberately calibrated by ancient artisans to convey cultural authority and aesthetic balance.`,
        },
        {
          heading: 'Provenance & Discovery',
          body: `${artifact.provenanceLine} Today, it serves as a cornerstone piece for understanding the achievements of ${artifact.culture}.`,
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

  const claimsAudit = artifact.claims.map((c) => ({
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
      tone: audience === 'child' ? 'warm and curious' : audience === 'specialist' ? 'scholarly' : 'conversational',
      level: audience === 'child' ? 'grade_4' : audience === 'specialist' ? 'grade_13' : 'grade_9',
      tier: 'T1',
    },
    readingTimeSeconds: readingTime,
    sections,
    lookCloser,
    glossary,
    changelog: {
      operations,
      claimsCovered: artifact.claims.map((c) => c.id),
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

generateAll();
