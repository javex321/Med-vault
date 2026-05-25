import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

import { env } from "../../config/env.js";
import type { UserDocument } from "./user.model.js";

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  refreshTokenJwtId: string;
  refreshTokenFamilyId: string;
  refreshTokenExpiresAt: Date;
};

type RefreshTokenPayload = {
  sub: string;
  jti: string;
  familyId: string;
};

const accessSecret = new TextEncoder().encode(env.ACCESS_TOKEN_SECRET);
const refreshSecret = new TextEncoder().encode(env.REFRESH_TOKEN_SECRET);

function secondsFromNow(seconds: number) {
  return Math.floor(Date.now() / 1000) + seconds;
}

function expiryDateFromNow(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAccessToken(user: UserDocument) {
  return new SignJWT({
    role: user.role,
    status: user.status
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setSubject(user._id.toString())
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(secondsFromNow(env.ACCESS_TOKEN_TTL_SECONDS))
    .sign(accessSecret);
}

export async function createRefreshToken(userId: string, familyId: string = randomUUID()) {
  const jwtId = randomUUID();
  const expiresAt = expiryDateFromNow(env.REFRESH_TOKEN_TTL_SECONDS);

  const refreshToken = await new SignJWT({
    familyId
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setSubject(userId)
    .setJti(jwtId)
    .setIssuedAt()
    .setExpirationTime(secondsFromNow(env.REFRESH_TOKEN_TTL_SECONDS))
    .sign(refreshSecret);

  return {
    refreshToken,
    refreshTokenJwtId: jwtId,
    refreshTokenFamilyId: familyId,
    refreshTokenExpiresAt: expiresAt
  };
}

export async function createTokenPair(user: UserDocument, familyId?: string): Promise<TokenPair> {
  const accessToken = await createAccessToken(user);
  const refreshTokenResult = await createRefreshToken(user._id.toString(), familyId);

  return {
    accessToken,
    ...refreshTokenResult
  };
}

export async function verifyAccessToken(token: string) {
  const result = await jwtVerify(token, accessSecret, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });

  return result.payload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const result = await jwtVerify(token, refreshSecret, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });

  if (!result.payload.sub || !result.payload.jti || typeof result.payload.familyId !== "string") {
    throw new Error("Invalid refresh token payload");
  }

  return {
    sub: result.payload.sub,
    jti: result.payload.jti,
    familyId: result.payload.familyId
  };
}
