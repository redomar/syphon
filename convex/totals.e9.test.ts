import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser } from "./test.helpers";
import type { Id } from "./_generated/dataModel";

// E9: refunds (EXPENSE + isRefund) net against spend; TRANSFER is excluded everywhere.
const now = Date.now();

async function seed() {
  const ctx = await setupTestWithUser();
  const { t, asUser, userId } = ctx;
  const catId = await asUser.mutation(api.categories.createCategory, {
    name: "Shopping",
    type: "expense",
    color: "#111111",
    icon: "Bag",
  });
  const base = { userId, date: now, isDemoData: false, createdAt: now, updatedAt: now };
  await t.run(async (db) => {
    await db.db.insert("transactions", { ...base, type: "INCOME", amount: 100000, description: "Pay" });
    await db.db.insert("transactions", { ...base, type: "EXPENSE", amount: 5000, description: "Shoes", categoryId: catId });
    await db.db.insert("transactions", { ...base, type: "EXPENSE", amount: 2000, description: "Shoes refund", categoryId: catId, isRefund: true });
    await db.db.insert("transactions", { ...base, type: "TRANSFER", amount: 40000, description: "To savings", direction: "out" });
    await db.db.insert("transactions", { ...base, type: "TRANSFER", amount: 40000, description: "From current", direction: "in" });
  });
  return { ...ctx, catId: catId as Id<"categories"> };
}

describe("E9 totals: refunds and transfers", () => {
  test("income/expense by month nets refunds and ignores transfers", async () => {
    const { asUser } = await seed();
    const data = await asUser.query(api.reports.getIncomeExpenseByMonth, { months: 1 });
    expect(data[0].income).toBe(100000);
    expect(data[0].expense).toBe(3000);
    expect(data[0].net).toBe(97000);
  });

  test("spending by category nets refunds", async () => {
    const { asUser } = await seed();
    const rows = await asUser.query(api.reports.getSpendingByCategory, {
      startDate: now - 86400000,
      endDate: now + 86400000,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Shopping");
    expect(rows[0].total).toBe(3000);
  });

  test("dashboard month stats net refunds and ignore transfers", async () => {
    const { asUser } = await seed();
    const stats = await asUser.query(api.transactions.getDashboardStats, {});
    expect(stats.monthIncome).toBe(1000);
    expect(stats.monthExpenses).toBe(30);
  });

  test("transactions can be filtered to TRANSFER", async () => {
    const { asUser } = await seed();
    const tx = await asUser.query(api.transactions.getTransactions, { type: "TRANSFER" });
    expect(tx).toHaveLength(2);
  });

  test("budget progress nets refunds", async () => {
    const { asUser, catId } = await seed();
    const d = new Date(now);
    const periodStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const periodEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "This month",
      periodStart,
      periodEnd,
    });
    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      allocatedAmount: 10000,
      budgetGroup: "WANTS",
    });
    const progress = await asUser.query(api.budgets.getBudgetProgress, { budgetId });
    expect(progress[0].spentAmount).toBe(3000);
  });
});
