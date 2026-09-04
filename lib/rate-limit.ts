import { redis } from "./redis"

// Fixed-window limiter backed by Redis. Returns whether the action is allowed.
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: boolean; remaining: number }> {
  const redisKey = `ratelimit:${key}`
  const count = await redis.incr(redisKey)
  if (count === 1) await redis.expire(redisKey, windowSeconds)
  return { ok: count <= limit, remaining: Math.max(0, limit - count) }
}

export async function resetRateLimit(key: string): Promise<void> {
  await redis.del(`ratelimit:${key}`)
}