import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Global rate limiters (fallbacks to memory if no redis).
// One entry per identifier: when the current window opened, and how many
// requests landed in it. windowStart is never refreshed by later requests,
// so a caller who keeps retrying still gets out once the window elapses.
const memoryCache = new Map<string, { count: number; windowStart: number }>();

export async function rateLimit(identifier: string, limit: number = 5, windowInSeconds: number = 60): Promise<boolean> {
  if (redis) {
    try {
      const ratelimit = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowInSeconds} s`),
        analytics: true,
      });
      const { success } = await ratelimit.limit(identifier);
      return success;
    } catch (e) {
      console.error('Rate limit error:', e);
      // Fallback to memory
    }
  }

  // Memory fallback
  const now = Date.now();
  const windowMs = windowInSeconds * 1000;
  
  // Clean up expired windows (simplistic)
  if (Math.random() < 0.05) {
    memoryCache.forEach((entry, key) => {
      if (now - entry.windowStart > windowMs) memoryCache.delete(key);
    });
  }

  const key = `rl_${identifier}`;
  const entry = memoryCache.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    memoryCache.set(key, { count: 1, windowStart: now });
    return true;
  }

  entry.count += 1;
  return entry.count <= limit;
}
