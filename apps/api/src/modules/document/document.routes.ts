import { Router } from "express";

import { validateRequest } from "../../middleware/validate.middleware.js";
import { requireAuth, requirePermission } from "../auth/auth.middleware.js";
import {
  deleteDocumentRecord,
  getDocumentRecord,
  listDocumentRecords,
  updateDocumentRecord,
  uploadDocumentRecord
} from "./document.controller.js";
import {
  documentIdParamsSchema,
  documentParamsSchema,
  listDocumentsQuerySchema,
  updateDocumentSchema
} from "./document.schemas.js";
import { uploadDocumentFile } from "./document.upload.js";

export const documentRouter = Router({ mergeParams: true });

documentRouter.use(requireAuth);

documentRouter.get(
  "/",
  requirePermission("documents:read"),
  validateRequest({ params: documentParamsSchema, query: listDocumentsQuerySchema }),
  listDocumentRecords
);
documentRouter.post(
  "/",
  requirePermission("documents:upload"),
  validateRequest({ params: documentParamsSchema }),
  uploadDocumentFile.single("file"),
  uploadDocumentRecord
);
documentRouter.get(
  "/:documentId",
  requirePermission("documents:read"),
  validateRequest({ params: documentIdParamsSchema }),
  getDocumentRecord
);
documentRouter.patch(
  "/:documentId",
  requirePermission("documents:update"),
  validateRequest({ params: documentIdParamsSchema, body: updateDocumentSchema }),
  updateDocumentRecord
);
documentRouter.delete(
  "/:documentId",
  requirePermission("documents:update"),
  validateRequest({ params: documentIdParamsSchema }),
  deleteDocumentRecord
);
