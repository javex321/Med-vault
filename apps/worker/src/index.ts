import { Worker } from "bullmq";
import { Redis } from "ioredis";

import { connectMongo, disconnectMongo } from "./config/db.js";
import { env } from "./config/env.js";
import { processEmailJob } from "./modules/email/email.processor.js";
import { logger } from "./utils/logger.js";

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const emailWorker = new Worker(env.EMAIL_QUEUE_NAME, processEmailJob, { connection });

emailWorker.on("ready", () => {
  logger.info({ queueName: env.EMAIL_QUEUE_NAME }, "MedVault email worker is ready");
});

emailWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, jobName: job.name }, "Email job completed");
});

emailWorker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, error }, "Email job failed");
});

async function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, "Shutting down worker");
  await emailWorker.close();
  await connection.quit();
  await disconnectMongo();
  process.exit(0);
}

await connectMongo();

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
