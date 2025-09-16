import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracer } from "@/lib/telemetry";
import { z } from "zod";
import { DebtType } from "../../../../generated/prisma";

const createDebtSchema = z.object({
  name: z.string().min(1, "Debt name is required").max(100),
  type: z.nativeEnum(DebtType).default(DebtType.OTHER),
  balance: z.number().positive("Balance must be positive"),
  apr: z.number().min(0).max(100).optional(),
  minPayment: z.number().positive("Minimum payment must be positive"),
  lender: z.string().optional(),
  dueDayOfMonth: z.number().min(1).max(31).optional(),
});

export async function GET() {
  return tracer.startActiveSpan("api.debts.GET", async (span) => {
    try {
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/debts",
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const debts = await db.debt.findMany({
        where: {
          userId: user.id,
          isClosed: false,
        },
        include: {
          payments: {
            orderBy: { occurredAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      span.setAttributes({
        "debts.count": debts.length,
        success: true,
      });
      span.end();

      return NextResponse.json(debts);
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        success: false,
        "error.message": (error as Error).message,
      });
      span.end();

      console.error("Failed to fetch debts:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return tracer.startActiveSpan("api.debts.POST", async (span) => {
    try {
      span.setAttributes({
        "http.method": "POST",
        "http.route": "/api/debts",
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      const validatedData = createDebtSchema.parse(body);

      span.setAttributes({
        "debt.name": validatedData.name,
        "debt.type": validatedData.type,
        "debt.balance": validatedData.balance,
        "debt.has_apr": !!validatedData.apr,
        "debt.has_lender": !!validatedData.lender,
      });

      const debt = await db.debt.create({
        data: {
          userId: user.id,
          name: validatedData.name,
          type: validatedData.type,
          balance: validatedData.balance,
          apr: validatedData.apr,
          minPayment: validatedData.minPayment,
          lender: validatedData.lender,
          dueDayOfMonth: validatedData.dueDayOfMonth,
        },
        include: {
          payments: true,
        },
      });

      span.setAttributes({
        "debt.id": debt.id,
        success: true,
      });
      span.end();

      return NextResponse.json(debt, { status: 201 });
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        success: false,
        "error.message": (error as Error).message,
      });
      span.end();

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.issues },
          { status: 400 }
        );
      }

      console.error("Failed to create debt:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}