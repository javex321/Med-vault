import { z } from "zod";

export const notificationIdParamsSchema = z.object({
  notificationId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid notification id")
});

export const createNotificationSchema = z.object({
  profileId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid patient profile id").optional(),
  type: z
    .enum(["medication_reminder", "timeline_update", "document_uploaded", "system", "security"])
    .default("system"),
  channels: z.array(z.enum(["in_app", "email"])).min(1).default(["in_app"]),
  title: z.string().trim().min(2).max(160),
  message: z.string().trim().min(2).max(2000),
  emailSubject: z.string().trim().min(2).max(160).optional(),
  metadata: z.record(z.string()).default({})
});

export const listNotificationsQuerySchema = z.object({
  status: z.enum(["queued", "sent", "failed", "read"]).optional(),
  type: z
    .enum(["medication_reminder", "timeline_update", "document_uploaded", "system", "security"])
    .optional(),
  unreadOnly: z.coerce.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
