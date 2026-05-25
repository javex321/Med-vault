import { describe, expect, it } from "vitest";

import { createShareToken, hashShareToken } from "./share-link.token.js";

describe("share link tokens", () => {
  it("creates high-entropy URL-safe tokens", () => {
    const firstToken = createShareToken();
    const secondToken = createShareToken();

    expect(firstToken).not.toBe(secondToken);
    expect(firstToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(firstToken.length).toBeGreaterThanOrEqual(40);
  });

  it("hashes tokens without keeping plaintext values", () => {
    const token = "share-token-example";
    const hash = hashShareToken(token);

    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashShareToken(token)).toBe(hash);
  });
});
