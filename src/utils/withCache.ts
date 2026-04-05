import { redis } from '../config/redis';

const TTL = 60 * 60;

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      console.error('[Redis] Cache read failed, falling through to DB:', err);
    }
  }

  const result = await fn();

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(result), 'EX', TTL);
    } catch (err) {
      console.error('[Redis] Cache write failed:', err);
    }
  }

  return result;
}
