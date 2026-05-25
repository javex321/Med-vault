import type { RequestHandler } from "express";
import type { ZodError, ZodTypeAny } from "zod";

import { HttpStatus } from "../constants/http-status.js";
import { AppError } from "../errors/app-error.js";
import { ErrorCode } from "../errors/error-codes.js";

type RequestValidationSchema = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
}

export function validateRequest(schema: RequestValidationSchema): RequestHandler {
  return (req, _res, next) => {
    const errors: unknown[] = [];

    if (schema.body) {
      const result = schema.body.safeParse(req.body);
      if (result.success) req.body = result.data;
      else errors.push(...formatZodError(result.error));
    }

    if (schema.params) {
      const result = schema.params.safeParse(req.params);
      if (result.success) req.params = result.data;
      else errors.push(...formatZodError(result.error));
    }

    if (schema.query) {
      const result = schema.query.safeParse(req.query);
      if (result.success) req.query = result.data;
      else errors.push(...formatZodError(result.error));
    }

    if (errors.length > 0) {
      next(
        new AppError("Request validation failed", {
          statusCode: HttpStatus.BAD_REQUEST,
          code: ErrorCode.VALIDATION_ERROR,
          details: errors
        })
      );
      return;
    }

    next();
  };
}
