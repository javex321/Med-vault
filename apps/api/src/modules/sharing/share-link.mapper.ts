import type { DocumentShareLink, PublicDocumentShareLink } from "@medvault/shared";

import type { MedicalDocumentDocument } from "../document/document.model.js";
import type { DocumentShareLinkDocument } from "./share-link.model.js";

function optionalString(value: string | null | undefined) {
  return value ?? undefined;
}

function optionalDate(value: Date | null | undefined) {
  return value ? value.toISOString() : undefined;
}

function getShareLinkStatus(shareLink: DocumentShareLinkDocument): DocumentShareLink["status"] {
  if (shareLink.revokedAt) return "revoked";
  if (shareLink.expiresAt.getTime() <= Date.now()) return "expired";
  if (shareLink.accessCount >= shareLink.maxAccessCount) return "exhausted";

  return "active";
}

export function toDocumentShareLink(
  shareLink: DocumentShareLinkDocument,
  token?: string
): DocumentShareLink {
  return {
    id: shareLink._id.toString(),
    ownerId: shareLink.ownerId.toString(),
    profileId: shareLink.profileId.toString(),
    documentId: shareLink.documentId.toString(),
    token,
    recipientName: optionalString(shareLink.recipientName),
    recipientEmail: optionalString(shareLink.recipientEmail),
    purpose: optionalString(shareLink.purpose),
    allowDownload: shareLink.allowDownload,
    maxAccessCount: shareLink.maxAccessCount,
    accessCount: shareLink.accessCount,
    status: getShareLinkStatus(shareLink),
    expiresAt: shareLink.expiresAt.toISOString(),
    lastAccessedAt: optionalDate(shareLink.lastAccessedAt),
    revokedAt: optionalDate(shareLink.revokedAt),
    createdAt: shareLink.createdAt.toISOString(),
    updatedAt: shareLink.updatedAt.toISOString()
  };
}

export function toPublicDocumentShareLink(
  shareLink: DocumentShareLinkDocument,
  document: MedicalDocumentDocument
): PublicDocumentShareLink {
  return {
    id: shareLink._id.toString(),
    document: {
      id: document._id.toString(),
      title: document.title,
      category: document.category,
      description: optionalString(document.description),
      originalFileName: document.originalFileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      checksumSha256: document.checksumSha256,
      tags: [...document.tags],
      uploadedAt: document.uploadedAt.toISOString()
    },
    allowDownload: shareLink.allowDownload,
    accessCount: shareLink.accessCount,
    maxAccessCount: shareLink.maxAccessCount,
    expiresAt: shareLink.expiresAt.toISOString()
  };
}
