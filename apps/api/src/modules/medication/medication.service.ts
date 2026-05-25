import { Types, type FilterQuery, type UpdateQuery } from "mongoose";

import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { ensureOwnedPatientProfile } from "../patient-profile/patient-profile.service.js";
import { buildMedicationReminderJobPayload } from "./medication-reminder.jobs.js";
import { toMedication } from "./medication.mapper.js";
import { MedicationModel, type MedicationDocument } from "./medication.model.js";
import type {
  AdherenceLogInput,
  CreateMedicationInput,
  ListAdherenceQuery,
  ListMedicationsQuery,
  UpdateMedicationInput
} from "./medication.schemas.js";

function toDate(value: string) {
  return new Date(value);
}

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function notFoundError() {
  return new AppError("Medication not found", {
    statusCode: HttpStatus.NOT_FOUND,
    code: ErrorCode.RESOURCE_NOT_FOUND
  });
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function computeNextReminderAt(input: Pick<CreateMedicationInput, "schedule" | "reminders" | "status">) {
  if (!input.reminders.enabled || input.status !== "active" || input.schedule.frequency === "as_needed") {
    return undefined;
  }

  const [firstTime] = input.schedule.timesOfDay;

  if (!firstTime) {
    return undefined;
  }

  const [hours = "00", minutes = "00"] = firstTime.split(":");
  const candidate = new Date(`${input.schedule.startDate}T${hours}:${minutes}:00.000Z`);
  candidate.setMinutes(candidate.getMinutes() - input.reminders.leadTimeMinutes);

  return candidate;
}

function normalizeMedicationInput(input: CreateMedicationInput | UpdateMedicationInput) {
  return removeUndefined({
    ...input,
    schedule: input.schedule
      ? {
          ...input.schedule,
          startDate: toDateOnly(input.schedule.startDate),
          endDate: input.schedule.endDate ? toDateOnly(input.schedule.endDate) : undefined
        }
      : undefined,
    reminders:
      input.schedule && input.reminders
        ? {
            ...input.reminders,
            nextReminderAt: computeNextReminderAt({
              schedule: input.schedule,
              reminders: input.reminders,
              status: input.status ?? "active"
            })
          }
        : input.reminders
  });
}

async function ensureProfileAccess(ownerId: string, profileId: string) {
  await ensureOwnedPatientProfile(ownerId, profileId);
}

async function findOwnedMedication(ownerId: string, profileId: string, medicationId: string) {
  await ensureProfileAccess(ownerId, profileId);

  const medication = (await MedicationModel.findOne({
    _id: medicationId,
    ownerId,
    profileId,
    archivedAt: null
  })) as MedicationDocument | null;

  if (!medication) {
    throw notFoundError();
  }

  return medication;
}

export async function listMedications(
  ownerId: string,
  profileId: string,
  query: ListMedicationsQuery
) {
  await ensureProfileAccess(ownerId, profileId);

  const filter: FilterQuery<MedicationDocument> = {
    ownerId,
    profileId,
    archivedAt: null
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.q) {
    filter.$text = { $search: query.q };
  }

  const skip = (query.page - 1) * query.limit;
  const sortDirection = query.sort === "asc" ? 1 : -1;

  const [medications, total] = await Promise.all([
    MedicationModel.find(filter).sort({ name: sortDirection }).skip(skip).limit(query.limit),
    MedicationModel.countDocuments(filter)
  ]);

  return {
    medications: (medications as MedicationDocument[]).map(toMedication),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  };
}

export async function createMedication(ownerId: string, profileId: string, input: CreateMedicationInput) {
  await ensureProfileAccess(ownerId, profileId);

  const normalized = normalizeMedicationInput(input);
  const medication = (await MedicationModel.create({
    ...normalized,
    ownerId: new Types.ObjectId(ownerId),
    profileId: new Types.ObjectId(profileId)
  })) as MedicationDocument;
  const mapped = toMedication(medication);

  return {
    medication: mapped,
    reminderJob: buildMedicationReminderJobPayload(mapped)
  };
}

export async function getMedication(ownerId: string, profileId: string, medicationId: string) {
  const medication = await findOwnedMedication(ownerId, profileId, medicationId);

  return toMedication(medication);
}

export async function updateMedication(
  ownerId: string,
  profileId: string,
  medicationId: string,
  input: UpdateMedicationInput
) {
  await ensureProfileAccess(ownerId, profileId);

  const update: UpdateQuery<MedicationDocument> = {
    $set: normalizeMedicationInput(input)
  };

  const medication = (await MedicationModel.findOneAndUpdate(
    {
      _id: medicationId,
      ownerId,
      profileId,
      archivedAt: null
    },
    update,
    {
      new: true,
      runValidators: true
    }
  )) as MedicationDocument | null;

  if (!medication) {
    throw notFoundError();
  }

  const mapped = toMedication(medication);

  return {
    medication: mapped,
    reminderJob: buildMedicationReminderJobPayload(mapped)
  };
}

export async function archiveMedication(ownerId: string, profileId: string, medicationId: string) {
  const medication = await findOwnedMedication(ownerId, profileId, medicationId);

  medication.archivedAt = new Date();
  medication.status = "stopped";
  medication.reminders.enabled = false;
  medication.reminders.nextReminderAt = null;
  await medication.save();
}

export async function addAdherenceLog(
  ownerId: string,
  profileId: string,
  medicationId: string,
  input: AdherenceLogInput
) {
  const medication = await findOwnedMedication(ownerId, profileId, medicationId);

  medication.adherenceLogs.push({
    scheduledFor: toDate(input.scheduledFor),
    status: input.status,
    recordedAt: input.recordedAt ? toDate(input.recordedAt) : new Date(),
    doseAmount: input.doseAmount,
    doseUnit: input.doseUnit,
    note: input.note
  });

  await medication.save();

  return toMedication(medication);
}

export async function listAdherenceLogs(
  ownerId: string,
  profileId: string,
  medicationId: string,
  query: ListAdherenceQuery
) {
  const medication = await findOwnedMedication(ownerId, profileId, medicationId);

  const from = query.from ? toDate(query.from) : undefined;
  const to = query.to ? toDate(query.to) : undefined;
  const filtered = medication.adherenceLogs
    .filter((log) => {
      if (from && log.scheduledFor < from) return false;
      if (to && log.scheduledFor > to) return false;
      return true;
    })
    .sort((a, b) => b.scheduledFor.getTime() - a.scheduledFor.getTime());

  const start = (query.page - 1) * query.limit;
  const logs = filtered.slice(start, start + query.limit).map((log) => ({
    id: log._id.toString(),
    scheduledFor: log.scheduledFor.toISOString(),
    status: log.status,
    recordedAt: log.recordedAt.toISOString(),
    doseAmount: log.doseAmount ?? undefined,
    doseUnit: log.doseUnit ?? undefined,
    note: log.note ?? undefined
  }));

  return {
    logs,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / query.limit)
    }
  };
}
