import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountType } from "../../../../generated/prisma";
import { tracer } from "@/lib/telemetry";

export async function GET() {
  return tracer.startActiveSpan("api.accounts.GET", async (span) => {
    try {
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/accounts",
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

      const accounts = await db.account.findMany({
        where: {
          userId: user.id,
          isArchived: false,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      span.setAttributes({
        "http.status_code": 200,
        "accounts.count": accounts.length,
        success: true,
      });
      span.end();

      return NextResponse.json(accounts);
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "http.status_code": 500,
        error: true,
        "error.message": (error as Error).message,
      });
      span.end();

      console.error("Failed to fetch accounts:", error);
      return NextResponse.json(
        { error: "Failed to fetch accounts" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return tracer.startActiveSpan("api.accounts.POST", async (span) => {
    try {
      span.setAttributes({
        "http.method": "POST",
        "http.route": "/api/accounts",
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

      const { name, type, provider, lastFourDigits } = await request.json();

      // Validate required fields
      if (!name || !type) {
        span.setAttributes({
          "http.status_code": 400,
          "validation.failed": true,
        });
        span.end();
        return NextResponse.json(
          { error: "Name and type are required" },
          { status: 400 }
        );
      }

      // Validate account type
      if (!Object.values(AccountType).includes(type)) {
        span.setAttributes({
          "http.status_code": 400,
          "validation.failed": true,
          "validation.invalid_type": type,
        });
        span.end();
        return NextResponse.json(
          { error: "Invalid account type" },
          { status: 400 }
        );
      }

      // Check if account with same name already exists for this user
      const existingAccount = await db.account.findFirst({
        where: {
          userId: user.id,
          name,
          isArchived: false,
        },
      });

      if (existingAccount) {
        span.setAttributes({
          "http.status_code": 400,
          "validation.failed": true,
          "validation.duplicate_name": true,
        });
        span.end();
        return NextResponse.json(
          { error: "Account with this name already exists" },
          { status: 400 }
        );
      }

      const account = await db.account.create({
        data: {
          userId: user.id,
          name,
          type,
          provider: provider || undefined,
          lastFourDigits: lastFourDigits || undefined,
        },
      });

      span.setAttributes({
        "http.status_code": 201,
        "account.id": account.id,
        "account.name": account.name,
        "account.type": account.type,
        success: true,
      });
      span.end();

      return NextResponse.json(account, { status: 201 });
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "http.status_code": 500,
        error: true,
        "error.message": (error as Error).message,
      });
      span.end();

      console.error("Failed to create account:", error);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }
  });
}
