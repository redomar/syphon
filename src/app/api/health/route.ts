import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
          // Attempt to ping the OpenTelemetry endpoint
          const telemetryUrl = telemetryEndpoint.replace("/v1/traces", "");
          const healthUrl = `${telemetryUrl}/v1/traces`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

          const response = await fetch(healthUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              resourceSpans: [],
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // OpenTelemetry collector typically returns 200 for valid requests
          // or 4xx for malformed requests, both indicate the service is up
          if (response.status < 500) {
            checks.checks.telemetry = "healthy";
          } else {
            checks.checks.telemetry = "unhealthy";
            checks.status = "degraded";
          }
        } catch (error) {
          console.error("OpenTelemetry heartbeat failed:", error);
          if (error instanceof Error && error.name === "AbortError") {
            checks.checks.telemetry = "timeout";
          } else {
            checks.checks.telemetry = "unreachable";
          }
          checks.status = "degraded";
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
