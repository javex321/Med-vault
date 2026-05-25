import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { requestIdMiddleware } from "./middleware/request-id.middleware.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { metricsMiddleware } from "./modules/observability/metrics.middleware.js";
import { observabilityRouter } from "./modules/observability/observability.routes.js";
import { apiRouter } from "./routes/index.js";
import { logger } from "./utils/logger.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(metricsMiddleware);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({
        requestId: req.id
      })
    })
  );

  app.use("/health", healthRouter);
  app.use("/", observabilityRouter);
  app.use("/api/v1", apiRouter);

  app.use(notFoundMiddleware);

  app.use(errorMiddleware);

  return app;
}
