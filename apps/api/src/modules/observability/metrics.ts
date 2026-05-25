import client from "prom-client";

export const metricsRegistry = new client.Registry();

metricsRegistry.setDefaultLabels({
  app: "medvault",
  service: "api"
});

client.collectDefaultMetrics({
  prefix: "medvault_",
  register: metricsRegistry
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "medvault_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry]
});

export const httpRequestsTotal = new client.Counter({
  name: "medvault_http_requests_total",
  help: "Total HTTP requests processed by the API",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [metricsRegistry]
});

export function normalizeMetricsRoute(originalUrl: string) {
  const path = originalUrl.split("?")[0] || "/";

  return path
    .replace(/\/[a-f\d]{24}(?=\/|$)/gi, "/:id")
    .replace(/\/\d+(?=\/|$)/g, "/:number");
}
