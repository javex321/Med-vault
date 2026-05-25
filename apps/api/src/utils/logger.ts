import pino from "pino";

import { env, isProduction } from "../config/env.js";

export const logger = pino({
  enabled: env.NODE_ENV !== "test",
  level: isProduction ? "info" : "debug",
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie"],
    censor: "[REDACTED]"
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard"
          }
        }
      : undefined
});
