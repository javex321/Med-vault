import type { ConsentGrant } from "@medvault/shared";

import type { ConsentGrantDocument } from "./consent.model.js";
import { getConsentStatus } from "./consent.status.js";

function optionalString(value: string | null | undefined) {
  return value ?? undefined;
}

function optionalDate(value: Date | null | undefined) {
  return value ? value.toISOString() : undefined;
}

function optionalObjectId(value: ConsentGrantDocument["documentId"]) {
  return value ? value.toString() : undefined;
}

export function toConsentGrant(consent: ConsentGrantDocument): ConsentGrant {
  return {
    id: consent._id.toString(),
    ownerId: consent.ownerId.toString(),
    profileId: consent.profileId.toString(),
    documentId: optionalObjectId(consent.documentId),
    recipientName: optionalString(consent.recipientName),
    recipientEmail: consent.recipientEmail,
    purpose: consent.purpose,
    legalBasis: consent.legalBasis,
    scopes: [...consent.scopes],
    status: getConsentStatus(consent),
    expiresAt: consent.expiresAt.toISOString(),
    grantedAt: consent.grantedAt.toISOString(),
    withdrawnAt: optionalDate(consent.withdrawnAt),
    withdrawalReason: optionalString(consent.withdrawalReason),
    createdAt: consent.createdAt.toISOString(),
    updatedAt: consent.updatedAt.toISOString()
  };
}
