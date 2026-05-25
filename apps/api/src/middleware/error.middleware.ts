import type { ErrorRequestHandler } from "express";

import { HttpStatus } from "../constants/http-status.js";
import { isProduction } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { ErrorCode } from "../errors/error-codes.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  const normalizedError =
    error instanceof AppError
      ? error
      : new AppError("Internal server error", {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          isOperational: false
        });

  logger.error(
    {
      error,
      requestId: req.id,
      code: normalizedError.code,
      isOperational: normalizedError.isOperational
    },
    "Request failed"
  );

  res.status(normalizedError.statusCode).json({
    success: false,
    requestId: req.id,
    error: {
      code: normalizedError.code,
      message: normalizedError.message,
      details: normalizedError.details,
      stack: isProduction ? undefined : normalizedError.stack
    }
  });
};
