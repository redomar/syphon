import { describe, expect, test } from "vitest";
import { cleanMerchant, learnRules, merchantKey, resolveMerchant, RuleIndex } from "./merchant";

describe("cleanMerchant", () => {
  test.each([
    ["ASDA STORES            Birmingham    GBR", "ASDA Stores"],
    ["SQ *EIS CAFE           Birmingham    GBR", "Eis Cafe"],
    ["SumUp  *MAK HALAL CHEF Sheffield     GBR", "Mak Halal Chef"],
    ["COSTA COFFEE 43011200  EDGBASTON     GBR", "Costa Coffee"],
    ["TWITCH CD 3020", "Twitch"],
    ["UBER   * EATS PENDING  LONDON        ENG", "Uber"],
    ["UBER   *ONE MEMBERSHIP LONDON        ENG", "Uber"],
    ["UBR* PENDING.UBER.COM LONDON ENG", "Uber"],
    ["AMAZON* NM5HS9RG4      LONDON        LND", "Amazon"],
    ["AMZNMktplace*TH41C7LT5 LONDON GBR", "Amazon"],
    ["amazon.co.uk           LONDON        GBR", "Amazon"],
    ["APPLE.COM/BILL         CORK          IRL", "Apple"],
    ["PADDLE.NET* WALLABY.JS LONDON        LND", "Paddle"],
    ["OPENAI *CHATGPT SUBSCR SAN FRANCISCO CA", "OpenAI"],
    ["TESCO PFS 4203         HOCKLEY       GBR", "Tesco Petrol"],
    ["TESCO STORES           BIRMINGHAM    GBR", "Tesco"],
    ["tesco stores 6112, birmingham, 9.3 pound sterling great britain", "Tesco"],
    ["SAINSBURYS S/MKTS      ARCHER ROAD 0 GBR", "Sainsbury's"],
    ["W M MORRISON STORE EDGBASTON GBR", "Morrisons"],
    ["WL *STEAM PURCHASE BELLEVUE WA", "Steam Purchase Bellevue Wa"], // no country code: kept as-is (rules fix it)
    ["NYX*Tesco Birmingham ENG", "Tesco"],
    ["Zettle_*HUDA COMMUNITY Birmingham GBR", "Huda Community"],
    ["Seven-eleven, Tokyo, 397.0 YEN JAPAN", "7-Eleven"],
    ["DIXY CHICKEN           Birmingham    GBR", "Dixy Chicken"],
    ["ODEON CINEMAS          LONDON        ENG", "Odeon Cinemas"],
    ["Disney+", "Disney+"],
    ["Costcutter", "Costcutter"],
    ["PAY (Jane Example)", "Jane Example"],
    ["CASH (Jane Example)", "Jane Example"],
    ["MONZO FP 15/09/26 0818", "Monzo"],
    ["Gray's T/A The Wild K  Hope Valley   GBR", "Gray's T"],
    ["McDonalds 1234 LONDON GBR", "McDonald's"],
  ])("%s -> %s", (raw, want) => {
    expect(cleanMerchant(raw)).toBe(want);
  });

  test("returns null when nothing name-like survives", () => {
    expect(cleanMerchant("12345678")).toBeNull();
    expect(cleanMerchant("   ")).toBeNull();
  });
});

describe("merchantKey", () => {
  test("is stable across store numbers, padding and location", () => {
    expect(merchantKey("COSTA COFFEE 43011200  EDGBASTON     GBR")).toBe(
      merchantKey("COSTA COFFEE 43011169 BIRMINGHAM GBR".replace(" BIRMINGHAM", "  BIRMINGHAM"))
    );
    expect(merchantKey("UBER   * EATS PENDING")).toBe(merchantKey("UBER   * EATS PENDING  LONDON        ENG"));
  });
});

describe("rules", () => {
  test("learnRules takes the majority merchant per key", () => {
    const rules = learnRules([
      { raw: "SQ *EIS CAFE  Birmingham  GBR", merchant: "Eis Cafe" },
      { raw: "SQ *EIS CAFE  Leeds  GBR", merchant: "Eis Cafe" },
      { raw: "SQ *EIS CAFE", merchant: "Eis" },
    ]);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({ pattern: "sq *eis cafe", merchant: "Eis Cafe", source: "learned" });
  });

  test("manual rules beat learned ones for the same key", () => {
    const idx = new RuleIndex([
      { pattern: "openai *chatgpt subscr san francisco ca", merchant: "OpenAI", source: "manual" },
      { pattern: "openai *chatgpt subscr san francisco ca", merchant: "Openai Inc", source: "learned" },
    ]);
    expect(idx.match("openai *chatgpt subscr san francisco ca")?.merchant).toBe("OpenAI");
  });

  test("prefix match needs a word boundary", () => {
    const idx = new RuleIndex([{ pattern: "costa coffee", merchant: "Costa Coffee", source: "learned" }]);
    expect(idx.match("costa coffee #")?.merchant).toBe("Costa Coffee");
    expect(idx.match("costa coffeeshop")).toBeUndefined();
  });
});

describe("resolveMerchant", () => {
  const idx = new RuleIndex([{ pattern: merchantKey("OPENAI *CHATGPT SUBSCR SAN FRANCISCO CA"), merchant: "ChatGPT", source: "manual" }]);
  test("csv > rule > cleaner > raw", () => {
    expect(resolveMerchant("SQ *EIS CAFE", "Eis Cafe", idx)).toMatchObject({ merchant: "Eis Cafe", source: "csv" });
    expect(resolveMerchant("OPENAI *CHATGPT SUBSCR SAN FRANCISCO CA", "", idx)).toMatchObject({ merchant: "ChatGPT", source: "rule" });
    expect(resolveMerchant("SQ *EIS CAFE", undefined, idx)).toMatchObject({ merchant: "Eis Cafe", source: "cleaner" });
    expect(resolveMerchant("12345678", undefined, idx)).toMatchObject({ merchant: "12345678", source: "raw" });
  });
});
