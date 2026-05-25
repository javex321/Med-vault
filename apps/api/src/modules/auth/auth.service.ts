import type { AuthSessionResponse, AuthUser, UserRole } from "@medvault/shared";

import { HttpStatus } from "../../constants/http-status.js";
import { AppError } from "../../errors/app-error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import { RefreshTokenModel } from "./refresh-token.model.js";
import { createTokenPair, hashToken, verifyRefreshToken } from "./token.service.js";
import { UserModel, type UserDocument } from "./user.model.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

type RequestContext = {
  ip?: string;
  userAgent?: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthResult = AuthSessionResponse & AuthTokens;

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function toAuthUser(user: UserDocument): AuthUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    status: user.status
  };
}

function invalidCredentialsError() {
  return new AppError("Invalid email or password", {
    statusCode: HttpStatus.UNAUTHORIZED,
    code: ErrorCode.UNAUTHENTICATED
  });
}

async function createSession(user: UserDocument, context: RequestContext, familyId?: string) {
  const tokenPair = await createTokenPair(user, familyId);
  const refreshToken = await RefreshTokenModel.create({
    userId: user._id,
    tokenHash: hashToken(tokenPair.refreshToken),
    jwtId: tokenPair.refreshTokenJwtId,
    familyId: tokenPair.refreshTokenFamilyId,
    expiresAt: tokenPair.refreshTokenExpiresAt,
    createdByIp: context.ip,
    createdByUserAgent: context.userAgent
  });

  return {
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    refreshTokenRecord: refreshToken
  };
}

async function revokeTokenFamily(familyId: string) {
  await RefreshTokenModel.updateMany(
    {
      familyId,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date()
      }
    }
  );
}

export async function registerUser(input: RegisterInput, context: RequestContext): Promise<AuthResult> {
  const existingUser = await UserModel.exists({ email: input.email });

  if (existingUser) {
    throw new AppError("An account with this email already exists", {
      statusCode: HttpStatus.CONFLICT,
      code: ErrorCode.CONFLICT
    });
  }

  const passwordHash = await hashPassword(input.password);
  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash
  });

  const session = await createSession(user as UserDocument, context);

  return {
    user: toAuthUser(user as UserDocument),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken
  };
}

export async function loginUser(input: LoginInput, context: RequestContext): Promise<AuthResult> {
  const user = (await UserModel.findOne({ email: input.email }).select("+passwordHash")) as
    | (UserDocument & { passwordHash: string; save: () => Promise<unknown> })
    | null;

  if (!user) {
    throw invalidCredentialsError();
  }

  if (user.status === "disabled") {
    throw new AppError("Account is disabled", {
      statusCode: HttpStatus.FORBIDDEN,
      code: ErrorCode.FORBIDDEN
    });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError("Account is temporarily locked", {
      statusCode: HttpStatus.FORBIDDEN,
      code: ErrorCode.FORBIDDEN
    });
  }

  const passwordMatches = await verifyPassword(user.passwordHash, input.password);

  if (!passwordMatches) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      user.status = "locked";
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }

    await user.save();
    throw invalidCredentialsError();
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.status = "active";
  user.lastLoginAt = new Date();
  await user.save();

  const session = await createSession(user, context);

  return {
    user: toAuthUser(user),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken
  };
}

export async function refreshSession(rawRefreshToken: string, context: RequestContext): Promise<AuthResult> {
  let payload: Awaited<ReturnType<typeof verifyRefreshToken>>;

  try {
    payload = await verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AppError("Invalid refresh token", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  const storedToken = await RefreshTokenModel.findOne({ jwtId: payload.jti });

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date() ||
    storedToken.tokenHash !== hashToken(rawRefreshToken)
  ) {
    await revokeTokenFamily(payload.familyId);
    throw new AppError("Refresh token has expired or was reused", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  const user = (await UserModel.findById(payload.sub)) as UserDocument | null;

  if (!user || user.status !== "active") {
    await revokeTokenFamily(payload.familyId);
    throw new AppError("Session is no longer valid", {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHENTICATED
    });
  }

  const session = await createSession(user, context, payload.familyId);

  storedToken.revokedAt = new Date();
  storedToken.lastUsedAt = new Date();
  storedToken.replacedByTokenId = session.refreshTokenRecord._id;
  await storedToken.save();

  return {
    user: toAuthUser(user),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken
  };
}

export async function logoutSession(rawRefreshToken?: string) {
  if (!rawRefreshToken) return;

  try {
    const payload = await verifyRefreshToken(rawRefreshToken);

    await RefreshTokenModel.updateOne(
      {
        jwtId: payload.jti,
        tokenHash: hashToken(rawRefreshToken),
        revokedAt: null
      },
      {
        $set: {
          revokedAt: new Date()
        }
      }
    );
  } catch {
    return;
  }
}

export async function getCurrentUser(userId: string) {
  const user = (await UserModel.findById(userId)) as UserDocument | null;

  if (!user) {
    throw new AppError("User not found", {
      statusCode: HttpStatus.NOT_FOUND,
      code: ErrorCode.RESOURCE_NOT_FOUND
    });
  }

  return toAuthUser(user);
}
