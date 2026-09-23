import type { AmountMapping, ImportMapping } from "./types";
import { inferDateFormat, parseDateAs, parseMoney } from "./values";

/**
 * E9 auto-mapping. Scores every column against every target field using the
 * header name AND the column's content, so a header like "Sub Type" can't win
 * "type" when it's empty, and "Merchant Name" can't win the description.
 */

export interface ColumnProfile {
  index: number;
  header: string;
  norm: string;
  fill: number; // 0..1 non-blank
  dateRate: number; // of filled
  moneyRate: number; // of filled
  negRate: number; // of parsed money
  distinct: number;
  avgLen: number;
  letterRate: number; // share of filled values with >=2 letters
  values: string[]; // sample of filled values
}

const SAMPLE = 300;

const norm = (h: string) =>
  h.trim().toLowerCase().replace(/[_\-./()]+/g, " ").replace(/\s+/g, " ");

export function profileColumns(headers: string[], rows: string[][]): ColumnProfile[] {
  const sample = rows.slice(0, SAMPLE);
  return headers.map((header, index) => {
    const vals = sample.map((r) => (r[index] ?? "").trim());
    const filled = vals.filter(Boolean);
    const money = filled.map(parseMoney).filter((x): x is number => x !== null);
    const dates = filled.filter(
      (v) => parseDateAs(v, "dmy") !== null || parseDateAs(v, "mdy") !== null
    );
    return {
      index,
      header,
      norm: norm(header),
      fill: vals.length ? filled.length / vals.length : 0,
      dateRate: filled.length ? dates.length / filled.length : 0,
      moneyRate: filled.length ? money.length / filled.length : 0,
      negRate: money.length ? money.filter((m) => m < 0).length / money.length : 0,
      distinct: new Set(filled).size,
      avgLen: filled.length ? filled.reduce((s, v) => s + v.length, 0) / filled.length : 0,
      letterRate: filled.length ? filled.filter((v) => /\p{L}.*\p{L}/u.test(v)).length / filled.length : 0,
      values: filled.slice(0, 50),
    };
  });
}

type Field =
  | "date" | "amount" | "moneyIn" | "moneyOut" | "indicator" | "rawDescription"
  | "merchant" | "category" | "account" | "accountProvider" | "status" | "notes";

// exact names score highest, then whole-word synonyms. `not` words veto a header.
const NAMES: Record<Field, { exact: string[]; words: string[]; not?: string[] }> = {
  date: { exact: ["date", "transaction date", "posted date", "posting date", "booking date", "value date", "completed date", "started date"], words: ["date"], not: ["update", "created"] },
  amount: { exact: ["amount", "value", "amount gbp", "amount (gbp)", "transaction amount", "money", "sum"], words: ["amount", "value"], not: ["balance", "fee", "original", "local"] },
  moneyIn: { exact: ["paid in", "money in", "credit", "credits", "credit amount", "deposit", "deposits", "in"], words: ["credit", "deposit", "paid in", "money in"], not: ["card"] },
  moneyOut: { exact: ["paid out", "money out", "debit", "debits", "debit amount", "withdrawal", "withdrawals", "out"], words: ["debit", "withdrawal", "paid out", "money out"], not: ["card", "direct"] },
  indicator: { exact: ["cr/dr", "dr/cr", "credit/debit", "debit/credit", "type", "transaction type", "dc"], words: ["cr dr", "dr cr"], not: ["sub", "account"] },
  rawDescription: { exact: ["description", "transaction description", "narrative", "details", "memo", "reference", "transaction details", "particulars", "transaction"], words: ["description", "narrative", "details", "memo"], not: ["category"] },
  merchant: { exact: ["merchant", "merchant name", "payee", "counterparty", "counter party", "name", "payee name", "vendor"], words: ["merchant", "payee", "counterparty", "vendor"], not: ["account", "sub", "category"] },
  category: { exact: ["category", "categories", "spending category"], words: ["category"], not: ["sub"] },
  account: { exact: ["account", "account name", "account nickname"], words: ["account"], not: ["number", "provider", "type", "sort"] },
  accountProvider: { exact: ["account provider", "bank", "provider", "institution"], words: ["provider", "bank", "institution"] },
  status: { exact: ["status", "state", "transaction status"], words: ["status"] },
  notes: { exact: ["notes", "note", "comment", "comments", "tags"], words: ["notes", "note", "comment"] },
};

function nameScore(p: ColumnProfile, f: Field): number {
  const spec = NAMES[f];
  if (spec.not?.some((w) => new RegExp(`\\b${w}\\b`).test(p.norm))) return 0;
  const i = spec.exact.indexOf(p.norm);
  if (i >= 0) return 3 + 0.5 * (1 - i / spec.exact.length); // earlier = preferred

  if (spec.words.some((w) => new RegExp(`\\b${w}\\b`).test(p.norm))) return 2;
  return 0;
}

export interface AutoMapResult {
  mapping: ImportMapping | null;
  /** Human-readable notes: ambiguity, fallbacks, missing fields. */
  notes: string[];
  profiles: ColumnProfile[];
}

export function autoMap(headers: string[], rows: string[][]): AutoMapResult {
  const profiles = profileColumns(headers, rows);
  const used = new Set<number>();
  const notes: string[] = [];
  const live = profiles.filter((p) => p.fill > 0); // never map an empty column

  const pick = (f: Field, contentOk: (p: ColumnProfile) => boolean, contentBonus = (_: ColumnProfile) => 0) => {
    let best: ColumnProfile | undefined;
    let bestScore = 0;
    for (const p of live) {
      if (used.has(p.index) || !contentOk(p)) continue;
      const score = nameScore(p, f) * 10 + contentBonus(p) + p.fill;
      if (nameScore(p, f) > 0 && score > bestScore) {
        best = p;
        bestScore = score;
      }
    }
    if (best) used.add(best.index);
    return best;
  };

  // --- date: name + content, else best content
  let date = pick("date", (p) => p.dateRate > 0.8);
  if (!date) {
    date = live.filter((p) => !used.has(p.index) && p.dateRate > 0.9).sort((a, b) => b.dateRate - a.dateRate)[0];
    if (date) used.add(date.index);
  }

  // --- amount: signed single column, split in/out, or amount + DR/CR indicator
  let amount: AmountMapping | undefined;
  const signed = pick("amount", (p) => p.moneyRate > 0.9);
  if (signed && signed.negRate > 0) {
    amount = { mode: "signed", column: signed.index };
  } else {
    if (signed) used.delete(signed.index);
    const inCol = pick("moneyIn", (p) => p.moneyRate > 0.9);
    const outCol = pick("moneyOut", (p) => p.moneyRate > 0.9);
    if (inCol && outCol) {
      amount = { mode: "split", inColumn: inCol.index, outColumn: outCol.index };
    } else {
      if (inCol) used.delete(inCol.index);
      if (outCol) used.delete(outCol.index);
      const ind = live.find(
        (p) =>
          !used.has(p.index) &&
          p.distinct <= 4 &&
          p.values.length > 0 &&
          p.values.every((v) => /^(cr|dr|credit|debit|c|d|in|out)$/i.test(v))
      );
      if (signed && ind) {
        used.add(signed.index);
        used.add(ind.index);
        const creditValues = [...new Set(ind.values.filter((v) => /^(cr|credit|c|in)$/i.test(v)).map((v) => v.toLowerCase()))];
        amount = { mode: "indicator", column: signed.index, indicator: ind.index, creditValues };
      } else if (signed) {
        used.add(signed.index);
        amount = { mode: "signed", column: signed.index };
        notes.push(`"${signed.header}" has no negative values — every row will be read as money in unless you invert it.`);
      }
    }
  }

  // --- text: raw description first (prefers "Description" over "Merchant Name"), then merchant
  const text = (p: ColumnProfile) => p.letterRate > 0.5 && p.moneyRate < 0.5 && p.dateRate < 0.5;
  let rawDescription = pick("rawDescription", text, (p) => Math.min(1, p.distinct / 100));
  const merchant = pick("merchant", text);
  if (!rawDescription && merchant) {
    // only a merchant-ish column: use it as the raw text too
    rawDescription = merchant;
    notes.push(`Using "${merchant.header}" as the description.`);
  }
  if (!rawDescription) {
    rawDescription = live
      .filter((p) => !used.has(p.index) && text(p))
      .sort((a, b) => b.distinct * b.avgLen - a.distinct * a.avgLen)[0];
    if (rawDescription) {
      used.add(rawDescription.index);
      notes.push(`Guessed "${rawDescription.header}" as the description from its contents.`);
    }
  }

  const category = pick("category", (p) => text(p) && p.distinct <= 200);
  const account = pick("account", (p) => text(p) && p.distinct <= 50);
  const accountProvider = pick("accountProvider", (p) => text(p) && p.distinct <= 50);
  const status = pick("status", (p) => p.distinct <= 10);
  const notesCol = pick("notes", () => true);

  let dateFormat: ImportMapping["dateFormat"] = "ymd";
  if (date) {
    const inferred = inferDateFormat(date.values);
    dateFormat = inferred.format;
    if (inferred.ambiguous) {
      notes.push(`Dates in "${date.header}" could be day-first or month-first; assuming day-first (UK).`);
    }
  }

  const missing: string[] = [];
  if (!date) missing.push("date");
  if (!amount) missing.push("amount");
  if (!rawDescription) missing.push("description");
  if (missing.length) {
    notes.push(`Couldn't find: ${missing.join(", ")}. Pick them manually.`);
    return { mapping: null, notes, profiles };
  }

  const pendingValues = status
    ? [...new Set(status.values.filter((v) => /pend|authori[sz]/i.test(v)).map((v) => v.toLowerCase()))]
    : undefined;

  return {
    mapping: {
      date: date!.index,
      dateFormat,
      amount: amount!,
      rawDescription: rawDescription!.index,
      merchant: merchant && merchant.index !== rawDescription!.index ? merchant.index : undefined,
      category: category?.index,
      account: account?.index,
      accountProvider: accountProvider?.index,
      status: status?.index,
      pendingValues: pendingValues?.length ? pendingValues : status ? ["pending"] : undefined,
      notes: notesCol?.index,
    },
    notes,
    profiles,
  };
}
