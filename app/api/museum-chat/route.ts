import { NextRequest, NextResponse } from 'next/server';
import { getMuseumById, Museum } from '@/lib/museums';
import { callOpenRouter, OpenRouterMessage } from '@/lib/openrouter';
import { getAnthropicClient } from '@/lib/anthropic';

export interface MuseumChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MuseumChatRequestBody {
  museumId?: string;
  message?: string;
  question?: string;
  messages?: MuseumChatMessage[];
  chatHistory?: MuseumChatMessage[];
  museumContext?: Partial<Museum>;
}

export interface MuseumChatResponseBody {
  status: 'ok' | 'fallback' | 'error';
  reply: string;
  museumId: string;
  museumName: string;
  groundingSources?: {
    fieldsReferenced: string[];
    confidence: 'high' | 'medium' | 'fallback';
  };
  suggestedFollowUps?: string[];
  modelUsed?: string;
  error?: string;
  message?: string;
}

/**
 * Detects which museum metadata fields are relevant to the user's question
 */
function detectFieldsReferenced(query: string): string[] {
  const q = query.toLowerCase();
  const fields: string[] = [];

  if (
    q.includes('time') ||
    q.includes('timing') ||
    q.includes('hour') ||
    q.includes('open') ||
    q.includes('close') ||
    q.includes('closed') ||
    q.includes('holiday') ||
    q.includes('day') ||
    q.includes('schedule')
  ) {
    fields.push('opening_hours');
  }
  if (
    q.includes('ticket') ||
    q.includes('fee') ||
    q.includes('cost') ||
    q.includes('price') ||
    q.includes('entry') ||
    q.includes('charge') ||
    q.includes('rupee') ||
    q.includes('inr') ||
    q.includes('free') ||
    q.includes('domestic') ||
    q.includes('foreign')
  ) {
    fields.push('entry_fee');
  }
  if (
    q.includes('access') ||
    q.includes('wheelchair') ||
    q.includes('braille') ||
    q.includes('tactile') ||
    q.includes('disabled') ||
    q.includes('elderly') ||
    q.includes('ramp') ||
    q.includes('lift') ||
    q.includes('elevator') ||
    q.includes('handicap') ||
    q.includes('special need')
  ) {
    fields.push('accessibility_features');
  }
  if (
    q.includes('where') ||
    q.includes('address') ||
    q.includes('location') ||
    q.includes('contact') ||
    q.includes('phone') ||
    q.includes('email') ||
    q.includes('website') ||
    q.includes('reach') ||
    q.includes('pin') ||
    q.includes('pincode')
  ) {
    fields.push('address', 'pincode', 'contact');
  }
  if (
    q.includes('highlight') ||
    q.includes('artifact') ||
    q.includes('collection') ||
    q.includes('famous') ||
    q.includes('see') ||
    q.includes('history') ||
    q.includes('special') ||
    q.includes('exhibit') ||
    q.includes('bronze') ||
    q.includes('sculpture') ||
    q.includes('gallery')
  ) {
    fields.push('description', 'artifact_count_approx', 'featured_artifacts');
  }

  if (fields.length === 0) {
    fields.push('description', 'category', 'opening_hours');
  }

  return Array.from(new Set(fields));
}

/**
 * Deterministic offline knowledge engine: synthesizes grounded factual replies directly
 * from canonical museum records without requiring external network access or LLM keys.
 */
export function resolveDeterministicMuseumDoubt(
  museum: Museum,
  query: string,
  chatHistory: MuseumChatMessage[] = []
): { reply: string; fieldsReferenced: string[] } {
  const q = query.toLowerCase();
  const historyText = chatHistory.map((m) => m.content.toLowerCase()).join(' ');
  const combinedContext = `${historyText} ${q}`;

  // 1. Specific artifact query (e.g. Nataraja, Chola bronzes, Harappan Priest-King, etc.)
  if (
    q.includes('nataraja') ||
    q.includes('chola') ||
    (q.includes('bronze') && (museum.id.includes('che') || museum.city.toLowerCase() === 'chennai' || combinedContext.includes('chola')))
  ) {
    return {
      reply: `Namaste! At ${museum.name} (Egmore, Chennai), you can admire the world-renowned Chola Bronze collection, including the celebrated 10th-century Nataraja (Lord Shiva in his cosmic dance posture), Ardhanarisvara, and Somaskanda masterworks housed in the dedicated Bronze Gallery. It is one of the richest bronze repositories in Asia.`,
      fieldsReferenced: ['featured_artifacts', 'description', 'category'],
    };
  }

  // 2. Timings & Visiting Schedule & Holidays
  if (
    (!q.includes('address') && !q.includes('contact') && !q.includes('pincode') && !q.includes('postal')) &&
    (
      q.includes('time') ||
      q.includes('timing') ||
      q.includes('hour') ||
      q.includes('open') ||
      q.includes('close') ||
      q.includes('closed') ||
      q.includes('holiday') ||
      q.includes('schedule') ||
      q.includes('visiting') ||
      q.includes('days')
    )
  ) {
    const closed =
      museum.opening_hours.closed_on && museum.opening_hours.closed_on.length > 0
        ? `It is closed on ${museum.opening_hours.closed_on.join(', ')}.`
        : 'It is open seven days a week (all days).';
    return {
      reply: `Namaste! ${museum.name} is open for visitors from ${museum.opening_hours.timings} (${museum.opening_hours.schedule}). ${closed} Ticket counters generally close 45 minutes prior to gallery closing.`,
      fieldsReferenced: ['opening_hours'],
    };
  }

  // 3. Entry Fees & Ticket Pricing
  if (
    q.includes('ticket') ||
    q.includes('fee') ||
    q.includes('cost') ||
    q.includes('price') ||
    q.includes('entry') ||
    q.includes('charge') ||
    q.includes('rupee') ||
    q.includes('inr') ||
    q.includes('domestic') ||
    q.includes('foreign') ||
    q.includes('free')
  ) {
    if (museum.entry_fee.is_free) {
      return {
        reply: `Namaste! Entry to ${museum.name} is completely free of charge for all visitors (domestic and international).`,
        fieldsReferenced: ['entry_fee'],
      };
    }
    return {
      reply: `Namaste! Entry ticket fees for ${museum.name} are ₹${museum.entry_fee.domestic_inr} for domestic Indian visitors and ₹${museum.entry_fee.foreign_inr} for international visitors. Special concessions or free admissions frequently apply to school students in uniform and accredited researchers.`,
      fieldsReferenced: ['entry_fee'],
    };
  }

  // 4. Accessibility & Wheelchair Facilities
  if (
    q.includes('access') ||
    q.includes('wheelchair') ||
    q.includes('braille') ||
    q.includes('tactile') ||
    q.includes('disabled') ||
    q.includes('elderly') ||
    q.includes('ramp') ||
    q.includes('lift') ||
    q.includes('elevator') ||
    q.includes('handicap') ||
    q.includes('special need') ||
    q.includes('facilities') ||
    q.includes('anubhav')
  ) {
    if (museum.accessibility_features && museum.accessibility_features.length > 0) {
      return {
        reply: `Namaste! ${museum.name} provides accessible visitor facilities, including: ${museum.accessibility_features.join(', ')}. Wheelchairs, accessible ramps, and mobility assistance are available at the main reception entrance.`,
        fieldsReferenced: ['accessibility_features'],
      };
    }
    return {
      reply: `Namaste! Standard ground-floor accessible pathways are provided at ${museum.name}. For dedicated wheelchair assistance or specialized accommodations, please contact the visitor helpdesk at ${museum.contact?.phone || 'the reception'}.`,
      fieldsReferenced: ['accessibility_features', 'contact'],
    };
  }

  // 5. Highlights, Artifacts & History
  if (
    q.includes('highlight') ||
    q.includes('artifact') ||
    q.includes('collection') ||
    q.includes('famous') ||
    q.includes('see') ||
    q.includes('history') ||
    q.includes('special') ||
    q.includes('exhibit') ||
    q.includes('sculpture') ||
    q.includes('gallery') ||
    q.includes('masterwork')
  ) {
    const featured =
      museum.featured_artifacts && museum.featured_artifacts.length > 0
        ? ` Key featured highlights include: ${museum.featured_artifacts.join(', ')}.`
        : '';
    return {
      reply: `Namaste! ${museum.name} is a premier ${museum.category.replace(/_/g, ' ')} repository housing approximately ${museum.artifact_count_approx.toLocaleString()} catalogued artifacts.${featured} ${museum.description}`,
      fieldsReferenced: ['description', 'artifact_count_approx', 'category', 'featured_artifacts'],
    };
  }

  // 6. Location, Address & Contact Details
  if (
    q.includes('where') ||
    q.includes('address') ||
    q.includes('location') ||
    q.includes('contact') ||
    q.includes('phone') ||
    q.includes('email') ||
    q.includes('website') ||
    q.includes('reach') ||
    q.includes('pin') ||
    q.includes('pincode')
  ) {
    return {
      reply: `Namaste! ${museum.name} is located at ${museum.address}, ${museum.city}, ${museum.state} - PIN ${museum.pincode}. Coordinates: ${museum.coordinates.lat}°N, ${museum.coordinates.lon}°E. Contact Phone: ${museum.contact?.phone || 'Available at entrance'}, Email: ${museum.contact?.email || 'N/A'}, Website: ${museum.contact?.website || 'Official portal'}.`,
      fieldsReferenced: ['address', 'city', 'state', 'pincode', 'contact', 'coordinates'],
    };
  }

  // 7. Unknown details fallback (e.g. canteen/cafeteria prices, locker dimensions, parking tariffs)
  if (q.includes('canteen') || q.includes('cafeteria') || q.includes('parking') || q.includes('locker') || q.includes('menu')) {
    return {
      reply: `Namaste! While visitor amenities are available at ${museum.name}, specific tariff schedules or detailed menus for cafeteria/parking services are not listed in the official directory. We invite you to contact the museum reception directly at ${museum.contact?.phone || 'the information desk'} for the latest updates.`,
      fieldsReferenced: ['contact'],
    };
  }

  // 8. General Museum Overview fallback
  return {
    reply: `Namaste! ${museum.name} is a premier ${museum.category.replace(/_/g, ' ')} institution under ${museum.governance.replace(/_/g, ' ')} administration located in ${museum.city}, ${museum.state} (PIN: ${museum.pincode}). ${museum.description} Visiting hours are ${museum.opening_hours.timings}.`,
    fieldsReferenced: ['description', 'category', 'opening_hours'],
  };
}

export async function POST(req: NextRequest) {
  let body: MuseumChatRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Invalid JSON request body' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { status: 'error', message: 'Request body must be a valid JSON object' },
      { status: 400 }
    );
  }

  const { museumId, museumContext } = body;
  const userQuery = (typeof body.question === 'string' ? body.question : typeof body.message === 'string' ? body.message : '').trim();
  const rawHistory = Array.isArray(body.messages) ? body.messages : Array.isArray(body.chatHistory) ? body.chatHistory : [];
  const chatHistory = rawHistory.filter(
    (m) => m && typeof m === 'object' && typeof m.content === 'string'
  );

  // 1. Validate museumId
  if (!museumId || typeof museumId !== 'string' || museumId.trim().length === 0) {
    return NextResponse.json(
      { status: 'error', message: 'Valid museumId is required' },
      { status: 400 }
    );
  }

  // 2. Validate user message/question
  if (!userQuery || userQuery.length === 0) {
    return NextResponse.json(
      { status: 'error', message: 'Question or message cannot be empty' },
      { status: 400 }
    );
  }

  // 3. Resolve Museum Record
  let museum = getMuseumById(museumId);
  if (!museum && museumContext && museumContext.name) {
    museum = museumContext as Museum;
  }

  if (!museum) {
    return NextResponse.json(
      { status: 'error', message: `Museum not found for ID: ${museumId}` },
      { status: 404 }
    );
  }

  const fieldsReferenced = detectFieldsReferenced(userQuery);

  // 4. Construct Authoritative Grounded System Prompt
  const closedDaysStr =
    museum.opening_hours?.closed_on && museum.opening_hours.closed_on.length > 0
      ? museum.opening_hours.closed_on.join(', ')
      : 'None (Open All Days)';

  const accessStr =
    museum.accessibility_features && museum.accessibility_features.length > 0
      ? museum.accessibility_features.join(', ')
      : 'Standard accessibility';

  const featuredStr =
    museum.featured_artifacts && museum.featured_artifacts.length > 0
      ? museum.featured_artifacts.join(', ')
      : 'None listed';

  const systemPrompt = `You are the official, knowledgeable AI Docent and Heritage Guide for ${museum.name}, located in ${museum.city}, ${museum.state} (PIN: ${museum.pincode}).

AUTHORITATIVE INSTITUTION RECORD:
- Full Name: ${museum.name}
- Vernacular Names: ${JSON.stringify(museum.vernacular_names || {})}
- Address & Location: ${museum.address}, ${museum.city}, ${museum.state} - PIN ${museum.pincode}
- Coordinates: Lat ${museum.coordinates?.lat ?? 0}, Lon ${museum.coordinates?.lon ?? 0}
- Category: ${museum.category}
- Administrative Governance: ${museum.governance}
- Visiting Hours: ${museum.opening_hours?.timings || '10:00 AM – 5:00 PM'} (Schedule: ${museum.opening_hours?.schedule || 'Regular'})
- Closed On: ${closedDaysStr}
- Entry Fees: Domestic: ₹${museum.entry_fee?.domestic_inr ?? 0}, Foreign: ₹${museum.entry_fee?.foreign_inr ?? 0} (Free Entry: ${museum.entry_fee?.is_free ? 'Yes' : 'No'})
- Accessibility Provisions: ${accessStr}
- Contact: Phone: ${museum.contact?.phone || 'N/A'}, Email: ${museum.contact?.email || 'N/A'}, Website: ${museum.contact?.website || 'N/A'}
- Approximate Artifacts: ~${museum.artifact_count_approx ?? 0} catalogued items
- Featured Artifacts: ${featuredStr}
- Curatorial Description:
"""
${museum.description}
"""

CRITICAL DOCENT INSTRUCTIONS:
1. STRICT FACTUAL GROUNDING: Always provide factual timings, ticket costs, closed days, and accessibility features based exclusively on the record above.
2. ADMIT UNKNOWN DETAILS: If the visitor asks about uncataloged specifics (e.g. temporary canteen tariffs, specific parking fees, locker dimensions), state politely that the official directory does not have that detail and suggest calling ${museum.contact?.phone || 'the museum reception'}.
3. TONE & STYLE: Polite, welcoming cultural tone ("Namaste!"), docent-like, respectful, and concise (2-3 short paragraphs or bullet points).
4. MULTILINGUAL SUPPORT: If the visitor asks in Hindi, Tamil, Bengali, Marathi, or another Indian language, respond in that language with accurate terminology.`;

  // -------------------------------------------------------------
  // Tier 1: OpenRouter API Integration
  // -------------------------------------------------------------
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const openRouterMessages: OpenRouterMessage[] = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-8).map((m) => ({
          role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: m.content,
        })),
        { role: 'user', content: userQuery },
      ];

      const model = process.env.OPENROUTER_MODEL || 'openrouter/free';
      const aiReply = await callOpenRouter(openRouterMessages, {
        model,
        temperature: 0.3,
        max_tokens: 1000,
      });

      if (aiReply && aiReply.trim().length > 0) {
        return NextResponse.json({
          status: 'ok',
          reply: aiReply.trim(),
          museumId: museum.id,
          museumName: museum.name,
          groundingSources: {
            fieldsReferenced,
            confidence: 'high',
          },
          modelUsed: model,
        });
      }
    } catch (err) {
      console.warn('[MuseumChat] OpenRouter API call failed. Attempting next fallback tier.', err);
    }
  }

  // -------------------------------------------------------------
  // Tier 2: Anthropic Direct SDK Fallback
  // -------------------------------------------------------------
  const anthropicClient = getAnthropicClient();
  if (anthropicClient) {
    try {
      const anthropicMessages = [
        ...chatHistory.slice(-8).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: userQuery },
      ];

      const anthropicResponse = await anthropicClient.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        system: systemPrompt,
        messages: anthropicMessages,
        temperature: 0.3,
      });

      const replyBlock = anthropicResponse.content[0];
      const replyText = replyBlock && replyBlock.type === 'text' ? replyBlock.text : '';

      if (replyText && replyText.trim().length > 0) {
        return NextResponse.json({
          status: 'ok',
          reply: replyText.trim(),
          museumId: museum.id,
          museumName: museum.name,
          groundingSources: {
            fieldsReferenced,
            confidence: 'high',
          },
          modelUsed: 'claude-3-5-haiku-20241022',
        });
      }
    } catch (err) {
      console.warn('[MuseumChat] Anthropic SDK fallback call failed. Falling back to deterministic resolver.', err);
    }
  }

  // -------------------------------------------------------------
  // Tier 3: Deterministic Offline Knowledge Resolver Fallback
  // -------------------------------------------------------------
  const offlineResult = resolveDeterministicMuseumDoubt(museum, userQuery, chatHistory);

  return NextResponse.json({
    status: 'fallback',
    reply: offlineResult.reply,
    museumId: museum.id,
    museumName: museum.name,
    groundingSources: {
      fieldsReferenced: offlineResult.fieldsReferenced,
      confidence: 'fallback',
    },
    modelUsed: 'deterministic-offline-engine',
  });
}
