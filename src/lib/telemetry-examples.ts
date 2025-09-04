import { tracer } from "@/lib/telemetry";

/**
 * Example utility functions demonstrating OpenTelemetry usage patterns
 */

// Example: Creating a span for a business operation
export async function createSampleTransaction(userId: string, amount: number) {
  return tracer.startActiveSpan("business.createTransaction", async (span) => {
    try {
      span.setAttributes({
        "user.id": userId,
        "transaction.amount": amount,
        "transaction.currency": "GBP",
        "operation.type": "sample",
      });

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 100));

      span.addEvent("transaction.validation_completed");

      // Simulate database operation
      await tracer.startActiveSpan("db.transaction.create", async (dbSpan) => {
        dbSpan.setAttributes({
          "db.operation": "create",
          "db.table": "transactions",
        });

        // Simulate work
        await new Promise((resolve) => setTimeout(resolve, 50));

        dbSpan.addEvent("transaction.persisted");
        dbSpan.end();
      });

      span.setAttributes({
        "operation.result": "success",
      });

      span.end();
      return { success: true, transactionId: "sample-123" };
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "operation.result": "error",
        "error.message": (error as Error).message,
      });
      span.end();
      throw error;
    }
  });
}

// Example: Adding telemetry to existing functions
export function withTelemetry<T extends unknown[], R>(
  operationName: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return tracer.startActiveSpan(operationName, async (span) => {
      try {
        const result = await fn(...args);
        span.setAttributes({
          "operation.result": "success",
        });
        span.end();
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setAttributes({
          "operation.result": "error",
          "error.message": (error as Error).message,
        });
        span.end();
        throw error;
      }
    });
  };
}

// Example usage:
// const trackedFunction = withTelemetry('my.operation', myAsyncFunction)
