import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracer } from "@/lib/telemetry";

export async function GET() {
  return tracer.startActiveSpan("api.income-sources.GET", async (span) => {
    try {
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/income-sources",
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

      const incomeSources = await db.incomeSource.findMany({
        where: {
          userId: user.id,
          isArchived: false,
        },
        orderBy: {
          name: "asc",
        },
      });

      span.setAttributes({
        "http.status_code": 200,
        "income_sources.count": incomeSources.length,
        "user.id": user.id,
      });

      span.end();
      return NextResponse.json(incomeSources);
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "http.status_code": 500,
        "error.message": (error as Error).message,
      });
      span.end();
      return NextResponse.json(
        { error: "Failed to fetch income sources" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return tracer.startActiveSpan("api.income-sources.POST", async (span) => {
    try {
      span.setAttributes({
        "http.method": "POST",
        "http.route": "/api/income-sources",
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

      const body = await request.json();
      const { name } = body;

      if (!name) {
        span.setAttributes({
          "http.status_code": 400,
          "error.type": "validation",
        });
        span.end();
        return NextResponse.json(
          { error: "Name is required" },
          { status: 400 }
        );
      }

      const incomeSource = await db.incomeSource.create({
        data: {
          userId: user.id,
          name,
        },
      });

      span.setAttributes({
        "http.status_code": 201,
        "income_source.id": incomeSource.id,
        "income_source.name": incomeSource.name,
        "user.id": user.id,
      });

      span.end();
      return NextResponse.json(incomeSource, { status: 201 });
    } catch (error) {
      span.recordException(error as Error);

      // Check for Prisma unique constraint violation
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        span.setAttributes({
          "http.status_code": 409,
          "error.type": "conflict",
        });
        span.end();
        return NextResponse.json(
          { error: "Income source with this name already exists" },
          { status: 409 }
        );
      }

      span.setAttributes({
        "http.status_code": 500,
        "error.message": (error as Error).message,
      });
      span.end();
      return NextResponse.json(
        { error: "Failed to create income source" },
        { status: 500 }
      );
    }
  });
}
