import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracer } from "@/lib/telemetry";

export async function DELETE() {
  return tracer.startActiveSpan("api.transactions.bulk-delete.DELETE", async (span) => {
    try {
      span.setAttributes({
        "http.method": "DELETE",
        "http.route": "/api/transactions/bulk-delete",
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

      // Get count before deletion for logging
      const transactionCount = await db.transaction.count({
        where: { userId: user.id },
      });

      // Delete all transactions for the user
      const result = await db.transaction.deleteMany({
        where: { userId: user.id },
      });

      span.setAttributes({
        "http.status_code": 200,
        "user.id": user.id,
        "transactions.deleted": result.count,
        "transactions.expected": transactionCount,
      });

      span.end();
      return NextResponse.json({
        success: true,
        deleted: result.count,
        message: `Successfully deleted ${result.count} transactions`,
      });
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "http.status_code": 500,
        "error.message": (error as Error).message,
      });
      span.end();
      return NextResponse.json(
        { error: "Failed to delete transactions" },
        { status: 500 }
      );
    }
  });
}