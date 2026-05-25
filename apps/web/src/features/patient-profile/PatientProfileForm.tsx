import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { PatientProfile } from "@medvault/shared";

import type { CreatePatientProfileInput } from "../../lib/api";

const relationshipOptions = ["self", "child", "parent", "spouse", "other"] as const;
const sexOptions = ["female", "male", "intersex", "unknown", "prefer_not_to_say"] as const;
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"] as const;

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

const patientProfileFormSchema = z.object({
  relationshipToOwner: z.enum(relationshipOptions),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.")
    .refine(isValidPastOrTodayDateOnly, "Date of birth cannot be in the future."),
  sexAtBirth: z.enum(sexOptions),
  bloodGroup: z.enum(bloodGroupOptions),
  heightCm: z.coerce.number().min(30, "Height is too low.").max(260, "Height is too high.").optional().or(z.literal("")),
  weightKg: z.coerce.number().min(1, "Weight is too low.").max(400, "Weight is too high.").optional().or(z.literal("")),
  allergiesText: z.string().max(500).optional(),
  chronicConditionsText: z.string().max(500).optional(),
  primaryPhysicianName: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional()
});

type PatientProfileFormValues = z.input<typeof patientProfileFormSchema>;

type PatientProfileFormProps = {
  errorMessage?: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: CreatePatientProfileInput) => void;
  profile?: PatientProfile;
};

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function splitCommaList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalNumber(value: number | "" | undefined) {
  return value === "" || value === undefined ? undefined : value;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-rose-600">{message}</p>;
}

export function PatientProfileForm({ errorMessage, isSubmitting, onCancel, onSubmit, profile }: PatientProfileFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError
  } = useForm<PatientProfileFormValues>({
    defaultValues: {
      relationshipToOwner: profile?.relationshipToOwner ?? "self",
      fullName: profile?.fullName ?? "",
      dateOfBirth: toDateInputValue(profile?.dateOfBirth),
      sexAtBirth: profile?.sexAtBirth ?? "unknown",
      bloodGroup: profile?.bloodGroup ?? "unknown",
      heightCm: profile?.heightCm ?? "",
      weightKg: profile?.weightKg ?? "",
      allergiesText: profile?.allergies.map((allergy) => allergy.name).join(", ") ?? "",
      chronicConditionsText: profile?.chronicConditions.join(", ") ?? "",
      primaryPhysicianName: profile?.primaryPhysicianName ?? "",
      notes: profile?.notes ?? ""
    }
  });

  const submit = handleSubmit((values) => {
    const result = patientProfileFormSchema.safeParse(values);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof PatientProfileFormValues;
        setError(field, { message: issue.message });
      });
      return;
    }

    const parsed = result.data;
    const allergies = splitCommaList(parsed.allergiesText).map((name) => ({
      name,
      severity: "unknown" as const
    }));

    onSubmit({
      relationshipToOwner: parsed.relationshipToOwner,
      fullName: parsed.fullName.trim(),
      dateOfBirth: parsed.dateOfBirth,
      sexAtBirth: parsed.sexAtBirth,
      bloodGroup: parsed.bloodGroup,
      heightCm: optionalNumber(parsed.heightCm),
      weightKg: optionalNumber(parsed.weightKg),
      allergies,
      chronicConditions: splitCommaList(parsed.chronicConditionsText),
      emergencyContacts: [],
      primaryPhysicianName: parsed.primaryPhysicianName?.trim() || undefined,
      notes: parsed.notes?.trim() || undefined
    });
  });

  return (
    <section className="soft-card page-fade border-teal-200 p-4 ring-4 ring-teal-50 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-teal-700">
            {profile ? "Edit Patient Profile" : "Add Patient Profile"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            {profile ? "Update profile from the website" : "Create a profile from the website"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This saves directly to MongoDB through the protected backend API.
          </p>
        </div>
        <button
          aria-label="Close profile form"
          className="button-motion shrink-0 rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          onClick={onCancel}
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Full name</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              placeholder="Javed Demo"
              {...register("fullName")}
            />
            <FieldError message={errors.fullName?.message} />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Relationship</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold capitalize outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              {...register("relationshipToOwner")}
            >
              {relationshipOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Date of birth</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              type="date"
              {...register("dateOfBirth")}
            />
            <FieldError message={errors.dateOfBirth?.message} />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Sex at birth</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold capitalize outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              {...register("sexAtBirth")}
            >
              {sexOptions.map((option) => (
                <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Blood group</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              {...register("bloodGroup")}
            >
              {bloodGroupOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Height in cm</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              placeholder="175"
              type="number"
              {...register("heightCm")}
            />
            <FieldError message={errors.heightCm?.message} />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Weight in kg</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              placeholder="70"
              type="number"
              {...register("weightKg")}
            />
            <FieldError message={errors.weightKg?.message} />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Chronic conditions</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            placeholder="Asthma, Diabetes"
            {...register("chronicConditionsText")}
          />
          <p className="mt-1 text-xs text-slate-500">Separate multiple conditions with commas.</p>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Allergies</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            placeholder="Peanuts, Penicillin"
            {...register("allergiesText")}
          />
          <p className="mt-1 text-xs text-slate-500">Allergy severity is saved as unknown for now.</p>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Primary physician</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              placeholder="Dr. Sharma"
              {...register("primaryPhysicianName")}
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Notes</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              placeholder="Routine profile created from dashboard"
              {...register("notes")}
            />
          </label>
        </div>

        {errorMessage ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="button-motion h-10 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="button-motion h-10 w-full rounded-xl bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Saving profile..." : profile ? "Update patient profile" : "Save patient profile"}
          </button>
        </div>
      </form>
    </section>
  );
}


