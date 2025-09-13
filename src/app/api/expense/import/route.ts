import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  TransactionType,
  CategoryKind,
  AccountType,
} from "../../../../../generated/prisma";
import { tracer } from "@/lib/telemetry";
import { Decimal } from "@prisma/client/runtime/library";

interface CSVImportRequest {
  csvData: string;
  dateColumn: string;
  amountColumn: string;
  categoryColumn: string;
  merchantColumn?: string;
  descriptionColumn?: string;
  accountColumn?: string;
}

export async function POST(request: NextRequest) {
  return tracer.startActiveSpan("api.expenses.import.POST", async (span) => {
    try {
      span.setAttributes({
        "http.method": "POST",
        "http.route": "/api/expense/import",
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

      const {
        csvData,
        dateColumn,
        amountColumn,
        categoryColumn,
        merchantColumn,
        descriptionColumn,
        accountColumn,
      }: CSVImportRequest = await request.json();

      // Parse CSV data
      const lines = csvData.trim().split("\n");
      if (lines.length < 2) {
        return NextResponse.json(
          { error: "CSV must have at least a header and one data row" },
          { status: 400 }
        );
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const dateColumnIndex = headers.indexOf(dateColumn);
      const amountColumnIndex = headers.indexOf(amountColumn);
      const categoryColumnIndex = headers.indexOf(categoryColumn);
      const merchantColumnIndex = merchantColumn
        ? headers.indexOf(merchantColumn)
        : -1;
      const descriptionColumnIndex = descriptionColumn
        ? headers.indexOf(descriptionColumn)
        : -1;
      const accountColumnIndex = accountColumn
        ? headers.indexOf(accountColumn)
        : -1;

      if (
        dateColumnIndex === -1 ||
        amountColumnIndex === -1 ||
        categoryColumnIndex === -1
      ) {
        return NextResponse.json(
          {
            error: "Required columns not found in CSV",
            missing: {
              date: dateColumnIndex === -1,
              amount: amountColumnIndex === -1,
              category: categoryColumnIndex === -1,
            },
          },
          { status: 400 }
        );
      }

      const dataLines = lines.slice(1);
      const transactions = [];
      const categoriesMap = new Map<string, string>();
      const accountsMap = new Map<string, string>();
      const skippedRows: string[] = [];

      // Get current date for filtering (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      span.setAttributes({
        "csv.total_rows": dataLines.length,
        "csv.headers_count": headers.length,
      });

      for (let i = 0; i < dataLines.length; i++) {
        const row = dataLines[i];
        const columns = row.split(",").map((c) => c.trim());

        if (columns.length !== headers.length) {
          skippedRows.push(`Row ${i + 2}: Column count mismatch`);
          continue;
        }

        try {
          // Parse date
          const dateStr = columns[dateColumnIndex];
          const transactionDate = new Date(dateStr);

          if (isNaN(transactionDate.getTime())) {
            skippedRows.push(`Row ${i + 2}: Invalid date format: ${dateStr}`);
            continue;
          }

          // Only import transactions from the last 90 days
          if (transactionDate < ninetyDaysAgo) {
            continue;
          }

          // Parse amount (handle negative values and currency symbols)
          const amountStr = columns[amountColumnIndex].replace(/[£$€,]/g, "");
          const amount = parseFloat(amountStr);

          if (isNaN(amount)) {
            skippedRows.push(
              `Row ${i + 2}: Invalid amount: ${columns[amountColumnIndex]}`
            );
            continue;
          }

          // Make sure it's treated as an expense (positive amount)
          const expenseAmount = Math.abs(amount);

          const categoryName = columns[categoryColumnIndex];
          const merchant =
            merchantColumnIndex !== -1
              ? columns[merchantColumnIndex]
              : undefined;
          const description =
            descriptionColumnIndex !== -1
              ? columns[descriptionColumnIndex]
              : undefined;
          const accountName =
            accountColumnIndex !== -1 ? columns[accountColumnIndex] : undefined;

          // Create or find category
          let categoryId: string | undefined;
          if (categoryName && categoryName !== "") {
            if (!categoriesMap.has(categoryName)) {
              // Create category if it doesn't exist
              const existingCategory = await db.category.findFirst({
                where: {
                  userId: user.id,
                  name: categoryName,
                  kind: CategoryKind.EXPENSE,
                },
              });

              if (existingCategory) {
                categoriesMap.set(categoryName, existingCategory.id);
              } else {
                const newCategory = await db.category.create({
                  data: {
                    userId: user.id,
                    name: categoryName,
                    kind: CategoryKind.EXPENSE,
                    color: getRandomColor(),
                  },
                });
                categoriesMap.set(categoryName, newCategory.id);
              }
            }
            categoryId = categoriesMap.get(categoryName);
          }

          // Create or find account
          let accountId: string | undefined;
          if (accountName && accountName !== "") {
            if (!accountsMap.has(accountName)) {
              // Create account if it doesn't exist
              const existingAccount = await db.account.findFirst({
                where: {
                  userId: user.id,
                  name: accountName,
                },
              });

              if (existingAccount) {
                accountsMap.set(accountName, existingAccount.id);
              } else {
                const newAccount = await db.account.create({
                  data: {
                    userId: user.id,
                    name: accountName,
                    type: AccountType.OTHER, // Default type for imported accounts
                    provider: accountName, // Use the account name as provider
                  },
                });
                accountsMap.set(accountName, newAccount.id);
              }
            }
            accountId = accountsMap.get(accountName);
          }

          transactions.push({
            userId: user.id,
            type: TransactionType.EXPENSE,
            amount: new Decimal(expenseAmount),
            occurredAt: transactionDate.toISOString(),
            description:
              [merchant, description].filter(Boolean).join(" - ") || undefined,
            categoryId,
            accountId,
          });
        } catch (error) {
          skippedRows.push(`Row ${i + 2}: ${(error as Error).message}`);
          continue;
        }
      }

      // Bulk create transactions
      let importedCount = 0;
      if (transactions.length > 0) {
        const result = await db.transaction.createMany({
          data: transactions,
          skipDuplicates: true,
        });
        importedCount = result.count;
      }

      span.setAttributes({
        "transactions.created": importedCount,
        "transactions.skipped": skippedRows.length,
        "categories.created": categoriesMap.size,
        "accounts.created": accountsMap.size,
        success: true,
      });

      span.end();

      return NextResponse.json({
        success: true,
        imported: importedCount,
        skipped: skippedRows.length,
        skippedReasons: skippedRows,
        categoriesCreated: categoriesMap.size,
        accountsCreated: accountsMap.size,
        message: `Successfully imported ${importedCount} expense transactions from the last 90 days`,
      });
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        error: true,
        "error.message": (error as Error).message,
      });
      span.end();

      console.error("CSV import error:", error);
      return NextResponse.json(
        { error: "Failed to import CSV data" },
        { status: 500 }
      );
    }
  });
}

function getRandomColor(): string {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#f59e0b", // amber
    "#10b981", // emerald
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
