import type { Response } from "express";

import { env, isProduction } from "../../config/env.js";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./auth.constants.js";

const secureCookie = isProduction || env.AUTH_COOKIE_SECURE;
const sameSiteCookie = env.AUTH_COOKIE_SAME_SITE;

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: sameSiteCookie,
    maxAge: env.ACCESS_TOKEN_TTL_SECONDS * 1000,
    path: "/"
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: sameSiteCookie,
    maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000,
    path: "/api/v1/auth"
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: sameSiteCookie,
    path: "/"
  });

  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: sameSiteCookie,
    path: "/api/v1/auth"
  });
}