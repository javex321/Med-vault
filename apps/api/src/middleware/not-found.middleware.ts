import type { RequestHandler } from "express";

import { HttpStatus } from "../constants/http-status.js";
import { AppError } from "../errors/app-error.js";
import { ErrorCode } from "../errors/error-codes.js";

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(
    new AppError(`Route not found: ${req.method} ${req.originalUrl}`, {
      statusCode: HttpStatus.NOT_FOUND,
      code: ErrorCode.ROUTE_NOT_FOUND
    })
  );
};
