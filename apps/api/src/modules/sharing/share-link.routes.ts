import { Router } from "express";

import { validateRequest } from "../../middleware/validate.middleware.js";
import { requireAuth, requirePermission } from "../auth/auth.middleware.js";
import {
  createShareLinkRecord,
  listShareLinkRecords,
  resolvePublicShareLinkRecord,
  revokeShareLinkRecord
} from "./share-link.controller.js";
import {
  createShareLinkSchema,
  documentShareLinkParamsSchema,
  documentShareParamsSchema,
  publicShareTokenParamsSchema
} from "./share-link.schemas.js";

export const documentShareLinkRouter = Router({ mergeParams: true });
export const publicShareLinkRouter = Router();

documentShareLinkRouter.use(requireAuth);

documentShareLinkRouter.get(
  "/:documentId/share-links",
  requirePermission("sharing:create"),
  validateRequest({ params: documentShareParamsSchema }),
  listShareLinkRecords
);

documentShareLinkRouter.post(
  "/:documentId/share-links",
  requirePermission("sharing:create"),
  validateRequest({ params: documentShareParamsSchema, body: createShareLinkSchema }),
  createShareLinkRecord
);

documentShareLinkRouter.patch(
  "/:documentId/share-links/:shareLinkId/revoke",
  requirePermission("sharing:create"),
  validateRequest({ params: documentShareLinkParamsSchema }),
  revokeShareLinkRecord
);

publicShareLinkRouter.get(
  "/:token",
  validateRequest({ params: publicShareTokenParamsSchema }),
  resolvePublicShareLinkRecord
);
