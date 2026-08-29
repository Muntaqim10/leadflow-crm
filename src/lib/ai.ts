/**
 * Shared OpenRouter chat-completion client.
 *
 * OpenRouter exposes an OpenAI-compatible /chat/completions endpoint, so this is a
 * thin wrapper: it centralises the key lookup, model default and error handling that
 * the email and analytics features both need.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Free-tier model, per the project's $0-AI-layer constraint. Free models rate-limit
 * (429) fairly often, so FALLBACK_AI_MODELS is handed to OpenRouter's routing: it
 * retries the next model in the list when the primary is unavailable.
 */
export const DEFAULT_AI_MODEL = 'minimax/minimax-m3:free';
export const FALLBACK_AI_MODELS = ['z-ai/glm-5.2:free', 'google/gemma-4-31b-it:free'];

/**
 * Thrown when OPENROUTER_API_KEY is missing, so callers can tell a deployment
 * misconfiguration apart from a genuine upstream failure.
 */
export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigError';
  }
}

export async function generateChatCompletion(
  messages: ChatMessage[],
  options: { temperature?: number; model?: string } = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AiConfigError('OpenRouter API key not configured. Set OPENROUTER_API_KEY.');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // Optional OpenRouter attribution headers — they surface the app on OpenRouter's
  // dashboards and are safely omitted when unset.
  if (process.env.OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  }
  if (process.env.OPENROUTER_SITE_NAME) {
    headers['X-Title'] = process.env.OPENROUTER_SITE_NAME;
  }

  const model = options.model || process.env.OPENROUTER_MODEL || DEFAULT_AI_MODEL;
  const fallbacks = FALLBACK_AI_MODELS.filter((m) => m !== model);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      models: [model, ...fallbacks],
      messages,
      temperature: options.temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API Error Response:', errorText);
    throw new Error(`OpenRouter API returned status ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
