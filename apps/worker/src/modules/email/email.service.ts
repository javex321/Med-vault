import nodemailer from "nodemailer";
import type { EmailJobPayload } from "@medvault/shared";

import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

function createTransporter() {
  if (!env.SMTP_HOST) {
    return nodemailer.createTransport({
      jsonTransport: true
    });
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS
          }
        : undefined
  });
}

const transporter = createTransporter();

export async function sendEmail(payload: EmailJobPayload) {
  const result = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  });

  logger.info(
    {
      notificationId: payload.notificationId,
      messageId: result.messageId
    },
    "Email processed"
  );
}
