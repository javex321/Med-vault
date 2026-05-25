import { Redis } from "ioredis";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null
});

redis.on("error", (error: Error) => {
  logger.error({ error }, "Redis connection error");
});

export async function connectRedis() {
  if (redis.status === "wait") {
    await redis.connect();
  }

  await redis.ping();
  logger.info("Redis connected");
}

export async function disconnectRedis() {
  await redis.quit();
}

export async function getRedisStatus() {
  if (redis.status === "wait" || redis.status === "end") {
    return "disconnected";
  }

  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }

    await redis.ping();
    return "connected";
  } catch {
    return "disconnected";
  }
}
