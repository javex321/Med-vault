import { Types, type FilterQuery, type UpdateQuery } from "mongoose";

import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { ensureOwnedPatientProfile } from "../patient-profile/patient-profile.service.js";
import { toTimelineEvent } from "./timeline-event.mapper.js";
import { TimelineEventModel, type TimelineEventDocument } from "./timeline-event.model.js";
import type {
  CreateTimelineEventInput,
  ListTimelineEventsQuery,
  UpdateTimelineEventInput
} from "./timeline-event.schemas.js";

function toDate(value: string) {
  return new Date(value);
}

function notFoundError() {
  return new AppError("Timeline event not found", {
    statusCode: HttpStatus.NOT_FOUND,
    code: ErrorCode.RESOURCE_NOT_FOUND
  });
}

function parseTags(tags?: string) {
  if (!tags) return [];

  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

async function ensureProfileAccess(ownerId: string, profileId: string) {
  await ensureOwnedPatientProfile(ownerId, profileId);
}

async function findOwnedEvent(ownerId: string, profileId: string, eventId: string) {
  await ensureProfileAccess(ownerId, profileId);

  const event = (await TimelineEventModel.findOne({
    _id: eventId,
    ownerId,
    profileId,
    archivedAt: null
  })) as TimelineEventDocument | null;

  if (!event) {
    throw notFoundError();
  }

  return event;
}

export async function listTimelineEvents(
  ownerId: string,
  profileId: string,
  query: ListTimelineEventsQuery
) {
  await ensureProfileAccess(ownerId, profileId);

  const filter: FilterQuery<TimelineEventDocument> = {
    ownerId,
    profileId,
    archivedAt: null
  };

  if (query.type) {
    filter.type = query.type;
  }

  if (query.from || query.to) {
    filter.occurredAt = {};

    if (query.from) {
      filter.occurredAt.$gte = toDate(query.from);
    }

    if (query.to) {
      filter.occurredAt.$lte = toDate(query.to);
    }
  }

  const tags = parseTags(query.tags);

  if (tags.length > 0) {
    filter.tags = { $all: tags };
  }

  if (query.q) {
    filter.$text = { $search: query.q };
  }

  const skip = (query.page - 1) * query.limit;
  const sortDirection = query.sort === "asc" ? 1 : -1;

  const [events, total] = await Promise.all([
    TimelineEventModel.find(filter)
      .sort({ occurredAt: sortDirection, createdAt: sortDirection })
      .skip(skip)
      .limit(query.limit),
    TimelineEventModel.countDocuments(filter)
  ]);

  return {
    events: (events as TimelineEventDocument[]).map(toTimelineEvent),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  };
}

export async function createTimelineEvent(
  ownerId: string,
  profileId: string,
  input: CreateTimelineEventInput
) {
  await ensureProfileAccess(ownerId, profileId);

  const event = (await TimelineEventModel.create({
    ...input,
    ownerId: new Types.ObjectId(ownerId),
    profileId: new Types.ObjectId(profileId),
    occurredAt: toDate(input.occurredAt),
    endedAt: input.endedAt ? toDate(input.endedAt) : undefined
  })) as TimelineEventDocument;

  return toTimelineEvent(event);
}

export async function getTimelineEvent(ownerId: string, profileId: string, eventId: string) {
  const event = await findOwnedEvent(ownerId, profileId, eventId);

  return toTimelineEvent(event);
}

export async function updateTimelineEvent(
  ownerId: string,
  profileId: string,
  eventId: string,
  input: UpdateTimelineEventInput
) {
  await ensureProfileAccess(ownerId, profileId);

  const update: UpdateQuery<TimelineEventDocument> = {
    $set: removeUndefined({
      ...input,
      occurredAt: input.occurredAt ? toDate(input.occurredAt) : undefined,
      endedAt: input.endedAt ? toDate(input.endedAt) : undefined
    })
  };

  const event = (await TimelineEventModel.findOneAndUpdate(
    {
      _id: eventId,
      ownerId,
      profileId,
      archivedAt: null
    },
    update,
    {
      new: true,
      runValidators: true
    }
  )) as TimelineEventDocument | null;

  if (!event) {
    throw notFoundError();
  }

  return toTimelineEvent(event);
}

export async function archiveTimelineEvent(ownerId: string, profileId: string, eventId: string) {
  const event = await findOwnedEvent(ownerId, profileId, eventId);

  event.archivedAt = new Date();
  await event.save();
}
