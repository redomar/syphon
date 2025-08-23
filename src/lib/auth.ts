import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import type { User, CurrencyCode } from "../../generated/prisma";

/**
 * Get the current authenticated user and ensure they exist in our database
 * This implements lazy user creation - users are created in our DB only when they first access the app
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    // Check if user exists in our database
    let dbUser = await db.user.findUnique({
      where: { id: userId },
    });

    // If user doesn't exist in our DB, create them (lazy creation)
    if (!dbUser) {
      const clerkUser = await currentUser();

      if (!clerkUser) {
        return null;
      }

      // Try to determine currency from user's locale or default to GBP
      const currency = getCurrencyFromLocale(
        clerkUser.lastSignInAt ? "GB" : "GB"
      ); // You can enhance this

      // Create user in our database with Clerk data
      dbUser = await db.user.create({
        data: {
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          currency,
          timezone: getTimezoneFromLocale() || "Europe/London",
        },
      });

      console.log(`Created new user in database: ${userId}`);
    }

    return dbUser;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Require authentication and return the user, throw if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Get just the Clerk user ID without database interaction
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return null;
  }
}

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
