import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const documentShareParamsSchema = z.object({
  profileId: objectIdSchema,
  documentId: objectIdSchema
});

export const documentShareLinkParamsSchema = documentShareParamsSchema.extend({
  shareLinkId: objectIdSchema
});

export const publicShareTokenParamsSchema = z.object({
  token: z.string().trim().min(24).max(256)
});

export const createShareLinkSchema = z.object({
  recipientName: z.string().trim().min(1).max(120).optional(),
  recipientEmail: z.string().trim().email().max(254).optional(),
  purpose: z.string().trim().max(500).optional(),
  allowDownload: z.boolean().default(false),
  maxAccessCount: z.coerce.number().int().min(1).max(100).default(10),
  expiresAt: z
    .string()
    .datetime()
    .refine((value) => new Date(value).getTime() > Date.now(), "Expiration must be in the future")
});

export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
