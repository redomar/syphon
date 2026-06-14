import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./lib/auth";

/** Returns the [start, end) epoch-ms bounds for `n` months ending this month. */
function monthBuckets(months: number): { key: string; start: number; end: number }[] {
  const now = new Date();
  const buckets: { key: string; start: number; end: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ key, start, end });
  }
  return buckets;
}

/**
 * Income vs expense totals per month for the last `months` months (E7.S1).
 */
export const getIncomeExpenseByMonth = query({
  args: { months: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const months = args.months ?? 6;
    const buckets = monthBuckets(months);
    const rangeStart = buckets[0].start;

    const txns = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).gte("date", rangeStart)
      )
      .collect();

    return buckets.map((b) => {
      const inBucket = txns.filter((t) => t.date >= b.start && t.date < b.end);
      const income = inBucket
        .filter((t) => t.type === "INCOME")
        .reduce((s, t) => s + t.amount, 0);
      const expense = inBucket
        .filter((t) => t.type === "EXPENSE")
        .reduce((s, t) => s + t.amount, 0);
      return { month: b.key, income, expense, net: income - expense };
    });
  },
});

/**
 * Expense totals grouped by category over a date range (E7.S2).
 */
export const getSpendingByCategory = query({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const txns = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).gte("date", args.startDate).lte("date", args.endDate)
      )
      .collect();

    const expenses = txns.filter((t) => t.type === "EXPENSE");
    const byCategory = new Map<string, number>();
    let uncategorized = 0;
    for (const t of expenses) {
      if (t.categoryId) {
        byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + t.amount);
      } else {
        uncategorized += t.amount;
      }
    }

    const result: { categoryId: string | null; name: string; color: string; total: number }[] = [];
    for (const [categoryId, total] of byCategory) {
      const cat = await ctx.db.get(categoryId as never);
      result.push({
        categoryId,
        name: (cat as { name?: string } | null)?.name ?? "Unknown",
        color: (cat as { color?: string } | null)?.color ?? "#888888",
        total,
      });
    }
    if (uncategorized > 0) {
      result.push({
        categoryId: null,
        name: "Uncategorized",
        color: "#888888",
        total: uncategorized,
      });
    }
    result.sort((a, b) => b.total - a.total);
    return result;
  },
});

/**
 * Net-worth trend per month (E7.S3). Anchored on current net worth
 * (active account balances minus open debt balances) and walked backward
 * using each month's net cashflow.
 */
export const getNetWorthTrend = query({
  args: { months: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const months = args.months ?? 6;
    const buckets = monthBuckets(months);

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .collect();
    const accountsTotal = accounts.reduce((s, a) => s + a.balance, 0);

    const debts = await ctx.db
      .query("debts")
      .withIndex("by_user_open", (q) =>
        q.eq("userId", user._id).eq("isClosed", false)
      )
      .collect();
    const debtTotal = debts.reduce((s, d) => s + d.currentBalance, 0);

    const currentNetWorth = accountsTotal - debtTotal;

    const rangeStart = buckets[0].start;
    const txns = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).gte("date", rangeStart)
      )
      .collect();

    // net cashflow per bucket
    const netByBucket = buckets.map((b) => {
      const inBucket = txns.filter((t) => t.date >= b.start && t.date < b.end);
      const income = inBucket.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
      const expense = inBucket.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
      return income - expense;
    });

    // Walk backward: netWorth at end of bucket i = current - sum(net of buckets after i)
    const points: { month: string; netWorth: number }[] = [];
    for (let i = 0; i < buckets.length; i++) {
      let after = 0;
      for (let j = i + 1; j < buckets.length; j++) after += netByBucket[j];
      points.push({ month: buckets[i].key, netWorth: currentNetWorth - after });
    }

    return { currentNetWorth, accountsTotal, debtTotal, points };
  },
});
