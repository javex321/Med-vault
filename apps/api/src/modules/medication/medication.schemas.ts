import { z } from "zod";

export const medicationParamsSchema = z.object({
  profileId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid patient profile id")
});

export const medicationIdParamsSchema = medicationParamsSchema.extend({
  medicationId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid medication id")
});

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), "Invalid date");

const dateTimeSchema = z.string().datetime({ offset: true });

const scheduleSchema = z
  .object({
    doseAmount: z.number().positive().max(10000),
    doseUnit: z.string().trim().min(1).max(40),
    frequency: z
      .enum(["once_daily", "twice_daily", "three_times_daily", "four_times_daily", "as_needed", "custom"])
      .default("once_daily"),
    timesOfDay: z.array(z.string().regex(/^\d{2}:\d{2}$/)).max(12).default([]),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).default([0, 1, 2, 3, 4, 5, 6]),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema.optional(),
    timezone: z.string().trim().min(1).max(80).default("Asia/Kolkata"),
    instructions: z.string().trim().max(1000).optional()
  })
  .refine((value) => {
    if (!value.endDate) return true;
    return value.endDate >= value.startDate;
  }, "End date must be after start date")
  .refine((value) => value.frequency === "as_needed" || value.timesOfDay.length > 0, {
    message: "At least one time of day is required unless medication is as needed",
    path: ["timesOfDay"]
  });

const reminderSchema = z.object({
  enabled: z.boolean().default(false),
  leadTimeMinutes: z.number().int().min(0).max(240).default(15)
});

export const createMedicationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  genericName: z.string().trim().max(160).optional(),
  form: z
    .enum(["tablet", "capsule", "liquid", "injection", "inhaler", "cream", "drops", "patch", "other"])
    .default("tablet"),
  route: z
    .enum(["oral", "topical", "inhaled", "injection", "intranasal", "ophthalmic", "otic", "other"])
    .default("oral"),
  strength: z.string().trim().max(80).optional(),
  reason: z.string().trim().max(240).optional(),
  prescribingClinician: z.string().trim().max(120).optional(),
  status: z.enum(["active", "paused", "completed", "stopped"]).default("active"),
  schedule: scheduleSchema,
  reminders: reminderSchema.default({ enabled: false, leadTimeMinutes: 15 })
});

export const updateMedicationSchema = createMedicationSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);

export const listMedicationsQuerySchema = z.object({
  status: z.enum(["active", "paused", "completed", "stopped"]).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("asc")
});

export const adherenceLogSchema = z.object({
  scheduledFor: dateTimeSchema,
  status: z.enum(["taken", "missed", "skipped"]),
  recordedAt: dateTimeSchema.optional(),
  doseAmount: z.number().positive().max(10000).optional(),
  doseUnit: z.string().trim().max(40).optional(),
  note: z.string().trim().max(500).optional()
});

export const listAdherenceQuerySchema = z.object({
  from: dateTimeSchema.optional(),
  to: dateTimeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type ListMedicationsQuery = z.infer<typeof listMedicationsQuerySchema>;
export type AdherenceLogInput = z.infer<typeof adherenceLogSchema>;
export type ListAdherenceQuery = z.infer<typeof listAdherenceQuerySchema>;
