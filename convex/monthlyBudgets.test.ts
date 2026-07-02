import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

const MONTH = "2026-06";
const OTHER_MONTH = "2026-07";

// ─── setMonthlyIncome ────────────────────────────────────────────────────────

describe("setMonthlyIncome", () => {
  test("creates an income record for a month", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.monthlyBudgets.setMonthlyIncome, {
      month: MONTH,
      income: 300000,
    });

    const entry = await asUser.query(api.monthlyBudgets.getMonthlyIncome, {
      month: MONTH,
    });
    expect(entry!.income).toBe(300000);
    expect(entry!.month).toBe(MONTH);
  });

  test("upserts (updates) the same month rather than duplicating", async () => {
    const { t, asUser } = await setupTestWithUser();

    await asUser.mutation(api.monthlyBudgets.setMonthlyIncome, {
      month: MONTH,
      income: 300000,
    });
    await asUser.mutation(api.monthlyBudgets.setMonthlyIncome, {
      month: MONTH,
      income: 350000,
    });

    const entry = await asUser.query(api.monthlyBudgets.getMonthlyIncome, {
      month: MONTH,
    });
    expect(entry!.income).toBe(350000);

    const rows = await t.run(async (ctx) =>
      ctx.db.query("monthly_budgets").collect()
    );
    expect(rows).toHaveLength(1);
  });

  test("regression: rejects negative income", async () => {
    const { asUser } = await setupTestWithUser();

    await expect(
      asUser.mutation(api.monthlyBudgets.setMonthlyIncome, {
        month: MONTH,
        income: -1,
      })
    ).rejects.toThrow("Income cannot be negative");
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();

    await expect(
      t.mutation(api.monthlyBudgets.setMonthlyIncome, {
        month: MONTH,
        income: 1000,
      })
    ).rejects.toThrow("Unauthorized");
  });
});

// ─── getMonthlyIncome ────────────────────────────────────────────────────────

describe("getMonthlyIncome", () => {
  test("returns null when no income set for the month", async () => {
    const { asUser } = await setupTestWithUser();

    const entry = await asUser.query(api.monthlyBudgets.getMonthlyIncome, {
      month: MONTH,
    });
    expect(entry).toBeNull();
  });

  test("scopes income per month", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.monthlyBudgets.setMonthlyIncome, {
      month: MONTH,
      income: 300000,
    });

    const other = await asUser.query(api.monthlyBudgets.getMonthlyIncome, {
      month: OTHER_MONTH,
    });
    expect(other).toBeNull();
  });
});

// ─── createAllocation ────────────────────────────────────────────────────────

describe("createAllocation", () => {
  test("creates an allocation for a month", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.monthlyBudgets.createAllocation, {
      month: MONTH,
      name: "Activities",
      amount: 15000,
    });

    const allocs = await asUser.query(api.monthlyBudgets.getAllocations, {
      month: MONTH,
    });
    expect(allocs).toHaveLength(1);
    expect(allocs[0].name).toBe("Activities");
    expect(allocs[0].amount).toBe(15000);
  });

  test("regression: rejects non-positive amount", async () => {
    const { asUser } = await setupTestWithUser();

    await expect(
      asUser.mutation(api.monthlyBudgets.createAllocation, {
        month: MONTH,
        name: "Zero",
        amount: 0,
      })
    ).rejects.toThrow("Amount must be positive");
  });
});

// ─── updateAllocation ────────────────────────────────────────────────────────

describe("updateAllocation", () => {
  test("updates name and amount", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.monthlyBudgets.createAllocation, {
      month: MONTH,
      name: "Activities",
      amount: 15000,
    });
    const allocs = await asUser.query(api.monthlyBudgets.getAllocations, {
      month: MONTH,
    });

    await asUser.mutation(api.monthlyBudgets.updateAllocation, {
      allocationId: allocs[0]._id,
      name: "Date nights",
      amount: 20000,
    });

    const updated = await asUser.query(api.monthlyBudgets.getAllocations, {
      month: MONTH,
    });
    expect(updated[0].name).toBe("Date nights");
    expect(updated[0].amount).toBe(20000);
  });

  test("blocks updating another user's allocation", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    await asUser.mutation(api.monthlyBudgets.createAllocation, {
      month: MONTH,
      name: "Activities",
      amount: 15000,
    });
    const allocs = await asUser.query(api.monthlyBudgets.getAllocations, {
      month: MONTH,
    });

    await expect(
      asUserB.mutation(api.monthlyBudgets.updateAllocation, {
        allocationId: allocs[0]._id,
        name: "Hacked",
        amount: 1,
      })
    ).rejects.toThrow("Allocation not found");
  });
});

// ─── deleteAllocation ────────────────────────────────────────────────────────

describe("deleteAllocation", () => {
  test("deletes an allocation", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.monthlyBudgets.createAllocation, {
      month: MONTH,
      name: "Activities",
      amount: 15000,
    });
    const allocs = await asUser.query(api.monthlyBudgets.getAllocations, {
      month: MONTH,
    });

    await asUser.mutation(api.monthlyBudgets.deleteAllocation, {
      allocationId: allocs[0]._id,
    });

    const remaining = await asUser.query(api.monthlyBudgets.getAllocations, {
      month: MONTH,
    });
    expect(remaining).toHaveLength(0);
  });

  test("blocks deleting another user's allocation", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    await asUser.mutation(api.monthlyBudgets.createAllocation, {
      month: MONTH,
      name: "Activities",
      amount: 15000,
    });
    const allocs = await asUser.query(api.monthlyBudgets.getAllocations, {
      month: MONTH,
    });

    await expect(
      asUserB.mutation(api.monthlyBudgets.deleteAllocation, {
        allocationId: allocs[0]._id,
      })
    ).rejects.toThrow("Allocation not found");
  });
});

// ─── getAllocations ──────────────────────────────────────────────────────────

describe("getAllocations", () => {
  test("returns only the requested month's allocations, newest first", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.monthlyBudgets.createAllocation, {
      month: MONTH,
      name: "First",
      amount: 1000,
    });
    await asUser.mutation(api.monthlyBudgets.createAllocation, {
      month: MONTH,
      name: "Second",
      amount: 2000,
    });
    await asUser.mutation(api.monthlyBudgets.createAllocation, {
      month: OTHER_MONTH,
      name: "Other",
      amount: 3000,
    });

    const allocs = await asUser.query(api.monthlyBudgets.getAllocations, {
      month: MONTH,
    });
    expect(allocs).toHaveLength(2);
    expect(allocs[0].name).toBe("Second");
    expect(allocs[1].name).toBe("First");
  });

  test("does not return another user's allocations", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    await asUser.mutation(api.monthlyBudgets.createAllocation, {
      month: MONTH,
      name: "Activities",
      amount: 15000,
    });

    const allocs = await asUserB.query(api.monthlyBudgets.getAllocations, {
      month: MONTH,
    });
    expect(allocs).toHaveLength(0);
  });
});
