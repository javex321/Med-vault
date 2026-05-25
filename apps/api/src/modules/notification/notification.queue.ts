import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type { EmailJobPayload } from "@medvault/shared";

import { env } from "../../config/env.js";

let emailQueue: Queue<EmailJobPayload> | null = null;

function getEmailQueue() {
  if (!emailQueue) {
    const connection = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null
    });

    emailQueue = new Queue<EmailJobPayload>(env.EMAIL_QUEUE_NAME, {
      connection
    });
  }

  return emailQueue;
}

export async function enqueueEmail(payload: EmailJobPayload) {
  await getEmailQueue().add("send-email", payload, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 30_000
    },
    removeOnComplete: 100,
    removeOnFail: 500
  });
}
