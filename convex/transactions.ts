import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

const transactionType = v.union(v.literal("INCOME"), v.literal("EXPENSE"));

/**
 * Creates a new transaction for the authenticated user.
 */
export const createTransaction = mutation({
  args: {
    type: transactionType,
    amount: v.number(), // In cents
    description: v.string(),
    date: v.number(), // Unix timestamp ms
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId);
      if (!category || category.userId !== user._id) {
        throw new Error("Category not found");
      }
    }

    if (args.accountId) {
      const account = await ctx.db.get(args.accountId);
      if (!account || account.userId !== user._id) {
        throw new Error("Account not found");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("transactions", {
      userId: user._id,
      type: args.type,
      amount: args.amount,
      description: args.description,
      date: args.date,
      categoryId: args.categoryId,
      accountId: args.accountId,
      isDemoData: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Updates an existing transaction for the authenticated user.
 */
export const updateTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    type: transactionType,
    amount: v.number(),
    description: v.string(),
    date: v.number(),
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.userId !== user._id) {
      throw new Error("Transaction not found");
    }

    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId);
      if (!category || category.userId !== user._id) {
        throw new Error("Category not found");
      }
    }

    if (args.accountId) {
      const account = await ctx.db.get(args.accountId);
      if (!account || account.userId !== user._id) {
        throw new Error("Account not found");
      }
    }

    await ctx.db.patch(args.transactionId, {
      type: args.type,
      amount: args.amount,
      description: args.description,
      date: args.date,
      categoryId: args.categoryId,
      accountId: args.accountId,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Permanently deletes a transaction.
 */
export const deleteTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.userId !== user._id) {
      throw new Error("Transaction not found");
    }

    await ctx.db.delete(args.transactionId);
  },
});

/**
 * Get transactions for the authenticated user with optional filters.
 * Results are sorted newest first.
 */
export const getTransactions = query({
  args: {
    type: v.optional(transactionType),
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    let transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) => {
        const base = q.eq("userId", user._id);
        if (args.dateFrom !== undefined && args.dateTo !== undefined) {
          return base.gte("date", args.dateFrom).lte("date", args.dateTo);
        }
        if (args.dateFrom !== undefined) {
          return base.gte("date", args.dateFrom);
        }
        if (args.dateTo !== undefined) {
          return base.lte("date", args.dateTo);
        }
        return base;
      })
      .order("desc")
      .collect();

    if (args.type) {
      transactions = transactions.filter((t) => t.type === args.type);
    }
    if (args.categoryId) {
      transactions = transactions.filter(
        (t) => t.categoryId === args.categoryId
      );
    }
    if (args.accountId) {
      transactions = transactions.filter((t) => t.accountId === args.accountId);
    }

    return transactions;
  },
});

/**
 * Returns aggregated stats for the dashboard.
 */
export const getDashboardStats = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Total balance = sum of all active account balances
    const activeAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .collect();

    const totalBalanceCents = activeAccounts.reduce(
      (sum, acc) => sum + acc.balance,
      0
    );

    // Current calendar month bounds
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ).getTime();

    const monthTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).gte("date", monthStart).lte("date", monthEnd)
      )
      .collect();

    const monthIncomeCents = monthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthExpensesCents = monthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const transactionCount = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
      .then((r) => r.length);

    return {
      totalBalance: totalBalanceCents / 100,
      monthIncome: monthIncomeCents / 100,
      monthExpenses: monthExpensesCents / 100,
      transactionCount,
      currency: activeAccounts[0]?.currency ?? user.currency,
    };
  },
});
