import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

const d = (y: number, m: number, day: number) => Date.UTC(y, m, day);

async function makeMonthly(
  asUser: Awaited<ReturnType<typeof setupTestWithUser>>["asUser"],
  startDate: number,
  dayOfMonth = 15,
  amount = 1000
) {
  return await asUser.mutation(api.recurring.createRecurring, {
    type: "EXPENSE",
    amount,
    description: "Netflix",
    frequency: "monthly",
    dayOfMonth,
    startDate,
  });
}

// ─── createRecurring ─────────────────────────────────────────────────────────

describe("createRecurring", () => {
  test("creates an active template", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await makeMonthly(asUser, d(2026, 0, 15));
    const tpl = await t.run(async (ctx) => ctx.db.get(id));
    expect(tpl!.isActive).toBe(true);
    expect(tpl!.frequency).toBe("monthly");
  });

  test("regression: rejects bad dayOfMonth", async () => {
    const { asUser } = await setupTestWithUser();
    await expect(
      asUser.mutation(api.recurring.createRecurring, {
        type: "EXPENSE",
        amount: 1000,
        description: "x",
        frequency: "monthly",
        dayOfMonth: 40,
        startDate: d(2026, 0, 1),
      })
    ).rejects.toThrow("Day of month must be between 1 and 31");
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();
    await expect(
      t.mutation(api.recurring.createRecurring, {
        type: "EXPENSE",
        amount: 1000,
        description: "x",
        frequency: "monthly",
        startDate: d(2026, 0, 1),
      })
    ).rejects.toThrow("Unauthorized");
  });
});

// ─── projection engine ───────────────────────────────────────────────────────

describe("getProjectedTransactions", () => {
  test("expands monthly occurrences in range", async () => {
    const { asUser } = await setupTestWithUser();
    await makeMonthly(asUser, d(2026, 0, 15), 15);

    const proj = await asUser.query(api.recurring.getProjectedTransactions, {
      startDate: d(2026, 0, 1),
      endDate: d(2026, 2, 31),
    });
    expect(proj.map((p) => p.date)).toEqual([
      d(2026, 0, 15),
      d(2026, 1, 15),
      d(2026, 2, 15),
    ]);
    expect(proj[0].isProjected).toBe(true);
  });

  test("expands weekly occurrences", async () => {
    const { asUser } = await setupTestWithUser();
    await asUser.mutation(api.recurring.createRecurring, {
      type: "INCOME",
      amount: 5000,
      description: "Side gig",
      frequency: "weekly",
      startDate: d(2026, 0, 1),
    });
    const proj = await asUser.query(api.recurring.getProjectedTransactions, {
      startDate: d(2026, 0, 1),
      endDate: d(2026, 0, 29),
    });
    expect(proj).toHaveLength(5); // 1, 8, 15, 22, 29
  });

  test("clamps monthly day to short months", async () => {
    const { asUser } = await setupTestWithUser();
    await makeMonthly(asUser, d(2026, 0, 31), 31);
    const proj = await asUser.query(api.recurring.getProjectedTransactions, {
      startDate: d(2026, 0, 1),
      endDate: d(2026, 1, 28),
    });
    // Jan 31 + Feb (clamped to 28)
    expect(proj.map((p) => p.date)).toEqual([d(2026, 0, 31), d(2026, 1, 28)]);
  });

  test("respects endDate", async () => {
    const { asUser } = await setupTestWithUser();
    await asUser.mutation(api.recurring.createRecurring, {
      type: "EXPENSE",
      amount: 1000,
      description: "x",
      frequency: "monthly",
      dayOfMonth: 15,
      startDate: d(2026, 0, 15),
      endDate: d(2026, 1, 1),
    });
    const proj = await asUser.query(api.recurring.getProjectedTransactions, {
      startDate: d(2026, 0, 1),
      endDate: d(2026, 5, 1),
    });
    expect(proj).toHaveLength(1); // only Jan 15 (Feb 15 is after endDate Feb 1)
  });

  test("inactive templates produce no projections", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await makeMonthly(asUser, d(2026, 0, 15));
    await asUser.mutation(api.recurring.setRecurringActive, {
      recurringId: id,
      isActive: false,
    });
    const proj = await asUser.query(api.recurring.getProjectedTransactions, {
      startDate: d(2026, 0, 1),
      endDate: d(2026, 2, 31),
    });
    expect(proj).toHaveLength(0);
  });
});

// ─── actualize ───────────────────────────────────────────────────────────────

describe("markPaid / skip", () => {
  test("markPaid creates a transaction and excludes the occurrence", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await makeMonthly(asUser, d(2026, 0, 15), 15, 1000);

    await asUser.mutation(api.recurring.markPaid, {
      recurringId: id,
      occurrenceDate: d(2026, 0, 15),
      amount: 1000,
    });

    const proj = await asUser.query(api.recurring.getProjectedTransactions, {
      startDate: d(2026, 0, 1),
      endDate: d(2026, 0, 31),
    });
    expect(proj).toHaveLength(0); // Jan 15 now actualized

    const txns = await asUser.query(api.transactions.getTransactions, {});
    const fromRecurring = txns.filter((t) => t.recurringTemplateId === id);
    expect(fromRecurring).toHaveLength(1);
    expect(fromRecurring[0].amount).toBe(1000);
  });

  test("markPaid with edited amount records MODIFIED", async () => {
    const { t, asUser } = await setupTestWithUser();
    const id = await makeMonthly(asUser, d(2026, 0, 15), 15, 1000);

    await asUser.mutation(api.recurring.markPaid, {
      recurringId: id,
      occurrenceDate: d(2026, 0, 15),
      amount: 1200,
    });

    const instances = await t.run(async (ctx) =>
      ctx.db
        .query("recurring_instances")
        .withIndex("by_recurring", (q) => q.eq("recurringId", id))
        .collect()
    );
    expect(instances[0].status).toBe("MODIFIED");
    expect(instances[0].actualAmount).toBe(1200);
  });

  test("cannot mark the same occurrence twice", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await makeMonthly(asUser, d(2026, 0, 15));
    await asUser.mutation(api.recurring.markPaid, {
      recurringId: id,
      occurrenceDate: d(2026, 0, 15),
      amount: 1000,
    });
    await expect(
      asUser.mutation(api.recurring.markPaid, {
        recurringId: id,
        occurrenceDate: d(2026, 0, 15),
        amount: 1000,
      })
    ).rejects.toThrow("already been resolved");
  });

  test("skip excludes the occurrence; unresolve restores it", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await makeMonthly(asUser, d(2026, 0, 15), 15);

    await asUser.mutation(api.recurring.skipOccurrence, {
      recurringId: id,
      occurrenceDate: d(2026, 0, 15),
    });
    let proj = await asUser.query(api.recurring.getProjectedTransactions, {
      startDate: d(2026, 0, 1),
      endDate: d(2026, 0, 31),
    });
    expect(proj).toHaveLength(0);

    await asUser.mutation(api.recurring.unresolveOccurrence, {
      recurringId: id,
      occurrenceDate: d(2026, 0, 15),
    });
    proj = await asUser.query(api.recurring.getProjectedTransactions, {
      startDate: d(2026, 0, 1),
      endDate: d(2026, 0, 31),
    });
    expect(proj).toHaveLength(1);
  });

  test("unresolve removes the actualized transaction", async () => {
    const { asUser } = await setupTestWithUser();
    const id = await makeMonthly(asUser, d(2026, 0, 15), 15, 1000);
    await asUser.mutation(api.recurring.markPaid, {
      recurringId: id,
      occurrenceDate: d(2026, 0, 15),
      amount: 1000,
    });
    await asUser.mutation(api.recurring.unresolveOccurrence, {
      recurringId: id,
      occurrenceDate: d(2026, 0, 15),
    });
    const txns = await asUser.query(api.transactions.getTransactions, {});
    expect(txns.filter((t) => t.recurringTemplateId === id)).toHaveLength(0);
  });

  test("blocks marking another user's template", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    const id = await makeMonthly(asUser, d(2026, 0, 15));
    await expect(
      asUserB.mutation(api.recurring.markPaid, {
        recurringId: id,
        occurrenceDate: d(2026, 0, 15),
        amount: 1000,
      })
    ).rejects.toThrow("Recurring template not found");
  });
});

// ─── upcoming bills (E8.S4) ──────────────────────────────────────────────────

describe("getUpcomingBills", () => {
  test("returns pending EXPENSE occurrences within the window", async () => {
    const { asUser } = await setupTestWithUser();
    const today = new Date();
    const todayMid = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    );
    // weekly expense starting today → at least one due within 7 days
    await asUser.mutation(api.recurring.createRecurring, {
      type: "EXPENSE",
      amount: 1500,
      description: "Weekly shop",
      frequency: "weekly",
      startDate: todayMid,
    });
    // an income template must NOT appear as a bill
    await asUser.mutation(api.recurring.createRecurring, {
      type: "INCOME",
      amount: 50000,
      description: "Pay",
      frequency: "weekly",
      startDate: todayMid,
    });

    const bills = await asUser.query(api.recurring.getUpcomingBills, { days: 7 });
    expect(bills.length).toBeGreaterThan(0);
    expect(bills.every((b) => b.description === "Weekly shop")).toBe(true);
    expect(bills[0].daysUntil).toBeGreaterThanOrEqual(0);
  });
});

// ─── convergence ─────────────────────────────────────────────────────────────

describe("migrateBillsToRecurring", () => {
  test("converts active bills into monthly recurring expenses", async () => {
    const { asUser } = await setupTestWithUser();
    await asUser.mutation(api.bills.createBill, {
      name: "Rent",
      amount: 120000,
      category: "necessary",
    });
    await asUser.mutation(api.bills.createBill, {
      name: "Netflix",
      amount: 999,
      category: "luxury",
    });

    const result = await asUser.mutation(api.recurring.migrateBillsToRecurring, {});
    expect(result.migrated).toBe(2);

    // bills archived
    expect(await asUser.query(api.bills.getBills, {})).toHaveLength(0);

    // recurring created with mapped budget groups
    const recurring = await asUser.query(api.recurring.getRecurring);
    expect(recurring).toHaveLength(2);
    const rent = recurring.find((r) => r.description === "Rent");
    expect(rent!.budgetGroup).toBe("NEEDS");
    expect(rent!.frequency).toBe("monthly");
    const netflix = recurring.find((r) => r.description === "Netflix");
    expect(netflix!.budgetGroup).toBe("WANTS");
  });
});
