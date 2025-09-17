import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracer } from "@/lib/telemetry";
import { z } from "zod";

const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().optional(),
  deadline: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  return tracer.startActiveSpan("api.goals.PUT", async (span) => {
    try {
      const resolvedParams = await params;
      span.setAttributes({
        "http.method": "PUT",
        "http.route": "/api/goals/[goalId]",
        "goal.id": resolvedParams.goalId,
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      const validatedData = updateGoalSchema.parse(body);

      const goal = await db.savingsGoal.update({
        where: {
          id: resolvedParams.goalId,
          userId: user.id,
        },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.targetAmount && {
            targetAmount: validatedData.targetAmount,
          }),
          ...(validatedData.deadline !== undefined && {
            deadline: validatedData.deadline
              ? new Date(validatedData.deadline)
              : null,
          }),
          ...(validatedData.isArchived !== undefined && {
            isArchived: validatedData.isArchived,
          }),
        },
        include: {
          contributions: {
            orderBy: { occurredAt: "desc" },
          },
        },
      });

      span.setAttributes({
        success: true,
      });
      span.end();

      return NextResponse.json(goal);
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

      console.error("Failed to update goal:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  return tracer.startActiveSpan("api.goals.DELETE", async (span) => {
    try {
      const resolvedParams = await params;
      span.setAttributes({
        "http.method": "DELETE",
        "http.route": "/api/goals/[goalId]",
        "goal.id": resolvedParams.goalId,
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      await db.savingsGoal.delete({
        where: {
          id: resolvedParams.goalId,
          userId: user.id,
        },
      });

      span.setAttributes({
        success: true,
      });
      span.end();

      return NextResponse.json({ message: "Goal deleted successfully" });
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        success: false,
        "error.message": (error as Error).message,
      });
      span.end();

      console.error("Failed to delete goal:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
