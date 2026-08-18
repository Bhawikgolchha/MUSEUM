import { Audience, Depth, Persona } from './types';

export const DEFAULT_PERSONA: Persona = {
  audience: 'adult',
  depth: 'standard',
  accessibility: false,
};

export const AUDIENCE_LABELS: Record<Audience, { title: string; description: string }> = {
  adult: {
    title: 'Adult',
    description: 'Conversational, engaging, and clear interpretation.',
  },
  child: {
    title: 'Child (8–11)',
    description: 'Curious, energetic, simple vocabulary with spotting questions.',
  },
  specialist: {
    title: 'Specialist / Deep',
    description: 'Rigorous scholarly analysis, historiography, and preserved hedges.',
  },
};

export const DEPTH_LABELS: Record<Depth, { title: string; description: string }> = {
  quick: {
    title: 'Quick (1 min)',
    description: 'Essential core facts and primary significance.',
  },
  standard: {
    title: 'Standard (2–3 min)',
    description: 'Balanced context, craft details, and cultural background.',
  },
  deep: {
    title: 'Deep (4–5 min)',
    description: 'Comprehensive historical nuances, provenance, and open questions.',
  },
};

export function getPersonaKey(artifactId: string, audience: Audience, depth: Depth): string {
  return `${artifactId}:${audience}:${depth}`;
}

export function formatPersonaDisplay(persona: Persona): string {
  const audience = AUDIENCE_LABELS[persona.audience]?.title.split(' ')[0] || 'Adult';
  const depth = DEPTH_LABELS[persona.depth]?.title.split(' ')[0] || 'Standard';
  const a11y = persona.accessibility ? ' · A11y' : '';
  return `${audience} · ${depth}${a11y}`;
}
