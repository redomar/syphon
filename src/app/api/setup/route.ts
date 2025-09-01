import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CategoryKind } from "../../../../generated/prisma";
import { tracer } from "@/lib/telemetry";

// Default categories and income sources to help users get started
const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", color: "#10b981" },
  { name: "Freelance", color: "#3b82f6" },
  { name: "Business", color: "#8b5cf6" },
  { name: "Investments", color: "#f59e0b" },
  { name: "Other", color: "#6b7280" },
];

const DEFAULT_INCOME_SOURCES = [
  "Primary Employer",
  "Side Hustle",
  "Investment Returns",
];

export async function POST() {
  return tracer.startActiveSpan("api.setup.POST", async (span) => {
    try {
      span.setAttributes({
        "http.method": "POST",
        "http.route": "/api/setup",
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

      // Check if user already has categories
      const existingCategories = await db.category.count({
        where: { userId: user.id },
      });

      const existingSources = await db.incomeSource.count({
        where: { userId: user.id },
      });

      const results = {
        categoriesCreated: 0,
        sourcesCreated: 0,
        skipped: false,
      };

      // Only create defaults if user has no existing data
      if (existingCategories === 0) {
        // Create default income categories
        for (const category of DEFAULT_INCOME_CATEGORIES) {
          await db.category.create({
            data: {
              userId: user.id,
              name: category.name,
              kind: CategoryKind.INCOME,
              color: category.color,
            },
          });
          results.categoriesCreated++;
        }

        // Create some expense categories too
        const EXPENSE_CATEGORIES = [
          { name: "Food & Dining", color: "#ef4444" },
          { name: "Transportation", color: "#f97316" },
          { name: "Shopping", color: "#ec4899" },
          { name: "Bills & Utilities", color: "#14b8a6" },
          { name: "Entertainment", color: "#a855f7" },
        ];

        for (const category of EXPENSE_CATEGORIES) {
          await db.category.create({
            data: {
              userId: user.id,
              name: category.name,
              kind: CategoryKind.EXPENSE,
              color: category.color,
            },
          });
          results.categoriesCreated++;
        }
      }

      if (existingSources === 0) {
        // Create default income sources
        for (const sourceName of DEFAULT_INCOME_SOURCES) {
          await db.incomeSource.create({
            data: {
              userId: user.id,
              name: sourceName,
            },
          });
          results.sourcesCreated++;
        }
      }

      if (existingCategories > 0 || existingSources > 0) {
        results.skipped = true;
      }

      span.setAttributes({
        "http.status_code": 200,
        "setup.categories_created": results.categoriesCreated,
        "setup.sources_created": results.sourcesCreated,
        "setup.skipped": results.skipped,
        "user.id": user.id,
      });

      span.end();
      return NextResponse.json(results);
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "http.status_code": 500,
        "error.message": (error as Error).message,
      });
      span.end();
      return NextResponse.json(
        { error: "Failed to setup default data" },
        { status: 500 }
      );
    }
  });
}
