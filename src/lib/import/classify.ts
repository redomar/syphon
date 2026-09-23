import { cyrb53 } from "./hash";
import { RuleIndex, resolveMerchant } from "./merchant";
import type {
  CategoryTarget,
  ImportMapping,
  ImportSummary,
  PreparedRow,
  SkipReason,
  ValueMaps,
} from "./types";
import { parseDateAs, parseMoney } from "./values";

const DAY = 86_400_000;

const cell = (row: string[], i: number | undefined) => (i === undefined ? "" : (row[i] ?? "").trim());

/** Signed pence for a row under the mapping, or null when unreadable. */
export function readAmount(row: string[], mapping: ImportMapping): number | null {
  const a = mapping.amount;
  if (a.mode === "signed") {
    const v = parseMoney(cell(row, a.column));
    return v === null ? null : a.invert ? -v : v;
  }
  if (a.mode === "split") {
    const inRaw = cell(row, a.inColumn);
    const outRaw = cell(row, a.outColumn);
    const inV = inRaw ? parseMoney(inRaw) : 0;
    const outV = outRaw ? parseMoney(outRaw) : 0;
    if (inV === null || outV === null) return null;
    if (!inRaw && !outRaw) return null;
    return Math.abs(inV) - Math.abs(outV);
  }
  const v = parseMoney(cell(row, a.column));
  if (v === null) return null;
  const credit = a.creditValues.includes(cell(row, a.indicator).toLowerCase());
  return credit ? Math.abs(v) : -Math.abs(v);
}

const normText = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function ymd(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Distinct values of a column with how many rows and the net sign — feeds the value-matching step. */
export function distinctValues(rows: string[][], column: number | undefined, mapping?: ImportMapping) {
  const out = new Map<string, { value: string; rows: number; positive: number; negative: number }>();
  if (column === undefined) return [];
  for (const r of rows) {
    const value = cell(r, column);
    if (!value) continue;
    const e = out.get(value) ?? { value, rows: 0, positive: 0, negative: 0 };
    e.rows++;
    if (mapping) {
      const amt = readAmount(r, mapping);
      if (amt !== null && amt > 0) e.positive++;
      if (amt !== null && amt < 0) e.negative++;
    }
    out.set(value, e);
  }
  return [...out.values()].sort((a, b) => b.rows - a.rows);
}

/**
 * Turns raw CSV rows into typed, classified rows. Pure: no I/O. Order of checks
 * follows the spec (§7.3): unreadable -> zero -> pending -> excluded -> transfer
 * -> refund -> income/expense by sign.
 */
export function prepareRows(
  headers: string[],
  rows: string[][],
  mapping: ImportMapping,
  maps: ValueMaps,
  rules: RuleIndex
): PreparedRow[] {
  const pending = new Set((mapping.pendingValues ?? []).map((v) => v.toLowerCase()));
  const occurrences = new Map<string, number>();

  const prepared = rows.map((row, index): PreparedRow => {
    const sourceRow: Record<string, string> = {};
    headers.forEach((h, i) => {
      const v = row[i];
      if (v !== undefined && v !== "") sourceRow[h || `Column ${i + 1}`] = v;
    });

    const rawDescription = cell(row, mapping.rawDescription).replace(/\s+/g, " ");
    const csvMerchant = cell(row, mapping.merchant);
    const externalCategory = cell(row, mapping.category) || undefined;
    const accountKey = cell(row, mapping.account);
    const statusRaw = cell(row, mapping.status).toLowerCase();
    const status: PreparedRow["status"] = statusRaw && pending.has(statusRaw) ? "pending" : "posted";
    const date = parseDateAs(cell(row, mapping.date), mapping.dateFormat);
    const signed = readAmount(row, mapping);

    const base: PreparedRow = {
      index,
      outcome: "import",
      signed: signed ?? 0,
      date: date ?? 0,
      type: (signed ?? 0) >= 0 ? "INCOME" : "EXPENSE",
      amount: Math.abs(signed ?? 0),
      description: rawDescription || csvMerchant,
      rawDescription: cell(row, mapping.rawDescription),
      externalCategory,
      accountKey,
      accountId: accountKey ? maps.account[accountKey] : undefined,
      status,
      isRefund: false,
      dedupeKey: "",
      sourceRow,
    };

    const skip = (reason: SkipReason): PreparedRow => ({ ...base, outcome: "skipped", reason });
    if (date === null) return skip("unparseable date");
    if (signed === null) return skip("unparseable amount");
    if (signed === 0) return skip("zero amount");
    if (!rawDescription && !csvMerchant) return skip("no description");
    if (status === "pending") return skip("pending");

    const m = resolveMerchant(rawDescription || csvMerchant, csvMerchant, rules);
    base.merchant = m.merchant;
    base.merchantSource = m.source;
    base.description = m.merchant;

    // dedupe: account|day|signed pence|normalised raw text|nth identical row in this file
    const baseKey = `${accountKey.toLowerCase()}|${ymd(date)}|${signed}|${normText(rawDescription || csvMerchant)}`;
    const occ = occurrences.get(baseKey) ?? 0;
    occurrences.set(baseKey, occ + 1);
    base.dedupeKey = cyrb53(`${baseKey}|${occ}`);

    const target: CategoryTarget =
      externalCategory !== undefined ? (maps.category[externalCategory] ?? { kind: "none" }) : { kind: "none" };

    if (target.kind === "exclude") return { ...base, outcome: "excluded", reason: "excluded category" };
    if (target.kind === "transfer") {
      return { ...base, type: "TRANSFER", direction: signed > 0 ? "in" : "out" };
    }
    // a rule may carry a category when the file has none
    const categoryId =
      target.kind === "category" ? target.id : m.rule?.categoryId;
    const categoryType = target.kind === "category" ? target.type : undefined;

    if (signed > 0 && categoryType === "expense") {
      return { ...base, type: "EXPENSE", isRefund: true, categoryId };
    }
    const type = signed > 0 ? "INCOME" : "EXPENSE";
    // only attach a category whose kind matches the transaction
    const fits = categoryType === undefined || (categoryType === "income") === (type === "INCOME");
    return { ...base, type, categoryId: fits ? categoryId : undefined };
  });

  pairTransfers(prepared, mapping.category !== undefined, maps);
  return prepared;
}

/**
 * Pairs transfer legs: same absolute amount, opposite sign, different accounts,
 * dates within a day. Candidates are rows already marked TRANSFER (by category),
 * plus uncategorised rows when the file has no category column. Nearest date wins.
 */
export function pairTransfers(rows: PreparedRow[], hasCategoryColumn: boolean, maps: ValueMaps) {
  const candidate = (r: PreparedRow) =>
    r.outcome === "import" &&
    r.accountKey !== "" &&
    (r.type === "TRANSFER" ||
      (!hasCategoryColumn && !r.categoryId) ||
      (r.externalCategory !== undefined && maps.category[r.externalCategory]?.kind === "transfer"));

  const outs = new Map<number, PreparedRow[]>();
  for (const r of rows) {
    if (candidate(r) && r.signed < 0) {
      const list = outs.get(r.amount) ?? [];
      list.push(r);
      outs.set(r.amount, list);
    }
  }
  for (const inRow of rows) {
    if (!candidate(inRow) || inRow.signed <= 0 || inRow.pairIndex !== undefined) continue;
    const list = outs.get(inRow.amount);
    if (!list) continue;
    let best: PreparedRow | undefined;
    for (const o of list) {
      if (o.pairIndex !== undefined || o.accountKey === inRow.accountKey) continue;
      const gap = Math.abs(o.date - inRow.date);
      if (gap > DAY) continue;
      if (!best || gap < Math.abs(best.date - inRow.date)) best = o;
    }
    if (!best) continue;
    for (const [leg, other, dir] of [[inRow, best, "in"], [best, inRow, "out"]] as const) {
      leg.pairIndex = other.index;
      leg.type = "TRANSFER";
      leg.direction = dir;
      leg.isRefund = false;
      leg.categoryId = undefined;
    }
  }
}

export function summarize(rows: PreparedRow[]): ImportSummary {
  const s: ImportSummary = {
    total: rows.length, toImport: 0, income: 0, spend: 0, transfers: 0, transferPairs: 0,
    refunds: 0, refundAmount: 0, excluded: 0, skipped: 0, skippedByReason: {},
  };
  for (const r of rows) {
    if (r.outcome === "skipped") {
      s.skipped++;
      const reason = r.reason as SkipReason;
      s.skippedByReason[reason] = (s.skippedByReason[reason] ?? 0) + 1;
      continue;
    }
    if (r.outcome === "excluded") { s.excluded++; continue; }
    s.toImport++;
    if (r.type === "TRANSFER") {
      s.transfers++;
      if (r.pairIndex !== undefined && r.direction === "in") s.transferPairs++;
    } else if (r.type === "INCOME") {
      s.income += r.amount;
    } else if (r.isRefund) {
      s.refunds++;
      s.refundAmount += r.amount;
      s.spend -= r.amount;
    } else {
      s.spend += r.amount;
    }
  }
  return s;
}

/** Learnable pairs from a prepared file (rows whose merchant came from the CSV). */
export function learnablePairs(rows: PreparedRow[]) {
  return rows
    .filter((r) => r.merchantSource === "csv" && r.rawDescription && r.merchant)
    .map((r) => ({ raw: r.rawDescription, merchant: r.merchant! }));
}
