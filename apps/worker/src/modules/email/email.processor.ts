import type { Job } from "bullmq";
import type { EmailJobPayload } from "@medvault/shared";

import { NotificationModel } from "../notification/notification.model.js";
import { sendEmail } from "./email.service.js";

export async function processEmailJob(job: Job<EmailJobPayload>) {
  try {
    await sendEmail(job.data);

    await NotificationModel.findByIdAndUpdate(job.data.notificationId, {
      $set: {
        status: "sent",
        sentAt: new Date(),
        failedAt: null,
        failureReason: null
      }
    });
  } catch (error) {
    await NotificationModel.findByIdAndUpdate(job.data.notificationId, {
      $set: {
        status: "failed",
        failedAt: new Date(),
        failureReason: error instanceof Error ? error.message : "Unknown email delivery failure"
      }
    });

    throw error;
  }
}
