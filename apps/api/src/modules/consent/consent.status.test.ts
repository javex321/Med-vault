import { describe, expect, it } from "vitest";

import { getConsentStatus } from "./consent.status.js";

describe("consent status", () => {
  const now = new Date("2026-05-18T10:00:00.000Z");

  it("marks future non-withdrawn consent as active", () => {
    expect(getConsentStatus({ expiresAt: new Date("2026-05-19T10:00:00.000Z") }, now)).toBe("active");
  });

  it("marks past consent as expired", () => {
    expect(getConsentStatus({ expiresAt: new Date("2026-05-17T10:00:00.000Z") }, now)).toBe("expired");
  });

  it("prioritizes withdrawn over expiration", () => {
    expect(
      getConsentStatus(
        {
          expiresAt: new Date("2026-05-17T10:00:00.000Z"),
          withdrawnAt: new Date("2026-05-18T09:00:00.000Z")
        },
        now
      )
    ).toBe("withdrawn");
  });
});
