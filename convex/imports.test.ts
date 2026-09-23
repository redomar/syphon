import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";
import type { Id } from "./_generated/dataModel";

const now = Date.now();

type Row = {
  ref: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  date: number;
  dedupeKey: string;
  merchant?: string;
  rawDescription?: string;
  isRefund?: boolean;
  direction?: "in" | "out";
  sourceRow?: Record<string, string>;
  categoryId?: Id<"categories">;
  accountId?: Id<"accounts">;
};

const rows: Row[] = [
  { ref: 0, type: "EXPENSE", amount: 1500, description: "Costa Coffee", merchant: "Costa Coffee", rawDescription: "COSTA COFFEE 43011200  EDGBASTON GBR", date: now, dedupeKey: "k0", sourceRow: { Date: "2026-09-21", "Account Name": "Lloyds" } },
  { ref: 1, type: "INCOME", amount: 300000, description: "Salary", date: now, dedupeKey: "k1" },
  { ref: 2, type: "EXPENSE", amount: 999, description: "Refund", isRefund: true, date: now, dedupeKey: "k2" },
];

async function start(asUser: Awaited<ReturnType<typeof setupTestWithUser>>["asUser"], total = rows.length) {
  return await asUser.mutation(api.imports.startImport, { fileName: "jan.csv", total });
}

describe("batched import", () => {
  test("start -> append -> finish records counts and stores the new fields", async () => {
    const { asUser } = await setupTestWithUser();
    const importId = await start(asUser);
    const res = await asUser.mutation(api.imports.appendBatch, { importId, rows });
    expect(res).toMatchObject({ inserted: 3, duplicate: 0 });
    expect(res.results.map((r) => r.ref)).toEqual([0, 1, 2]);

    await asUser.mutation(api.imports.finishImport, {
      importId, excluded: 1, skipped: 2, transfers: 0, refunds: 1,
    });

    const txns = await asUser.query(api.transactions.getTransactions, {});
    expect(txns).toHaveLength(3);
    const coffee = txns.find((t) => t.description === "Costa Coffee")!;
    expect(coffee).toMatchObject({
      merchant: "Costa Coffee",
      rawDescription: "COSTA COFFEE 43011200  EDGBASTON GBR",
      status: "posted",
      importId,
      dedupeKey: "k0",
    });
    expect(coffee.sourceRow).toEqual({ Date: "2026-09-21", "Account Name": "Lloyds" });

    const [imp] = await asUser.query(api.imports.getImports);
    expect(imp.status).toBe("complete");
    expect(imp.rowCount).toBe(3);
    expect(imp.counts).toEqual({ total: 3, inserted: 3, duplicate: 0, excluded: 1, skipped: 2, transfers: 0, refunds: 1 });
  });

  test("re-sending rows is idempotent (dedupe on dedupeKey) — an interrupted import can resume", async () => {
    const { asUser } = await setupTestWithUser();
    const first = await start(asUser);
    await asUser.mutation(api.imports.appendBatch, { importId: first, rows: rows.slice(0, 2) });
    // "crash", then run the whole file again under a new import
    const second = await start(asUser);
    const res = await asUser.mutation(api.imports.appendBatch, { importId: second, rows });
    expect(res).toMatchObject({ inserted: 1, duplicate: 2 });
    expect(res.results.filter((r) => r.duplicate).map((r) => r.ref)).toEqual([0, 1]);
    expect(await asUser.query(api.transactions.getTransactions, {})).toHaveLength(3);
  });

  test("rejects batches over the limit, non-positive amounts and finished imports", async () => {
    const { asUser } = await setupTestWithUser();
    const importId = await start(asUser);
    const big = Array.from({ length: 501 }, (_, i) => ({ ...rows[0], ref: i, dedupeKey: `b${i}` }));
    await expect(asUser.mutation(api.imports.appendBatch, { importId, rows: big })).rejects.toThrow(/At most 500/);
    await expect(
      asUser.mutation(api.imports.appendBatch, { importId, rows: [{ ...rows[0], amount: 0 }] })
    ).rejects.toThrow("Amount must be positive");
    await asUser.mutation(api.imports.finishImport, { importId, excluded: 0, skipped: 0, transfers: 0, refunds: 0 });
    await expect(asUser.mutation(api.imports.appendBatch, { importId, rows })).rejects.toThrow("not in progress");
  });

  test("rejects another user's category or account", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    const theirCat = await asUserB.mutation(api.categories.createCategory, {
      name: "Theirs", type: "expense", color: "#000000", icon: "X",
    });
    const importId = await start(asUser);
    await expect(
      asUser.mutation(api.imports.appendBatch, { importId, rows: [{ ...rows[0], categoryId: theirCat }] })
    ).rejects.toThrow("Category or account not found");
  });

  test("linkTransfers pairs TRANSFER legs both ways and ignores non-transfers", async () => {
    const { asUser } = await setupTestWithUser();
    const importId = await start(asUser, 3);
    const legs: Row[] = [
      { ref: 0, type: "TRANSFER", direction: "out", amount: 50000, description: "To TSB", date: now, dedupeKey: "t0" },
      { ref: 1, type: "TRANSFER", direction: "in", amount: 50000, description: "From Monzo", date: now, dedupeKey: "t1" },
      { ref: 2, type: "EXPENSE", amount: 50000, description: "Rent", date: now, dedupeKey: "t2" },
    ];
    const { results } = await asUser.mutation(api.imports.appendBatch, { importId, rows: legs });
    const id = (ref: number) => results.find((r) => r.ref === ref)!.id;
    const res = await asUser.mutation(api.imports.linkTransfers, {
      importId,
      pairs: [{ a: id(0), b: id(1) }, { a: id(0), b: id(2) }],
    });
    expect(res.linked).toBe(1);
    const transfers = await asUser.query(api.transactions.getTransactions, { type: "TRANSFER" });
    const out = transfers.find((t) => t.direction === "out")!;
    const inn = transfers.find((t) => t.direction === "in")!;
    expect(out.transferPairId).toBe(inn._id);
    expect(inn.transferPairId).toBe(out._id);
  });

  test("finishImport saves and then updates the profile for a header fingerprint", async () => {
    const { asUser } = await setupTestWithUser();
    const profile = {
      name: "Aggregator export",
      headerFingerprint: "fp1",
      mapping: { date: 0 },
      categoryMap: { "Eating Out": "__none__" },
      accountMap: {},
    };
    const a = await start(asUser);
    const { profileId } = await asUser.mutation(api.imports.finishImport, {
      importId: a, excluded: 0, skipped: 0, transfers: 0, refunds: 0, profile,
    });
    const b = await start(asUser);
    const again = await asUser.mutation(api.imports.finishImport, {
      importId: b, excluded: 0, skipped: 0, transfers: 0, refunds: 0,
      profile: { ...profile, categoryMap: { "Eating Out": "__exclude__" } },
    });
    expect(again.profileId).toBe(profileId);
    const saved = await asUser.query(api.importProfiles.getByFingerprint, { headerFingerprint: "fp1" });
    expect(saved?.categoryMap).toEqual({ "Eating Out": "__exclude__" });
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();
    await expect(t.mutation(api.imports.startImport, { fileName: "x.csv", total: 1 })).rejects.toThrow("Unauthorized");
  });
});

describe("undoImport", () => {
  test("deletes the imported transactions in batches, then the record", async () => {
    const { asUser } = await setupTestWithUser();
    const importId = await start(asUser, 620);
    const many = (from: number, n: number) =>
      Array.from({ length: n }, (_, i) => ({ ...rows[0], ref: from + i, dedupeKey: `u${from + i}` }));
    await asUser.mutation(api.imports.appendBatch, { importId, rows: many(0, 500) });
    await asUser.mutation(api.imports.appendBatch, { importId, rows: many(500, 120) });

    const first = await asUser.mutation(api.imports.undoImport, { importId });
    expect(first).toEqual({ deleted: 500, done: false });
    const second = await asUser.mutation(api.imports.undoImport, { importId });
    expect(second).toEqual({ deleted: 120, done: true });
    expect(await asUser.query(api.transactions.getTransactions, {})).toHaveLength(0);
    expect(await asUser.query(api.imports.getImports)).toHaveLength(0);
  });

  test("unlinks a transfer partner that lives outside the undone import", async () => {
    const { asUser } = await setupTestWithUser();
    const a = await start(asUser, 1);
    const outLeg = await asUser.mutation(api.imports.appendBatch, {
      importId: a,
      rows: [{ ref: 0, type: "TRANSFER", direction: "out", amount: 100, description: "Out", date: now, dedupeKey: "x0" }],
    });
    const b = await start(asUser, 1);
    const inLeg = await asUser.mutation(api.imports.appendBatch, {
      importId: b,
      rows: [{ ref: 0, type: "TRANSFER", direction: "in", amount: 100, description: "In", date: now, dedupeKey: "x1" }],
    });
    await asUser.mutation(api.imports.linkTransfers, {
      importId: b,
      pairs: [{ a: outLeg.results[0].id, b: inLeg.results[0].id }],
    });
    await asUser.mutation(api.imports.undoImport, { importId: b });
    const [remaining] = await asUser.query(api.transactions.getTransactions, {});
    expect(remaining.description).toBe("Out");
    expect(remaining.transferPairId).toBeUndefined();
  });

  test("blocks undoing another user's import", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    const importId = await start(asUser);
    await expect(asUserB.mutation(api.imports.undoImport, { importId })).rejects.toThrow("Import not found");
  });
});

describe("merchant rules", () => {
  test("learned rules never overwrite manual ones; manual overwrites learned", async () => {
    const { asUser } = await setupTestWithUser();
    await asUser.mutation(api.merchantRules.upsertRules, {
      rules: [
        { pattern: "openai *chatgpt", merchant: "OpenAI", source: "learned" },
        { pattern: "sq *eis cafe", merchant: "Eis Cafe", source: "manual" },
      ],
    });
    const res = await asUser.mutation(api.merchantRules.upsertRules, {
      rules: [
        { pattern: "openai *chatgpt", merchant: "ChatGPT", source: "manual" },
        { pattern: "sq *eis cafe", merchant: "EIS", source: "learned" },
      ],
    });
    expect(res).toEqual({ created: 0, updated: 1 });
    const rules = await asUser.query(api.merchantRules.listRules);
    expect(Object.fromEntries(rules.map((r) => [r.pattern, [r.merchant, r.source]]))).toEqual({
      "openai *chatgpt": ["ChatGPT", "manual"],
      "sq *eis cafe": ["Eis Cafe", "manual"],
    });
  });

  test("rules are per user", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    await asUser.mutation(api.merchantRules.upsertRules, {
      rules: [{ pattern: "tesco", merchant: "Tesco", source: "learned" }],
    });
    expect(await asUserB.query(api.merchantRules.listRules)).toEqual([]);
  });
});
