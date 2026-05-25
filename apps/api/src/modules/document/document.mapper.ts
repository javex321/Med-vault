import type { MedicalDocument } from "@medvault/shared";

import type { MedicalDocumentDocument } from "./document.model.js";

function optionalString(value: string | null | undefined) {
  return value ?? undefined;
}

function optionalObjectId(value: MedicalDocumentDocument["timelineEventId"]) {
  return value ? value.toString() : undefined;
}

export function toMedicalDocument(document: MedicalDocumentDocument): MedicalDocument {
  return {
    id: document._id.toString(),
    ownerId: document.ownerId.toString(),
    profileId: document.profileId.toString(),
    timelineEventId: optionalObjectId(document.timelineEventId),
    title: document.title,
    category: document.category,
    description: optionalString(document.description),
    originalFileName: document.originalFileName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    checksumSha256: document.checksumSha256,
    storageProvider: document.storageProvider,
    storageKey: document.storageKey,
    storageUrl: optionalString(document.storageUrl),
    tags: [...document.tags],
    uploadedAt: document.uploadedAt.toISOString(),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}
