import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { env } from "../../config/env.js";
import { getDocumentStorageAdapter } from "./document.storage.js";

const originalUploadDir = env.LOCAL_UPLOAD_DIR;
const originalStorageProvider = env.STORAGE_PROVIDER;
let tempUploadDir: string | undefined;

afterEach(async () => {
  env.LOCAL_UPLOAD_DIR = originalUploadDir;
  env.STORAGE_PROVIDER = originalStorageProvider;

  if (tempUploadDir) {
    await rm(tempUploadDir, { force: true, recursive: true });
    tempUploadDir = undefined;
  }
});

describe("document storage adapter", () => {
  it("stores local uploads with a stable storage key and SHA-256 checksum", async () => {
    tempUploadDir = await mkdtemp(path.join(tmpdir(), "medvault-documents-"));
    env.LOCAL_UPLOAD_DIR = tempUploadDir;
    env.STORAGE_PROVIDER = "local";

    const adapter = getDocumentStorageAdapter();
    const stored = await adapter.upload({
      buffer: Buffer.from("mock document content"),
      mimeType: "application/pdf",
      originalFileName: "blood report.pdf",
      ownerId: "owner-1",
      profileId: "profile-1"
    });

    expect(stored.storageProvider).toBe("local");
    expect(stored.storageKey).toContain("owner-1/profile-1/");
    expect(stored.storageKey).toContain("blood_report.pdf");
    expect(stored.checksumSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.storageUrl).toBeDefined();
    await expect(readFile(stored.storageUrl ?? "", "utf8")).resolves.toBe("mock document content");
  });

  it("fails fast when a non-local provider is selected without an adapter implementation", () => {
    env.STORAGE_PROVIDER = "s3";

    expect(() => getDocumentStorageAdapter()).toThrow("s3 storage adapter is not configured yet");
  });
});
