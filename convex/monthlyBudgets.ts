import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

const monthArg = v.string(); // "YYYY-MM"

/**
 * Sets (creates or updates) the income recorded for a given month.
 */
export const setMonthlyIncome = mutation({
  args: {
    month: monthArg,
    income: v.number(), // In cents
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.income < 0) {
      throw new Error("Income cannot be negative");
    }

    const existing = await ctx.db
      .query("monthly_budgets")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", user._id).eq("month", args.month)
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        income: args.income,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("monthly_budgets", {
      userId: user._id,
      month: args.month,
      income: args.income,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Returns the income recorded for a given month, or null if none has been set.
 */
export const getMonthlyIncome = query({
  args: {
    month: monthArg,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const entry = await ctx.db
      .query("monthly_budgets")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", user._id).eq("month", args.month)
      )
      .unique();

    return entry ?? null;
  },
});

/**
 * Adds a planned allocation (e.g. "Activities", "New clothes", "Extra savings")
 * for a given month — money the user wants to set aside on top of their bills.
 */
export const createAllocation = mutation({
  args: {
    month: monthArg,
    name: v.string(),
    amount: v.number(), // In cents
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const now = Date.now();
    return await ctx.db.insert("monthly_allocations", {
      userId: user._id,
      month: args.month,
      name: args.name,
      amount: args.amount,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Updates an existing planned allocation for the authenticated user.
 */
export const updateAllocation = mutation({
  args: {
    allocationId: v.id("monthly_allocations"),
    name: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const allocation = await ctx.db.get(args.allocationId);
    if (!allocation || allocation.userId !== user._id) {
      throw new Error("Allocation not found");
    }

    await ctx.db.patch(args.allocationId, {
      name: args.name,
      amount: args.amount,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Permanently deletes a planned allocation.
 */
export const deleteAllocation = mutation({
  args: {
    allocationId: v.id("monthly_allocations"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const allocation = await ctx.db.get(args.allocationId);
    if (!allocation || allocation.userId !== user._id) {
      throw new Error("Allocation not found");
    }

    await ctx.db.delete(args.allocationId);
  },
});

/**
 * Returns the planned allocations for a given month, sorted newest first.
 */
export const getAllocations = query({
  args: {
    month: monthArg,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("monthly_allocations")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", user._id).eq("month", args.month)
      )
      .order("desc")
      .collect();
  },
});
