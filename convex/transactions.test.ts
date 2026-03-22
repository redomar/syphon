import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

const NOW = Date.now();

async function createTestCategory(
  asUser: Awaited<ReturnType<typeof setupTestWithUser>>["asUser"]
) {
  return await asUser.mutation(api.categories.createCategory, {
    name: "Groceries",
    type: "expense",
    color: "#FF5733",
    icon: "ShoppingCart",
  });
}

async function createTestAccount(
  asUser: Awaited<ReturnType<typeof setupTestWithUser>>["asUser"]
) {
  return await asUser.mutation(api.accounts.createAccount, {
    name: "Barclays",
    type: "checking",
    provider: "Barclays",
    lastFourDigits: "1234",
    balance: 100000,
    currency: "GBP",
  });
}

describe("createTransaction", () => {
  test("creates a transaction with all fields", async () => {
    const { t, asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const accId = await createTestAccount(asUser);

    const id = await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 5000,
      description: "Weekly shop",
      date: NOW,
      categoryId: catId,
      accountId: accId,
    });

    const tx = await t.run(async (ctx) => ctx.db.get(id));
    expect(tx!.type).toBe("EXPENSE");
    expect(tx!.amount).toBe(5000);
    expect(tx!.description).toBe("Weekly shop");
  });

  test("creates a transaction without optional fields", async () => {
    const { asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.transactions.createTransaction, {
      type: "INCOME",
      amount: 250000,
      description: "Salary",
      date: NOW,
    });

    expect(id).toBeDefined();
  });

  test("regression: rejects negative amount", async () => {
    const { asUser } = await setupTestWithUser();

    await expect(
      asUser.mutation(api.transactions.createTransaction, {
        type: "EXPENSE",
        amount: -100,
        description: "Bad",
        date: NOW,
      })
    ).rejects.toThrow("Amount must be positive");
  });

  test("regression: rejects zero amount", async () => {
    const { asUser } = await setupTestWithUser();

    await expect(
      asUser.mutation(api.transactions.createTransaction, {
        type: "EXPENSE",
        amount: 0,
        description: "Zero",
        date: NOW,
      })
    ).rejects.toThrow("Amount must be positive");
  });

  test("regression: rejects categoryId belonging to another user", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const catId = await asUser.mutation(api.categories.createCategory, {
      name: "My Category",
      type: "expense",
      color: "#FF5733",
      icon: "X",
    });

    await expect(
      asUserB.mutation(api.transactions.createTransaction, {
        type: "EXPENSE",
        amount: 1000,
        description: "Stolen cat",
        date: NOW,
        categoryId: catId,
      })
    ).rejects.toThrow("Category not found");
  });

  test("regression: rejects accountId belonging to another user", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const accId = await createTestAccount(asUser);

    await expect(
      asUserB.mutation(api.transactions.createTransaction, {
        type: "EXPENSE",
        amount: 1000,
        description: "Stolen acc",
        date: NOW,
        accountId: accId,
      })
    ).rejects.toThrow("Account not found");
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();

    await expect(
      t.mutation(api.transactions.createTransaction, {
        type: "EXPENSE",
        amount: 1000,
        description: "Test",
        date: NOW,
      })
    ).rejects.toThrow("Unauthorized");
  });
});

describe("updateTransaction", () => {
  test("updates a transaction successfully", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 5000,
      description: "Original",
      date: NOW,
    });

    await asUser.mutation(api.transactions.updateTransaction, {
      transactionId: id,
      type: "INCOME",
      amount: 10000,
      description: "Updated",
      date: NOW,
    });

    const tx = await t.run(async (ctx) => ctx.db.get(id));
    expect(tx!.type).toBe("INCOME");
    expect(tx!.amount).toBe(10000);
    expect(tx!.description).toBe("Updated");
  });

  test("blocks updating another user's transaction", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const id = await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 5000,
      description: "Mine",
      date: NOW,
    });

    await expect(
      asUserB.mutation(api.transactions.updateTransaction, {
        transactionId: id,
        type: "EXPENSE",
        amount: 1,
        description: "Hacked",
        date: NOW,
      })
    ).rejects.toThrow("Transaction not found");
  });

  test("regression: rejects negative amount on update", async () => {
    const { asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 5000,
      description: "Test",
      date: NOW,
    });

    await expect(
      asUser.mutation(api.transactions.updateTransaction, {
        transactionId: id,
        type: "EXPENSE",
        amount: -100,
        description: "Test",
        date: NOW,
      })
    ).rejects.toThrow("Amount must be positive");
  });
});

describe("deleteTransaction", () => {
  test("deletes a transaction", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 5000,
      description: "Delete me",
      date: NOW,
    });

    await asUser.mutation(api.transactions.deleteTransaction, {
      transactionId: id,
    });

    const tx = await t.run(async (ctx) => ctx.db.get(id));
    expect(tx).toBeNull();
  });

  test("blocks deleting another user's transaction", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const id = await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 5000,
      description: "Mine",
      date: NOW,
    });

    await expect(
      asUserB.mutation(api.transactions.deleteTransaction, {
        transactionId: id,
      })
    ).rejects.toThrow("Transaction not found");
  });
});

describe("getTransactions", () => {
  test("returns transactions sorted newest first", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 1000,
      description: "Older",
      date: NOW - 86400000,
    });

    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 2000,
      description: "Newer",
      date: NOW,
    });

    const txs = await asUser.query(api.transactions.getTransactions, {});
    expect(txs).toHaveLength(2);
    expect(txs[0].description).toBe("Newer");
    expect(txs[1].description).toBe("Older");
  });

  test("filters by type", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 1000,
      description: "Expense",
      date: NOW,
    });

    await asUser.mutation(api.transactions.createTransaction, {
      type: "INCOME",
      amount: 5000,
      description: "Income",
      date: NOW,
    });

    const expenses = await asUser.query(api.transactions.getTransactions, {
      type: "EXPENSE",
    });
    expect(expenses).toHaveLength(1);
    expect(expenses[0].description).toBe("Expense");
  });

  test("filters by date range", async () => {
    const { asUser } = await setupTestWithUser();

    const jan1 = new Date(2026, 0, 1).getTime();
    const feb1 = new Date(2026, 1, 1).getTime();
    const mar1 = new Date(2026, 2, 1).getTime();

    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 1000,
      description: "Jan",
      date: jan1,
    });

    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 2000,
      description: "Feb",
      date: feb1,
    });

    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 3000,
      description: "Mar",
      date: mar1,
    });

    const febOnly = await asUser.query(api.transactions.getTransactions, {
      dateFrom: feb1,
      dateTo: feb1 + 86400000,
    });
    expect(febOnly).toHaveLength(1);
    expect(febOnly[0].description).toBe("Feb");
  });

  test("does not return another user's transactions", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 1000,
      description: "User A only",
      date: NOW,
    });

    const txs = await asUserB.query(api.transactions.getTransactions, {});
    expect(txs).toHaveLength(0);
  });
});

describe("getDashboardStats", () => {
  test("returns zero values when no data exists", async () => {
    const { asUser } = await setupTestWithUser();

    const stats = await asUser.query(api.transactions.getDashboardStats);
    expect(stats.totalBalance).toBe(0);
    expect(stats.monthIncome).toBe(0);
    expect(stats.monthExpenses).toBe(0);
    expect(stats.transactionCount).toBe(0);
  });

  test("calculates totalBalance from active accounts", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.accounts.createAccount, {
      name: "A1",
      type: "checking",
      provider: "Bank",
      lastFourDigits: "1111",
      balance: 50000,
      currency: "GBP",
    });

    await asUser.mutation(api.accounts.createAccount, {
      name: "A2",
      type: "savings",
      provider: "Bank",
      lastFourDigits: "2222",
      balance: 30000,
      currency: "GBP",
    });

    const stats = await asUser.query(api.transactions.getDashboardStats);
    expect(stats.totalBalance).toBe(800); // (50000+30000)/100
  });

  test("excludes archived account balances", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.accounts.createAccount, {
      name: "Active",
      type: "checking",
      provider: "Bank",
      lastFourDigits: "1111",
      balance: 50000,
      currency: "GBP",
    });

    const archivedId = await asUser.mutation(api.accounts.createAccount, {
      name: "Archived",
      type: "savings",
      provider: "Bank",
      lastFourDigits: "2222",
      balance: 999999,
      currency: "GBP",
    });

    await asUser.mutation(api.accounts.archiveAccount, {
      accountId: archivedId,
    });

    const stats = await asUser.query(api.transactions.getDashboardStats);
    expect(stats.totalBalance).toBe(500); // 50000/100 only
  });
});
