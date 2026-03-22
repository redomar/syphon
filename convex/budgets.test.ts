import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

const MAR_START = new Date(2026, 2, 1).getTime();
const MAR_END = new Date(2026, 2, 31, 23, 59, 59, 999).getTime();
const APR_START = new Date(2026, 3, 1).getTime();
const APR_END = new Date(2026, 3, 30, 23, 59, 59, 999).getTime();

async function createTestCategory(
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

// ─── createBudget ──────────────────────────────────────────────────────────────

describe("createBudget", () => {
  test("creates a budget with correct fields", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.budgets.createBudget, {
      name: "March 2026",
      periodStart: MAR_START,
      periodEnd: MAR_END,
      totalAmount: 200000,
    });

    const budget = await t.run(async (ctx) => ctx.db.get(id));
    expect(budget!.name).toBe("March 2026");
    expect(budget!.totalAmount).toBe(200000);
  });

  test("creates a budget without optional totalAmount", async () => {
    const { asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.budgets.createBudget, {
      name: "March 2026",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    expect(id).toBeDefined();
  });

  test("rejects periodEnd <= periodStart", async () => {
    const { asUser } = await setupTestWithUser();

    await expect(
      asUser.mutation(api.budgets.createBudget, {
        name: "Bad",
        periodStart: MAR_END,
        periodEnd: MAR_START,
      })
    ).rejects.toThrow("Period end must be after period start");
  });

  test("regression: rejects negative totalAmount", async () => {
    const { asUser } = await setupTestWithUser();

    await expect(
      asUser.mutation(api.budgets.createBudget, {
        name: "Negative",
        periodStart: MAR_START,
        periodEnd: MAR_END,
        totalAmount: -1000,
      })
    ).rejects.toThrow("Total amount must be positive");
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();

    await expect(
      t.mutation(api.budgets.createBudget, {
        name: "Unauthed",
        periodStart: MAR_START,
        periodEnd: MAR_END,
      })
    ).rejects.toThrow("Unauthorized");
  });
});

// ─── overlap detection ─────────────────────────────────────────────────────────

describe("createBudget overlap detection", () => {
  test("rejects a budget that fully overlaps an existing budget", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await expect(
      asUser.mutation(api.budgets.createBudget, {
        name: "March Again",
        periodStart: MAR_START,
        periodEnd: MAR_END,
      })
    ).rejects.toThrow("already covers this period");
  });

  test("rejects partial overlap (new start inside existing)", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    const midMarch = new Date(2026, 2, 15).getTime();
    await expect(
      asUser.mutation(api.budgets.createBudget, {
        name: "Mid-March to April",
        periodStart: midMarch,
        periodEnd: APR_END,
      })
    ).rejects.toThrow("already covers this period");
  });

  test("rejects when new budget fully contains existing", async () => {
    const { asUser } = await setupTestWithUser();

    const midStart = new Date(2026, 2, 10).getTime();
    const midEnd = new Date(2026, 2, 20).getTime();

    await asUser.mutation(api.budgets.createBudget, {
      name: "Mid March",
      periodStart: midStart,
      periodEnd: midEnd,
    });

    await expect(
      asUser.mutation(api.budgets.createBudget, {
        name: "Full March",
        periodStart: MAR_START,
        periodEnd: MAR_END,
      })
    ).rejects.toThrow("already covers this period");
  });

  test("adjacent periods (new starts at old end) are NOT overlap", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    // periodStart === old periodEnd → not overlap (strict < comparison)
    const id = await asUser.mutation(api.budgets.createBudget, {
      name: "Adjacent",
      periodStart: MAR_END,
      periodEnd: APR_END,
    });
    expect(id).toBeDefined();
  });

  test("one millisecond inside boundary IS overlap", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await expect(
      asUser.mutation(api.budgets.createBudget, {
        name: "Overlapping",
        periodStart: MAR_END - 1,
        periodEnd: APR_END,
      })
    ).rejects.toThrow("already covers this period");
  });

  test("allows non-overlapping budgets", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    const id = await asUser.mutation(api.budgets.createBudget, {
      name: "April",
      periodStart: APR_START,
      periodEnd: APR_END,
    });

    expect(id).toBeDefined();
  });
});

// ─── updateBudget ──────────────────────────────────────────────────────────────

describe("updateBudget", () => {
  test("updates name and totalAmount", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.updateBudget, {
      budgetId: id,
      name: "March 2026",
      totalAmount: 300000,
    });

    const budget = await t.run(async (ctx) => ctx.db.get(id));
    expect(budget!.name).toBe("March 2026");
    expect(budget!.totalAmount).toBe(300000);
  });

  test("blocks update to another user's budget", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const id = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await expect(
      asUserB.mutation(api.budgets.updateBudget, {
        budgetId: id,
        name: "Hacked",
      })
    ).rejects.toThrow("Budget not found");
  });
});

// ─── deleteBudget ──────────────────────────────────────────────────────────────

describe("deleteBudget", () => {
  test("deletes a budget", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.deleteBudget, { budgetId: id });

    const budget = await t.run(async (ctx) => ctx.db.get(id));
    expect(budget).toBeNull();
  });

  test("cascade-deletes all allocations", async () => {
    const { t, asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      budgetGroup: "NEEDS",
      allocatedAmount: 10000,
    });

    await asUser.mutation(api.budgets.deleteBudget, { budgetId });

    const remaining = await t.run(async (ctx) =>
      ctx.db
        .query("budget_allocations")
        .withIndex("by_budget", (q) => q.eq("budgetId", budgetId))
        .collect()
    );
    expect(remaining).toHaveLength(0);
  });

  test("blocks deleting another user's budget", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const id = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await expect(
      asUserB.mutation(api.budgets.deleteBudget, { budgetId: id })
    ).rejects.toThrow("Budget not found");
  });
});

// ─── upsertAllocation ──────────────────────────────────────────────────────────

describe("upsertAllocation", () => {
  test("creates a new allocation", async () => {
    const { asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      budgetGroup: "NEEDS",
      allocatedAmount: 10000,
    });

    const allocs = await asUser.query(api.budgets.getAllocations, { budgetId });
    expect(allocs).toHaveLength(1);
    expect(allocs[0].allocatedAmount).toBe(10000);
    expect(allocs[0].budgetGroup).toBe("NEEDS");
  });

  test("updates an existing allocation (upsert)", async () => {
    const { asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      budgetGroup: "NEEDS",
      allocatedAmount: 10000,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      budgetGroup: "WANTS",
      allocatedAmount: 20000,
    });

    const allocs = await asUser.query(api.budgets.getAllocations, { budgetId });
    expect(allocs).toHaveLength(1);
    expect(allocs[0].allocatedAmount).toBe(20000);
    expect(allocs[0].budgetGroup).toBe("WANTS");
  });

  test("regression: rejects negative allocatedAmount", async () => {
    const { asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await expect(
      asUser.mutation(api.budgets.upsertAllocation, {
        budgetId,
        categoryId: catId,
        budgetGroup: "NEEDS",
        allocatedAmount: -500,
      })
    ).rejects.toThrow("Allocated amount must not be negative");
  });

  test("allows zero allocatedAmount", async () => {
    const { asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      budgetGroup: "NEEDS",
      allocatedAmount: 0,
    });

    const allocs = await asUser.query(api.budgets.getAllocations, { budgetId });
    expect(allocs[0].allocatedAmount).toBe(0);
  });

  test("blocks allocation on another user's budget", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await expect(
      asUserB.mutation(api.budgets.upsertAllocation, {
        budgetId,
        categoryId: catId,
        budgetGroup: "NEEDS",
        allocatedAmount: 10000,
      })
    ).rejects.toThrow("Budget not found");
  });
});

// ─── deleteAllocation ──────────────────────────────────────────────────────────

describe("deleteAllocation", () => {
  test("deletes an allocation", async () => {
    const { t, asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      budgetGroup: "NEEDS",
      allocatedAmount: 10000,
    });

    const allocs = await asUser.query(api.budgets.getAllocations, { budgetId });
    await asUser.mutation(api.budgets.deleteAllocation, {
      allocationId: allocs[0]._id,
    });

    const remaining = await asUser.query(api.budgets.getAllocations, {
      budgetId,
    });
    expect(remaining).toHaveLength(0);
  });

  test("blocks deleting another user's allocation", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      budgetGroup: "NEEDS",
      allocatedAmount: 10000,
    });

    const allocs = await asUser.query(api.budgets.getAllocations, { budgetId });

    await expect(
      asUserB.mutation(api.budgets.deleteAllocation, {
        allocationId: allocs[0]._id,
      })
    ).rejects.toThrow("Allocation not found");
  });
});

// ─── applyTemplate ─────────────────────────────────────────────────────────────

describe("applyTemplate", () => {
  test("distributes amounts according to 50/30/20 ratios", async () => {
    const { asUser } = await setupTestWithUser();

    const cat1 = await createTestCategory(asUser, "Groceries");
    const cat2 = await createTestCategory(asUser, "Transport");
    const cat3 = await createTestCategory(asUser, "Entertainment");

    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.applyTemplate, {
      budgetId,
      totalAmount: 200000, // £2000
      ratios: { needs: 50, wants: 30, niceties: 20 },
      assignments: [
        { categoryId: cat1, group: "NEEDS" },
        { categoryId: cat2, group: "WANTS" },
        { categoryId: cat3, group: "NICETIES" },
      ],
    });

    const allocs = await asUser.query(api.budgets.getAllocations, { budgetId });
    expect(allocs).toHaveLength(3);

    const needs = allocs.find((a) => a.budgetGroup === "NEEDS");
    const wants = allocs.find((a) => a.budgetGroup === "WANTS");
    const niceties = allocs.find((a) => a.budgetGroup === "NICETIES");

    expect(needs!.allocatedAmount).toBe(100000); // 50%
    expect(wants!.allocatedAmount).toBe(60000); // 30%
    expect(niceties!.allocatedAmount).toBe(40000); // 20%
  });

  test("splits evenly within a group", async () => {
    const { asUser } = await setupTestWithUser();

    const cat1 = await createTestCategory(asUser, "Groceries");
    const cat2 = await createTestCategory(asUser, "Dining");

    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.applyTemplate, {
      budgetId,
      totalAmount: 200000,
      ratios: { needs: 100, wants: 0, niceties: 0 },
      assignments: [
        { categoryId: cat1, group: "NEEDS" },
        { categoryId: cat2, group: "NEEDS" },
      ],
    });

    const allocs = await asUser.query(api.budgets.getAllocations, { budgetId });
    expect(allocs).toHaveLength(2);
    expect(allocs[0].allocatedAmount).toBe(100000);
    expect(allocs[1].allocatedAmount).toBe(100000);
  });

  test("clears existing allocations before applying", async () => {
    const { asUser } = await setupTestWithUser();

    const cat1 = await createTestCategory(asUser, "Old Cat");
    const cat2 = await createTestCategory(asUser, "New Cat");

    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: cat1,
      budgetGroup: "NEEDS",
      allocatedAmount: 50000,
    });

    await asUser.mutation(api.budgets.applyTemplate, {
      budgetId,
      totalAmount: 200000,
      ratios: { needs: 100, wants: 0, niceties: 0 },
      assignments: [{ categoryId: cat2, group: "NEEDS" }],
    });

    const allocs = await asUser.query(api.budgets.getAllocations, { budgetId });
    expect(allocs).toHaveLength(1);
    expect(allocs[0].categoryName).toBe("New Cat");
  });

  test("rejects ratios that don't sum to 100", async () => {
    const { asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await expect(
      asUser.mutation(api.budgets.applyTemplate, {
        budgetId,
        totalAmount: 200000,
        ratios: { needs: 50, wants: 30, niceties: 10 },
        assignments: [{ categoryId: catId, group: "NEEDS" }],
      })
    ).rejects.toThrow("Ratios must sum to 100");
  });

  test("regression: rejects individually negative ratios", async () => {
    const { asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await expect(
      asUser.mutation(api.budgets.applyTemplate, {
        budgetId,
        totalAmount: 200000,
        ratios: { needs: 200, wants: -50, niceties: -50 },
        assignments: [{ categoryId: catId, group: "NEEDS" }],
      })
    ).rejects.toThrow("Ratios must be non-negative");
  });

  test("skips empty groups", async () => {
    const { asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    const result = await asUser.mutation(api.budgets.applyTemplate, {
      budgetId,
      totalAmount: 200000,
      ratios: { needs: 50, wants: 30, niceties: 20 },
      assignments: [{ categoryId: catId, group: "NEEDS" }],
    });

    expect(result.created).toBe(1);
  });
});

// ─── getBudgets ────────────────────────────────────────────────────────────────

describe("getBudgets", () => {
  test("returns budgets sorted by periodStart descending", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.createBudget, {
      name: "April",
      periodStart: APR_START,
      periodEnd: APR_END,
    });

    const budgets = await asUser.query(api.budgets.getBudgets);
    expect(budgets).toHaveLength(2);
    expect(budgets[0].name).toBe("April");
    expect(budgets[1].name).toBe("March");
  });

  test("does not return another user's budgets", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    const budgets = await asUserB.query(api.budgets.getBudgets);
    expect(budgets).toHaveLength(0);
  });
});

// ─── getBudget ─────────────────────────────────────────────────────────────────

describe("getBudget", () => {
  test("returns the requested budget", async () => {
    const { asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    const budget = await asUser.query(api.budgets.getBudget, { budgetId: id });
    expect(budget.name).toBe("March");
  });

  test("throws for another user's budget", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const id = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await expect(
      asUserB.query(api.budgets.getBudget, { budgetId: id })
    ).rejects.toThrow("Budget not found");
  });
});

// ─── getAllocations ─────────────────────────────────────────────────────────────

describe("getAllocations", () => {
  test("returns enriched allocations with category info", async () => {
    const { asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser, "Groceries");
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      budgetGroup: "NEEDS",
      allocatedAmount: 10000,
    });

    const allocs = await asUser.query(api.budgets.getAllocations, { budgetId });
    expect(allocs[0].categoryName).toBe("Groceries");
    expect(allocs[0].categoryColor).toBe("#FF5733");
  });
});

// ─── getBudgetProgress ─────────────────────────────────────────────────────────

describe("getBudgetProgress", () => {
  test("calculates spent amounts from transactions in period", async () => {
    const { asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      budgetGroup: "NEEDS",
      allocatedAmount: 10000,
    });

    // Add expense transaction in the budget period
    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 3000,
      description: "Groceries",
      date: MAR_START + 86400000,
      categoryId: catId,
    });

    const progress = await asUser.query(api.budgets.getBudgetProgress, {
      budgetId,
    });

    expect(progress).toHaveLength(1);
    expect(progress[0].spentAmount).toBe(3000);
    expect(progress[0].percentage).toBe(30);
    expect(progress[0].status).toBe("green");
  });

  test("returns correct status thresholds", async () => {
    const { asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      budgetGroup: "NEEDS",
      allocatedAmount: 10000,
    });

    // Spend 80% → yellow
    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 8000,
      description: "Big shop",
      date: MAR_START + 86400000,
      categoryId: catId,
    });

    let progress = await asUser.query(api.budgets.getBudgetProgress, {
      budgetId,
    });
    expect(progress[0].percentage).toBe(80);
    expect(progress[0].status).toBe("yellow");

    // Spend another 15% → red (95% total)
    await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 1500,
      description: "More groceries",
      date: MAR_START + 2 * 86400000,
      categoryId: catId,
    });

    progress = await asUser.query(api.budgets.getBudgetProgress, { budgetId });
    expect(progress[0].percentage).toBe(95);
    expect(progress[0].status).toBe("red");
  });

  test("returns 0% when no transactions exist", async () => {
    const { asUser } = await setupTestWithUser();

    const catId = await createTestCategory(asUser);
    const budgetId = await asUser.mutation(api.budgets.createBudget, {
      name: "March",
      periodStart: MAR_START,
      periodEnd: MAR_END,
    });

    await asUser.mutation(api.budgets.upsertAllocation, {
      budgetId,
      categoryId: catId,
      budgetGroup: "NEEDS",
      allocatedAmount: 10000,
    });

    const progress = await asUser.query(api.budgets.getBudgetProgress, {
      budgetId,
    });
    expect(progress[0].percentage).toBe(0);
    expect(progress[0].status).toBe("green");
  });
});

// ─── getActiveBudgetSummary ────────────────────────────────────────────────────

describe("getActiveBudgetSummary", () => {
  test("returns null when no active budget exists", async () => {
    const { asUser } = await setupTestWithUser();

    // Create a budget in the past
    const past = new Date(2020, 0, 1).getTime();
    const pastEnd = new Date(2020, 0, 31).getTime();

    await asUser.mutation(api.budgets.createBudget, {
      name: "Old Budget",
      periodStart: past,
      periodEnd: pastEnd,
    });

    const summary = await asUser.query(api.budgets.getActiveBudgetSummary);
    expect(summary).toBeNull();
  });

  test("returns zero totals when budget has no allocations", async () => {
    const { asUser } = await setupTestWithUser();

    // Create a budget that spans a very wide range to include "now"
    const wideStart = new Date(2020, 0, 1).getTime();
    const wideEnd = new Date(2030, 11, 31).getTime();

    await asUser.mutation(api.budgets.createBudget, {
      name: "Wide Budget",
      periodStart: wideStart,
      periodEnd: wideEnd,
    });

    const summary = await asUser.query(api.budgets.getActiveBudgetSummary);
    expect(summary).not.toBeNull();
    expect(summary!.totalAllocated).toBe(0);
    expect(summary!.totalSpent).toBe(0);
    expect(summary!.alertCategories).toHaveLength(0);
  });
});
