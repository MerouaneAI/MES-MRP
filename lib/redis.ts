import IORedis from "ioredis"

export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379"

// Shared connection for publishing + BullMQ. maxRetriesPerRequest: null is
// required by BullMQ and harmless for pub/sub publishing.
export const redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })

// A Redis SUBSCRIBER cannot run normal commands, so every SSE stream needs its
// OWN dedicated connection.
export function makeSubscriber() {
  return new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
}

export const SHOPFLOOR_CHANNEL = "shopfloor"
