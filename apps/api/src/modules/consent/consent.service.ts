import { Types, type FilterQuery } from "mongoose";

import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { MedicalDocumentModel, type MedicalDocumentDocument } from "../document/document.model.js";
import { ensureOwnedPatientProfile } from "../patient-profile/patient-profile.service.js";
import { toConsentGrant } from "./consent.mapper.js";
import { ConsentGrantModel, type ConsentGrantDocument } from "./consent.model.js";
import type { CreateConsentInput, ListConsentsQuery, WithdrawConsentInput } from "./consent.schemas.js";
import { getConsentStatus } from "./consent.status.js";

function notFoundError() {
  return new AppError("Consent grant not found", {
    statusCode: HttpStatus.NOT_FOUND,
    code: ErrorCode.RESOURCE_NOT_FOUND
  });
}

async function ensureProfileAccess(ownerId: string, profileId: string) {
  await ensureOwnedPatientProfile(ownerId, profileId);
}

async function ensureDocumentAccess(ownerId: string, profileId: string, documentId?: string) {
  if (!documentId) return;

  const document = (await MedicalDocumentModel.findOne({
    _id: documentId,
    ownerId,
    profileId,
    archivedAt: null
  })) as MedicalDocumentDocument | null;

  if (!document) {
    throw new AppError("Document not found", {
      statusCode: HttpStatus.NOT_FOUND,
      code: ErrorCode.RESOURCE_NOT_FOUND
    });
  }
}

export async function createConsentGrant(ownerId: string, profileId: string, input: CreateConsentInput) {
  await ensureProfileAccess(ownerId, profileId);
  await ensureDocumentAccess(ownerId, profileId, input.documentId);

  const consent = (await ConsentGrantModel.create({
    ownerId: new Types.ObjectId(ownerId),
    profileId: new Types.ObjectId(profileId),
    documentId: input.documentId ? new Types.ObjectId(input.documentId) : null,
    recipientName: input.recipientName,
    recipientEmail: input.recipientEmail,
    purpose: input.purpose,
    legalBasis: input.legalBasis,
    scopes: input.scopes,
    expiresAt: new Date(input.expiresAt),
    grantedAt: new Date()
  })) as ConsentGrantDocument;

  return toConsentGrant(consent);
}

export async function listConsentGrants(ownerId: string, profileId: string, query: ListConsentsQuery) {
  await ensureProfileAccess(ownerId, profileId);

  const filter: FilterQuery<ConsentGrantDocument> = {
    ownerId,
    profileId
  };

  if (query.recipientEmail) {
    filter.recipientEmail = query.recipientEmail;
  }

  const consents = (await ConsentGrantModel.find(filter).sort({ createdAt: -1 })) as ConsentGrantDocument[];
  const mapped = consents.map(toConsentGrant);
  const filtered = query.status ? mapped.filter((consent) => consent.status === query.status) : mapped;

  return {
    consents: filtered
  };
}

export async function withdrawConsentGrant(
  ownerId: string,
  profileId: string,
  consentId: string,
  input: WithdrawConsentInput
) {
  await ensureProfileAccess(ownerId, profileId);

  const consent = (await ConsentGrantModel.findOne({
    _id: consentId,
    ownerId,
    profileId
  })) as ConsentGrantDocument | null;

  if (!consent) {
    throw notFoundError();
  }

  if (getConsentStatus(consent) !== "withdrawn") {
    consent.withdrawnAt = new Date();
    consent.withdrawalReason = input.withdrawalReason;
    await consent.save();
  }

  return toConsentGrant(consent);
}
