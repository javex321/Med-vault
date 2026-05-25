import multer from "multer";

import { env } from "../../config/env.js";
import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export const uploadDocumentFile = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_DOCUMENT_UPLOAD_BYTES,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new AppError("Unsupported document file type", {
          statusCode: HttpStatus.BAD_REQUEST,
          code: ErrorCode.VALIDATION_ERROR
        })
      );
      return;
    }

    callback(null, true);
  }
});
