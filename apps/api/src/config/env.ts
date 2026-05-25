import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { z } from "zod";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(currentDir, "../../../../.env"),
  path.resolve(currentDir, "../../.env")
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().optional(),
  CLIENT_ORIGIN: z.string().url(),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(2_592_000),
  JWT_ISSUER: z.string().default("medvault-api"),
  JWT_AUDIENCE: z.string().default("medvault-web"),
  AUTH_COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  AUTH_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  STORAGE_PROVIDER: z.enum(["local", "s3", "cloudinary"]).default("local"),
  LOCAL_UPLOAD_DIR: z.string().default("uploads"),
  MAX_DOCUMENT_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  EMAIL_QUEUE_NAME: z.string().default("medvault-email")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid API environment variables", parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  API_PORT: parsedEnv.data.API_PORT ?? parsedEnv.data.PORT ?? 4000
};
export const isProduction = env.NODE_ENV === "production";