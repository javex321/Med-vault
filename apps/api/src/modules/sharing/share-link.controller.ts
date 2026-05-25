import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createDocumentShareLink,
  listDocumentShareLinks,
  resolvePublicShareLink,
  revokeDocumentShareLink
} from "./share-link.service.js";
import type { CreateShareLinkInput } from "./share-link.schemas.js";

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

export const createShareLinkRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const documentId = getRouteParam(req, "documentId");
  const shareLink = await createDocumentShareLink(
    auth.userId,
    profileId,
    documentId,
    req.body as CreateShareLinkInput
  );

  return sendSuccess(res, HttpStatus.CREATED, {
    shareLink
  });
});

export const listShareLinkRecords = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const documentId = getRouteParam(req, "documentId");
  const result = await listDocumentShareLinks(auth.userId, profileId, documentId);

  return sendSuccess(res, HttpStatus.OK, result);
});

export const revokeShareLinkRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const documentId = getRouteParam(req, "documentId");
  const shareLinkId = getRouteParam(req, "shareLinkId");
  const shareLink = await revokeDocumentShareLink(auth.userId, profileId, documentId, shareLinkId);

  return sendSuccess(res, HttpStatus.OK, {
    shareLink
  });
});

export const resolvePublicShareLinkRecord = asyncHandler(async (req, res) => {
  const token = getRouteParam(req, "token");
  const shareLink = await resolvePublicShareLink(token);

  return sendSuccess(res, HttpStatus.OK, {
    shareLink
  });
});
