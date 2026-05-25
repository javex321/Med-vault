import { Router } from "express";

import { getLiveness, getMetrics, getReadiness } from "./observability.controller.js";

export const observabilityRouter = Router();

observabilityRouter.get("/metrics", getMetrics);
observabilityRouter.get("/live", getLiveness);
observabilityRouter.get("/ready", getReadiness);
