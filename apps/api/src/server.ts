import { createServer } from "node:http";

import { createApp } from "./app.js";
import { connectMongo, disconnectMongo } from "./config/db.js";
import { env } from "./config/env.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { logger } from "./utils/logger.js";

const API_HOST = "0.0.0.0";

async function bootstrap() {
  const app = createApp();
  const server = createServer(app);

  server.listen(env.API_PORT, API_HOST, () => {
    logger.info({ host: API_HOST, port: env.API_PORT }, "MedVault API is running");
  });

  connectDependencies();

  async function shutdown(signal: NodeJS.Signals) {
    logger.info({ signal }, "Shutting down API");

    server.close(async () => {
      await disconnectRedis();
      await disconnectMongo();
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function connectDependencies() {
  try {
    await connectMongo();
  } catch (error) {
    logger.error({ error }, "MongoDB unavailable during API startup");
  }

  try {
    await connectRedis();
  } catch (error) {
    logger.error({ error }, "Redis unavailable during API startup");
  }
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start API");
  process.exit(1);
});