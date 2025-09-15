import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracer } from "@/lib/telemetry";
import { z } from "zod";

const createGoalSchema = z.object({
  name: z.string().min(1, "Goal name is required").max(100),
  targetAmount: z.number().positive("Target amount must be positive"),
  deadline: z.string().optional(),
});

export async function GET() {
  return tracer.startActiveSpan("api.goals.GET", async (span) => {
    try {
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/goals",
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const goals = await db.savingsGoal.findMany({
        where: {
          userId: user.id,
          isArchived: false,
        },
        include: {
          contributions: {
            orderBy: { occurredAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      span.setAttributes({
        "goals.count": goals.length,
        success: true,
      });
      span.end();

      return NextResponse.json(goals);
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        success: false,
        "error.message": (error as Error).message,
      });
      span.end();

      console.error("Failed to fetch goals:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return tracer.startActiveSpan("api.goals.POST", async (span) => {
    try {
      span.setAttributes({
        "http.method": "POST",
        "http.route": "/api/goals",
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      const validatedData = createGoalSchema.parse(body);

      span.setAttributes({
        "goal.name": validatedData.name,
        "goal.target_amount": validatedData.targetAmount,
        "goal.has_deadline": !!validatedData.deadline,
      });

      const goal = await db.savingsGoal.create({
        data: {
          userId: user.id,
          name: validatedData.name,
          targetAmount: validatedData.targetAmount,
          deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        },
        include: {
          contributions: true,
        },
      });

      span.setAttributes({
        "goal.id": goal.id,
        success: true,
      });
      span.end();

      return NextResponse.json(goal, { status: 201 });
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

      console.error("Failed to create goal:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}