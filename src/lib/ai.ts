/**
 * Shared chat-completion client for the AI features (email drafting, analytics
 * insights).
 *
 * Groq and OpenRouter both expose an OpenAI-compatible /chat/completions endpoint,
 * so a single wrapper serves either. The provider is chosen from whichever API key
 * is present in the environment, which means switching providers is an env-var
 * change on the host rather than a code change and redeploy.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ProviderConfig {
  name: string;
  apiKey: string;
  endpoint: string;
  defaultModel: string;
  /**
   * OpenRouter accepts a `models` array and reroutes when the primary is
   * unavailable — useful because free-tier models rate-limit (429) intermittently.
   * Groq has no equivalent, so this stays empty there.
   */
  fallbackModels: string[];
}

export const GROQ_DEFAULT_MODEL = 'llama-3.1-8b-instant';
export const OPENROUTER_DEFAULT_MODEL = 'minimax/minimax-m3:free';
export const OPENROUTER_FALLBACK_MODELS = ['z-ai/glm-5.2:free', 'google/gemma-4-31b-it:free'];

/**
 * Thrown when no provider key is configured, so callers can tell a deployment
 * misconfiguration apart from a genuine upstream failure and surface it in the UI.
 */
export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigError';
  }
}

/**
 * Picks the provider from the available keys. GROQ_API_KEY wins when both are set,
 * so a host can fail back to Groq by adding one variable.
 */
function resolveProvider(): ProviderConfig {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      name: 'Groq',
      apiKey: groqKey,
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      defaultModel: process.env.GROQ_MODEL || GROQ_DEFAULT_MODEL,
      fallbackModels: [],
    };
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    return {
      name: 'OpenRouter',
      apiKey: openRouterKey,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      defaultModel: process.env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL,
      fallbackModels: OPENROUTER_FALLBACK_MODELS,
    };
  }

  throw new AiConfigError(
    'No AI provider key configured. Set GROQ_API_KEY or OPENROUTER_API_KEY.'
  );
}

export async function generateChatCompletion(
  messages: ChatMessage[],
  options: { temperature?: number; model?: string } = {}
): Promise<string> {
  const provider = resolveProvider();

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${provider.apiKey}`,
    'Content-Type': 'application/json',
  };

  // Optional OpenRouter attribution headers — they surface the app on OpenRouter's
  // dashboards and are ignored by Groq, so they are only sent where they apply.
  if (provider.name === 'OpenRouter') {
    if (process.env.OPENROUTER_SITE_URL) {
      headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
    }
    if (process.env.OPENROUTER_SITE_NAME) {
      headers['X-Title'] = process.env.OPENROUTER_SITE_NAME;
    }
  }

  const model = options.model || provider.defaultModel;
  const fallbacks = provider.fallbackModels.filter((m) => m !== model);

  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature,
  };
  if (fallbacks.length > 0) {
    payload.models = [model, ...fallbacks];
  }

  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${provider.name} API Error Response:`, errorText);
    throw new Error(`${provider.name} API returned status ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
