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
   */
  fallbackModels: string[];
  /** Retry each candidate model with a separate request instead of one routed call. */
  retryModelsClientSide?: boolean;
  /** True when an operator pinned the model via env, which disables fallbacks. */
  modelPinned: boolean;
}

/**
 * Groq deprecates and rotates hosted models fairly often, and a retired id fails the
 * whole request. So a list is tried in order and the next one is used when a model is
 * rejected as unknown. Non-Llama models lead by preference; the Llama entries remain
 * as a last resort because they are the longest-standing ids on the platform.
 */
export const GROQ_DEFAULT_MODEL = 'openai/gpt-oss-120b';
export const GROQ_FALLBACK_MODELS = [
  'openai/gpt-oss-20b',
  'qwen/qwen3-32b',
  'moonshotai/kimi-k2-instruct',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];
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
      fallbackModels: GROQ_FALLBACK_MODELS,
      // Groq has no server-side model routing, so candidates are retried here.
      retryModelsClientSide: true,
      modelPinned: Boolean(process.env.GROQ_MODEL),
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
      modelPinned: Boolean(process.env.OPENROUTER_MODEL),
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

  // An explicit model override is honoured as-is: if an operator names a model, a
  // silent switch to a different one would hide the misconfiguration.
  const candidates = options.model || provider.modelPinned ? [model] : [model, ...fallbacks];

  const attempt = async (candidate: string, routed: string[] | null) => {
    const payload: Record<string, unknown> = {
      model: candidate,
      messages,
      temperature: options.temperature,
    };
    if (routed && routed.length > 1) {
      payload.models = routed;
    }

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `${provider.name} API error (model=${candidate}, status=${response.status}):`,
        errorText
      );
      const error = new Error(
        `${provider.name} API returned status ${response.status} for model ${candidate}`
      );
      // A model that no longer exists is worth retrying with the next candidate;
      // an auth or quota failure would fail identically for every model.
      (error as any).retryable = response.status === 400 || response.status === 404;
      throw error;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  };

  if (!provider.retryModelsClientSide) {
    return attempt(model, candidates.length > 1 ? candidates : null);
  }

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return await attempt(candidate, null);
    } catch (error) {
      lastError = error;
      if (!(error as any)?.retryable) throw error;
    }
  }
  throw lastError;
}
