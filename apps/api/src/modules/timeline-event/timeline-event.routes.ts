import { Router } from "express";

import { validateRequest } from "../../middleware/validate.middleware.js";
import { requireAuth, requirePermission } from "../auth/auth.middleware.js";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent
} from "./timeline-event.controller.js";
import {
  createTimelineEventSchema,
  listTimelineEventsQuerySchema,
  timelineEventIdParamsSchema,
  timelineEventParamsSchema,
  updateTimelineEventSchema
} from "./timeline-event.schemas.js";

export const timelineEventRouter = Router({ mergeParams: true });

timelineEventRouter.use(requireAuth);

timelineEventRouter.get(
  "/",
  requirePermission("timeline:read"),
  validateRequest({ params: timelineEventParamsSchema, query: listTimelineEventsQuerySchema }),
  listEvents
);
timelineEventRouter.post(
  "/",
  requirePermission("timeline:create"),
  validateRequest({ params: timelineEventParamsSchema, body: createTimelineEventSchema }),
  createEvent
);
timelineEventRouter.get(
  "/:eventId",
  requirePermission("timeline:read"),
  validateRequest({ params: timelineEventIdParamsSchema }),
  getEvent
);
timelineEventRouter.patch(
  "/:eventId",
  requirePermission("timeline:update"),
  validateRequest({ params: timelineEventIdParamsSchema, body: updateTimelineEventSchema }),
  updateEvent
);
timelineEventRouter.delete(
  "/:eventId",
  requirePermission("timeline:update"),
  validateRequest({ params: timelineEventIdParamsSchema }),
  deleteEvent
);
