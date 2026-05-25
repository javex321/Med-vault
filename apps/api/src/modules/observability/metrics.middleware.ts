import type { RequestHandler } from "express";

import {
  httpRequestDurationSeconds,
  httpRequestsTotal,
  normalizeMetricsRoute
} from "./metrics.js";

export const metricsMiddleware: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
    const labels = {
      method: req.method,
      route: normalizeMetricsRoute(req.originalUrl),
      status_code: String(res.statusCode)
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
};
