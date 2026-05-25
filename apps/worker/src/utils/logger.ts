import pino from "pino";

import { env, isProduction } from "../config/env.js";

export const logger = pino({
  enabled: env.NODE_ENV !== "test",
  level: isProduction ? "info" : "debug"
});
