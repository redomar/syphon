import { trace } from "@opentelemetry/api";

// Simple telemetry utilities for the application
export const tracer = trace.getTracer("syphon-app", process.env.OTEL_SERVICE_VERSION || process.env.VERSION || "0.2.0");

// Telemetry initialization will be handled separately in instrumentation.ts for Next.js
console.log("Telemetry tracer initialized for syphon-app");
