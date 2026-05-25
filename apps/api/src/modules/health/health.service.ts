import type { ApiHealthStatus } from "@medvault/shared";

import { getMongoStatus } from "../../config/db.js";
import { getRedisStatus } from "../../config/redis.js";

export async function getHealthStatus(): Promise<ApiHealthStatus> {
  const mongo = getMongoStatus();
  const redis = await getRedisStatus();

  return {
    status: mongo === "connected" && redis === "connected" ? "ok" : "degraded",
    service: "api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {
      mongo,
      redis
    }
  };
}
