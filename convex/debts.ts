import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

const debtType = v.union(
  v.literal("credit_card"),
  v.literal("student_loan"),
  v.literal("mortgage"),
  v.literal("personal"),
  v.literal("auto"),
  v.literal("other")
);

function validateDebtInput(args: {
  initialBalance: number;
  currentBalance: number;
  minPayment: number;
  apr?: number;
  dueDay?: number;
}) {
  if (args.initialBalance <= 0) throw new Error("Initial balance must be positive");
  if (args.currentBalance < 0) throw new Error("Current balance must not be negative");
  if (args.minPayment < 0) throw new Error("Minimum payment must not be negative");
  if (args.apr !== undefined && args.apr < 0) throw new Error("APR must not be negative");
  if (args.dueDay !== undefined && (args.dueDay < 1 || args.dueDay > 31)) {
    throw new Error("Due day must be between 1 and 31");
  }
}

/**
 * Creates a debt for the authenticated user.
 */
export const createDebt = mutation({
  args: {
    name: v.string(),
    type: debtType,
    initialBalance: v.number(),
    currentBalance: v.number(),
    apr: v.optional(v.number()),
    minPayment: v.number(),
    lender: v.optional(v.string()),
    dueDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    validateDebtInput(args);

    const now = Date.now();
    return await ctx.db.insert("debts", {
      userId: user._id,
      name: args.name,
      type: args.type,
      initialBalance: args.initialBalance,
      currentBalance: args.currentBalance,
      apr: args.apr,
      minPayment: args.minPayment,
      lender: args.lender,
      dueDay: args.dueDay,
      isClosed: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Updates a debt.
 */
export const updateDebt = mutation({
  args: {
    debtId: v.id("debts"),
    name: v.string(),
    type: debtType,
    initialBalance: v.number(),
    currentBalance: v.number(),
    apr: v.optional(v.number()),
    minPayment: v.number(),
    lender: v.optional(v.string()),
    dueDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    validateDebtInput(args);

    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.userId !== user._id) {
      throw new Error("Debt not found");
    }

    await ctx.db.patch(args.debtId, {
      name: args.name,
      type: args.type,
      initialBalance: args.initialBalance,
      currentBalance: args.currentBalance,
      apr: args.apr,
      minPayment: args.minPayment,
      lender: args.lender,
      dueDay: args.dueDay,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Marks a debt as closed (paid off / no longer tracked).
 */
export const closeDebt = mutation({
  args: { debtId: v.id("debts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.userId !== user._id) throw new Error("Debt not found");
    if (debt.isClosed) throw new Error("Debt is already closed");
    await ctx.db.patch(args.debtId, { isClosed: true, updatedAt: Date.now() });
  },
});

/**
 * Reopens a closed debt.
 */
export const reopenDebt = mutation({
  args: { debtId: v.id("debts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.userId !== user._id) throw new Error("Debt not found");
    if (!debt.isClosed) throw new Error("Debt is not closed");
    await ctx.db.patch(args.debtId, { isClosed: false, updatedAt: Date.now() });
  },
});

/**
 * Permanently deletes a debt and its payments.
 */
export const deleteDebt = mutation({
  args: { debtId: v.id("debts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.userId !== user._id) throw new Error("Debt not found");

    const payments = await ctx.db
      .query("debt_payments")
      .withIndex("by_debt", (q) => q.eq("debtId", args.debtId))
      .collect();
    for (const p of payments) await ctx.db.delete(p._id);

    await ctx.db.delete(args.debtId);
  },
});

/**
 * Records a payment. currentBalance reduces by principal if provided,
 * otherwise by the full amount.
 */
export const addPayment = mutation({
  args: {
    debtId: v.id("debts"),
    amount: v.number(),
    date: v.number(),
    principal: v.optional(v.number()),
    interest: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.principal !== undefined && args.principal < 0)
      throw new Error("Principal must not be negative");
    if (args.interest !== undefined && args.interest < 0)
      throw new Error("Interest must not be negative");

    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.userId !== user._id) throw new Error("Debt not found");

    const reduction = args.principal ?? args.amount;

    const id = await ctx.db.insert("debt_payments", {
      userId: user._id,
      debtId: args.debtId,
      amount: args.amount,
      date: args.date,
      principal: args.principal,
      interest: args.interest,
      note: args.note,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.debtId, {
      currentBalance: Math.max(0, debt.currentBalance - reduction),
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Deletes a payment and restores the reduced balance.
 */
export const deletePayment = mutation({
  args: { paymentId: v.id("debt_payments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const payment = await ctx.db.get(args.paymentId);
    if (!payment || payment.userId !== user._id)
      throw new Error("Payment not found");

    const debt = await ctx.db.get(payment.debtId);
    await ctx.db.delete(args.paymentId);

    if (debt) {
      const reduction = payment.principal ?? payment.amount;
      await ctx.db.patch(debt._id, {
        currentBalance: debt.currentBalance + reduction,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Open (non-closed) debts, newest first.
 */
export const getDebts = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("debts")
      .withIndex("by_user_open", (q) =>
        q.eq("userId", user._id).eq("isClosed", false)
      )
      .order("desc")
      .collect();
  },
});

/**
 * Closed debts, newest first.
 */
export const getClosedDebts = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("debts")
      .withIndex("by_user_open", (q) =>
        q.eq("userId", user._id).eq("isClosed", true)
      )
      .order("desc")
      .collect();
  },
});

/**
 * A single debt with its payoff projection (ownership enforced).
 */
export const getDebt = query({
  args: { debtId: v.id("debts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.userId !== user._id) throw new Error("Debt not found");

    const payments = await ctx.db
      .query("debt_payments")
      .withIndex("by_debt", (q) => q.eq("debtId", args.debtId))
      .collect();

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const avgPayment =
      payments.length > 0 ? totalPaid / payments.length : debt.minPayment;
    const monthsToPayoff =
      avgPayment > 0 ? Math.ceil(debt.currentBalance / avgPayment) : null;
    const estimatedPayoffDate =
      monthsToPayoff !== null
        ? Date.now() + monthsToPayoff * 30 * 86400000
        : null;

    return { ...debt, monthsToPayoff, estimatedPayoffDate, paymentsCount: payments.length };
  },
});

/**
 * Payments for a debt, newest first (ownership enforced).
 */
export const getPayments = query({
  args: { debtId: v.id("debts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.userId !== user._id) throw new Error("Debt not found");
    return await ctx.db
      .query("debt_payments")
      .withIndex("by_debt", (q) => q.eq("debtId", args.debtId))
      .order("desc")
      .collect();
  },
});

/**
 * Dashboard summary: total debt across open debts, debt-to-income ratio
 * (using the current month's income if recorded), and aggregate payoff.
 */
export const getDebtSummary = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const debts = await ctx.db
      .query("debts")
      .withIndex("by_user_open", (q) =>
        q.eq("userId", user._id).eq("isClosed", false)
      )
      .collect();

    const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);

    // Current month's income (if set) for debt-to-income.
    const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const incomeEntry = await ctx.db
      .query("monthly_budgets")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", user._id).eq("month", month)
      )
      .unique();
    const monthlyIncome = incomeEntry?.income ?? 0;
    const debtToIncome =
      monthlyIncome > 0 ? totalDebt / monthlyIncome : null;

    const monthsToPayoff =
      totalMinPayment > 0 ? Math.ceil(totalDebt / totalMinPayment) : null;

    return {
      totalDebt,
      debtCount: debts.length,
      totalMinPayment,
      monthlyIncome,
      debtToIncome,
      monthsToPayoff,
    };
  },
});
