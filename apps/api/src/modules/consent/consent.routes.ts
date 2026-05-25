import { Router } from "express";

import { validateRequest } from "../../middleware/validate.middleware.js";
import { requireAuth, requirePermission } from "../auth/auth.middleware.js";
import { createConsentRecord, listConsentRecords, withdrawConsentRecord } from "./consent.controller.js";
import {
  consentIdParamsSchema,
  consentParamsSchema,
  createConsentSchema,
  listConsentsQuerySchema,
  withdrawConsentSchema
} from "./consent.schemas.js";

export const consentRouter = Router({ mergeParams: true });

consentRouter.use(requireAuth);

consentRouter.get(
  "/",
  requirePermission("consent:manage"),
  validateRequest({ params: consentParamsSchema, query: listConsentsQuerySchema }),
  listConsentRecords
);

consentRouter.post(
  "/",
  requirePermission("consent:manage"),
  validateRequest({ params: consentParamsSchema, body: createConsentSchema }),
  createConsentRecord
);

consentRouter.patch(
  "/:consentId/withdraw",
  requirePermission("consent:manage"),
  validateRequest({ params: consentIdParamsSchema, body: withdrawConsentSchema }),
  withdrawConsentRecord
);
