import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TransactionType } from "../../../../generated/prisma";
import { tracer } from "@/lib/telemetry";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(request: NextRequest) {
  return tracer.startActiveSpan("api.transactions.GET", async (span) => {
    try {
      span.setAttributes({
        "http.method": "GET",
        "http.route": "/api/transactions",
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

      const { searchParams } = new URL(request.url);
      const type = searchParams.get("type");
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");

      const whereClause: {
        userId: string;
        type?: TransactionType;
      } = {
        userId: user.id,
      };

      if (
        type &&
        Object.values(TransactionType).includes(type as TransactionType)
      ) {
        whereClause.type = type as TransactionType;
      }

      const transactions = await db.transaction.findMany({
        where: whereClause,
        include: {
          category: true,
          incomeSource: true,
        },
        orderBy: {
          occurredAt: "desc",
        },
        take: limit,
        skip: offset,
      });

      span.setAttributes({
        "http.status_code": 200,
        "transactions.count": transactions.length,
        "user.id": user.id,
        "query.type": type || "all",
        "query.limit": limit,
        "query.offset": offset,
      });

      span.end();
      return NextResponse.json(transactions);
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "http.status_code": 500,
        "error.message": (error as Error).message,
      });
      span.end();
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return tracer.startActiveSpan("api.transactions.POST", async (span) => {
    try {
      span.setAttributes({
        "http.method": "POST",
        "http.route": "/api/transactions",
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

      const body = await request.json();
      const {
        type,
        amount,
        occurredAt,
        description,
        categoryId,
        incomeSourceId,
      } = body;

      // Validate required fields
      if (!type || !amount || !occurredAt) {
        span.setAttributes({
          "http.status_code": 400,
          "error.type": "validation",
        });
        span.end();
        return NextResponse.json(
          { error: "Type, amount, and occurredAt are required" },
          { status: 400 }
        );
      }

      // Validate transaction type
      if (!Object.values(TransactionType).includes(type)) {
        span.setAttributes({
          "http.status_code": 400,
          "error.type": "validation",
          "validation.field": "type",
        });
        span.end();
        return NextResponse.json(
          { error: "Invalid transaction type" },
          { status: 400 }
        );
      }

      // Validate amount
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        span.setAttributes({
          "http.status_code": 400,
          "error.type": "validation",
          "validation.field": "amount",
        });
        span.end();
        return NextResponse.json(
          { error: "Amount must be a positive number" },
          { status: 400 }
        );
      }

      // Validate date
      const transactionDate = new Date(occurredAt);
      if (isNaN(transactionDate.getTime())) {
        span.setAttributes({
          "http.status_code": 400,
          "error.type": "validation",
          "validation.field": "occurredAt",
        });
        span.end();
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }

      // Verify category and income source belong to user if provided
      if (categoryId) {
        const category = await db.category.findFirst({
          where: {
            id: categoryId,
            userId: user.id,
          },
        });
        if (!category) {
          span.setAttributes({
            "http.status_code": 400,
            "error.type": "validation",
            "validation.field": "categoryId",
          });
          span.end();
          return NextResponse.json(
            { error: "Invalid category" },
            { status: 400 }
          );
        }
      }

      if (incomeSourceId) {
        const incomeSource = await db.incomeSource.findFirst({
          where: {
            id: incomeSourceId,
            userId: user.id,
          },
        });
        if (!incomeSource) {
          span.setAttributes({
            "http.status_code": 400,
            "error.type": "validation",
            "validation.field": "incomeSourceId",
          });
          span.end();
          return NextResponse.json(
            { error: "Invalid income source" },
            { status: 400 }
          );
        }
      }

      const transaction = await db.transaction.create({
        data: {
          userId: user.id,
          type,
          amount: new Decimal(amount),
          occurredAt: transactionDate,
          description,
          categoryId,
          incomeSourceId,
          currency: user.currency,
        },
        include: {
          category: true,
          incomeSource: true,
        },
      });

      span.setAttributes({
        "http.status_code": 201,
        "transaction.id": transaction.id,
        "transaction.type": transaction.type,
        "transaction.amount": transaction.amount.toString(),
        "user.id": user.id,
      });

      span.end();
      return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "http.status_code": 500,
        "error.message": (error as Error).message,
      });
      span.end();
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return tracer.startActiveSpan("api.transactions.DELETE", async (span) => {
    try {
      span.setAttributes({
        "http.method": "DELETE",
        "http.route": "/api/transactions",
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

      const { searchParams } = new URL(request.url);
      const transactionId = searchParams.get("id");

      if (!transactionId) {
        span.setAttributes({
          "http.status_code": 400,
          "error.type": "validation",
          "validation.field": "id",
        });
        span.end();
        return NextResponse.json(
          { error: "Transaction ID is required" },
          { status: 400 }
        );
      }

      const transaction = await db.transaction.findFirst({
        where: {
          id: transactionId,
          userId: user.id,
        },
      });

      if (!transaction) {
        span.setAttributes({
          "http.status_code": 404,
          "error.type": "not_found",
          "validation.field": "id",
        });
        span.end();
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 }
        );
      }

      await db.transaction.delete({
        where: {
          id: transaction.id,
        },
      });

      span.setAttributes({
        "http.status_code": 200,
        "transaction.id": transaction.id,
        "user.id": user.id,
        deletion: "successful",
      });
      span.end();
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "http.status_code": 500,
        "error.message": (error as Error).message,
      });
      span.end();
      return NextResponse.json(
        { error: "Failed to delete transaction" },
        { status: 500 }
      );
    }
  });
}
