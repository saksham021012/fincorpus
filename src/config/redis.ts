import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    family: 4,
  });

  redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  console.log('[Redis] Client initialized');
} else {
  console.log('[Redis] REDIS_URL not set — caching disabled');
}

export { redis };

export async function invalidateDashboardCache(): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys('dash:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('[Redis] Cache invalidation failed:', err);
  }
}
