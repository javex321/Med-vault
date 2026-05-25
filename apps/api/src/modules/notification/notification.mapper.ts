import type { Notification } from "@medvault/shared";

import type { NotificationDocument } from "./notification.model.js";

function optionalDate(value: Date | null | undefined) {
  return value ? value.toISOString() : undefined;
}

function optionalString(value: string | null | undefined) {
  return value ?? undefined;
}

function mapMetadata(value: NotificationDocument["metadata"]) {
  const entries = value instanceof Map ? value.entries() : Object.entries(value ?? {});
  const metadata: Record<string, string> = {};

  for (const [key, entry] of entries) {
    metadata[key] = String(entry);
  }

  return metadata;
}

export function toNotification(notification: NotificationDocument): Notification {
  return {
    id: notification._id.toString(),
    ownerId: notification.ownerId.toString(),
    profileId: notification.profileId ? notification.profileId.toString() : undefined,
    type: notification.type,
    channels: [...notification.channels],
    title: notification.title,
    message: notification.message,
    status: notification.status,
    readAt: optionalDate(notification.readAt),
    sentAt: optionalDate(notification.sentAt),
    failedAt: optionalDate(notification.failedAt),
    failureReason: optionalString(notification.failureReason),
    metadata: mapMetadata(notification.metadata),
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString()
  };
}
