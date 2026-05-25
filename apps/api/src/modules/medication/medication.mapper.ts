import type { Medication, MedicationAdherenceLog } from "@medvault/shared";

import type { MedicationDocument } from "./medication.model.js";

function optionalString(value: string | null | undefined) {
  return value ?? undefined;
}

function optionalNumber(value: number | null | undefined) {
  return value ?? undefined;
}

function optionalDate(value: Date | null | undefined) {
  return value ? value.toISOString() : undefined;
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toAdherenceLog(log: MedicationDocument["adherenceLogs"][number]): MedicationAdherenceLog {
  return {
    id: log._id.toString(),
    scheduledFor: log.scheduledFor.toISOString(),
    status: log.status,
    recordedAt: log.recordedAt.toISOString(),
    doseAmount: optionalNumber(log.doseAmount),
    doseUnit: optionalString(log.doseUnit),
    note: optionalString(log.note)
  };
}

export function toMedication(medication: MedicationDocument): Medication {
  return {
    id: medication._id.toString(),
    ownerId: medication.ownerId.toString(),
    profileId: medication.profileId.toString(),
    name: medication.name,
    genericName: optionalString(medication.genericName),
    form: medication.form,
    route: medication.route,
    strength: optionalString(medication.strength),
    reason: optionalString(medication.reason),
    prescribingClinician: optionalString(medication.prescribingClinician),
    status: medication.status,
    schedule: {
      doseAmount: medication.schedule.doseAmount,
      doseUnit: medication.schedule.doseUnit,
      frequency: medication.schedule.frequency,
      timesOfDay: [...medication.schedule.timesOfDay],
      daysOfWeek: [...medication.schedule.daysOfWeek],
      startDate: toDateOnly(medication.schedule.startDate),
      endDate: optionalDate(medication.schedule.endDate)?.slice(0, 10),
      timezone: medication.schedule.timezone,
      instructions: optionalString(medication.schedule.instructions)
    },
    reminders: {
      enabled: medication.reminders.enabled,
      leadTimeMinutes: medication.reminders.leadTimeMinutes,
      nextReminderAt: optionalDate(medication.reminders.nextReminderAt)
    },
    adherenceLogs: medication.adherenceLogs.map(toAdherenceLog),
    createdAt: medication.createdAt.toISOString(),
    updatedAt: medication.updatedAt.toISOString()
  };
}
