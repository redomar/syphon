import { describe, expect, test } from "vitest";
import { parseCsv } from "../csv";
import { autoMap } from "./sniff";
import { distinctValues, learnablePairs, prepareRows, readAmount, summarize } from "./classify";
import { RuleIndex, learnRules } from "./merchant";
import { CREATE, EXCLUDE, TRANSFER, guessAccountType, suggestAccount, suggestCategory, tidyLabel } from "./suggest";
import type { ValueMaps } from "./types";
import { AGGREGATOR, SIMPLE_INDICATOR, SIMPLE_SPLIT } from "./__fixtures__/csvs";

const load = (csv: string) => {
  const [headers, ...rows] = parseCsv(csv);
  return { headers, rows };
};
const col = (headers: string[], name: string) => headers.indexOf(name);

describe("autoMap — aggregator export", () => {
  const { headers, rows } = load(AGGREGATOR);
  const { mapping, notes } = autoMap(headers, rows);

  test("maps the right columns and never the empty ones", () => {
    expect(mapping).not.toBeNull();
    expect(mapping!.date).toBe(col(headers, "Date"));
    expect(mapping!.dateFormat).toBe("ymd");
    expect(mapping!.amount).toEqual({ mode: "signed", column: col(headers, "Amount") });
    // the old bug: description must be "Description", not "Merchant Name"
    expect(mapping!.rawDescription).toBe(col(headers, "Description"));
    expect(mapping!.merchant).toBe(col(headers, "Merchant Name"));
    expect(mapping!.category).toBe(col(headers, "Category"));
    expect(mapping!.account).toBe(col(headers, "Account Name"));
    expect(mapping!.accountProvider).toBe(col(headers, "Account Provider"));
    expect(mapping!.status).toBe(col(headers, "Status"));
    expect(mapping!.pendingValues).toEqual(["pending"]);
    // "Notes" and "Sub Type" are 0% filled
    expect(Object.values(mapping!)).not.toContain(col(headers, "Sub Type"));
    expect(mapping!.notes).toBeUndefined();
    expect(notes).toEqual([]);
  });
});

describe("autoMap — simple bank formats", () => {
  test("debit/credit columns become split mode with day-first dates", () => {
    const { headers, rows } = load(SIMPLE_SPLIT);
    const { mapping } = autoMap(headers, rows);
    expect(mapping!.amount).toEqual({
      mode: "split",
      inColumn: col(headers, "Credit Amount"),
      outColumn: col(headers, "Debit Amount"),
    });
    expect(mapping!.dateFormat).toBe("dmy");
    expect(mapping!.rawDescription).toBe(col(headers, "Transaction Description"));
    expect(mapping!.merchant).toBeUndefined();
    expect(mapping!.category).toBeUndefined();
  });

  test("an unsigned amount + CR/DR column becomes indicator mode, month-first dates", () => {
    const { headers, rows } = load(SIMPLE_INDICATOR);
    const { mapping } = autoMap(headers, rows);
    expect(mapping!.amount).toEqual({
      mode: "indicator",
      column: col(headers, "Amount"),
      indicator: col(headers, "CR/DR"),
      creditValues: ["cr"],
    });
    expect(mapping!.dateFormat).toBe("mdy");
    const amounts = rows.map((r) => readAmount(r, mapping!));
    expect(amounts).toEqual([-1299, 1299]);
  });

  test("reports what it couldn't find", () => {
    const { headers, rows } = load("Foo,Bar\nx,y\n");
    const res = autoMap(headers, rows);
    expect(res.mapping).toBeNull();
    expect(res.notes.join(" ")).toMatch(/date, amount/);
  });
});

describe("prepareRows — aggregator export", () => {
  const { headers, rows } = load(AGGREGATOR);
  const { mapping } = autoMap(headers, rows);
  const maps: ValueMaps = {
    category: {
      Transport: { kind: "category", id: "c_transport", type: "expense" },
      Groceries: { kind: "category", id: "c_groceries", type: "expense" },
      "Eating Out": { kind: "category", id: "c_dining", type: "expense" },
      Entertainment: { kind: "category", id: "c_ent", type: "expense" },
      General: { kind: "none" },
      Income: { kind: "category", id: "c_salary", type: "income" },
      Shopping: { kind: "category", id: "c_shopping", type: "expense" },
      "Internal Transfers": { kind: "transfer" },
      Finances: { kind: "category", id: "c_fin", type: "expense" },
      Lending: { kind: "exclude" },
      "Hotel ": { kind: "category", id: "c_travel", type: "expense" },
    },
    account: { Lloyds: "a_lloyds", TSB: "a_tsb", Monzo: "a_monzo" },
  };
  const out = prepareRows(headers, rows, mapping!, maps, new RuleIndex([]));
  const byDesc = (d: string) => out.filter((r) => r.rawDescription.includes(d));

  test("pending and zero rows are skipped with reasons", () => {
    expect(byDesc("EATS PENDING")[0]).toMatchObject({ outcome: "skipped", reason: "pending" });
    expect(byDesc("Disney+")[0]).toMatchObject({ outcome: "skipped", reason: "zero amount" });
  });

  test("blank merchant rows are kept, using the cleaned raw text", () => {
    const [invoice] = byDesc("ACME DESIGN");
    expect(invoice).toMatchObject({ outcome: "import", type: "EXPENSE", merchantSource: "cleaner", amount: 6000 });
    const [pay] = byDesc("EXAMPLE EMPLOYER");
    expect(pay).toMatchObject({ outcome: "import", type: "INCOME", categoryId: "c_salary", amount: 250000 });
  });

  test("merchant comes from the CSV; raw text is preserved verbatim", () => {
    const [cafe] = byDesc("EIS CAFE");
    expect(cafe.merchant).toBe("Eis Cafe");
    expect(cafe.merchantSource).toBe("csv");
    expect(cafe.rawDescription).toBe("SQ *EIS CAFE           Birmingham    GBR");
    expect(cafe.accountId).toBe("a_lloyds");
    expect(cafe.externalCategory).toBe("Eating Out");
    expect(cafe.sourceRow["Account Provider"]).toBe("Lloyds Personal");
  });

  test("positive rows in expense categories are refunds", () => {
    const refund = byDesc("AMAZON*").find((r) => r.signed > 0)!;
    expect(refund).toMatchObject({ type: "EXPENSE", isRefund: true, categoryId: "c_shopping", amount: 2499 });
  });

  test("transfer legs across accounts are paired", () => {
    const out1 = byDesc("TSB PAY VIA MOBILE")[0];
    const in1 = byDesc("MONZO FP")[0];
    expect(out1).toMatchObject({ type: "TRANSFER", direction: "out", pairIndex: in1.index });
    expect(in1).toMatchObject({ type: "TRANSFER", direction: "in", pairIndex: out1.index });
  });

  test("excluded categories are set aside", () => {
    expect(byDesc("LOAN REPAY")[0]).toMatchObject({ outcome: "excluded", reason: "excluded category" });
  });

  test("identical rows in one file get distinct dedupe keys; keys are stable across runs", () => {
    const [a, b] = byDesc("TESCO STORES");
    expect(a.dedupeKey).not.toBe(b.dedupeKey);
    const again = prepareRows(headers, rows, mapping!, maps, new RuleIndex([]));
    expect(again.map((r) => r.dedupeKey)).toEqual(out.map((r) => r.dedupeKey));
  });

  test("summary adds up", () => {
    const s = summarize(out);
    expect(s.total).toBe(rows.length);
    expect(s.skipped).toBe(2);
    expect(s.excluded).toBe(1);
    expect(s.toImport).toBe(rows.length - 3);
    expect(s.transfers).toBe(2);
    expect(s.transferPairs).toBe(1);
    expect(s.refunds).toBe(1);
    expect(s.income).toBe(250000);
    // 103.88+3.90+13.30+4.99+60+1+1+24.99+0.45+120 - 24.99 refund
    expect(s.spend).toBe(10388 + 390 + 1330 + 499 + 6000 + 100 + 100 + 2499 + 45 + 12000 - 2499);
    expect(s.skippedByReason).toEqual({ pending: 1, "zero amount": 1 });
  });

  test("learnable pairs come only from CSV merchants and feed rules", () => {
    const pairs = learnablePairs(out);
    expect(pairs.every((p) => p.merchant)).toBe(true);
    const rules = new RuleIndex(learnRules(pairs));
    expect(rules.match("sq *eis cafe")?.merchant).toBe("Eis Cafe");
  });

  test("distinctValues counts rows and sign per value", () => {
    const cats = distinctValues(rows, mapping!.category, mapping!);
    const shopping = cats.find((c) => c.value === "Shopping")!;
    expect(shopping).toMatchObject({ rows: 2, positive: 1, negative: 1 });
    expect(cats[0].rows).toBeGreaterThanOrEqual(cats[cats.length - 1].rows);
  });
});

describe("prepareRows — simple CSV learns from rules", () => {
  test("rules learned from a rich import name merchants in a plain statement", () => {
    const { headers, rows } = load(SIMPLE_SPLIT);
    const { mapping } = autoMap(headers, rows);
    const rules = new RuleIndex([
      { pattern: "openai *chatgpt subscr san", merchant: "ChatGPT", source: "learned" },
    ]);
    const out = prepareRows(headers, rows, mapping!, { category: {}, account: {} }, rules);
    expect(out.map((r) => [r.merchant, r.merchantSource, r.type])).toEqual([
      ["Eis Cafe", "cleaner", "EXPENSE"],
      ["Costa Coffee", "cleaner", "EXPENSE"],
      ["Example Employer Ltd Salary", "cleaner", "INCOME"],
      ["Twitch", "cleaner", "EXPENSE"],
      ["ChatGPT", "rule", "EXPENSE"],
    ]);
  });
});

describe("suggest", () => {
  const cats = [
    { _id: "g", name: "Groceries", type: "expense" as const },
    { _id: "d", name: "Dining Out", type: "expense" as const },
    { _id: "u", name: "Utilities", type: "expense" as const },
    { _id: "s", name: "Salary", type: "income" as const },
  ];
  test.each([
    ["Groceries", 0, "g"],
    ["Eating Out", 0, "d"],
    ["Bills", 0, "u"],
    ["Income", 1, "s"],
    ["Internal Transfers", 0.5, TRANSFER],
    ["Lending", 0.4, EXCLUDE],
    ["Health & Beauty", 0, CREATE],
  ])("%s -> %s", (value, share, want) => {
    expect(suggestCategory(value, share, cats)).toBe(want);
  });

  test("accounts match by name, then provider", () => {
    const accts = [{ _id: "m", name: "Monzo", provider: "Monzo" }, { _id: "l", name: "Current", provider: "Lloyds" }];
    expect(suggestAccount("monzo", accts)).toBe("m");
    expect(suggestAccount("Lloyds", accts)).toBe("l");
    expect(suggestAccount("TSB", accts)).toBe(CREATE);
  });

  test("account type and label helpers", () => {
    expect(guessAccountType("Barclaycard™", "Barclaycard UK")).toBe("credit_card");
    expect(guessAccountType("Monzo Flex")).toBe("credit_card");
    expect(guessAccountType("Lloyds", "Lloyds Personal")).toBe("checking");
    expect(tidyLabel("Hotel ")).toBe("Hotel");
  });
});
