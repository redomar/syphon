import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracer } from "@/lib/telemetry";
import { z } from "zod";

const createContributionSchema = z.object({
  goalId: z.string().min(1, "Goal ID is required"),
  amount: z.number().positive("Amount must be positive"),
  occurredAt: z.string(),
  note: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return tracer.startActiveSpan("api.goals.contributions.POST", async (span) => {
    try {
      span.setAttributes({
        "http.method": "POST",
        "http.route": "/api/goals/contributions",
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      const validatedData = createContributionSchema.parse(body);

      span.setAttributes({
        "contribution.goal_id": validatedData.goalId,
        "contribution.amount": validatedData.amount,
        "contribution.has_note": !!validatedData.note,
      });

      // Verify the goal belongs to the user
      const goal = await db.savingsGoal.findFirst({
        where: {
          id: validatedData.goalId,
          userId: user.id,
        },
      });

      if (!goal) {
        return NextResponse.json({ error: "Goal not found" }, { status: 404 });
      }

      const contribution = await db.savingsGoalContribution.create({
        data: {
          userId: user.id,
          goalId: validatedData.goalId,
          amount: validatedData.amount,
          occurredAt: new Date(validatedData.occurredAt),
          note: validatedData.note || null,
        },
      });

      // Update the goal's current amount
      await db.savingsGoal.update({
        where: { id: validatedData.goalId },
        data: {
          currentAmount: {
            increment: validatedData.amount,
          },
        },
      });

      span.setAttributes({
        "contribution.id": contribution.id,
        success: true,
      });
      span.end();

      return NextResponse.json(contribution, { status: 201 });
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

      console.error("Failed to create contribution:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}