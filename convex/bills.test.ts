import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

// ─── createBill ──────────────────────────────────────────────────────────────

describe("createBill", () => {
  test("creates a bill with correct fields", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.bills.createBill, {
      name: "Rent",
      amount: 120000,
      category: "necessary",
    });

    const bill = await t.run(async (ctx) => ctx.db.get(id));
    expect(bill!.name).toBe("Rent");
    expect(bill!.amount).toBe(120000);
    expect(bill!.category).toBe("necessary");
    expect(bill!.isArchived).toBe(false);
  });

  test("regression: rejects non-positive amount", async () => {
    const { asUser } = await setupTestWithUser();

    await expect(
      asUser.mutation(api.bills.createBill, {
        name: "Free",
        amount: 0,
        category: "luxury",
      })
    ).rejects.toThrow("Amount must be positive");
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();

    await expect(
      t.mutation(api.bills.createBill, {
        name: "Unauthed",
        amount: 1000,
        category: "necessary",
      })
    ).rejects.toThrow("Unauthorized");
  });
});

// ─── updateBill ──────────────────────────────────────────────────────────────

describe("updateBill", () => {
  test("updates name, amount and category", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.bills.createBill, {
      name: "Gym",
      amount: 3000,
      category: "luxury",
    });

    await asUser.mutation(api.bills.updateBill, {
      billId: id,
      name: "Gym Premium",
      amount: 4500,
      category: "necessary",
    });

    const bill = await t.run(async (ctx) => ctx.db.get(id));
    expect(bill!.name).toBe("Gym Premium");
    expect(bill!.amount).toBe(4500);
    expect(bill!.category).toBe("necessary");
  });

  test("regression: rejects non-positive amount on update", async () => {
    const { asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.bills.createBill, {
      name: "Phone",
      amount: 2000,
      category: "necessary",
    });

    await expect(
      asUser.mutation(api.bills.updateBill, {
        billId: id,
        name: "Phone",
        amount: -1,
        category: "necessary",
      })
    ).rejects.toThrow("Amount must be positive");
  });

  test("blocks updating another user's bill", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const id = await asUser.mutation(api.bills.createBill, {
      name: "Rent",
      amount: 120000,
      category: "necessary",
    });

    await expect(
      asUserB.mutation(api.bills.updateBill, {
        billId: id,
        name: "Hacked",
        amount: 1,
        category: "luxury",
      })
    ).rejects.toThrow("Bill not found");
  });
});

// ─── deleteBill ──────────────────────────────────────────────────────────────

describe("deleteBill", () => {
  test("deletes a bill", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.bills.createBill, {
      name: "Netflix",
      amount: 999,
      category: "luxury",
    });

    await asUser.mutation(api.bills.deleteBill, { billId: id });

    const bill = await t.run(async (ctx) => ctx.db.get(id));
    expect(bill).toBeNull();
  });

  test("blocks deleting another user's bill", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const id = await asUser.mutation(api.bills.createBill, {
      name: "Rent",
      amount: 120000,
      category: "necessary",
    });

    await expect(
      asUserB.mutation(api.bills.deleteBill, { billId: id })
    ).rejects.toThrow("Bill not found");
  });
});

// ─── getBills ──────────────────────────────────────────────────────────────

describe("getBills", () => {
  test("returns active bills newest first", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.bills.createBill, {
      name: "First",
      amount: 1000,
      category: "necessary",
    });
    await asUser.mutation(api.bills.createBill, {
      name: "Second",
      amount: 2000,
      category: "luxury",
    });

    const bills = await asUser.query(api.bills.getBills, {});
    expect(bills).toHaveLength(2);
    expect(bills[0].name).toBe("Second");
    expect(bills[1].name).toBe("First");
  });

  test("filters by category", async () => {
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

    const luxury = await asUser.query(api.bills.getBills, { category: "luxury" });
    expect(luxury).toHaveLength(1);
    expect(luxury[0].name).toBe("Netflix");
  });

  test("does not return another user's bills", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    await asUser.mutation(api.bills.createBill, {
      name: "Rent",
      amount: 120000,
      category: "necessary",
    });

    const bills = await asUserB.query(api.bills.getBills, {});
    expect(bills).toHaveLength(0);
  });
});
