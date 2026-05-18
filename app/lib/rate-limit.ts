
import { redis } from "./redis";

export async function rateLimit(
  key:      string,
  limit:    number,
  window:   number  // seconds
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now       = Date.now();
  const windowMs  = window * 1000;
  const redisKey  = `rl:${key}`;

  // Sliding window using sorted set
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, now - windowMs);
  pipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });
  pipeline.zcard(redisKey);
  pipeline.expire(redisKey, window);

  const results  = await pipeline.exec();
  const count    = results[2] as number;
  const success  = count <= limit;
  const remaining= Math.max(0, limit - count);
  const reset    = Math.ceil((now + windowMs) / 1000);

  return { success, remaining, reset };
}

