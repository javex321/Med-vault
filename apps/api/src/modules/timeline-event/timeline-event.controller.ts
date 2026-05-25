import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  archiveTimelineEvent,
  createTimelineEvent,
  getTimelineEvent,
  listTimelineEvents,
  updateTimelineEvent
} from "./timeline-event.service.js";
import type {
  CreateTimelineEventInput,
  ListTimelineEventsQuery,
  UpdateTimelineEventInput
} from "./timeline-event.schemas.js";

function requireAuthContext(req: Parameters<Parameters<typeof asyncHandler>[0]>[0]) {
  if (!req.auth) {
    throw new AppError("Authentication required", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  return req.auth;
}

function getRouteParam(req: Parameters<Parameters<typeof asyncHandler>[0]>[0], key: string) {
  const value = req.params[key];

  if (!value) {
    throw new AppError(`Route param is required: ${key}`, {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.VALIDATION_ERROR
    });
  }

  return value;
}

export const listEvents = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const result = await listTimelineEvents(
    auth.userId,
    profileId,
    req.query as unknown as ListTimelineEventsQuery
  );

  return sendSuccess(res, HttpStatus.OK, result);
});

export const createEvent = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const event = await createTimelineEvent(auth.userId, profileId, req.body as CreateTimelineEventInput);

  return sendSuccess(res, HttpStatus.CREATED, {
    event
  });
});

export const getEvent = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const eventId = getRouteParam(req, "eventId");
  const event = await getTimelineEvent(auth.userId, profileId, eventId);

  return sendSuccess(res, HttpStatus.OK, {
    event
  });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const eventId = getRouteParam(req, "eventId");
  const event = await updateTimelineEvent(
    auth.userId,
    profileId,
    eventId,
    req.body as UpdateTimelineEventInput
  );

  return sendSuccess(res, HttpStatus.OK, {
    event
  });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const eventId = getRouteParam(req, "eventId");

  await archiveTimelineEvent(auth.userId, profileId, eventId);

  return sendSuccess(res, HttpStatus.OK, {
    deleted: true
  });
});
