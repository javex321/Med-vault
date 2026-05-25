import { Activity, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { TimelineEvent, TimelineEventSensitivity, TimelineEventType } from "@medvault/shared";

import type { CreateTimelineEventInput } from "../../lib/api";

const timelineTypeOptions: Array<{ label: string; value: TimelineEventType }> = [
  { label: "Visit", value: "visit" },
  { label: "Lab result", value: "lab_result" },
  { label: "Diagnosis", value: "diagnosis" },
  { label: "Procedure", value: "procedure" },
  { label: "Medication", value: "medication" },
  { label: "Immunization", value: "immunization" },
  { label: "Allergy", value: "allergy" },
  { label: "Vital", value: "vital" },
  { label: "Document", value: "document" },
  { label: "Note", value: "note" }
];

const sensitivityOptions: Array<{ label: string; value: TimelineEventSensitivity }> = [
  { label: "Normal", value: "normal" },
  { label: "Sensitive", value: "sensitive" },
  { label: "Restricted", value: "restricted" }
];

const timelineEventFormSchema = z.object({
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
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(160),
  occurredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an event date."),
  occurredTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose an event time."),
  providerName: z.string().trim().max(120).optional(),
  facilityName: z.string().trim().max(160).optional(),
  summary: z.string().trim().max(2000).optional(),
  tagsText: z.string().max(240).optional(),
  sensitivity: z.enum(["normal", "sensitive", "restricted"])
});

type TimelineEventFormValues = z.input<typeof timelineEventFormSchema>;

type TimelineEventFormProps = {
  errorMessage?: string;
  event?: TimelineEvent;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateTimelineEventInput) => void;
  profileId: string;
};

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function toTimeInputValue(value?: string) {
  return value ? value.slice(11, 16) : "";
}

function todayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function currentTimeInputValue() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function splitCommaList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toIsoFromLocalDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-rose-600">{message}</p>;
}

export function TimelineEventForm({
  errorMessage,
  event,
  isSubmitting,
  onCancel,
  onSubmit,
  profileId
}: TimelineEventFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError
  } = useForm<TimelineEventFormValues>({
    defaultValues: {
      type: event?.type ?? "visit",
      title: event?.title ?? "",
      occurredDate: toDateInputValue(event?.occurredAt) || todayDateInputValue(),
      occurredTime: toTimeInputValue(event?.occurredAt) || currentTimeInputValue(),
      providerName: event?.providerName ?? "",
      facilityName: event?.facilityName ?? "",
      summary: event?.summary ?? "",
      tagsText: event?.tags.join(", ") ?? "",
      sensitivity: event?.sensitivity ?? "normal"
    }
  });

  const submit = handleSubmit((values) => {
    const result = timelineEventFormSchema.safeParse(values);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof TimelineEventFormValues;
        setError(field, { message: issue.message });
      });
      return;
    }

    const parsed = result.data;

    onSubmit({
      profileId,
      type: parsed.type,
      title: parsed.title.trim(),
      occurredAt: toIsoFromLocalDateTime(parsed.occurredDate, parsed.occurredTime),
      providerName: parsed.providerName?.trim() || undefined,
      facilityName: parsed.facilityName?.trim() || undefined,
      summary: parsed.summary?.trim() || undefined,
      tags: splitCommaList(parsed.tagsText),
      source: "manual",
      sensitivity: parsed.sensitivity
    });
  });

  return (
    <section className="soft-card page-fade border-slate-900 p-4 ring-4 ring-slate-100 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <Activity size={18} />
            {event ? "Edit Timeline Event" : "Add Timeline Event"}
          </div>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            {event ? "Update a medical timeline record" : "Create a medical timeline record"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This saves a profile-scoped event to MongoDB through the protected backend API.
          </p>
        </div>
        <button
          aria-label="Close timeline form"
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
            <span className="text-sm font-bold text-slate-700">Event type</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              {...register("type")}
            >
              {timelineTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Title</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              placeholder="Annual checkup"
              {...register("title")}
            />
            <FieldError message={errors.title?.message} />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Event date</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              type="date"
              {...register("occurredDate")}
            />
            <FieldError message={errors.occurredDate?.message} />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Event time</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              type="time"
              {...register("occurredTime")}
            />
            <FieldError message={errors.occurredTime?.message} />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Sensitivity</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              {...register("sensitivity")}
            >
              {sensitivityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Provider name</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              placeholder="Dr. Sharma"
              {...register("providerName")}
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Facility name</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              placeholder="City Clinic"
              {...register("facilityName")}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Summary</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            placeholder="Routine checkup with normal vitals."
            {...register("summary")}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Tags</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            placeholder="checkup, primary-care"
            {...register("tagsText")}
          />
          <p className="mt-1 text-xs text-slate-500">Separate multiple tags with commas.</p>
        </label>

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
            className="button-motion h-10 w-full rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Saving event..." : event ? "Update timeline event" : "Save timeline event"}
          </button>
        </div>
      </form>
    </section>
  );
}
