export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// OpenRouter Free Models list
export const OPENROUTER_FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'deepseek/deepseek-r1:free',
  'openrouter/auto',
];

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' };
  } = {}
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  // Default to OpenRouter Free tier model
  const model = options.model || 'google/gemini-2.0-flash-exp:free';

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://digital-muse.in',
      'X-Title': 'Digital Muse (OpenRouter Free)',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 1200,
      ...(options.response_format ? { response_format: options.response_format } : {}),
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0]?.message?.content;
  if (!choice) {
    throw new Error('No content returned from OpenRouter');
  }

  return choice as string;
}
