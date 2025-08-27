import { trace } from "@opentelemetry/api";

// Simple telemetry utilities for the application
export const tracer = trace.getTracer("syphon-app", "0.1.0");

// Telemetry initialization will be handled separately in instrumentation.ts for Next.js
console.log("Telemetry tracer initialized for syphon-app");
