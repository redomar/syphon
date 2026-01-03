/**
 * Creates a new account for the authenticated user
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

export const createAccount = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("checking"),
      v.literal("savings"),
      v.literal("credit_card"),
      v.literal("cash"),
      v.literal("investment"),
      v.literal("other")
    ),
    provider: v.string(),
    lastFourDigits: v.string(),
    balance: v.number(), // In smallest currency unit (e.g., cents)
    currency: v.union(
      v.literal("GBP"),
      v.literal("USD"),
      v.literal("EUR"),
      v.literal("CAD"),
      v.literal("AUD")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existingUserAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (
      existingUserAccounts.some(
        (account) =>
          account.name.toLowerCase() === args.name.toLowerCase() &&
          account.lastFourDigits === args.lastFourDigits &&
          !account.isArchived
      )
    ) {
      throw new Error(
        "Account with this name and last four digits already exists"
      );
    }

    const accountId = await ctx.db.insert("accounts", {
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

    return accountId;
  },
});

/**
 * Updates an existing account for the authenticated user`
 */
export const updateAccount = mutation({
  args: {
    accountId: v.id("accounts"),
    name: v.string(),
    type: v.union(
      v.literal("checking"),
      v.literal("savings"),
      v.literal("credit_card"),
      v.literal("cash"),
      v.literal("investment"),
      v.literal("other")
    ),
    provider: v.string(),
    lastFourDigits: v.string(),
    balance: v.number(), // In smallest currency unit (e.g., cents)
    currency: v.union(
      v.literal("GBP"),
      v.literal("USD"),
      v.literal("EUR"),
      v.literal("CAD"),
      v.literal("AUD")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Verify ownership
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== user._id) {
      throw new Error("Account not found");
    }

    // Check for duplicates (excluding current account)
    const existingAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const duplicate = existingAccounts.find(
      (acc) =>
        acc._id !== args.accountId &&
        acc.name.toLowerCase() === args.name.toLowerCase() &&
        acc.lastFourDigits === args.lastFourDigits &&
        !acc.isArchived
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
 * Archives an existing account for the authenticated user
 */

export const deleteAccount = mutation({
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

    return;
  },
});

/**
 * Restores an archived account for the authenticated user
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

    return;
  },
});

/**
 * Get all accounts for the authenticated user
 */

export const getAccounts = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return accounts;
  },
});