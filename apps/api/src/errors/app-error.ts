import { HttpStatus, type HttpStatusCode } from "../constants/http-status.js";
import { ErrorCode } from "./error-codes.js";

type AppErrorOptions = {
  statusCode?: HttpStatusCode;
  code?: ErrorCode;
  details?: unknown;
  isOperational?: boolean;
};

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);

    this.name = "AppError";
    this.statusCode = options.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
    this.code = options.code ?? ErrorCode.INTERNAL_SERVER_ERROR;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;

    Error.captureStackTrace(this, this.constructor);
  }
}
