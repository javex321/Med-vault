import { Router } from "express";

import { requireAuth, requirePermission } from "../auth/auth.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import {
  createProfile,
  deleteProfile,
  getProfile,
  listProfiles,
  updateProfile
} from "./patient-profile.controller.js";
import {
  createPatientProfileSchema,
  profileIdParamSchema,
  updatePatientProfileSchema
} from "./patient-profile.schemas.js";

export const patientProfileRouter = Router();

patientProfileRouter.use(requireAuth);

patientProfileRouter.get("/", requirePermission("profile:read"), listProfiles);
patientProfileRouter.post(
  "/",
  requirePermission("profile:update"),
  validateRequest({ body: createPatientProfileSchema }),
  createProfile
);
patientProfileRouter.get(
  "/:profileId",
  requirePermission("profile:read"),
  validateRequest({ params: profileIdParamSchema }),
  getProfile
);
patientProfileRouter.patch(
  "/:profileId",
  requirePermission("profile:update"),
  validateRequest({ params: profileIdParamSchema, body: updatePatientProfileSchema }),
  updateProfile
);
patientProfileRouter.delete(
  "/:profileId",
  requirePermission("profile:update"),
  validateRequest({ params: profileIdParamSchema }),
  deleteProfile
);
