import { Types } from "mongoose";

import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { toPatientProfile } from "./patient-profile.mapper.js";
import { PatientProfileModel, type PatientProfileDocument } from "./patient-profile.model.js";
import type {
  CreatePatientProfileInput,
  UpdatePatientProfileInput
} from "./patient-profile.schemas.js";

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function notFoundError() {
  return new AppError("Patient profile not found", {
    statusCode: HttpStatus.NOT_FOUND,
    code: ErrorCode.RESOURCE_NOT_FOUND
  });
}

async function findOwnedProfile(ownerId: string, profileId: string) {
  const profile = (await PatientProfileModel.findOne({
    _id: profileId,
    ownerId,
    archivedAt: null
  })) as PatientProfileDocument | null;

  if (!profile) {
    throw notFoundError();
  }

  return profile;
}

export async function ensureOwnedPatientProfile(ownerId: string, profileId: string) {
  return findOwnedProfile(ownerId, profileId);
}

export async function listPatientProfiles(ownerId: string) {
  const profiles = (await PatientProfileModel.find({
    ownerId,
    archivedAt: null
  }).sort({ relationshipToOwner: 1, fullName: 1 })) as PatientProfileDocument[];

  return profiles.map(toPatientProfile);
}

export async function createPatientProfile(ownerId: string, input: CreatePatientProfileInput) {
  const profile = (await PatientProfileModel.create({
    ...input,
    ownerId: new Types.ObjectId(ownerId),
    dateOfBirth: toDate(input.dateOfBirth)
  })) as PatientProfileDocument;

  return toPatientProfile(profile);
}

export async function getPatientProfile(ownerId: string, profileId: string) {
  const profile = await findOwnedProfile(ownerId, profileId);

  return toPatientProfile(profile);
}

export async function updatePatientProfile(
  ownerId: string,
  profileId: string,
  input: UpdatePatientProfileInput
) {
  const update = {
    ...input,
    dateOfBirth: input.dateOfBirth ? toDate(input.dateOfBirth) : undefined
  };

  const profile = (await PatientProfileModel.findOneAndUpdate(
    {
      _id: profileId,
      ownerId,
      archivedAt: null
    },
    {
      $set: update
    },
    {
      new: true,
      runValidators: true
    }
  )) as PatientProfileDocument | null;

  if (!profile) {
    throw notFoundError();
  }

  return toPatientProfile(profile);
}

export async function archivePatientProfile(ownerId: string, profileId: string) {
  const profile = await findOwnedProfile(ownerId, profileId);

  profile.archivedAt = new Date();
  await profile.save();
}
