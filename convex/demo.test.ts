import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser } from "./test.helpers";

describe("demo data", () => {
  test("seedDemoData creates tagged sample records", async () => {
    const { t, asUser } = await setupTestWithUser();
    await asUser.mutation(api.demo.seedDemoData, {});

    const txns = await asUser.query(api.transactions.getTransactions, {});
    expect(txns.length).toBe(12);
    expect(txns.every((tx) => tx.isDemoData)).toBe(true);

    expect(await asUser.query(api.goals.getGoals)).toHaveLength(2);
    expect(await asUser.query(api.debts.getDebts)).toHaveLength(1);
    expect(await asUser.query(api.budgets.getBudgets)).toHaveLength(1);

    const user = await t.run(async (ctx) =>
      ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", "clerk_test_user_a"))
        .unique()
    );
    expect(user?.isDemoMode).toBe(true);
  });

  test("clearDemoData removes all demo records", async () => {
    const { asUser } = await setupTestWithUser();
    await asUser.mutation(api.demo.seedDemoData, {});
    await asUser.mutation(api.demo.clearDemoData, {});

    expect(await asUser.query(api.transactions.getTransactions, {})).toHaveLength(0);
    expect(await asUser.query(api.goals.getGoals)).toHaveLength(0);
    expect(await asUser.query(api.debts.getDebts)).toHaveLength(0);
    expect(await asUser.query(api.budgets.getBudgets)).toHaveLength(0);
  });

  test("clearDemoData keeps non-demo records", async () => {
    const { asUser } = await setupTestWithUser();
    await asUser.mutation(api.goals.createGoal, { name: "Real", targetAmount: 1000 });
    await asUser.mutation(api.demo.seedDemoData, {});
    await asUser.mutation(api.demo.clearDemoData, {});

    const goals = await asUser.query(api.goals.getGoals);
    expect(goals).toHaveLength(1);
    expect(goals[0].name).toBe("Real");
  });
});
