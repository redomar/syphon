import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { tracer } from "@/lib/telemetry";

export async function GET() {
  return tracer.startActiveSpan("api.me.GET", async (span) => {
    try {
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/me",
      });

      const user = await getCurrentUser();

      if (!user) {
        span.setAttributes({
          "http.status_code": 401,
          "auth.result": "unauthorized",
        });
        span.end();
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      span.setAttributes({
        "http.status_code": 200,
        "auth.result": "success",
        "user.id": user.id,
        "user.email": user.email || "unknown",
      });

      span.addEvent("user.data_retrieved");
      span.end();

      // Return user data (excluding sensitive fields if any)
      return NextResponse.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        currency: user.currency,
        timezone: user.timezone,
        createdAt: user.createdAt,
      });
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "http.status_code": 500,
        "error.message": (error as Error).message,
      });
      span.end();

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
