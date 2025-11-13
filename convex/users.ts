import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Syncs the current authenticated user from Clerk to Convex database
 * This should be called when the user first signs in
 */
export const syncUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const now = new Date().toISOString();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: identity.email!,
        firstName: identity.givenName,
        lastName: identity.familyName,
        imageUrl: identity.pictureUrl,
        updatedAt: now,
      });
      return existingUser._id;
    }

    // Create new user with default timezone (London)
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email!,
      firstName: identity.givenName,
      lastName: identity.familyName,
      imageUrl: identity.pictureUrl,
      timezone: "Europe/London", // Default to London timezone
      onboardingComplete: false,
      isDemoMode: false,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * Gets the current authenticated user from the database
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});

/**
 * Gets a user by their Clerk ID
 */
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    return user;
  },
});

/**
 * Updates the current user's profile
 */
export const updateProfile = mutation({
  args: {
    currency: v.optional(v.union(
      v.literal("GBP"),
      v.literal("USD"),
      v.literal("EUR"),
      v.literal("CAD"),
      v.literal("AUD")
    )),
    timezone: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
    isDemoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      ...args,
      updatedAt: new Date().toISOString(),
    });

    return user._id;
  },
});

/**
 * List all users (for testing - remove in production)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

/**
 * Internal mutation to sync user from Clerk webhook
 * This is called server-side from the HTTP webhook handler
 * Only callable from other Convex functions (not from client)
 */
export const syncUserFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const now = new Date().toISOString();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        updatedAt: now,
      });
      return existingUser._id;
    }

    // Create new user with default timezone (London)
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      timezone: "Europe/London", // Default to London timezone
      onboardingComplete: false,
      isDemoMode: false,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});