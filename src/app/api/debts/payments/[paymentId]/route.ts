import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracer } from "@/lib/telemetry";
import { z } from "zod";

const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  occurredAt: z.string().optional(),
  principal: z.number().positive().optional(),
  interest: z.number().min(0).optional(),
  note: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  return tracer.startActiveSpan("api.debts.payments.get_one", async (span) => {
    try {
      const resolvedParams = await params;
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/debts/payments/[paymentId]",
        "payment.id": resolvedParams.paymentId,
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const payment = await db.debtPayment.findFirst({
        where: {
          id: resolvedParams.paymentId,
          userId: user.id,
        },
        include: {
          debt: true,
        },
      });

      if (!payment) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      }

      span.setAttributes({
        success: true,
        "payment.amount": Number(payment.amount),
      });
      span.end();

      return NextResponse.json(payment);
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        success: false,
        "error.message": (error as Error).message,
      });
      span.end();

      console.error("Failed to fetch payment:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  return tracer.startActiveSpan("api.debts.payments.PUT", async (span) => {
    try {
      const resolvedParams = await params;
      span.setAttributes({
        "http.method": "PUT",
        "http.route": "/api/debts/payments/[paymentId]",
        "payment.id": resolvedParams.paymentId,
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      const validatedData = updatePaymentSchema.parse(body);

      // Verify payment ownership
      const existingPayment = await db.debtPayment.findFirst({
        where: {
          id: resolvedParams.paymentId,
          userId: user.id,
        },
        include: {
          debt: true,
        },
      });

      if (!existingPayment) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      }

      const updatedPayment = await db.$transaction(async (tx) => {
        // If amount changed, adjust debt balance
        if (
          validatedData.amount &&
          validatedData.amount !== Number(existingPayment.amount)
        ) {
          const amountDifference =
            validatedData.amount - Number(existingPayment.amount);

          await tx.debt.update({
            where: { id: existingPayment.debtId },
            data: {
              balance: {
                decrement: amountDifference,
              },
            },
          });
        }

        return await tx.debtPayment.update({
          where: { id: resolvedParams.paymentId },
          data: {
            ...validatedData,
            occurredAt: validatedData.occurredAt
              ? new Date(validatedData.occurredAt)
              : undefined,
          },
          include: {
            debt: true,
          },
        });
      });

      span.setAttributes({
        success: true,
        "payment.updated_fields": Object.keys(validatedData).length,
      });
      span.end();

      return NextResponse.json(updatedPayment);
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

      console.error("Failed to update payment:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  return tracer.startActiveSpan("api.debts.payments.DELETE", async (span) => {
    try {
      const resolvedParams = await params;
      span.setAttributes({
        "http.method": "DELETE",
        "http.route": "/api/debts/payments/[paymentId]",
        "payment.id": resolvedParams.paymentId,
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verify payment ownership and get payment details
      const existingPayment = await db.debtPayment.findFirst({
        where: {
          id: resolvedParams.paymentId,
          userId: user.id,
        },
        include: {
          debt: true,
        },
      });

      if (!existingPayment) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      }

      await db.$transaction(async (tx) => {
        // Restore the debt balance (add back the payment amount)
        await tx.debt.update({
          where: { id: existingPayment.debtId },
          data: {
            balance: {
              increment: Number(existingPayment.amount),
            },
          },
        });

        // Delete the payment
        await tx.debtPayment.delete({
          where: { id: resolvedParams.paymentId },
        });
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

      console.error("Failed to delete payment:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
