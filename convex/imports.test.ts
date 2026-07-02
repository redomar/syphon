import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

const now = Date.now();
const rows = [
  { type: "EXPENSE" as const, amount: 1500, description: "Coffee", date: now },
  { type: "INCOME" as const, amount: 300000, description: "Salary", date: now },
];

describe("importTransactions", () => {
  test("creates an import and tagged transactions", async () => {
    const { asUser } = await setupTestWithUser();
    const res = await asUser.mutation(api.imports.importTransactions, {
      fileName: "jan.csv",
      rows,
    });
    expect(res.count).toBe(2);

    const txns = await asUser.query(api.transactions.getTransactions, {});
    expect(txns).toHaveLength(2);
    expect(txns.every((t) => t.importId === res.importId)).toBe(true);

    const imports = await asUser.query(api.imports.getImports);
    expect(imports).toHaveLength(1);
    expect(imports[0].rowCount).toBe(2);
  });

  test("rejects empty import", async () => {
    const { asUser } = await setupTestWithUser();
    await expect(
      asUser.mutation(api.imports.importTransactions, { fileName: "x.csv", rows: [] })
    ).rejects.toThrow("No rows to import");
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();
    await expect(
      t.mutation(api.imports.importTransactions, { fileName: "x.csv", rows })
    ).rejects.toThrow("Unauthorized");
  });
});

describe("undoImport", () => {
  test("deletes the imported transactions and the record", async () => {
    const { asUser } = await setupTestWithUser();
    const res = await asUser.mutation(api.imports.importTransactions, {
      fileName: "jan.csv",
      rows,
    });
    const undo = await asUser.mutation(api.imports.undoImport, {
      importId: res.importId,
    });
    expect(undo.deleted).toBe(2);
    expect(await asUser.query(api.transactions.getTransactions, {})).toHaveLength(0);
    expect(await asUser.query(api.imports.getImports)).toHaveLength(0);
  });

  test("blocks undoing another user's import", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    const res = await asUser.mutation(api.imports.importTransactions, {
      fileName: "jan.csv",
      rows,
    });
    await expect(
      asUserB.mutation(api.imports.undoImport, { importId: res.importId })
    ).rejects.toThrow("Import not found");
  });
});
