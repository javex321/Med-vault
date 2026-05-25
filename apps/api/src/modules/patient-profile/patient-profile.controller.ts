import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  archivePatientProfile,
  createPatientProfile,
  getPatientProfile,
  listPatientProfiles,
  updatePatientProfile
} from "./patient-profile.service.js";
import type {
  CreatePatientProfileInput,
  UpdatePatientProfileInput
} from "./patient-profile.schemas.js";

function requireAuthContext(req: Parameters<Parameters<typeof asyncHandler>[0]>[0]) {
  if (!req.auth) {
    throw new AppError("Authentication required", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  return req.auth;
}

function getProfileId(req: Parameters<Parameters<typeof asyncHandler>[0]>[0]) {
  const { profileId } = req.params;

  if (!profileId) {
    throw new AppError("Patient profile id is required", {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.VALIDATION_ERROR
    });
  }

  return profileId;
}

export const listProfiles = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profiles = await listPatientProfiles(auth.userId);

  return sendSuccess(res, HttpStatus.OK, {
    profiles
  });
});

export const createProfile = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profile = await createPatientProfile(auth.userId, req.body as CreatePatientProfileInput);

  return sendSuccess(res, HttpStatus.CREATED, {
    profile
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profile = await getPatientProfile(auth.userId, getProfileId(req));

  return sendSuccess(res, HttpStatus.OK, {
    profile
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profile = await updatePatientProfile(
    auth.userId,
    getProfileId(req),
    req.body as UpdatePatientProfileInput
  );

  return sendSuccess(res, HttpStatus.OK, {
    profile
  });
});

export const deleteProfile = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);

  await archivePatientProfile(auth.userId, getProfileId(req));

  return sendSuccess(res, HttpStatus.OK, {
    deleted: true
  });
});
