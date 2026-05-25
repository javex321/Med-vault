import { Types, type FilterQuery } from "mongoose";

import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { UserModel, type UserDocument } from "../auth/user.model.js";
import { ensureOwnedPatientProfile } from "../patient-profile/patient-profile.service.js";
import { toNotification } from "./notification.mapper.js";
import { NotificationModel, type NotificationDocument } from "./notification.model.js";
import { enqueueEmail } from "./notification.queue.js";
import type { CreateNotificationInput, ListNotificationsQuery } from "./notification.schemas.js";

function notFoundError() {
  return new AppError("Notification not found", {
    statusCode: HttpStatus.NOT_FOUND,
    code: ErrorCode.RESOURCE_NOT_FOUND
  });
}

async function getOwner(ownerId: string) {
  const user = (await UserModel.findById(ownerId)) as UserDocument | null;

  if (!user) {
    throw new AppError("User not found", {
      statusCode: HttpStatus.NOT_FOUND,
      code: ErrorCode.RESOURCE_NOT_FOUND
    });
  }

  return user;
}

async function ensureProfileAccess(ownerId: string, profileId?: string) {
  if (!profileId) return;

  await ensureOwnedPatientProfile(ownerId, profileId);
}

export async function createNotification(ownerId: string, input: CreateNotificationInput) {
  await ensureProfileAccess(ownerId, input.profileId);

  const notification = (await NotificationModel.create({
    ownerId: new Types.ObjectId(ownerId),
    profileId: input.profileId ? new Types.ObjectId(input.profileId) : null,
    type: input.type,
    channels: input.channels,
    title: input.title,
    message: input.message,
    metadata: input.metadata,
    status: input.channels.includes("email") ? "queued" : "sent",
    sentAt: input.channels.includes("email") ? null : new Date()
  })) as NotificationDocument;

  if (input.channels.includes("email")) {
    const user = await getOwner(ownerId);

    await enqueueEmail({
      notificationId: notification._id.toString(),
      to: user.email,
      subject: input.emailSubject ?? input.title,
      text: input.message,
      html: `<p>${input.message}</p>`
    });
  }

  return toNotification(notification);
}

export async function listNotifications(ownerId: string, query: ListNotificationsQuery) {
  const filter: FilterQuery<NotificationDocument> = {
    ownerId,
    archivedAt: null
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.unreadOnly) {
    filter.readAt = null;
  }

  const skip = (query.page - 1) * query.limit;

  const [notifications, total] = await Promise.all([
    NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    NotificationModel.countDocuments(filter)
  ]);

  return {
    notifications: (notifications as NotificationDocument[]).map(toNotification),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  };
}

export async function markNotificationRead(ownerId: string, notificationId: string) {
  const notification = (await NotificationModel.findOneAndUpdate(
    {
      _id: notificationId,
      ownerId,
      archivedAt: null
    },
    {
      $set: {
        status: "read",
        readAt: new Date()
      }
    },
    {
      new: true
    }
  )) as NotificationDocument | null;

  if (!notification) {
    throw notFoundError();
  }

  return toNotification(notification);
}

export async function archiveNotification(ownerId: string, notificationId: string) {
  const notification = await NotificationModel.findOne({
    _id: notificationId,
    ownerId,
    archivedAt: null
  });

  if (!notification) {
    throw notFoundError();
  }

  notification.archivedAt = new Date();
  await notification.save();
}
