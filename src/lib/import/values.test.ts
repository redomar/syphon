import { describe, expect, test } from "vitest";
import { inferDateFormat, parseDateAs, parseMoney } from "./values";
import { cyrb53, headerFingerprint } from "./hash";

const d = (y: number, m: number, day: number) => Date.UTC(y, m - 1, day);

describe("parseDateAs", () => {
  test.each([
    ["2026-09-21", "ymd", d(2026, 9, 21)],
    ["2026/09/21 14:03", "ymd", d(2026, 9, 21)],
    ["21/09/2026", "dmy", d(2026, 9, 21)],
    ["21-09-26", "dmy", d(2026, 9, 21)],
    ["09/21/2026", "mdy", d(2026, 9, 21)],
    ["21 Sep 2026", "dmy", d(2026, 9, 21)],
    ["21-Sep-26", "dmy", d(2026, 9, 21)],
    ["Sep 21, 2026", "dmy", d(2026, 9, 21)],
  ] as const)("%s (%s)", (raw, fmt, want) => {
    expect(parseDateAs(raw, fmt)).toBe(want);
  });

  test("rejects impossible dates and junk", () => {
    expect(parseDateAs("31/02/2026", "dmy")).toBeNull();
    expect(parseDateAs("13/13/2026", "dmy")).toBeNull();
    expect(parseDateAs("yesterday", "dmy")).toBeNull();
    expect(parseDateAs("", "dmy")).toBeNull();
  });
});

describe("inferDateFormat", () => {
  test("day > 12 proves day-first", () => {
    expect(inferDateFormat(["01/02/2026", "21/09/2026"])).toEqual({ format: "dmy", ambiguous: false });
  });
  test("second part > 12 proves month-first", () => {
    expect(inferDateFormat(["09/21/2026", "01/02/2026"])).toEqual({ format: "mdy", ambiguous: false });
  });
  test("ISO is ymd", () => {
    expect(inferDateFormat(["2026-09-21"])).toEqual({ format: "ymd", ambiguous: false });
  });
  test("ambiguous numeric defaults to UK day-first and says so", () => {
    expect(inferDateFormat(["01/02/2026", "03/04/2026"])).toEqual({ format: "dmy", ambiguous: true });
  });
});

describe("parseMoney", () => {
  test.each([
    ["-22.03", -2203],
    ["22.03", 2203],
    ["£1,234.56", 123456],
    ["(50.00)", -5000],
    ["-3", -300],
    ["12.50 CR", 1250],
    ["12.50 DR", -1250],
    ["+7.10", 710],
    ["−4.99", -499],
    ["0", 0],
  ])("%s -> %i", (raw, want) => {
    expect(parseMoney(raw)).toBe(want);
  });
  test("rejects non-numbers", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("1.2.3")).toBeNull();
  });
});

describe("hashing", () => {
  test("fingerprint ignores header order, case and spacing", () => {
    expect(headerFingerprint(["Date", "Amount", "Description"])).toBe(
      headerFingerprint(["description ", "DATE", "amount"])
    );
    expect(headerFingerprint(["Date", "Amount"])).not.toBe(headerFingerprint(["Date", "Value"]));
  });
  test("cyrb53 is deterministic and seed-sensitive", () => {
    expect(cyrb53("abc")).toBe(cyrb53("abc"));
    expect(cyrb53("abc")).not.toBe(cyrb53("abd"));
    expect(cyrb53("abc", 1)).not.toBe(cyrb53("abc"));
  });
});
