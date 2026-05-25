import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  archiveNotification,
  createNotification,
  listNotifications,
  markNotificationRead
} from "./notification.service.js";
import type { CreateNotificationInput, ListNotificationsQuery } from "./notification.schemas.js";

function requireAuthContext(req: Parameters<Parameters<typeof asyncHandler>[0]>[0]) {
  if (!req.auth) {
    throw new AppError("Authentication required", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  return req.auth;
}

function getNotificationId(req: Parameters<Parameters<typeof asyncHandler>[0]>[0]) {
  const { notificationId } = req.params;

  if (!notificationId) {
    throw new AppError("Notification id is required", {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.VALIDATION_ERROR
    });
  }

  return notificationId;
}

export const listNotificationRecords = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const result = await listNotifications(auth.userId, req.query as unknown as ListNotificationsQuery);

  return sendSuccess(res, HttpStatus.OK, result);
});

export const createNotificationRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const notification = await createNotification(auth.userId, req.body as CreateNotificationInput);

  return sendSuccess(res, HttpStatus.CREATED, {
    notification
  });
});

export const markNotificationRecordRead = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const notification = await markNotificationRead(auth.userId, getNotificationId(req));

  return sendSuccess(res, HttpStatus.OK, {
    notification
  });
});

export const deleteNotificationRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);

  await archiveNotification(auth.userId, getNotificationId(req));

  return sendSuccess(res, HttpStatus.OK, {
    deleted: true
  });
});
