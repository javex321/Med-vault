import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { createConsentGrant, listConsentGrants, withdrawConsentGrant } from "./consent.service.js";
import type { CreateConsentInput, ListConsentsQuery, WithdrawConsentInput } from "./consent.schemas.js";

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

export const createConsentRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const consent = await createConsentGrant(auth.userId, profileId, req.body as CreateConsentInput);

  return sendSuccess(res, HttpStatus.CREATED, {
    consent
  });
});

export const listConsentRecords = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const result = await listConsentGrants(auth.userId, profileId, req.query as unknown as ListConsentsQuery);

  return sendSuccess(res, HttpStatus.OK, result);
});

export const withdrawConsentRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const consentId = getRouteParam(req, "consentId");
  const consent = await withdrawConsentGrant(
    auth.userId,
    profileId,
    consentId,
    req.body as WithdrawConsentInput
  );

  return sendSuccess(res, HttpStatus.OK, {
    consent
  });
});
