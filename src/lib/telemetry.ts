import { trace } from "@opentelemetry/api";

// Simple telemetry utilities for the application
export const tracer = trace.getTracer(
  "syphon-app",
  process.env.OTEL_SERVICE_VERSION || process.env.VERSION || "0.3.0"
);
