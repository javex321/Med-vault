import { z } from "zod";

export const profileIdParamSchema = z.object({
  profileId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid patient profile id")
});

function isValidPastOrTodayDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const [, yearRaw, monthRaw, dayRaw] = match;

  if (!yearRaw || !monthRaw || !dayRaw) return false;

  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const date = new Date(year, month - 1, day);

  const isRealCalendarDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  if (!isRealCalendarDate) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return date <= today;
}

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine(isValidPastOrTodayDateOnly, "Date must be valid and cannot be in the future");

const allergySchema = z.object({
  name: z.string().trim().min(1).max(120),
  reaction: z.string().trim().max(240).optional(),
  severity: z.enum(["mild", "moderate", "severe", "unknown"]).default("unknown"),
  notes: z.string().trim().max(500).optional()
});

const emergencyContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  relationship: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().optional()
});

export const createPatientProfileSchema = z.object({
  relationshipToOwner: z.enum(["self", "child", "parent", "spouse", "other"]).default("self"),
  fullName: z.string().trim().min(2).max(120),
  dateOfBirth: dateOnlySchema,
  sexAtBirth: z.enum(["female", "male", "intersex", "unknown", "prefer_not_to_say"]),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"]).default("unknown"),
  heightCm: z.number().min(30).max(260).optional(),
  weightKg: z.number().min(1).max(400).optional(),
  allergies: z.array(allergySchema).max(50).default([]),
  chronicConditions: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  emergencyContacts: z.array(emergencyContactSchema).max(10).default([]),
  primaryPhysicianName: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional()
});

export const updatePatientProfileSchema = createPatientProfileSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);

export type CreatePatientProfileInput = z.infer<typeof createPatientProfileSchema>;
export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>;


