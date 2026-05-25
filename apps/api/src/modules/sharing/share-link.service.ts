import { Types } from "mongoose";

import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { MedicalDocumentModel, type MedicalDocumentDocument } from "../document/document.model.js";
import { ensureOwnedPatientProfile } from "../patient-profile/patient-profile.service.js";
import { toDocumentShareLink, toPublicDocumentShareLink } from "./share-link.mapper.js";
import { DocumentShareLinkModel, type DocumentShareLinkDocument } from "./share-link.model.js";
import type { CreateShareLinkInput } from "./share-link.schemas.js";
import { createShareToken, hashShareToken } from "./share-link.token.js";

function notFoundError(message = "Share link not found") {
  return new AppError(message, {
    statusCode: HttpStatus.NOT_FOUND,
    code: ErrorCode.RESOURCE_NOT_FOUND
  });
}

async function findOwnedDocument(ownerId: string, profileId: string, documentId: string) {
  await ensureOwnedPatientProfile(ownerId, profileId);

  const document = (await MedicalDocumentModel.findOne({
    _id: documentId,
    ownerId,
    profileId,
    archivedAt: null
  })) as MedicalDocumentDocument | null;

  if (!document) {
    throw notFoundError("Document not found");
  }

  return document;
}

function isShareLinkUsable(shareLink: DocumentShareLinkDocument) {
  return (
    !shareLink.revokedAt &&
    shareLink.expiresAt.getTime() > Date.now() &&
    shareLink.accessCount < shareLink.maxAccessCount
  );
}

export async function createDocumentShareLink(
  ownerId: string,
  profileId: string,
  documentId: string,
  input: CreateShareLinkInput
) {
  await findOwnedDocument(ownerId, profileId, documentId);

  const token = createShareToken();
  const tokenHash = hashShareToken(token);

  const shareLink = (await DocumentShareLinkModel.create({
    ownerId: new Types.ObjectId(ownerId),
    profileId: new Types.ObjectId(profileId),
    documentId: new Types.ObjectId(documentId),
    tokenHash,
    recipientName: input.recipientName,
    recipientEmail: input.recipientEmail,
    purpose: input.purpose,
    allowDownload: input.allowDownload,
    maxAccessCount: input.maxAccessCount,
    expiresAt: new Date(input.expiresAt)
  })) as DocumentShareLinkDocument;

  return toDocumentShareLink(shareLink, token);
}

export async function listDocumentShareLinks(ownerId: string, profileId: string, documentId: string) {
  await findOwnedDocument(ownerId, profileId, documentId);

  const shareLinks = (await DocumentShareLinkModel.find({
    ownerId,
    profileId,
    documentId
  }).sort({ createdAt: -1 })) as DocumentShareLinkDocument[];

  return {
    shareLinks: shareLinks.map((shareLink) => toDocumentShareLink(shareLink))
  };
}

export async function revokeDocumentShareLink(
  ownerId: string,
  profileId: string,
  documentId: string,
  shareLinkId: string
) {
  await findOwnedDocument(ownerId, profileId, documentId);

  const shareLink = (await DocumentShareLinkModel.findOneAndUpdate(
    {
      _id: shareLinkId,
      ownerId,
      profileId,
      documentId,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date()
      }
    },
    {
      new: true
    }
  )) as DocumentShareLinkDocument | null;

  if (!shareLink) {
    throw notFoundError();
  }

  return toDocumentShareLink(shareLink);
}

export async function resolvePublicShareLink(token: string) {
  const tokenHash = hashShareToken(token);

  const shareLink = (await DocumentShareLinkModel.findOne({
    tokenHash
  })) as DocumentShareLinkDocument | null;

  if (!shareLink || !isShareLinkUsable(shareLink)) {
    throw notFoundError("Share link is invalid or expired");
  }

  const document = (await MedicalDocumentModel.findOne({
    _id: shareLink.documentId,
    ownerId: shareLink.ownerId,
    profileId: shareLink.profileId,
    archivedAt: null
  })) as MedicalDocumentDocument | null;

  if (!document) {
    throw notFoundError("Shared document is no longer available");
  }

  shareLink.accessCount += 1;
  shareLink.lastAccessedAt = new Date();
  await shareLink.save();

  return toPublicDocumentShareLink(shareLink, document);
}
