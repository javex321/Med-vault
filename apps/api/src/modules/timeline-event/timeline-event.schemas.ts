import { z } from "zod";

export const timelineEventParamsSchema = z.object({
  profileId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid patient profile id")
});

export const timelineEventIdParamsSchema = timelineEventParamsSchema.extend({
  eventId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid timeline event id")
});

const dateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
  .transform((value) => (value.length === 10 ? `${value}T00:00:00.000Z` : value))
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date");

const codingSchema = z.object({
  system: z.string().trim().url().optional(),
  code: z.string().trim().min(1).max(80),
  display: z.string().trim().min(1).max(160).optional()
});

const fhirResourceSchema = z.object({
  resourceType: z.enum([
    "AllergyIntolerance",
    "Condition",
    "DiagnosticReport",
    "DocumentReference",
    "Encounter",
    "Immunization",
    "MedicationStatement",
    "Observation",
    "Procedure"
  ]),
  resourceId: z.string().trim().max(120).optional(),
  coding: z.array(codingSchema).max(20).default([])
});

export const createTimelineEventSchema = z.object({
  type: z.enum([
    "visit",
    "lab_result",
    "diagnosis",
    "procedure",
    "medication",
    "immunization",
    "allergy",
    "vital",
    "document",
    "note"
  ]),
  title: z.string().trim().min(2).max(160),
  occurredAt: dateTimeSchema,
  endedAt: dateTimeSchema.optional(),
  providerName: z.string().trim().max(120).optional(),
  facilityName: z.string().trim().max(160).optional(),
  summary: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  source: z.enum(["manual", "document", "import", "fhir"]).default("manual"),
  sensitivity: z.enum(["normal", "sensitive", "restricted"]).default("normal"),
  fhirResource: fhirResourceSchema.optional()
});

export const updateTimelineEventSchema = createTimelineEventSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);

export const listTimelineEventsQuerySchema = z.object({
  type: z
    .enum([
      "visit",
      "lab_result",
      "diagnosis",
      "procedure",
      "medication",
      "immunization",
      "allergy",
      "vital",
      "document",
      "note"
    ])
    .optional(),
  from: dateTimeSchema.optional(),
  to: dateTimeSchema.optional(),
  q: z.string().trim().max(120).optional(),
  tags: z.string().trim().max(240).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc")
});

export type CreateTimelineEventInput = z.infer<typeof createTimelineEventSchema>;
export type UpdateTimelineEventInput = z.infer<typeof updateTimelineEventSchema>;
export type ListTimelineEventsQuery = z.infer<typeof listTimelineEventsQuerySchema>;
