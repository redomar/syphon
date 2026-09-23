import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

const now = Date.now();

async function category(
  asUser: Awaited<ReturnType<typeof setupTestWithUser>>["asUser"],
  name = "Groceries"
) {
  return await asUser.mutation(api.categories.createCategory, {
    name,
    type: "expense",
    color: "#FF5733",
    icon: "ShoppingCart",
  });
}

describe("getIncomeExpenseByMonth", () => {
  test("aggregates income and expense in the current month bucket", async () => {
    const { asUser } = await setupTestWithUser();
    await asUser.mutation(api.transactions.createTransaction, {
      type: "INCOME",
      amount: 5000,
      description: "Salary",
      date: now,
    });
    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 2000,
      description: "Food",
      date: now,
    });

    const data = await asUser.query(api.reports.getIncomeExpenseByMonth, { months: 6 });
    expect(data).toHaveLength(6);
    const last = data[data.length - 1];
    expect(last.income).toBe(5000);
    expect(last.expense).toBe(2000);
    expect(last.net).toBe(3000);
  });

  test("does not include another user's transactions", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    await asUser.mutation(api.transactions.createTransaction, {
      type: "INCOME",
      amount: 5000,
      description: "Salary",
      date: now,
    });
    const data = await asUserB.query(api.reports.getIncomeExpenseByMonth, { months: 6 });
    expect(data[data.length - 1].income).toBe(0);
  });
});

describe("getSpendingByCategory", () => {
  test("groups expenses by category and includes uncategorized", async () => {
    const { asUser } = await setupTestWithUser();
    const catId = await category(asUser);
    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 3000,
      description: "Groceries",
      date: now,
      categoryId: catId,
    });
    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 1000,
      description: "Misc",
      date: now,
    });

    const data = await asUser.query(api.reports.getSpendingByCategory, {
      startDate: now - 86400000,
      endDate: now + 86400000,
    });
    expect(data[0].name).toBe("Groceries");
    expect(data[0].total).toBe(3000);
    const uncat = data.find((d) => d.categoryId === null);
    expect(uncat!.total).toBe(1000);
  });

  test("excludes income", async () => {
    const { asUser } = await setupTestWithUser();
    await asUser.mutation(api.transactions.createTransaction, {
      type: "INCOME",
      amount: 5000,
      description: "Salary",
      date: now,
    });
    const data = await asUser.query(api.reports.getSpendingByCategory, {
      startDate: now - 86400000,
      endDate: now + 86400000,
    });
    expect(data).toHaveLength(0);
  });
});

describe("getNetWorthTrend", () => {
  test("computes current net worth as accounts minus debts", async () => {
    const { asUser } = await setupTestWithUser();
    await asUser.mutation(api.accounts.createAccount, {
      name: "Main",
      type: "checking",
      provider: "Bank",
      lastFourDigits: "1234",
      balance: 500000,
      currency: "GBP",
    });
    await asUser.mutation(api.debts.createDebt, {
      name: "Card",
      type: "credit_card",
      initialBalance: 200000,
      currentBalance: 200000,
      minPayment: 5000,
    });

    const data = await asUser.query(api.reports.getNetWorthTrend, { months: 6 });
    expect(data.accountsTotal).toBe(500000);
    expect(data.debtTotal).toBe(200000);
    expect(data.currentNetWorth).toBe(300000);
    expect(data.points).toHaveLength(6);
    expect(data.points[data.points.length - 1].netWorth).toBe(300000);
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();
    await expect(
      t.query(api.reports.getNetWorthTrend, { months: 6 })
    ).rejects.toThrow("Unauthorized");
  });
});
