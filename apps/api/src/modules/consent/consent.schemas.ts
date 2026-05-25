import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const consentParamsSchema = z.object({
  profileId: objectIdSchema
});

export const consentIdParamsSchema = consentParamsSchema.extend({
  consentId: objectIdSchema
});

export const consentScopeSchema = z.enum([
  "documents:read",
  "documents:download",
  "timeline:read",
  "medications:read"
]);

export const createConsentSchema = z.object({
  documentId: objectIdSchema.optional(),
  recipientName: z.string().trim().min(1).max(120).optional(),
  recipientEmail: z.string().trim().email().max(254),
  purpose: z.string().trim().min(3).max(500),
  legalBasis: z.enum(["treatment", "care_coordination", "insurance", "personal", "other"]).default("treatment"),
  scopes: z.array(consentScopeSchema).min(1).max(4).default(["documents:read"]),
  expiresAt: z
    .string()
    .datetime()
    .refine((value) => new Date(value).getTime() > Date.now(), "Expiration must be in the future")
});

export const listConsentsQuerySchema = z.object({
  status: z.enum(["active", "expired", "withdrawn"]).optional(),
  recipientEmail: z.string().trim().email().optional()
});

export const withdrawConsentSchema = z.object({
  withdrawalReason: z.string().trim().max(500).optional()
});

export type CreateConsentInput = z.infer<typeof createConsentSchema>;
export type ListConsentsQuery = z.infer<typeof listConsentsQuerySchema>;
export type WithdrawConsentInput = z.infer<typeof withdrawConsentSchema>;
