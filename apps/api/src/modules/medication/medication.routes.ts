import { Router } from "express";

import { validateRequest } from "../../middleware/validate.middleware.js";
import { requireAuth, requirePermission } from "../auth/auth.middleware.js";
import {
  createAdherenceLog,
  createMedicationRecord,
  deleteMedicationRecord,
  getMedicationRecord,
  listMedicationAdherenceLogs,
  listMedicationRecords,
  updateMedicationRecord
} from "./medication.controller.js";
import {
  adherenceLogSchema,
  createMedicationSchema,
  listAdherenceQuerySchema,
  listMedicationsQuerySchema,
  medicationIdParamsSchema,
  medicationParamsSchema,
  updateMedicationSchema
} from "./medication.schemas.js";

export const medicationRouter = Router({ mergeParams: true });

medicationRouter.use(requireAuth);

medicationRouter.get(
  "/",
  requirePermission("medications:read"),
  validateRequest({ params: medicationParamsSchema, query: listMedicationsQuerySchema }),
  listMedicationRecords
);
medicationRouter.post(
  "/",
  requirePermission("medications:create"),
  validateRequest({ params: medicationParamsSchema, body: createMedicationSchema }),
  createMedicationRecord
);
medicationRouter.get(
  "/:medicationId",
  requirePermission("medications:read"),
  validateRequest({ params: medicationIdParamsSchema }),
  getMedicationRecord
);
medicationRouter.patch(
  "/:medicationId",
  requirePermission("medications:update"),
  validateRequest({ params: medicationIdParamsSchema, body: updateMedicationSchema }),
  updateMedicationRecord
);
medicationRouter.delete(
  "/:medicationId",
  requirePermission("medications:update"),
  validateRequest({ params: medicationIdParamsSchema }),
  deleteMedicationRecord
);
medicationRouter.get(
  "/:medicationId/adherence",
  requirePermission("medications:read"),
  validateRequest({ params: medicationIdParamsSchema, query: listAdherenceQuerySchema }),
  listMedicationAdherenceLogs
);
medicationRouter.post(
  "/:medicationId/adherence",
  requirePermission("medications:update"),
  validateRequest({ params: medicationIdParamsSchema, body: adherenceLogSchema }),
  createAdherenceLog
);
