import { describe, expect, it } from "vitest";

import { APP_NAME, type ApiHealthStatus, type ApiReadinessStatus } from "./index.js";

describe("shared package exports", () => {
  it("exports the MedVault app name", () => {
    expect(APP_NAME).toBe("MedVault");
  });

  it("supports the API health response contract", () => {
    const health: ApiHealthStatus = {
      status: "ok",
      service: "api",
      timestamp: "2026-05-18T00:00:00.000Z",
      uptime: 12,
      dependencies: {
        mongo: "connected",
        redis: "connected"
      }
    };

    expect(health.dependencies.redis).toBe("connected");
  });

  it("supports the API readiness response contract", () => {
    const readiness: ApiReadinessStatus = {
      status: "not_ready",
      service: "api",
      timestamp: "2026-05-18T00:00:00.000Z",
      uptime: 12,
      dependencies: {
        mongo: "connected",
        redis: "disconnected"
      }
    };

    expect(readiness.status).toBe("not_ready");
  });
});
