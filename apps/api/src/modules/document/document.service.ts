import { Types, type FilterQuery, type UpdateQuery } from "mongoose";

import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { ensureOwnedPatientProfile } from "../patient-profile/patient-profile.service.js";
import { getTimelineEvent } from "../timeline-event/timeline-event.service.js";
import { toMedicalDocument } from "./document.mapper.js";
import { MedicalDocumentModel, type MedicalDocumentDocument } from "./document.model.js";
import type { ListDocumentsQuery, UpdateDocumentInput, UploadDocumentInput } from "./document.schemas.js";
import { getDocumentStorageAdapter } from "./document.storage.js";

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function notFoundError() {
  return new AppError("Document not found", {
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

async function ensureTimelineLink(ownerId: string, profileId: string, timelineEventId?: string) {
  if (!timelineEventId) return;

  await getTimelineEvent(ownerId, profileId, timelineEventId);
}

async function findOwnedDocument(ownerId: string, profileId: string, documentId: string) {
  await ensureProfileAccess(ownerId, profileId);

  const document = (await MedicalDocumentModel.findOne({
    _id: documentId,
    ownerId,
    profileId,
    archivedAt: null
  })) as MedicalDocumentDocument | null;

  if (!document) {
    throw notFoundError();
  }

  return document;
}

export async function listDocuments(ownerId: string, profileId: string, query: ListDocumentsQuery) {
  await ensureProfileAccess(ownerId, profileId);

  const filter: FilterQuery<MedicalDocumentDocument> = {
    ownerId,
    profileId,
    archivedAt: null
  };

  if (query.category) {
    filter.category = query.category;
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

  const [documents, total] = await Promise.all([
    MedicalDocumentModel.find(filter).sort({ uploadedAt: sortDirection }).skip(skip).limit(query.limit),
    MedicalDocumentModel.countDocuments(filter)
  ]);

  return {
    documents: (documents as MedicalDocumentDocument[]).map(toMedicalDocument),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  };
}

export async function uploadDocument(
  ownerId: string,
  profileId: string,
  input: UploadDocumentInput,
  file: UploadedFile
) {
  await ensureProfileAccess(ownerId, profileId);
  await ensureTimelineLink(ownerId, profileId, input.timelineEventId);

  const storage = getDocumentStorageAdapter();
  const stored = await storage.upload({
    ownerId,
    profileId,
    originalFileName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer
  });

  const document = (await MedicalDocumentModel.create({
    ownerId: new Types.ObjectId(ownerId),
    profileId: new Types.ObjectId(profileId),
    timelineEventId: input.timelineEventId ? new Types.ObjectId(input.timelineEventId) : null,
    title: input.title,
    category: input.category,
    description: input.description,
    originalFileName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    checksumSha256: stored.checksumSha256,
    storageProvider: stored.storageProvider,
    storageKey: stored.storageKey,
    storageUrl: stored.storageUrl,
    tags: input.tags,
    uploadedAt: new Date()
  })) as MedicalDocumentDocument;

  return toMedicalDocument(document);
}

export async function getDocument(ownerId: string, profileId: string, documentId: string) {
  const document = await findOwnedDocument(ownerId, profileId, documentId);

  return toMedicalDocument(document);
}

export async function updateDocument(
  ownerId: string,
  profileId: string,
  documentId: string,
  input: UpdateDocumentInput
) {
  await ensureProfileAccess(ownerId, profileId);
  await ensureTimelineLink(ownerId, profileId, input.timelineEventId);

  const update: UpdateQuery<MedicalDocumentDocument> = {
    $set: removeUndefined({
      ...input,
      timelineEventId: input.timelineEventId ? new Types.ObjectId(input.timelineEventId) : undefined
    })
  };

  const document = (await MedicalDocumentModel.findOneAndUpdate(
    {
      _id: documentId,
      ownerId,
      profileId,
      archivedAt: null
    },
    update,
    {
      new: true,
      runValidators: true
    }
  )) as MedicalDocumentDocument | null;

  if (!document) {
    throw notFoundError();
  }

  return toMedicalDocument(document);
}

export async function archiveDocument(ownerId: string, profileId: string, documentId: string) {
  const document = await findOwnedDocument(ownerId, profileId, documentId);

  document.archivedAt = new Date();
  await document.save();
}
