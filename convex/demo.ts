import { mutation } from "./_generated/server";
import { requireUser } from "./lib/auth";

const DAY = 86400000;

/**
 * E8.S3: seeds sample data (transactions, a budget, goals, a debt) tagged with
 * isDemoData so it can be cleared in one click. Idempotent-ish: safe to re-run
 * (it just adds another demo set), but typically paired with clearDemoData.
 */
export const seedDemoData = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    // ~12 transactions across the last 3 months
    const samples: { type: "INCOME" | "EXPENSE"; amount: number; description: string; daysAgo: number }[] = [
      { type: "INCOME", amount: 300000, description: "Salary", daysAgo: 2 },
      { type: "EXPENSE", amount: 120000, description: "Rent", daysAgo: 3 },
      { type: "EXPENSE", amount: 8500, description: "Groceries", daysAgo: 5 },
      { type: "EXPENSE", amount: 4200, description: "Dinner out", daysAgo: 9 },
      { type: "EXPENSE", amount: 999, description: "Streaming", daysAgo: 12 },
      { type: "INCOME", amount: 300000, description: "Salary", daysAgo: 32 },
      { type: "EXPENSE", amount: 120000, description: "Rent", daysAgo: 33 },
      { type: "EXPENSE", amount: 9100, description: "Groceries", daysAgo: 38 },
      { type: "EXPENSE", amount: 5400, description: "Fuel", daysAgo: 44 },
      { type: "INCOME", amount: 300000, description: "Salary", daysAgo: 62 },
      { type: "EXPENSE", amount: 120000, description: "Rent", daysAgo: 63 },
      { type: "EXPENSE", amount: 7600, description: "Groceries", daysAgo: 70 },
    ];
    for (const s of samples) {
      await ctx.db.insert("transactions", {
        userId: user._id,
        type: s.type,
        amount: s.amount,
        description: s.description,
        date: now - s.daysAgo * DAY,
        isDemoData: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // current-month budget
    const d = new Date();
    const periodStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const periodEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    await ctx.db.insert("budgets", {
      userId: user._id,
      name: `${d.toLocaleString("en-GB", { month: "long" })} ${d.getFullYear()} (demo)`,
      periodStart,
      periodEnd,
      totalAmount: 200000,
      isDemoData: true,
      createdAt: now,
    });

    // two goals (~50%)
    for (const g of [
      { name: "Holiday fund", target: 200000, current: 100000 },
      { name: "New laptop", target: 150000, current: 60000 },
    ]) {
      await ctx.db.insert("goals", {
        userId: user._id,
        name: g.name,
        targetAmount: g.target,
        currentAmount: g.current,
        isArchived: false,
        isDemoData: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // one debt with a payment
    const debtId = await ctx.db.insert("debts", {
      userId: user._id,
      name: "Credit card (demo)",
      type: "credit_card",
      initialBalance: 250000,
      currentBalance: 220000,
      apr: 19.9,
      minPayment: 10000,
      isClosed: false,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("debt_payments", {
      userId: user._id,
      debtId,
      amount: 30000,
      date: now - 10 * DAY,
      principal: 27000,
      interest: 3000,
      createdAt: now,
    });

    await ctx.db.patch(user._id, { isDemoMode: true, updatedAt: now });
    return { seeded: true };
  },
});

/**
 * Deletes all demo-tagged records (and their children) for the user.
 */
export const clearDemoData = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const txns = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const t of txns) if (t.isDemoData) await ctx.db.delete(t._id);

    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const g of goals) {
      if (!g.isDemoData) continue;
      const contribs = await ctx.db
        .query("goal_contributions")
        .withIndex("by_goal", (q) => q.eq("goalId", g._id))
        .collect();
      for (const c of contribs) await ctx.db.delete(c._id);
      await ctx.db.delete(g._id);
    }

    const debts = await ctx.db
      .query("debts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const debt of debts) {
      if (!debt.isDemoData) continue;
      const payments = await ctx.db
        .query("debt_payments")
        .withIndex("by_debt", (q) => q.eq("debtId", debt._id))
        .collect();
      for (const p of payments) await ctx.db.delete(p._id);
      await ctx.db.delete(debt._id);
    }

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const b of budgets) {
      if (!b.isDemoData) continue;
      const allocs = await ctx.db
        .query("budget_allocations")
        .withIndex("by_budget", (q) => q.eq("budgetId", b._id))
        .collect();
      for (const a of allocs) await ctx.db.delete(a._id);
      await ctx.db.delete(b._id);
    }

    await ctx.db.patch(user._id, { isDemoMode: false, updatedAt: Date.now() });
    return { cleared: true };
  },
});
