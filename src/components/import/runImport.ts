import type { ConvexReactClient } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { learnablePairs, prepareRows, summarize } from "@/lib/import/classify";
import { learnRules, RuleIndex } from "@/lib/import/merchant";
import { CREATE, guessAccountType, tidyLabel } from "@/lib/import/suggest";
import type { ImportMapping, MerchantRule, PreparedRow } from "@/lib/import/types";
import { NEW_PREFIX, buildValueMaps, colorFor, newCategoryType, resolvePlaceholders, type CategoryLite, type ValueStat } from "./model";

export const BATCH = 500;

export interface RunInput {
  fileName: string;
  headers: string[];
  rows: string[][];
  mapping: ImportMapping;
  catChoices: Record<string, string>;
  acctChoices: Record<string, string>;
  catStats: ValueStat[];
  /** CSV account value -> provider (from the provider column), for new accounts. */
  acctProviders: Record<string, string>;
  categories: (CategoryLite & { isArchived?: boolean })[];
  accounts: { _id: string; name: string; lastFourDigits: string }[];
  rules: MerchantRule[];
  manualRules: MerchantRule[];
  fingerprint: string;
  profileName: string;
  currency: "GBP" | "USD" | "EUR" | "CAD" | "AUD";
}

export interface RunResult {
  importId: Id<"imports">;
  inserted: number;
  duplicate: number;
  linked: number;
  rulesLearned: number;
  createdCategories: number;
  createdAccounts: number;
  rows: PreparedRow[];
}

type Progress = (stage: string, done: number, total: number) => void;

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Runs a full import: create any new categories/accounts, save manual merchant
 * rules, write rows in batches, link transfer legs, learn rules, and finish
 * (which also saves the import profile). Safe to re-run after a failure.
 */
export async function runImport(convex: ConvexReactClient, input: RunInput, onProgress: Progress): Promise<RunResult> {
  const created = new Map<string, string>();
  let createdCategories = 0;
  let createdAccounts = 0;

  // 1. categories
  onProgress("Creating categories", 0, 1);
  const statsByValue = new Map(input.catStats.map((s) => [s.value, s]));
  let colour = input.categories.length;
  for (const [value, choice] of Object.entries(input.catChoices)) {
    if (choice !== CREATE) continue;
    const name = tidyLabel(value);
    const type = newCategoryType(statsByValue.get(value));
    const existing = input.categories.find((c) => c.type === type && c.name.toLowerCase() === name.toLowerCase());
    let id = existing?._id;
    if (!id) {
      id = await convex.mutation(api.categories.createCategory, { name, type, color: colorFor(colour++), icon: "Tag" });
      createdCategories++;
    }
    created.set(NEW_PREFIX + name, id);
  }

  // 2. accounts
  onProgress("Creating accounts", 0, 1);
  for (const [value, choice] of Object.entries(input.acctChoices)) {
    if (choice !== CREATE) continue;
    const existing = input.accounts.find((a) => a.name.toLowerCase() === value.toLowerCase() && a.lastFourDigits === "");
    let id = existing?._id;
    if (!id) {
      const provider = input.acctProviders[value] || value;
      id = await convex.mutation(api.accounts.createAccount, {
        name: value,
        type: guessAccountType(value, provider),
        provider,
        lastFourDigits: "",
        balance: 0,
        currency: input.currency,
      });
      createdAccounts++;
    }
    created.set(NEW_PREFIX + value, id);
  }

  // 3. manual rules first, so they win in this run and in future ones
  for (const batch of chunks(input.manualRules, BATCH)) {
    await convex.mutation(api.merchantRules.upsertRules, {
      rules: batch.map((r) => ({ pattern: r.pattern, merchant: r.merchant, source: "manual" as const })),
    });
  }

  // 4. final rows with real ids
  const maps = resolvePlaceholders(
    buildValueMaps(input.catChoices, input.acctChoices, input.catStats, input.categories),
    created
  );
  const rules = new RuleIndex([...input.rules, ...input.manualRules]);
  const rows = prepareRows(input.headers, input.rows, input.mapping, maps, rules);
  const summary = summarize(rows);
  const toWrite = rows.filter((r) => r.outcome === "import");

  // 5. batches
  const importId = await convex.mutation(api.imports.startImport, {
    fileName: input.fileName,
    total: rows.length,
    mappingSnapshot: input.mapping,
  });
  const idByIndex = new Map<number, Id<"transactions">>();
  let inserted = 0;
  let duplicate = 0;
  const batches = chunks(toWrite, BATCH);
  for (let i = 0; i < batches.length; i++) {
    onProgress("Importing transactions", i * BATCH, toWrite.length);
    const res = await convex.mutation(api.imports.appendBatch, {
      importId,
      rows: batches[i].map((r) => ({
        ref: r.index,
        type: r.type,
        amount: r.amount,
        description: r.description,
        date: r.date,
        categoryId: r.categoryId as Id<"categories"> | undefined,
        accountId: r.accountId as Id<"accounts"> | undefined,
        merchant: r.merchant,
        merchantSource: r.merchantSource,
        rawDescription: r.rawDescription || undefined,
        externalCategory: r.externalCategory,
        isRefund: r.isRefund || undefined,
        direction: r.direction,
        dedupeKey: r.dedupeKey,
        sourceRow: r.sourceRow,
      })),
    });
    inserted += res.inserted;
    duplicate += res.duplicate;
    for (const x of res.results) idByIndex.set(x.ref, x.id);
  }
  onProgress("Importing transactions", toWrite.length, toWrite.length);

  // 6. transfer links
  const pairs = toWrite
    .filter((r) => r.type === "TRANSFER" && r.direction === "in" && r.pairIndex !== undefined)
    .map((r) => ({ a: idByIndex.get(r.index)!, b: idByIndex.get(r.pairIndex!)! }))
    .filter((p) => p.a && p.b);
  let linked = 0;
  for (const batch of chunks(pairs, BATCH)) {
    onProgress("Linking transfers", linked, pairs.length);
    linked += (await convex.mutation(api.imports.linkTransfers, { importId, pairs: batch })).linked;
  }

  // 7. learn merchant rules from this file
  const learned = learnRules(learnablePairs(rows));
  for (const [i, batch] of chunks(learned, BATCH).entries()) {
    onProgress("Learning merchant names", i * BATCH, learned.length);
    await convex.mutation(api.merchantRules.upsertRules, {
      rules: batch.map((r) => ({ pattern: r.pattern, merchant: r.merchant, source: "learned" as const })),
    });
  }

  // 8. finish + profile (store real ids so the next import is one click)
  const categoryMap: Record<string, string> = {};
  for (const [value, choice] of Object.entries(input.catChoices)) {
    categoryMap[value] = choice === CREATE ? created.get(NEW_PREFIX + tidyLabel(value)) ?? choice : choice;
  }
  const accountMap: Record<string, string> = {};
  for (const [value, choice] of Object.entries(input.acctChoices)) {
    accountMap[value] = choice === CREATE ? created.get(NEW_PREFIX + value) ?? choice : choice;
  }
  await convex.mutation(api.imports.finishImport, {
    importId,
    excluded: summary.excluded,
    skipped: summary.skipped,
    transfers: summary.transfers,
    refunds: summary.refunds,
    profile: {
      name: input.profileName,
      headerFingerprint: input.fingerprint,
      mapping: input.mapping,
      categoryMap,
      accountMap,
    },
  });

  return { importId, inserted, duplicate, linked, rulesLearned: learned.length, createdCategories, createdAccounts, rows };
}

/** Undo in batches until the server reports done. */
export async function undoAll(convex: ConvexReactClient, importId: Id<"imports">) {
  let deleted = 0;
  for (;;) {
    const res = await convex.mutation(api.imports.undoImport, { importId });
    deleted += res.deleted;
    if (res.done) return deleted;
  }
}
