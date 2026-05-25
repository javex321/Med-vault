import request from "supertest";
import { describe, expect, it } from "vitest";

import { ErrorCode } from "./errors/error-codes.js";
import { createApp } from "./app.js";

describe("MedVault API app", () => {
  it("exposes the root health endpoint with dependency status", async () => {
    const response = await request(createApp()).get("/health").expect(500);

    expect(response.headers["x-request-id"]).toBeDefined();
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      status: "degraded",
      service: "api",
      dependencies: {
        mongo: "disconnected",
        redis: "disconnected"
      }
    });
  });

  it("returns a consistent API error envelope for unknown routes", async () => {
    const response = await request(createApp())
      .get("/not-a-real-route")
      .set("x-request-id", "test-request-id")
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      requestId: "test-request-id",
      error: {
        code: ErrorCode.ROUTE_NOT_FOUND
      }
    });
  });

  it("exposes a liveness probe that does not depend on MongoDB or Redis", async () => {
    const response = await request(createApp()).get("/live").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: "alive",
        service: "api"
      }
    });
  });

  it("exposes readiness as unavailable when dependencies are disconnected", async () => {
    const response = await request(createApp()).get("/ready").expect(503);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: "not_ready",
        service: "api",
        dependencies: {
          mongo: "disconnected",
          redis: "disconnected"
        }
      }
    });
  });

  it("exports Prometheus-compatible metrics", async () => {
    await request(createApp()).get("/live").expect(200);

    const response = await request(createApp()).get("/metrics").expect(200);

    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.text).toContain("medvault_http_requests_total");
    expect(response.text).toContain("medvault_http_request_duration_seconds");
  });
});
