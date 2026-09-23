import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

const DEADLINE = new Date(2026, 11, 31).getTime();

// ─── createGoal ──────────────────────────────────────────────────────────────

describe("createGoal", () => {
  test("creates a goal with currentAmount 0", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.goals.createGoal, {
      name: "Vacation Fund",
      targetAmount: 200000,
      deadline: DEADLINE,
    });

    const goal = await t.run(async (ctx) => ctx.db.get(id));
    expect(goal!.name).toBe("Vacation Fund");
    expect(goal!.targetAmount).toBe(200000);
    expect(goal!.currentAmount).toBe(0);
    expect(goal!.deadline).toBe(DEADLINE);
    expect(goal!.isArchived).toBe(false);
  });

  test("creates a goal without a deadline", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await asUser.mutation(api.goals.createGoal, {
      name: "Rainy Day",
      targetAmount: 50000,
    });
    expect(id).toBeDefined();
  });

  test("regression: rejects non-positive target", async () => {
    const { asUser } = await setupTestWithUser();
    await expect(
      asUser.mutation(api.goals.createGoal, { name: "Bad", targetAmount: 0 })
    ).rejects.toThrow("Target amount must be positive");
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();
    await expect(
      t.mutation(api.goals.createGoal, { name: "Unauthed", targetAmount: 1000 })
    ).rejects.toThrow("Unauthorized");
  });
});

// ─── updateGoal ──────────────────────────────────────────────────────────────

describe("updateGoal", () => {
  test("updates fields", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await asUser.mutation(api.goals.createGoal, {
      name: "Car",
      targetAmount: 500000,
    });

    await asUser.mutation(api.goals.updateGoal, {
      goalId: id,
      name: "New Car",
      targetAmount: 800000,
      deadline: DEADLINE,
    });

    const goal = await t.run(async (ctx) => ctx.db.get(id));
    expect(goal!.name).toBe("New Car");
    expect(goal!.targetAmount).toBe(800000);
    expect(goal!.deadline).toBe(DEADLINE);
  });

  test("blocks updating another user's goal", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    const id = await asUser.mutation(api.goals.createGoal, {
      name: "Car",
      targetAmount: 500000,
    });
    await expect(
      asUserB.mutation(api.goals.updateGoal, {
        goalId: id,
        name: "Hacked",
        targetAmount: 1,
      })
    ).rejects.toThrow("Goal not found");
  });
});

// ─── archive / unarchive ─────────────────────────────────────────────────────

describe("archiveGoal", () => {
  test("archives then unarchives", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await asUser.mutation(api.goals.createGoal, {
      name: "Car",
      targetAmount: 500000,
    });

    await asUser.mutation(api.goals.archiveGoal, { goalId: id });
    expect(await asUser.query(api.goals.getGoals)).toHaveLength(0);
    expect(await asUser.query(api.goals.getArchivedGoals)).toHaveLength(1);

    await asUser.mutation(api.goals.unarchiveGoal, { goalId: id });
    expect(await asUser.query(api.goals.getGoals)).toHaveLength(1);
  });

  test("rejects double archive", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await asUser.mutation(api.goals.createGoal, {
      name: "Car",
      targetAmount: 500000,
    });
    await asUser.mutation(api.goals.archiveGoal, { goalId: id });
    await expect(
      asUser.mutation(api.goals.archiveGoal, { goalId: id })
    ).rejects.toThrow("already archived");
  });
});

// ─── contributions ───────────────────────────────────────────────────────────

describe("contributions", () => {
  test("addContribution increments currentAmount", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await asUser.mutation(api.goals.createGoal, {
      name: "Vacation",
      targetAmount: 200000,
    });

    await asUser.mutation(api.goals.addContribution, {
      goalId: id,
      amount: 50000,
      date: Date.now(),
    });
    await asUser.mutation(api.goals.addContribution, {
      goalId: id,
      amount: 30000,
      date: Date.now(),
      note: "bonus",
    });

    const goal = await t.run(async (ctx) => ctx.db.get(id));
    expect(goal!.currentAmount).toBe(80000);

    const contribs = await asUser.query(api.goals.getContributions, {
      goalId: id,
    });
    expect(contribs).toHaveLength(2);
  });

  test("deleteContribution recalculates currentAmount", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await asUser.mutation(api.goals.createGoal, {
      name: "Vacation",
      targetAmount: 200000,
    });
    await asUser.mutation(api.goals.addContribution, {
      goalId: id,
      amount: 50000,
      date: Date.now(),
    });
    const contribs = await asUser.query(api.goals.getContributions, {
      goalId: id,
    });

    await asUser.mutation(api.goals.deleteContribution, {
      contributionId: contribs[0]._id,
    });

    const goal = await t.run(async (ctx) => ctx.db.get(id));
    expect(goal!.currentAmount).toBe(0);
  });

  test("regression: rejects non-positive contribution", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await asUser.mutation(api.goals.createGoal, {
      name: "Vacation",
      targetAmount: 200000,
    });
    await expect(
      asUser.mutation(api.goals.addContribution, {
        goalId: id,
        amount: 0,
        date: Date.now(),
      })
    ).rejects.toThrow("Amount must be positive");
  });

  test("blocks contributing to another user's goal", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    const id = await asUser.mutation(api.goals.createGoal, {
      name: "Vacation",
      targetAmount: 200000,
    });
    await expect(
      asUserB.mutation(api.goals.addContribution, {
        goalId: id,
        amount: 1000,
        date: Date.now(),
      })
    ).rejects.toThrow("Goal not found");
  });
});

// ─── deleteGoal cascade ──────────────────────────────────────────────────────

describe("deleteGoal", () => {
  test("cascade-deletes contributions", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await asUser.mutation(api.goals.createGoal, {
      name: "Vacation",
      targetAmount: 200000,
    });
    await asUser.mutation(api.goals.addContribution, {
      goalId: id,
      amount: 50000,
      date: Date.now(),
    });

    await asUser.mutation(api.goals.deleteGoal, { goalId: id });

    const remaining = await t.run(async (ctx) =>
      ctx.db
        .query("goal_contributions")
        .withIndex("by_goal", (q) => q.eq("goalId", id))
        .collect()
    );
    expect(remaining).toHaveLength(0);
    expect(await t.run(async (ctx) => ctx.db.get(id))).toBeNull();
  });
});

// ─── getActiveGoalsSummary ───────────────────────────────────────────────────

describe("getActiveGoalsSummary", () => {
  test("returns goals with percentage, closest first, limited", async () => {
    const { asUser } = await setupTestWithUser();

    const g1 = await asUser.mutation(api.goals.createGoal, {
      name: "Low",
      targetAmount: 100000,
    });
    const g2 = await asUser.mutation(api.goals.createGoal, {
      name: "High",
      targetAmount: 100000,
    });
    await asUser.mutation(api.goals.addContribution, {
      goalId: g1,
      amount: 10000,
      date: Date.now(),
    });
    await asUser.mutation(api.goals.addContribution, {
      goalId: g2,
      amount: 90000,
      date: Date.now(),
    });

    const summary = await asUser.query(api.goals.getActiveGoalsSummary, {
      limit: 3,
    });
    expect(summary[0].name).toBe("High");
    expect(summary[0].percentage).toBe(90);
    expect(summary[1].percentage).toBe(10);
  });

  test("does not return another user's goals", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    await asUser.mutation(api.goals.createGoal, {
      name: "Mine",
      targetAmount: 100000,
    });
    expect(
      await asUserB.query(api.goals.getActiveGoalsSummary, {})
    ).toHaveLength(0);
  });
});
