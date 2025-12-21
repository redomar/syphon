import type { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Helper function to get the current authenticated user from the database.
 * Throws an error if the user is not authenticated or not found.
 *
 * @param ctx - The Convex query or mutation context
 * @returns The authenticated user document
 * @throws Error if user is not authenticated or not found in database
 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Helper function to get the current user identity without requiring
 * the user to exist in the database. Useful for checking auth status.
 *
 * @param ctx - The Convex query or mutation context
 * @returns The user identity or null if not authenticated
 */
export async function getIdentity(ctx: QueryCtx | MutationCtx) {
  return ctx.auth.getUserIdentity();
}
