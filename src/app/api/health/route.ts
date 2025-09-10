import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTestTrace } from "@/lib/test-telemetry";

// Health check endpoint for deployment monitoring
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    environment: process.env.NODE_ENV || "development",
    version: process.env.VERSION || process.env.npm_package_version || "0.2.0",
    branch: process.env.BRANCH || "dev",
    service: "syphon-app",
    checks: {
      database: "unknown",
      telemetry: "unknown",
    },
  };

  // Generate a test trace to verify telemetry is working
  try {
    generateTestTrace();
  } catch (error) {
    console.error("Failed to generate test trace:", error);
  }

  try {
    // Check database connectivity
    try {
      await db.$connect();
      checks.checks.database = "healthy";
    } catch (dbError) {
      console.error("Database health check failed:", dbError);
      checks.checks.database = "unhealthy";
      checks.status = "degraded";
    }

    // Check OpenTelemetry status with actual heartbeat
    const telemetryEnabled = process.env.OTEL_SDK_DISABLED !== "true";
    const telemetryEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    if (telemetryEnabled) {
      if (telemetryEndpoint) {
        try {
          // Better telemetry endpoint health check for Jaeger
          let healthUrl: string;
          
          if (telemetryEndpoint.includes("/v1/traces")) {
            // Remove /v1/traces suffix to get base URL, then add health endpoint
            healthUrl = telemetryEndpoint.replace("/v1/traces", "/v1/health");
          } else {
            // Assume base URL, add health endpoint
            healthUrl = `${telemetryEndpoint}/v1/health`;
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          // Try health endpoint first (better for Jaeger)
          let response;
          try {
            response = await fetch(healthUrl, {
              method: "GET",
              signal: controller.signal,
            });
          } catch {
            // Fallback: try a lightweight Jaeger traces endpoint test
            const tracesUrl = telemetryEndpoint.includes("/v1/traces") 
              ? telemetryEndpoint 
              : `${telemetryEndpoint}/v1/traces`;
              
            response = await fetch(tracesUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                resourceSpans: [],
              }),
              signal: controller.signal,
            });
          }

          clearTimeout(timeoutId);

          // Check if telemetry service is responding
          if (response.status < 500) {
            checks.checks.telemetry = "healthy";
          } else {
            checks.checks.telemetry = "unhealthy";
            checks.status = "degraded";
          }
        } catch (error) {
          console.error("OpenTelemetry connectivity check failed:", error);
          if (error instanceof Error && error.name === "AbortError") {
            checks.checks.telemetry = "timeout";
          } else {
            checks.checks.telemetry = "unreachable";
          }
          // Don't mark as degraded for telemetry issues in production
          // App can still function without telemetry
          if (process.env.NODE_ENV !== "production") {
            checks.status = "degraded";
          }
        }
      } else {
        checks.checks.telemetry = "console-only";
      }
    } else {
      checks.checks.telemetry = "disabled";
    }
  } catch (error) {
    console.error("Health check error:", error);
    checks.status = "unhealthy";
    checks.checks.database = "error";
  }

  // Return appropriate HTTP status
  let statusCode: number;
  if (checks.status === "healthy" || checks.status === "degraded") {
    statusCode = 200;
  } else {
    statusCode = 503;
  }

  return NextResponse.json(checks, { status: statusCode });
}

// Simple readiness check (for load balancers)
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
