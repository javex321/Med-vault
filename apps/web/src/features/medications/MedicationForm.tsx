import { Pill, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type {
  Medication,
  MedicationDoseSchedule,
  MedicationForm as MedicationFormKind,
  MedicationRoute,
  MedicationStatus
} from "@medvault/shared";

import type { CreateMedicationInput } from "../../lib/api";

const medicationFormOptions: Array<{ label: string; value: MedicationFormKind }> = [
  { label: "Tablet", value: "tablet" },
  { label: "Capsule", value: "capsule" },
  { label: "Liquid", value: "liquid" },
  { label: "Injection", value: "injection" },
  { label: "Inhaler", value: "inhaler" },
  { label: "Cream", value: "cream" },
  { label: "Drops", value: "drops" },
  { label: "Patch", value: "patch" },
  { label: "Other", value: "other" }
];

const routeOptions: Array<{ label: string; value: MedicationRoute }> = [
  { label: "Oral", value: "oral" },
  { label: "Topical", value: "topical" },
  { label: "Inhaled", value: "inhaled" },
  { label: "Injection", value: "injection" },
  { label: "Intranasal", value: "intranasal" },
  { label: "Ophthalmic", value: "ophthalmic" },
  { label: "Otic", value: "otic" },
  { label: "Other", value: "other" }
];

const statusOptions: Array<{ label: string; value: MedicationStatus }> = [
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
  { label: "Stopped", value: "stopped" }
];

const frequencyOptions: Array<{ label: string; value: MedicationDoseSchedule["frequency"] }> = [
  { label: "Once daily", value: "once_daily" },
  { label: "Twice daily", value: "twice_daily" },
  { label: "Three times daily", value: "three_times_daily" },
  { label: "Four times daily", value: "four_times_daily" },
  { label: "As needed", value: "as_needed" },
  { label: "Custom", value: "custom" }
];

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");

const medicationFormSchema = z
  .object({
    name: z.string().trim().min(1, "Medication name is required.").max(160),
    genericName: z.string().trim().max(160).optional(),
    form: z.enum(["tablet", "capsule", "liquid", "injection", "inhaler", "cream", "drops", "patch", "other"]),
    route: z.enum(["oral", "topical", "inhaled", "injection", "intranasal", "ophthalmic", "otic", "other"]),
    strength: z.string().trim().max(80).optional(),
    reason: z.string().trim().max(240).optional(),
    prescribingClinician: z.string().trim().max(120).optional(),
    status: z.enum(["active", "paused", "completed", "stopped"]),
    doseAmount: z.coerce.number().positive("Dose amount must be greater than zero.").max(10000),
    doseUnit: z.string().trim().min(1, "Dose unit is required.").max(40),
    frequency: z.enum(["once_daily", "twice_daily", "three_times_daily", "four_times_daily", "as_needed", "custom"]),
    timesOfDayText: z.string().trim().max(120).optional(),
    startDate: dateOnlySchema,
    endDate: z.union([dateOnlySchema, z.literal("")]).optional(),
    timezone: z.string().trim().min(1, "Timezone is required.").max(80),
    instructions: z.string().trim().max(1000).optional(),
    remindersEnabled: z.boolean().default(false),
    leadTimeMinutes: z.coerce.number().int().min(0).max(240)
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: "End date must be after the start date.",
    path: ["endDate"]
  });

type MedicationFormValues = z.input<typeof medicationFormSchema>;

type MedicationFormProps = {
  errorMessage?: string;
  isSubmitting: boolean;
  medication?: Medication;
  onCancel: () => void;
  onSubmit: (input: CreateMedicationInput) => void;
  profileId: string;
};

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function todayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function splitTimeList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function optionalTrimmed(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-rose-600">{message}</p>;
}

export function MedicationForm({
  errorMessage,
  isSubmitting,
  medication,
  onCancel,
  onSubmit,
  profileId
}: MedicationFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError
  } = useForm<MedicationFormValues>({
    defaultValues: {
      name: medication?.name ?? "",
      genericName: medication?.genericName ?? "",
      form: medication?.form ?? "tablet",
      route: medication?.route ?? "oral",
      strength: medication?.strength ?? "",
      reason: medication?.reason ?? "",
      prescribingClinician: medication?.prescribingClinician ?? "",
      status: medication?.status ?? "active",
      doseAmount: medication?.schedule.doseAmount ?? 1,
      doseUnit: medication?.schedule.doseUnit ?? "tablet",
      frequency: medication?.schedule.frequency ?? "once_daily",
      timesOfDayText: medication?.schedule.timesOfDay.join(", ") ?? "08:00",
      startDate: toDateInputValue(medication?.schedule.startDate) || todayDateInputValue(),
      endDate: toDateInputValue(medication?.schedule.endDate),
      timezone: medication?.schedule.timezone ?? "Asia/Kolkata",
      instructions: medication?.schedule.instructions ?? "",
      remindersEnabled: medication?.reminders.enabled ?? false,
      leadTimeMinutes: medication?.reminders.leadTimeMinutes ?? 15
    }
  });

  const submit = handleSubmit((values) => {
    const result = medicationFormSchema.safeParse(values);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof MedicationFormValues;
        setError(field, { message: issue.message });
      });
      return;
    }

    const parsed = result.data;
    const timesOfDay = splitTimeList(parsed.timesOfDayText);
    const invalidTime = timesOfDay.find((time) => !isValidTime(time));

    if (invalidTime) {
      setError("timesOfDayText", { message: "Use 24-hour HH:MM times, separated by commas." });
      return;
    }

    if (parsed.frequency !== "as_needed" && timesOfDay.length === 0) {
      setError("timesOfDayText", { message: "Add at least one time unless the medication is as needed." });
      return;
    }

    onSubmit({
      profileId,
      name: parsed.name.trim(),
      genericName: optionalTrimmed(parsed.genericName),
      form: parsed.form,
      route: parsed.route,
      strength: optionalTrimmed(parsed.strength),
      reason: optionalTrimmed(parsed.reason),
      prescribingClinician: optionalTrimmed(parsed.prescribingClinician),
      status: parsed.status,
      schedule: {
        doseAmount: parsed.doseAmount,
        doseUnit: parsed.doseUnit.trim(),
        frequency: parsed.frequency,
        timesOfDay,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startDate: parsed.startDate,
        endDate: parsed.endDate || undefined,
        timezone: parsed.timezone.trim(),
        instructions: optionalTrimmed(parsed.instructions)
      },
      reminders: {
        enabled: parsed.remindersEnabled,
        leadTimeMinutes: parsed.leadTimeMinutes
      }
    });
  });

  return (
    <section className="soft-card page-fade border-amber-200 p-4 ring-4 ring-amber-50 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
            <Pill size={18} />
            {medication ? "Edit Medication" : "Add Medication"}
          </div>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            {medication ? "Update medication schedule" : "Create a medication schedule"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This saves dose timing, instructions, and reminder settings through the protected backend API.
          </p>
        </div>
        <button
          aria-label="Close medication form"
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
            <span className="text-sm font-bold text-slate-700">Medication name</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              placeholder="Metformin"
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Generic name</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              placeholder="Metformin hydrochloride"
              {...register("genericName")}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Medication form</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              {...register("form")}
            >
              {medicationFormOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Route</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              {...register("route")}
            >
              {routeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Strength</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              placeholder="500mg"
              {...register("strength")}
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Status</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              {...register("status")}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Reason</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              placeholder="Blood sugar control"
              {...register("reason")}
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Prescribing clinician</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              placeholder="Dr. Sharma"
              {...register("prescribingClinician")}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Dose amount</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              min="0"
              step="0.5"
              type="number"
              {...register("doseAmount")}
            />
            <FieldError message={errors.doseAmount?.message} />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Dose unit</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              placeholder="tablet"
              {...register("doseUnit")}
            />
            <FieldError message={errors.doseUnit?.message} />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Frequency</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              {...register("frequency")}
            >
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Times of day</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              placeholder="08:00, 20:00"
              {...register("timesOfDayText")}
            />
            <FieldError message={errors.timesOfDayText?.message} />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Start date</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              type="date"
              {...register("startDate")}
            />
            <FieldError message={errors.startDate?.message} />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">End date</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              type="date"
              {...register("endDate")}
            />
            <FieldError message={errors.endDate?.message} />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Timezone</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              placeholder="Asia/Kolkata"
              {...register("timezone")}
            />
            <FieldError message={errors.timezone?.message} />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Instructions</span>
          <textarea
            className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
            placeholder="Take after meals"
            {...register("instructions")}
          />
        </label>

        <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_220px]">
          <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              type="checkbox"
              {...register("remindersEnabled")}
            />
            Enable reminders
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Reminder lead time minutes</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              min="0"
              max="240"
              type="number"
              {...register("leadTimeMinutes")}
            />
            <FieldError message={errors.leadTimeMinutes?.message} />
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
            className="button-motion h-10 w-full rounded-xl bg-amber-600 px-5 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Saving medication..." : medication ? "Update medication" : "Save medication"}
          </button>
        </div>
      </form>
    </section>
  );
}