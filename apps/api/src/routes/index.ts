import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.js";
import { consentRouter } from "../modules/consent/consent.routes.js";
import { documentRouter } from "../modules/document/document.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { medicationRouter } from "../modules/medication/medication.routes.js";
import { notificationRouter } from "../modules/notification/notification.routes.js";
import { patientProfileRouter } from "../modules/patient-profile/patient-profile.routes.js";
import { documentShareLinkRouter, publicShareLinkRouter } from "../modules/sharing/share-link.routes.js";
import { timelineEventRouter } from "../modules/timeline-event/timeline-event.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/share-links", publicShareLinkRouter);
apiRouter.use("/patient-profiles/:profileId/consents", consentRouter);
apiRouter.use("/patient-profiles/:profileId/documents", documentShareLinkRouter);
apiRouter.use("/patient-profiles/:profileId/documents", documentRouter);
apiRouter.use("/patient-profiles/:profileId/medications", medicationRouter);
apiRouter.use("/patient-profiles/:profileId/timeline-events", timelineEventRouter);
apiRouter.use("/patient-profiles", patientProfileRouter);
