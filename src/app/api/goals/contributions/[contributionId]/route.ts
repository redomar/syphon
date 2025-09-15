import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracer } from "@/lib/telemetry";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contributionId: string }> }
) {
  return tracer.startActiveSpan("api.goals.contributions.DELETE", async (span) => {
    try {
      const resolvedParams = await params;
      span.setAttributes({
        "http.method": "DELETE",
        "http.route": "/api/goals/contributions/[contributionId]",
        "contribution.id": resolvedParams.contributionId,
      });

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get the contribution to know the amount to subtract
      const contribution = await db.savingsGoalContribution.findFirst({
        where: {
          id: resolvedParams.contributionId,
          userId: user.id,
        },
        include: {
          goal: true,
        },
      });

      if (!contribution) {
        return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
      }

      // Delete the contribution and update the goal's current amount
      await db.$transaction([
        db.savingsGoalContribution.delete({
          where: { id: resolvedParams.contributionId },
        }),
        db.savingsGoal.update({
          where: { id: contribution.goalId },
          data: {
            currentAmount: {
              decrement: contribution.amount,
            },
          },
        }),
      ]);

      span.setAttributes({
        success: true,
        "contribution.amount": Number(contribution.amount),
      });
      span.end();

      return NextResponse.json({ message: "Contribution deleted successfully" });
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        success: false,
        "error.message": (error as Error).message,
      });
      span.end();

      console.error("Failed to delete contribution:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}