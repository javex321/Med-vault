import type { Medication } from "@medvault/shared";

export const MEDICATION_REMINDER_QUEUE = "medvault-medication-reminders";

export type MedicationReminderJobPayload = {
  ownerId: string;
  profileId: string;
  medicationId: string;
  medicationName: string;
  scheduledFor: string;
};

export function buildMedicationReminderJobPayload(
  medication: Medication
): MedicationReminderJobPayload | undefined {
  if (!medication.reminders.enabled || !medication.reminders.nextReminderAt) {
    return undefined;
  }

  return {
    ownerId: medication.ownerId,
    profileId: medication.profileId,
    medicationId: medication.id,
    medicationName: medication.name,
    scheduledFor: medication.reminders.nextReminderAt
  };
}
