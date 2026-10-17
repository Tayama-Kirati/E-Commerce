
import { redis } from "./redis";

export async function rateLimit(
  key:    string,
  limit:  number,
  window: number, // seconds
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now      = Date.now();
  const windowMs = window * 1000;
  const redisKey = `rl:${key}`;
  const reset    = Math.ceil((now + windowMs) / 1000);

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(redisKey, 0, now - windowMs);
    pipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });
    pipeline.zcard(redisKey);
    pipeline.expire(redisKey, window);

    const results = await pipeline.exec();
    const count   = typeof results[2] === "number" ? results[2] : 0;
    const success = count <= limit;

    return { success, remaining: Math.max(0, limit - count), reset };
  } catch {
    // Redis unavailable — fail open so users are never blocked by infrastructure issues
    return { success: true, remaining: limit, reset };
  }
}

