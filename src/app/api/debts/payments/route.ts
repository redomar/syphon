import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracer } from "@/lib/telemetry";
import { z } from "zod";

const createPaymentSchema = z.object({
  debtId: z.string().min(1, "Debt ID is required"),
  amount: z.number().positive("Payment amount must be positive"),
  occurredAt: z.string().min(1, "Payment date is required"),
  principal: z.number().positive().optional(),
  interest: z.number().min(0).optional(),
  note: z.string().optional(),
});

export async function GET() {
  return tracer.startActiveSpan("api.debts.payments.GET", async (span) => {
    try {
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/debts/payments",
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const payments = await db.debtPayment.findMany({
        where: {
          userId: user.id,
        },
        include: {
          debt: true,
        },
        orderBy: { occurredAt: "desc" },
      });

      span.setAttributes({
        "payments.count": payments.length,
        success: true,
      });
      span.end();

      return NextResponse.json(payments);
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        success: false,
        "error.message": (error as Error).message,
      });
      span.end();

      console.error("Failed to fetch debt payments:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return tracer.startActiveSpan("api.debts.payments.POST", async (span) => {
    try {
      span.setAttributes({
        "http.method": "POST",
        "http.route": "/api/debts/payments",
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      const validatedData = createPaymentSchema.parse(body);

      span.setAttributes({
        "debt.id": validatedData.debtId,
        "payment.amount": validatedData.amount,
        "payment.has_principal": !!validatedData.principal,
        "payment.has_interest": !!validatedData.interest,
      });

      // Verify debt ownership
      const debt = await db.debt.findFirst({
        where: {
          id: validatedData.debtId,
          userId: user.id,
        },
      });

      if (!debt) {
        return NextResponse.json(
          { error: "Debt not found" },
          { status: 404 }
        );
      }

      // Create payment and update debt balance
      const payment = await db.$transaction(async (tx) => {
        const newPayment = await tx.debtPayment.create({
          data: {
            userId: user.id,
            debtId: validatedData.debtId,
            amount: validatedData.amount,
            occurredAt: new Date(validatedData.occurredAt),
            principal: validatedData.principal,
            interest: validatedData.interest,
            note: validatedData.note,
          },
          include: {
            debt: true,
          },
        });

        // Update debt balance (subtract the payment amount)
        await tx.debt.update({
          where: { id: validatedData.debtId },
          data: {
            balance: {
              decrement: validatedData.amount,
            },
          },
        });

        return newPayment;
      });

      span.setAttributes({
        "payment.id": payment.id,
        success: true,
      });
      span.end();

      return NextResponse.json(payment, { status: 201 });
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

      console.error("Failed to create debt payment:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}