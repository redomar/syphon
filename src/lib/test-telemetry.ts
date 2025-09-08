import { trace } from "@opentelemetry/api";

// Test utility to generate sample traces
export function generateTestTrace() {
  const tracer = trace.getTracer("syphon-app", process.env.OTEL_SERVICE_VERSION || "0.2.0");
  
  const span = tracer.startSpan("test-trace", {
    attributes: {
      "test.type": "manual",
      "service.name": "syphon-app",
      "environment": process.env.NODE_ENV || "development"
    }
  });
  
  // Simulate some work
  span.addEvent("Processing test operation");
  span.setAttributes({
    "test.timestamp": Date.now(),
    "test.success": true
  });
  
  // End the span after a short delay
  setTimeout(() => {
    span.addEvent("Test operation completed");
    span.end();
    console.log("✅ Test trace sent to OpenTelemetry");
  }, 100);
}