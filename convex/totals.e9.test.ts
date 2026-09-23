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

describe("E9 editing imported rows", () => {
  test("editing keeps merchant in step and un-pairs an edited transfer", async () => {
    const { t, asUser, userId } = await setupTestWithUser();
    const ids = await t.run(async (db) => {
      const base = { userId, date: now, isDemoData: false, createdAt: now, updatedAt: now };
      const a = await db.db.insert("transactions", { ...base, type: "EXPENSE", amount: 390, description: "Eis Cafe", merchant: "Eis Cafe", rawDescription: "SQ *EIS CAFE" });
      const out = await db.db.insert("transactions", { ...base, type: "TRANSFER", amount: 500, description: "To TSB", direction: "out" });
      return { a, out };
    });
    await asUser.mutation(api.transactions.updateTransaction, {
      transactionId: ids.a, type: "EXPENSE", amount: 390, description: "Eis Café", date: now,
    });
    await asUser.mutation(api.transactions.updateTransaction, {
      transactionId: ids.out, type: "EXPENSE", amount: 500, description: "Rent", date: now,
    });
    const all = await asUser.query(api.transactions.getTransactions, {});
    const cafe = all.find((x) => x._id === ids.a)!;
    expect(cafe.merchant).toBe("Eis Café");
    expect(cafe.rawDescription).toBe("SQ *EIS CAFE");
    const rent = all.find((x) => x._id === ids.out)!;
    expect(rent.type).toBe("EXPENSE");
    expect(rent.direction).toBeUndefined();
  });
});

describe("E9 transfer legs", () => {
  test("deleting one leg unlinks the other", async () => {
    const { t, asUser, userId } = await setupTestWithUser();
    const { a, b } = await t.run(async (db) => {
      const base = { userId, date: now, isDemoData: false, createdAt: now, updatedAt: now, amount: 500 };
      const a = await db.db.insert("transactions", { ...base, type: "TRANSFER", description: "Out", direction: "out" });
      const b = await db.db.insert("transactions", { ...base, type: "TRANSFER", description: "In", direction: "in", transferPairId: a });
      await db.db.patch(a, { transferPairId: b });
      return { a, b };
    });
    await asUser.mutation(api.transactions.deleteTransaction, { transactionId: a });
    const [left] = await asUser.query(api.transactions.getTransactions, {});
    expect(left._id).toBe(b);
    expect(left.transferPairId).toBeUndefined();
  });
});

describe("getTransactions limits", () => {
  test("caps results and filters server-side before the cap", async () => {
    const { t, asUser, userId } = await setupTestWithUser();
    await t.run(async (db) => {
      for (let i = 0; i < 30; i++) {
        await db.db.insert("transactions", {
          userId, type: i % 3 === 0 ? "INCOME" : "EXPENSE", amount: 100, description: `t${i}`,
          date: now - i * 1000, isDemoData: false, createdAt: now, updatedAt: now,
        });
      }
    });
    expect(await asUser.query(api.transactions.getTransactions, { limit: 5 })).toHaveLength(5);
    const income = await asUser.query(api.transactions.getTransactions, { type: "INCOME", limit: 100 });
    expect(income).toHaveLength(10);
    expect(await asUser.query(api.transactions.getTransactions, { limit: 99999 })).toHaveLength(30);
  });
});
