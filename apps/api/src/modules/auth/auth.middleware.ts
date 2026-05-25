import type { JWTPayload } from "jose";
import type { RequestHandler } from "express";
import type { Permission } from "@medvault/shared";

import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { ACCESS_TOKEN_COOKIE } from "./auth.constants.js";
import { getPermissionsForRole } from "./permissions.js";
import { verifyAccessToken } from "./token.service.js";
import { UserModel, type UserDocument } from "./user.model.js";

function getBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) return undefined;
  return authorizationHeader.slice("Bearer ".length).trim();
}

function requireStringSubject(payload: JWTPayload) {
  if (!payload.sub) {
    throw new AppError("Invalid access token", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  return payload.sub;
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const accessToken =
    req.cookies?.[ACCESS_TOKEN_COOKIE] ?? getBearerToken(req.header("authorization"));

  if (!accessToken) {
    throw new AppError("Authentication required", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  let payload: JWTPayload;

  try {
    payload = await verifyAccessToken(accessToken);
  } catch {
    throw new AppError("Invalid or expired access token", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  const userId = requireStringSubject(payload);
  const user = (await UserModel.findById(userId)) as UserDocument | null;

  if (!user || user.status !== "active") {
    throw new AppError("Authentication required", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  req.auth = {
    userId: user._id.toString(),
    activeProfileId: user._id.toString(),
    role: user.role,
    permissions: getPermissionsForRole(user.role)
  };

  next();
});

export function requirePermission(permission: Permission): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(
        new AppError("Authentication required", {
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCode.UNAUTHENTICATED
        })
      );
      return;
    }

    if (!req.auth.permissions.includes(permission)) {
      next(
        new AppError("You do not have permission to perform this action", {
          statusCode: HttpStatus.FORBIDDEN,
          code: ErrorCode.FORBIDDEN
        })
      );
      return;
    }

    next();
  };
}
