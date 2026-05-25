import { z } from "zod";

export const documentParamsSchema = z.object({
  profileId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid patient profile id")
});

export const documentIdParamsSchema = documentParamsSchema.extend({
  documentId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid document id")
});

export const uploadDocumentSchema = z.object({
  title: z.string().trim().min(2).max(160),
  category: z
    .enum([
      "lab_report",
      "prescription",
      "doctor_note",
      "imaging",
      "insurance",
      "vaccination",
      "discharge_summary",
      "other"
    ])
    .default("other"),
  description: z.string().trim().max(1000).optional(),
  timelineEventId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid timeline event id").optional(),
  tags: z
    .string()
    .trim()
    .max(240)
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : []
    )
});

export const updateDocumentSchema = z
  .object({
    title: z.string().trim().min(2).max(160).optional(),
    category: z
      .enum([
        "lab_report",
        "prescription",
        "doctor_note",
        "imaging",
        "insurance",
        "vaccination",
        "discharge_summary",
        "other"
      ])
      .optional(),
    description: z.string().trim().max(1000).optional(),
    timelineEventId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid timeline event id").optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const listDocumentsQuerySchema = z.object({
  category: z
    .enum([
      "lab_report",
      "prescription",
      "doctor_note",
      "imaging",
      "insurance",
      "vaccination",
      "discharge_summary",
      "other"
    ])
    .optional(),
  q: z.string().trim().max(120).optional(),
  tags: z.string().trim().max(240).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc")
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
