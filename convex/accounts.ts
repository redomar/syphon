import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

const accountType = v.union(
  v.literal("checking"),
  v.literal("savings"),
  v.literal("credit_card"),
  v.literal("debit_card"),
  v.literal("cash"),
  v.literal("investment"),
  v.literal("other")
);

const currency = v.union(
  v.literal("GBP"),
  v.literal("USD"),
  v.literal("EUR"),
  v.literal("CAD"),
  v.literal("AUD")
);

/**
 * Creates a new account for the authenticated user.
 */
export const createAccount = mutation({
  args: {
    name: v.string(),
    type: accountType,
    provider: v.string(),
    lastFourDigits: v.string(),
    balance: v.number(),
    currency,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const activeAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .collect();

    if (
      activeAccounts.some(
        (account) =>
          account.name.toLowerCase() === args.name.toLowerCase() &&
          account.lastFourDigits === args.lastFourDigits
      )
    ) {
      throw new Error(
        "Account with this name and last four digits already exists"
      );
    }

    return await ctx.db.insert("accounts", {
      userId: user._id,
      name: args.name,
      type: args.type,
      provider: args.provider,
      lastFourDigits: args.lastFourDigits,
      balance: args.balance,
      currency: args.currency,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isArchived: false,
    });
  },
});

/**
 * Updates an existing account for the authenticated user.
 */
export const updateAccount = mutation({
  args: {
    accountId: v.id("accounts"),
    name: v.string(),
    type: accountType,
    provider: v.string(),
    lastFourDigits: v.string(),
    balance: v.number(),
    currency,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== user._id) {
      throw new Error("Account not found");
    }

    const activeAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .collect();

    const duplicate = activeAccounts.find(
      (acc) =>
        acc._id !== args.accountId &&
        acc.name.toLowerCase() === args.name.toLowerCase() &&
        acc.lastFourDigits === args.lastFourDigits
    );

    if (duplicate) {
      throw new Error(
        "Account with this name and last four digits already exists"
      );
    }

    await ctx.db.patch(args.accountId, {
      name: args.name,
      type: args.type,
      provider: args.provider,
      lastFourDigits: args.lastFourDigits,
      balance: args.balance,
      currency: args.currency,
      updatedAt: Date.now(),
    });

    return args.accountId;
  },
});

/**
 * Archives an account (soft delete).
 */
export const archiveAccount = mutation({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== user._id) {
      throw new Error("Account not found");
    }

    if (account.isArchived) {
      throw new Error("Account is already archived");
    }

    await ctx.db.patch(args.accountId, {
      isArchived: true,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Restores an archived account.
 */
export const unarchiveAccount = mutation({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== user._id) {
      throw new Error("Account not found");
    }

    if (!account.isArchived) {
      throw new Error("Account is not archived");
    }

    await ctx.db.patch(args.accountId, {
      isArchived: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get active (non-archived) accounts for the authenticated user.
 */
export const getActiveAccounts = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("accounts")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .collect();
  },
});

/**
 * Get archived accounts for the authenticated user.
 */
export const getArchivedAccounts = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("accounts")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", true)
      )
      .collect();
  },
});

/**
 * Get all accounts for the authenticated user (active + archived).
 * Useful for dropdowns where you need the full list.
 */
export const getAccounts = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
