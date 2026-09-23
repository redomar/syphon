import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

async function makeDebt(
  asUser: Awaited<ReturnType<typeof setupTestWithUser>>["asUser"],
  overrides: Partial<{
    name: string;
    initialBalance: number;
    currentBalance: number;
    minPayment: number;
  }> = {}
) {
  return await asUser.mutation(api.debts.createDebt, {
    name: overrides.name ?? "Visa",
    type: "credit_card",
    initialBalance: overrides.initialBalance ?? 500000,
    currentBalance: overrides.currentBalance ?? 500000,
    minPayment: overrides.minPayment ?? 10000,
  });
}

// ─── createDebt ──────────────────────────────────────────────────────────────

describe("createDebt", () => {
  test("creates a debt", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await asUser.mutation(api.debts.createDebt, {
      name: "Visa",
      type: "credit_card",
      initialBalance: 500000,
      currentBalance: 450000,
      apr: 19.9,
      minPayment: 10000,
      lender: "Barclays",
      dueDay: 15,
    });
    const debt = await t.run(async (ctx) => ctx.db.get(id));
    expect(debt!.name).toBe("Visa");
    expect(debt!.currentBalance).toBe(450000);
    expect(debt!.apr).toBe(19.9);
    expect(debt!.isClosed).toBe(false);
  });

  test("regression: rejects non-positive initial balance", async () => {
    const { asUser } = await setupTestWithUser();
    await expect(makeDebt(asUser, { initialBalance: 0 })).rejects.toThrow(
      "Initial balance must be positive"
    );
  });

  test("regression: rejects dueDay out of range", async () => {
    const { asUser } = await setupTestWithUser();
    await expect(
      asUser.mutation(api.debts.createDebt, {
        name: "Bad",
        type: "other",
        initialBalance: 1000,
        currentBalance: 1000,
        minPayment: 100,
        dueDay: 32,
      })
    ).rejects.toThrow("Due day must be between 1 and 31");
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();
    await expect(
      t.mutation(api.debts.createDebt, {
        name: "Unauthed",
        type: "other",
        initialBalance: 1000,
        currentBalance: 1000,
        minPayment: 100,
      })
    ).rejects.toThrow("Unauthorized");
  });
});

// ─── close / reopen ──────────────────────────────────────────────────────────

describe("closeDebt", () => {
  test("closes then reopens", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await makeDebt(asUser);

    await asUser.mutation(api.debts.closeDebt, { debtId: id });
    expect(await asUser.query(api.debts.getDebts)).toHaveLength(0);
    expect(await asUser.query(api.debts.getClosedDebts)).toHaveLength(1);

    await asUser.mutation(api.debts.reopenDebt, { debtId: id });
    expect(await asUser.query(api.debts.getDebts)).toHaveLength(1);
  });

  test("blocks closing another user's debt", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    const id = await makeDebt(asUser);
    await expect(
      asUserB.mutation(api.debts.closeDebt, { debtId: id })
    ).rejects.toThrow("Debt not found");
  });
});

// ─── payments ────────────────────────────────────────────────────────────────

describe("payments", () => {
  test("reduces balance by full amount when no principal given", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await makeDebt(asUser, { currentBalance: 500000 });

    await asUser.mutation(api.debts.addPayment, {
      debtId: id,
      amount: 10000,
      date: Date.now(),
    });

    const debt = await t.run(async (ctx) => ctx.db.get(id));
    expect(debt!.currentBalance).toBe(490000);
  });

  test("reduces balance by principal when provided", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await makeDebt(asUser, { currentBalance: 500000 });

    await asUser.mutation(api.debts.addPayment, {
      debtId: id,
      amount: 10000,
      date: Date.now(),
      principal: 7000,
      interest: 3000,
    });

    const debt = await t.run(async (ctx) => ctx.db.get(id));
    expect(debt!.currentBalance).toBe(493000); // only principal reduces
  });

  test("deletePayment restores the reduction", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await makeDebt(asUser, { currentBalance: 500000 });
    await asUser.mutation(api.debts.addPayment, {
      debtId: id,
      amount: 10000,
      date: Date.now(),
      principal: 7000,
    });
    const payments = await asUser.query(api.debts.getPayments, { debtId: id });

    await asUser.mutation(api.debts.deletePayment, {
      paymentId: payments[0]._id,
    });

    const debt = await t.run(async (ctx) => ctx.db.get(id));
    expect(debt!.currentBalance).toBe(500000);
  });

  test("balance never goes below zero", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await makeDebt(asUser, { currentBalance: 5000 });
    await asUser.mutation(api.debts.addPayment, {
      debtId: id,
      amount: 10000,
      date: Date.now(),
    });
    const debt = await t.run(async (ctx) => ctx.db.get(id));
    expect(debt!.currentBalance).toBe(0);
  });

  test("regression: rejects non-positive payment", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await makeDebt(asUser);
    await expect(
      asUser.mutation(api.debts.addPayment, {
        debtId: id,
        amount: 0,
        date: Date.now(),
      })
    ).rejects.toThrow("Amount must be positive");
  });

  test("blocks paying another user's debt", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    const id = await makeDebt(asUser);
    await expect(
      asUserB.mutation(api.debts.addPayment, {
        debtId: id,
        amount: 1000,
        date: Date.now(),
      })
    ).rejects.toThrow("Debt not found");
  });
});

// ─── deleteDebt cascade ──────────────────────────────────────────────────────

describe("deleteDebt", () => {
  test("cascade-deletes payments", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await makeDebt(asUser);
    await asUser.mutation(api.debts.addPayment, {
      debtId: id,
      amount: 10000,
      date: Date.now(),
    });

    await asUser.mutation(api.debts.deleteDebt, { debtId: id });

    const remaining = await t.run(async (ctx) =>
      ctx.db
        .query("debt_payments")
        .withIndex("by_debt", (q) => q.eq("debtId", id))
        .collect()
    );
    expect(remaining).toHaveLength(0);
    expect(await t.run(async (ctx) => ctx.db.get(id))).toBeNull();
  });
});

// ─── getDebt projection ──────────────────────────────────────────────────────

describe("getDebt projection", () => {
  test("computes months to payoff from average payment", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await makeDebt(asUser, { currentBalance: 100000, minPayment: 10000 });

    // two payments averaging 10000; balance after = 80000 -> 8 months
    await asUser.mutation(api.debts.addPayment, {
      debtId: id,
      amount: 10000,
      date: Date.now(),
    });
    await asUser.mutation(api.debts.addPayment, {
      debtId: id,
      amount: 10000,
      date: Date.now(),
    });

    const debt = await asUser.query(api.debts.getDebt, { debtId: id });
    expect(debt.currentBalance).toBe(80000);
    expect(debt.monthsToPayoff).toBe(8);
    expect(debt.estimatedPayoffDate).not.toBeNull();
  });

  test("falls back to minPayment when no payments", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await makeDebt(asUser, { currentBalance: 100000, minPayment: 25000 });
    const debt = await asUser.query(api.debts.getDebt, { debtId: id });
    expect(debt.monthsToPayoff).toBe(4);
  });
});

// ─── getDebtSummary ──────────────────────────────────────────────────────────

describe("getDebtSummary", () => {
  test("totals open debts and computes debt-to-income", async () => {
    const { asUser } = await setupTestWithUser();
    await makeDebt(asUser, { name: "A", currentBalance: 100000, minPayment: 5000 });
    await makeDebt(asUser, { name: "B", currentBalance: 200000, minPayment: 5000 });

    const month = new Date().toISOString().slice(0, 7);
    await asUser.mutation(api.monthlyBudgets.setMonthlyIncome, {
      month,
      income: 300000,
    });

    const summary = await asUser.query(api.debts.getDebtSummary);
    expect(summary.totalDebt).toBe(300000);
    expect(summary.debtCount).toBe(2);
    expect(summary.debtToIncome).toBe(1); // 300000 / 300000
    expect(summary.monthsToPayoff).toBe(30); // 300000 / 10000
  });

  test("debt-to-income null when no income recorded", async () => {
    const { asUser } = await setupTestWithUser();
    await makeDebt(asUser, { currentBalance: 100000 });
    const summary = await asUser.query(api.debts.getDebtSummary);
    expect(summary.debtToIncome).toBeNull();
  });

  test("does not include another user's debts", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    await makeDebt(asUser, { currentBalance: 100000 });
    const summary = await asUserB.query(api.debts.getDebtSummary);
    expect(summary.totalDebt).toBe(0);
  });
});
