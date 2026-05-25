import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  archiveDocument,
  getDocument,
  listDocuments,
  updateDocument,
  uploadDocument
} from "./document.service.js";
import { uploadDocumentSchema } from "./document.schemas.js";
import type { ListDocumentsQuery, UpdateDocumentInput } from "./document.schemas.js";

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

export const listDocumentRecords = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const result = await listDocuments(auth.userId, profileId, req.query as unknown as ListDocumentsQuery);

  return sendSuccess(res, HttpStatus.OK, result);
});

export const uploadDocumentRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");

  if (!req.file) {
    throw new AppError("Document file is required", {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.VALIDATION_ERROR
    });
  }

  const parsedBody = uploadDocumentSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new AppError("Request validation failed", {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.VALIDATION_ERROR,
      details: parsedBody.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  const document = await uploadDocument(auth.userId, profileId, parsedBody.data, req.file);

  return sendSuccess(res, HttpStatus.CREATED, {
    document
  });
});

export const getDocumentRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const documentId = getRouteParam(req, "documentId");
  const document = await getDocument(auth.userId, profileId, documentId);

  return sendSuccess(res, HttpStatus.OK, {
    document
  });
});

export const updateDocumentRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const documentId = getRouteParam(req, "documentId");
  const document = await updateDocument(
    auth.userId,
    profileId,
    documentId,
    req.body as UpdateDocumentInput
  );

  return sendSuccess(res, HttpStatus.OK, {
    document
  });
});

export const deleteDocumentRecord = asyncHandler(async (req, res) => {
  const auth = requireAuthContext(req);
  const profileId = getRouteParam(req, "profileId");
  const documentId = getRouteParam(req, "documentId");

  await archiveDocument(auth.userId, profileId, documentId);

  return sendSuccess(res, HttpStatus.OK, {
    deleted: true
  });
});
