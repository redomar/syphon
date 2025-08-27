import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { tracer } from "./telemetry";
import type { User, CurrencyCode } from "../../generated/prisma";

/**
 * Helper function to determine currency from locale
 */
function getCurrencyFromLocale(country?: string): CurrencyCode {
  const currencyMap: Record<string, CurrencyCode> = {
    US: "USD",
    GB: "GBP",
    EU: "EUR",
    CA: "CAD",
    AU: "AUD",
  };

  return currencyMap[country || "GB"] || "GBP";
}

/**
 * Helper function to determine timezone
 */
function getTimezoneFromLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Europe/London";
  }
}

/**
 * Get the current authenticated user and ensure they exist in our database
 * This implements lazy user creation - users are created in our DB only when they first access the app
 */
export async function getCurrentUser(): Promise<User | null> {
  return tracer.startActiveSpan("auth.getCurrentUser", async (span) => {
    try {
      const { userId } = await auth();

      if (!userId) {
        span.setAttributes({
          "auth.result": "unauthenticated",
        });
        span.end();
        return null;
      }

      span.setAttributes({
        "auth.userId": userId,
      });

      // Check if user exists in our database
      let dbUser = await tracer.startActiveSpan(
        "db.user.findUnique",
        async (dbSpan) => {
          const user = await db.user.findUnique({
            where: { id: userId },
          });
          dbSpan.setAttributes({
            "db.operation": "findUnique",
            "db.table": "user",
            "db.result": user ? "found" : "not_found",
          });
          dbSpan.end();
          return user;
        }
      );

      // If user doesn't exist in our DB, create them (lazy creation)
      if (!dbUser) {
        span.addEvent("user.lazy_creation_started");

        const clerkUser = await currentUser();

        if (!clerkUser) {
          span.setAttributes({
            "auth.result": "clerk_user_not_found",
          });
          span.end();
          return null;
        }

        // Try to determine currency from user's locale or default to GBP
        const currency = getCurrencyFromLocale(
          clerkUser.lastSignInAt ? "GB" : "GB"
        ); // You can enhance this

        // Create user in our database with Clerk data
        dbUser = await tracer.startActiveSpan(
          "db.user.create",
          async (createSpan) => {
            const newUser = await db.user.create({
              data: {
                id: userId,
                email: clerkUser.emailAddresses[0]?.emailAddress,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                currency,
                timezone: getTimezoneFromLocale() || "Europe/London",
              },
            });

            createSpan.setAttributes({
              "db.operation": "create",
              "db.table": "user",
              "user.email": newUser.email || "unknown",
              "user.currency": newUser.currency,
              "user.timezone": newUser.timezone,
            });
            createSpan.addEvent("user.created_successfully");
            createSpan.end();
            return newUser;
          }
        );

        span.addEvent("user.lazy_creation_completed", {
          "user.id": userId,
          "user.email": dbUser.email || "unknown",
        });
      }

      span.setAttributes({
        "auth.result": "success",
        "user.exists_in_db": true,
      });
      span.end();
      return dbUser;
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "auth.result": "error",
        "error.message": (error as Error).message,
      });
      span.end();
      return null;
    }
  });
}

/**
 * Require authentication and return the user, throw if not authenticated
 */
export async function requireAuth(): Promise<User> {
  return tracer.startActiveSpan("auth.requireAuth", async (span) => {
    const user = await getCurrentUser();

    if (!user) {
      span.setAttributes({
        "auth.result": "unauthorized",
      });
      span.end();
      throw new Error("Authentication required");
    }

    span.setAttributes({
      "auth.result": "success",
      "user.id": user.id,
    });
    span.end();
    return user;
  });
}

/**
 * Get just the Clerk user ID without database interaction
 */
export async function getCurrentUserId(): Promise<string | null> {
  return tracer.startActiveSpan("auth.getCurrentUserId", async (span) => {
    try {
      const { userId } = await auth();
      span.setAttributes({
        "auth.result": userId ? "success" : "unauthenticated",
      });
      span.end();
      return userId;
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "auth.result": "error",
        "error.message": (error as Error).message,
      });
      span.end();
      return null;
    }
  });
}
