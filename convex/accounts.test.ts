import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

const ACCOUNT_ARGS = {
  name: "Barclays",
  type: "checking" as const,
  provider: "Barclays",
  lastFourDigits: "1234",
  balance: 100000, // £1000 in cents
  currency: "GBP" as const,
};

describe("createAccount", () => {
  test("creates an account with correct fields", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);
    expect(id).toBeDefined();

    const account = await t.run(async (ctx) => ctx.db.get(id));
    expect(account!.name).toBe("Barclays");
    expect(account!.isArchived).toBe(false);
    expect(account!.balance).toBe(100000);
  });

  test("prevents duplicate name+lastFourDigits combination", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);

    await expect(
      asUser.mutation(api.accounts.createAccount, {
        ...ACCOUNT_ARGS,
        provider: "Different",
      })
    ).rejects.toThrow("already exists");
  });

  test("allows same name with different lastFourDigits", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);

    const id = await asUser.mutation(api.accounts.createAccount, {
      ...ACCOUNT_ARGS,
      lastFourDigits: "5678",
    });
    expect(id).toBeDefined();
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();

    await expect(
      t.mutation(api.accounts.createAccount, ACCOUNT_ARGS)
    ).rejects.toThrow("Unauthorized");
  });
});

describe("updateAccount", () => {
  test("updates all fields correctly", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);

    await asUser.mutation(api.accounts.updateAccount, {
      accountId: id,
      name: "HSBC",
      type: "savings",
      provider: "HSBC",
      lastFourDigits: "9999",
      balance: 200000,
      currency: "USD",
    });

    const account = await t.run(async (ctx) => ctx.db.get(id));
    expect(account!.name).toBe("HSBC");
    expect(account!.type).toBe("savings");
    expect(account!.balance).toBe(200000);
  });

  test("prevents updating to duplicate name+lastFourDigits", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);

    const id2 = await asUser.mutation(api.accounts.createAccount, {
      ...ACCOUNT_ARGS,
      name: "HSBC",
      lastFourDigits: "5678",
    });

    await expect(
      asUser.mutation(api.accounts.updateAccount, {
        accountId: id2,
        ...ACCOUNT_ARGS,
      })
    ).rejects.toThrow("already exists");
  });

  test("blocks updating another user's account", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const id = await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);

    await expect(
      asUserB.mutation(api.accounts.updateAccount, {
        accountId: id,
        ...ACCOUNT_ARGS,
        name: "Hacked",
      })
    ).rejects.toThrow("Account not found");
  });
});

describe("archiveAccount", () => {
  test("sets isArchived to true", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);
    await asUser.mutation(api.accounts.archiveAccount, { accountId: id });

    const account = await t.run(async (ctx) => ctx.db.get(id));
    expect(account!.isArchived).toBe(true);
  });

  test("prevents double-archiving", async () => {
    const { asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);
    await asUser.mutation(api.accounts.archiveAccount, { accountId: id });

    await expect(
      asUser.mutation(api.accounts.archiveAccount, { accountId: id })
    ).rejects.toThrow("already archived");
  });

  test("blocks archiving another user's account", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const id = await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);

    await expect(
      asUserB.mutation(api.accounts.archiveAccount, { accountId: id })
    ).rejects.toThrow("Account not found");
  });
});

describe("unarchiveAccount", () => {
  test("restores an archived account", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);
    await asUser.mutation(api.accounts.archiveAccount, { accountId: id });
    await asUser.mutation(api.accounts.unarchiveAccount, { accountId: id });

    const account = await t.run(async (ctx) => ctx.db.get(id));
    expect(account!.isArchived).toBe(false);
  });

  test("prevents unarchiving a non-archived account", async () => {
    const { asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);

    await expect(
      asUser.mutation(api.accounts.unarchiveAccount, { accountId: id })
    ).rejects.toThrow("not archived");
  });
});

describe("getActiveAccounts", () => {
  test("returns only non-archived accounts", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);
    const archivedId = await asUser.mutation(api.accounts.createAccount, {
      ...ACCOUNT_ARGS,
      name: "Old Account",
      lastFourDigits: "0000",
    });
    await asUser.mutation(api.accounts.archiveAccount, {
      accountId: archivedId,
    });

    const accounts = await asUser.query(api.accounts.getActiveAccounts);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe("Barclays");
  });

  test("returns empty array when no accounts exist", async () => {
    const { asUser } = await setupTestWithUser();

    const accounts = await asUser.query(api.accounts.getActiveAccounts);
    expect(accounts).toHaveLength(0);
  });

  test("does not return another user's accounts", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);

    const accounts = await asUserB.query(api.accounts.getActiveAccounts);
    expect(accounts).toHaveLength(0);
  });
});

describe("getArchivedAccounts", () => {
  test("returns only archived accounts", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);
    const archivedId = await asUser.mutation(api.accounts.createAccount, {
      ...ACCOUNT_ARGS,
      name: "Old",
      lastFourDigits: "0000",
    });
    await asUser.mutation(api.accounts.archiveAccount, {
      accountId: archivedId,
    });

    const accounts = await asUser.query(api.accounts.getArchivedAccounts);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe("Old");
  });
});

describe("getAccounts", () => {
  test("returns both active and archived accounts", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.accounts.createAccount, ACCOUNT_ARGS);
    const archivedId = await asUser.mutation(api.accounts.createAccount, {
      ...ACCOUNT_ARGS,
      name: "Old",
      lastFourDigits: "0000",
    });
    await asUser.mutation(api.accounts.archiveAccount, {
      accountId: archivedId,
    });

    const accounts = await asUser.query(api.accounts.getAccounts);
    expect(accounts).toHaveLength(2);
  });
});
