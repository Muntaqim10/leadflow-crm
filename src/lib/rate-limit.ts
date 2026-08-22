import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Global rate limiters (fallbacks to memory if no redis)
const memoryCache = new Map<string, number>();

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
  
  // Clean up old entries (simplistic)
  if (Math.random() < 0.05) {
    memoryCache.forEach((timestamp, key) => {
      if (now - timestamp > windowMs) memoryCache.delete(key);
    });
  }

  const userKey = `rl_${identifier}`;
  const countKey = `${userKey}_count`;
  
  const lastRequest = memoryCache.get(userKey) || 0;
  let count = memoryCache.get(countKey) || 0;

  if (now - lastRequest > windowMs) {
    count = 1;
  } else {
    count += 1;
  }

  memoryCache.set(userKey, now);
  memoryCache.set(countKey, count);

  return count <= limit;
}
