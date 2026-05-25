import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { clearAuthCookies, setAuthCookies } from "./auth.cookies.js";
import { REFRESH_TOKEN_COOKIE } from "./auth.constants.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";
import { getCurrentUser, loginUser, logoutSession, refreshSession, registerUser } from "./auth.service.js";

function getRequestContext(req: Parameters<Parameters<typeof asyncHandler>[0]>[0]) {
  return {
    ip: req.ip,
    userAgent: req.header("user-agent")
  };
}

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body as RegisterInput, getRequestContext(req));

  setAuthCookies(res, result.accessToken, result.refreshToken);

  return sendSuccess(res, HttpStatus.CREATED, {
    user: result.user
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body as LoginInput, getRequestContext(req));

  setAuthCookies(res, result.accessToken, result.refreshToken);

  return sendSuccess(res, HttpStatus.OK, {
    user: result.user
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!rawRefreshToken) {
    throw new AppError("Refresh token is required", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  const result = await refreshSession(rawRefreshToken, getRequestContext(req));

  setAuthCookies(res, result.accessToken, result.refreshToken);

  return sendSuccess(res, HttpStatus.OK, {
    user: result.user
  });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutSession(req.cookies?.[REFRESH_TOKEN_COOKIE]);
  clearAuthCookies(res);

  return sendSuccess(res, HttpStatus.OK, {
    loggedOut: true
  });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.auth) {
    throw new AppError("Authentication required", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  const user = await getCurrentUser(req.auth.userId);

  return sendSuccess(res, HttpStatus.OK, {
    user
  });
});
