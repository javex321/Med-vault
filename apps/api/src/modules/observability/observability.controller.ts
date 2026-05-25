import { HttpStatus } from "../../constants/http-status.js";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getHealthStatus } from "../health/health.service.js";
import { metricsRegistry } from "./metrics.js";

export const getMetrics = asyncHandler(async (_req, res) => {
  res.setHeader("Content-Type", metricsRegistry.contentType);
  return res.status(HttpStatus.OK).send(await metricsRegistry.metrics());
});

export const getLiveness = asyncHandler(async (_req, res) => {
  return sendSuccess(res, HttpStatus.OK, {
    status: "alive",
    service: "api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export const getReadiness = asyncHandler(async (_req, res) => {
  const health = await getHealthStatus();
  const statusCode = health.status === "ok" ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

  return sendSuccess(res, statusCode, {
    status: health.status === "ok" ? "ready" : "not_ready",
    service: health.service,
    timestamp: health.timestamp,
    uptime: health.uptime,
    dependencies: health.dependencies
  });
});
