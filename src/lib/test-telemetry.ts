import { trace } from "@opentelemetry/api";

// Test utility to generate sample traces
export function generateTestTrace() {
  const serviceName = process.env.OTEL_SERVICE_NAME || "syphon-app";
  const serviceVersion =
    process.env.OTEL_SERVICE_VERSION || process.env.VERSION || "0.3.0";
  const tracer = trace.getTracer(serviceName, serviceVersion);

  const span = tracer.startSpan("health-check-test", {
    attributes: {
      "test.type": "health-check",
      "service.name": serviceName,
      "service.version": serviceVersion,
      "deployment.environment": process.env.NODE_ENV || "development",
      "test.source": "api-health-endpoint",
    },
  });

  // Simulate some work
  span.addEvent("Processing test operation");
  span.setAttributes({
    "test.timestamp": Date.now(),
    "test.success": true,
  });

  // End the span after a short delay
  setTimeout(() => {
    span.addEvent("Test operation completed");
    span.end();
    console.log("✅ Test trace sent to OpenTelemetry");
  }, 100);
}
