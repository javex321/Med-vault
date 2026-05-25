import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  addAdherenceLog,
  archiveMedication,
  createMedication,
  getMedication,
  listAdherenceLogs,
  listMedications,
  updateMedication
} from "./medication.service.js";
import type {
  AdherenceLogInput,
  CreateMedicationInput,
  ListAdherenceQuery,
  ListMedicationsQuery,
  UpdateMedicationInput
} from "./medication.schemas.js";

function requireAuthContext(req: Parameters<Parameters<typeof asyncHandler>[0]>[0]) {
  if (!req.auth) {
    throw new AppError("Authentication required", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  return req.auth;
}

function getRouteParam(req: Parameters<Parameters<typeof asyncHandler>[0]>[0], key: string) {
  const value = req.params[key];

  if (!value) {
    throw new AppError(`Route param is required: ${key}`, {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.VALIDATION_ERROR
    });
  }

  return value;
}

export const listMedicationRecords = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const result = await listMedications(auth.userId, profileId, req.query as unknown as ListMedicationsQuery);

  return sendSuccess(res, HttpStatus.OK, result);
});

export const createMedicationRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const result = await createMedication(auth.userId, profileId, req.body as CreateMedicationInput);

  return sendSuccess(res, HttpStatus.CREATED, result);
});

export const getMedicationRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const medicationId = getRouteParam(req, "medicationId");
  const medication = await getMedication(auth.userId, profileId, medicationId);

  return sendSuccess(res, HttpStatus.OK, {
    medication
  });
});

export const updateMedicationRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const medicationId = getRouteParam(req, "medicationId");
  const result = await updateMedication(
    auth.userId,
    profileId,
    medicationId,
    req.body as UpdateMedicationInput
  );

  return sendSuccess(res, HttpStatus.OK, result);
});

export const deleteMedicationRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const medicationId = getRouteParam(req, "medicationId");

  await archiveMedication(auth.userId, profileId, medicationId);

  return sendSuccess(res, HttpStatus.OK, {
    deleted: true
  });
});

export const createAdherenceLog = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const medicationId = getRouteParam(req, "medicationId");
  const medication = await addAdherenceLog(
    auth.userId,
    profileId,
    medicationId,
    req.body as AdherenceLogInput
  );

  return sendSuccess(res, HttpStatus.CREATED, {
    medication
  });
});

export const listMedicationAdherenceLogs = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const medicationId = getRouteParam(req, "medicationId");
  const result = await listAdherenceLogs(
    auth.userId,
    profileId,
    medicationId,
    req.query as unknown as ListAdherenceQuery
  );

  return sendSuccess(res, HttpStatus.OK, result);
});
