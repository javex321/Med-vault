import { Router } from "express";

import { validateRequest } from "../../middleware/validate.middleware.js";
import { requireAuth, requirePermission } from "../auth/auth.middleware.js";
import {
  createNotificationRecord,
  deleteNotificationRecord,
  listNotificationRecords,
  markNotificationRecordRead
} from "./notification.controller.js";
import {
  createNotificationSchema,
  listNotificationsQuerySchema,
  notificationIdParamsSchema
} from "./notification.schemas.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get(
  "/",
  requirePermission("notifications:read"),
  validateRequest({ query: listNotificationsQuerySchema }),
  listNotificationRecords
);
notificationRouter.post(
  "/",
  requirePermission("notifications:update"),
  validateRequest({ body: createNotificationSchema }),
  createNotificationRecord
);
notificationRouter.patch(
  "/:notificationId/read",
  requirePermission("notifications:update"),
  validateRequest({ params: notificationIdParamsSchema }),
  markNotificationRecordRead
);
notificationRouter.delete(
  "/:notificationId",
  requirePermission("notifications:update"),
  validateRequest({ params: notificationIdParamsSchema }),
  deleteNotificationRecord
);
