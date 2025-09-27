import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracer } from "@/lib/telemetry";

export async function DELETE() {
  return tracer.startActiveSpan("api.accounts.bulk-delete.DELETE", async (span) => {
    try {
      span.setAttributes({
        "http.method": "DELETE",
        "http.route": "/api/accounts/bulk-delete",
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
      const accountCount = await db.account.count({
        where: { userId: user.id },
      });

      // Delete all accounts for the user
      const result = await db.account.deleteMany({
        where: { userId: user.id },
      });

      span.setAttributes({
        "http.status_code": 200,
        "user.id": user.id,
        "accounts.deleted": result.count,
        "accounts.expected": accountCount,
      });

      span.end();
      return NextResponse.json({
        success: true,
        deleted: result.count,
        message: `Successfully deleted ${result.count} accounts`,
      });
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "http.status_code": 500,
        "error.message": (error as Error).message,
      });
      span.end();
      return NextResponse.json(
        { error: "Failed to delete accounts" },
        { status: 500 }
      );
    }
  });
}