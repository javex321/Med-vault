import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "../../config/env.js";

export type StoredObject = {
  storageProvider: "local" | "s3" | "cloudinary";
  storageKey: string;
  storageUrl?: string;
  checksumSha256: string;
};

type UploadObjectInput = {
  ownerId: string;
  profileId: string;
  originalFileName: string;
  mimeType: string;
  buffer: Buffer;
};

export interface DocumentStorageAdapter {
  upload(input: UploadObjectInput): Promise<StoredObject>;
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function checksum(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

class LocalDocumentStorageAdapter implements DocumentStorageAdapter {
  async upload(input: UploadObjectInput): Promise<StoredObject> {
    const safeName = sanitizeFileName(input.originalFileName);
    const objectName = `${Date.now()}-${randomUUID()}-${safeName}`;
    const storageKey = path.posix.join(input.ownerId, input.profileId, objectName);
    const absoluteDir = path.resolve(env.LOCAL_UPLOAD_DIR, input.ownerId, input.profileId);
    const absolutePath = path.join(absoluteDir, objectName);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absolutePath, input.buffer, { flag: "wx" });

    return {
      storageProvider: "local",
      storageKey,
      storageUrl: absolutePath,
      checksumSha256: checksum(input.buffer)
    };
  }
}

export function getDocumentStorageAdapter(): DocumentStorageAdapter {
  if (env.STORAGE_PROVIDER !== "local") {
    throw new Error(`${env.STORAGE_PROVIDER} storage adapter is not configured yet`);
  }

  return new LocalDocumentStorageAdapter();
}
