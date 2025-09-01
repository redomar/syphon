import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CategoryKind } from "../../../../generated/prisma";
import { tracer } from "@/lib/telemetry";

export async function GET() {
  return tracer.startActiveSpan("api.categories.GET", async (span) => {
    try {
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/categories",
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

      const categories = await db.category.findMany({
        where: {
          userId: user.id,
          isArchived: false,
        },
        orderBy: [{ kind: "asc" }, { name: "asc" }],
      });

      span.setAttributes({
        "http.status_code": 200,
        "categories.count": categories.length,
        "user.id": user.id,
      });

      span.end();
      return NextResponse.json(categories);
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "http.status_code": 500,
        "error.message": (error as Error).message,
      });
      span.end();
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return tracer.startActiveSpan("api.categories.POST", async (span) => {
    try {
      span.setAttributes({
        "http.method": "POST",
        "http.route": "/api/categories",
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
      const { name, kind, color, icon } = body;

      if (!name || !kind) {
        span.setAttributes({
          "http.status_code": 400,
          "error.type": "validation",
        });
        span.end();
        return NextResponse.json(
          { error: "Name and kind are required" },
          { status: 400 }
        );
      }

      if (!Object.values(CategoryKind).includes(kind)) {
        span.setAttributes({
          "http.status_code": 400,
          "error.type": "validation",
          "validation.field": "kind",
        });
        span.end();
        return NextResponse.json(
          { error: "Invalid category kind" },
          { status: 400 }
        );
      }

      const category = await db.category.create({
        data: {
          userId: user.id,
          name,
          kind,
          color,
          icon,
        },
      });

      span.setAttributes({
        "http.status_code": 201,
        "category.id": category.id,
        "category.name": category.name,
        "category.kind": category.kind,
        "user.id": user.id,
      });

      span.end();
      return NextResponse.json(category, { status: 201 });
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
          { error: "Category with this name already exists" },
          { status: 409 }
        );
      }

      span.setAttributes({
        "http.status_code": 500,
        "error.message": (error as Error).message,
      });
      span.end();
      return NextResponse.json(
        { error: "Failed to create category" },
        { status: 500 }
      );
    }
  });
}
