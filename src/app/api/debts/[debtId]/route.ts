import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracer } from "@/lib/telemetry";
import { z } from "zod";
import { DebtType } from "../../../../../generated/prisma";

const updateDebtSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.nativeEnum(DebtType).optional(),
  balance: z.number().positive().optional(),
  apr: z.number().min(0).max(100).optional(),
  minPayment: z.number().positive().optional(),
  lender: z.string().optional(),
  dueDayOfMonth: z.number().min(1).max(31).optional(),
  isClosed: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ debtId: string }> }
) {
  return tracer.startActiveSpan("api.debts.get_one", async (span) => {
    try {
      const resolvedParams = await params;
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/debts/[debtId]",
        "debt.id": resolvedParams.debtId,
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const debt = await db.debt.findFirst({
        where: {
          id: resolvedParams.debtId,
          userId: user.id,
        },
        include: {
          payments: {
            orderBy: { occurredAt: "desc" },
          },
        },
      });

      if (!debt) {
        return NextResponse.json({ error: "Debt not found" }, { status: 404 });
      }

      span.setAttributes({
        success: true,
        "debt.balance": Number(debt.balance),
        "payments.count": debt.payments.length,
      });
      span.end();

      return NextResponse.json(debt);
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        success: false,
        "error.message": (error as Error).message,
      });
      span.end();

      console.error("Failed to fetch debt:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ debtId: string }> }
) {
  return tracer.startActiveSpan("api.debts.PUT", async (span) => {
    try {
      const resolvedParams = await params;
      span.setAttributes({
        "http.method": "PUT",
        "http.route": "/api/debts/[debtId]",
        "debt.id": resolvedParams.debtId,
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      const validatedData = updateDebtSchema.parse(body);

      // Verify debt ownership
      const existingDebt = await db.debt.findFirst({
        where: {
          id: resolvedParams.debtId,
          userId: user.id,
        },
      });

      if (!existingDebt) {
        return NextResponse.json({ error: "Debt not found" }, { status: 404 });
      }

      const updatedDebt = await db.debt.update({
        where: { id: resolvedParams.debtId },
        data: validatedData,
        include: {
          payments: {
            orderBy: { occurredAt: "desc" },
          },
        },
      });

      span.setAttributes({
        success: true,
        "debt.updated_fields": Object.keys(validatedData).length,
      });
      span.end();

      return NextResponse.json(updatedDebt);
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

      console.error("Failed to update debt:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ debtId: string }> }
) {
  return tracer.startActiveSpan("api.debts.DELETE", async (span) => {
    try {
      const resolvedParams = await params;
      span.setAttributes({
        "http.method": "DELETE",
        "http.route": "/api/debts/[debtId]",
        "debt.id": resolvedParams.debtId,
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verify debt ownership
      const existingDebt = await db.debt.findFirst({
        where: {
          id: resolvedParams.debtId,
          userId: user.id,
        },
      });

      if (!existingDebt) {
        return NextResponse.json({ error: "Debt not found" }, { status: 404 });
      }

      await db.debt.delete({
        where: { id: resolvedParams.debtId },
      });

      span.setAttributes({
        success: true,
      });
      span.end();

      return NextResponse.json({ success: true });
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        success: false,
        "error.message": (error as Error).message,
      });
      span.end();

      console.error("Failed to delete debt:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
