import type { MerchantRule, MerchantSource } from "./types";

/**
 * E9 merchant resolution. Bank statement text ("SQ *EIS CAFE   Birmingham   GBR")
 * is turned into a clean merchant ("Eis Cafe") in three layers: the user's own
 * rules (learned from rich imports or corrections), a deterministic cleaner, and
 * finally the raw text.
 */

// Card processors whose name precedes the real merchant ("SQ *EIS CAFE").
const PROCESSORS =
  "sq|sumup|sum up|iz|izettle|zettle|ztl|paypal|pp|crv|lsp|tst|gpay|sp|wpy|clp|nya|nyx|wl|bbmsl|sagepay|dojo|stripe|ubr|pos|ppoint";
const PROCESSOR_ONLY = new RegExp(`^(?:${PROCESSORS})$`, "i");
const PROCESSOR_STAR = new RegExp(`^(?:${PROCESSORS})_?\\s*\\*\\s*`, "i");

// Trailing country / region codes used by UK card statements.
const COUNTRY =
  /^(?:GBR|GB|UK|ENG|LND|SCT|WLS|NIR|IRL|IE|NLD|NL|USA|US|CA|CAN|FRA|FR|DEU|DE|ESP|ES|ITA|IT|JPN|JP|LUX|LU|SWE|SE|AUS|AU|CHE|CH|BEL|BE|PRT|PT|DNK|DK|NOR|NO|POL|PL|ARE|AE|TUR|TR|SGP|SG|CYP|CY|GRC|GR|MLT|MT)$/i;

// Brands whose casing title-case would mangle.
const BRAND_CASE: Record<string, string> = {
  asda: "ASDA", kfc: "KFC", tsb: "TSB", bp: "BP", "h&m": "H&M", ee: "EE", o2: "O2",
  tk: "TK", hmrc: "HMRC", dvla: "DVLA", nhs: "NHS", bt: "BT", tfl: "TfL", mcdonalds: "McDonald's",
  "mcdonald's": "McDonald's", ikea: "IKEA", aldi: "ALDI", lidl: "Lidl", jd: "JD", uk: "UK",
  "wh": "WH", "b&q": "B&Q", "m&s": "M&S", "pfs": "PFS", ltd: "Ltd", plc: "plc",
  openai: "OpenAI", paypal: "PayPal", ebay: "eBay", iphone: "iPhone", youtube: "YouTube",
};

// Well-known statement spellings -> the name people use.
const ALIASES: [RegExp, string][] = [
  [/^(?:amzn|amz|amznmktplace|amazon mktplace|amazon marketplace|amazon ?eu|amazon\.co)\b.*/i, "Amazon"],
  [/^amazon prime\b.*/i, "Amazon Prime"],
  [/^w ?m morrisons?\b.*/i, "Morrisons"],
  [/^seven[- ]eleven\b.*/i, "7-Eleven"],
  [/^sainsburys?\b.*/i, "Sainsbury's"],
  [/^mcdonalds?\b.*/i, "McDonald's"],
  [/^tesco (?:stores|store|express|extra|metro)\b.*/i, "Tesco"],
  [/^tesco pfs\b.*/i, "Tesco Petrol"],
  [/^greggs?\b.*/i, "Greggs"],
  [/^tfl\b.*/i, "TfL"],
];

function alias(name: string): string {
  for (const [re, to] of ALIASES) if (re.test(name)) return to;
  return name;
}

const SMALL = new Set(["of", "and", "the", "at", "on", "in", "for", "de", "la"]);

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => {
      if (BRAND_CASE[w]) return BRAND_CASE[w];
      if (i > 0 && SMALL.has(w)) return w;
      return w.replace(/^([^a-z]*)([a-z])/, (_, p: string, c: string) => p + c.toUpperCase());
    })
    .join(" ");
}

/**
 * Splits a statement line into its padded segments and drops location noise.
 * Returns the merchant-bearing head ("SQ *EIS CAFE") in original case.
 */
export function merchantHead(raw: string): string {
  let s = raw.replace(/\t/g, "  ").trim();
  s = s.replace(/,\s*[\d.,]+\s+pound sterling.*$/i, ""); // Barclaycard FX-style tail
  let segs = s.split(/\s{2,}/).map((x) => x.trim()).filter(Boolean);
  let countryDropped = false;
  if (segs.length > 1 && COUNTRY.test(segs[segs.length - 1])) {
    segs.pop();
    countryDropped = true;
  }
  // merge "SumUp" + "*MAK HALAL CHEF" and "UBER" + "* EATS"
  if (segs.length > 1 && (PROCESSOR_ONLY.test(segs[0]) || segs[1].startsWith("*"))) {
    segs = [`${segs[0]} ${segs[1]}`, ...segs.slice(2)];
  }
  let head = segs[0] ?? "";
  // single-spaced lines: "TESCO STORES 6112, BIRMINGHAM" / "NYX*Tesco Birmingham ENG"
  head = head.replace(/,.*$/, "");
  head = head.replace(/\s+([A-Z]{2,3})$/i, (m, code: string) => {
    if (!COUNTRY.test(code)) return m;
    countryDropped = true;
    return "";
  });
  // a country with no padded location segment before it means the town is glued on
  if (countryDropped && segs.length === 1) {
    const words = head.trim().split(" ");
    if (words.length >= 2) head = words.slice(0, -1).join(" ");
  }
  return head.trim();
}

/** Deterministic cleaner. Returns null when nothing name-like survives. */
export function cleanMerchant(raw: string): string | null {
  let m = merchantHead(raw);
  if (!m) return null;

  m = m.replace(/\bPENDING\b/gi, " ").trim();
  // "PAY (Jane Doe)", "CASH (Jane Doe)" -> the name in brackets
  const wrapped = m.match(/^(?:pay|cash|transfer|tfr|payment|to|from)\s*\((.+)\)$/i);
  if (wrapped) m = wrapped[1];
  // "SQ *EIS CAFE" -> "EIS CAFE"; "AMAZON* NM5HS9RG4" -> "AMAZON"; "UBER * EATS" -> "UBER"
  if (PROCESSOR_STAR.test(m)) {
    m = m.replace(PROCESSOR_STAR, "");
  } else if (m.includes("*")) {
    const [before, ...rest] = m.split("*");
    const b = before.trim().replace(/_$/, "");
    // a short single token before "*" is almost always a processor code ("WL*STEAM")
    if ((/^[a-z]{1,3}$/i.test(b) && !BRAND_CASE[b.toLowerCase()]) || PROCESSOR_ONLY.test(b))
      m = rest.join(" ");
    else if (/[a-z]{2}/i.test(b)) m = b;
    else m = m.replace(/\*/g, " ");
  }
  m = m.replace(/\bCD \d{3,4}\b.*$/i, ""); // "TWITCH CD 3020"
  m = m.replace(/\b(?:FP|BGC|DD|SO|STO|TFR|BP)\s+\d{2}\/\d{2}\/\d{2}.*$/i, ""); // faster-payment tails
  m = m.replace(/\.(?:co\.uk|com|net|org|io|uk)(?:[/\\]\S*)?/gi, ""); // "APPLE.COM/BILL", "PADDLE.NET"
  m = m.replace(/[\\/].*$/, "");
  m = m.replace(/\s+#?\d[\d\-/]{2,}.*$/, ""); // store numbers & refs: "COSTA COFFEE 43011200"
  m = m.replace(/\s+[A-Z0-9]*\d[A-Z0-9]{5,}\b.*$/i, ""); // long alphanumeric refs
  m = m.replace(/[^\p{L}\p{N}&'.+\- ]/gu, " ");
  m = m.replace(/\s+/g, " ").replace(/^[\s.\-']+|[\s.\-']+$/g, "");

  if (!/\p{L}.*\p{L}/u.test(m)) return null;
  const aliased = alias(m);
  return aliased === m ? titleCase(m) : aliased;
}

/**
 * Normalised lookup key for rules: stable across store numbers, padding, case and
 * location, so "COSTA COFFEE 43011200  EDGBASTON GBR" and "COSTA COFFEE 43011169
 * BIRMINGHAM GBR" share a key.
 */
export function merchantKey(raw: string): string {
  return merchantHead(raw)
    .toLowerCase()
    .replace(/\bpending\b/g, " ")
    .replace(/\d+/g, "#")
    .replace(/[^a-z#&*' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

const MIN_PREFIX = 6;

/** Index of rules for exact + longest-prefix lookup. Manual rules beat learned ones. */
export class RuleIndex {
  private exact = new Map<string, MerchantRule>();
  private byStem = new Map<string, MerchantRule[]>();

  constructor(rules: MerchantRule[]) {
    for (const r of rules) {
      const existing = this.exact.get(r.pattern);
      if (existing && existing.source === "manual" && r.source !== "manual") continue;
      this.exact.set(r.pattern, r);
    }
    for (const r of this.exact.values()) {
      if (r.pattern.length < MIN_PREFIX) continue;
      const stem = r.pattern.slice(0, MIN_PREFIX);
      const list = this.byStem.get(stem) ?? [];
      list.push(r);
      this.byStem.set(stem, list);
    }
    for (const list of this.byStem.values()) list.sort((a, b) => b.pattern.length - a.pattern.length);
  }

  get size() {
    return this.exact.size;
  }

  match(key: string): MerchantRule | undefined {
    const hit = this.exact.get(key);
    if (hit) return hit;
    if (key.length < MIN_PREFIX) return undefined;
    const list = this.byStem.get(key.slice(0, MIN_PREFIX));
    return list?.find((r) => key.startsWith(r.pattern) && /[ #]/.test(key.charAt(r.pattern.length) || " "));
  }
}

export interface ResolvedMerchant {
  merchant: string;
  source: MerchantSource;
  rule?: MerchantRule;
}

/** csv column -> rule -> cleaner -> raw. */
export function resolveMerchant(
  raw: string,
  csvMerchant: string | undefined,
  rules: RuleIndex
): ResolvedMerchant {
  const fromCsv = csvMerchant?.trim();
  if (fromCsv) return { merchant: fromCsv, source: "csv" };
  const rule = rules.match(merchantKey(raw));
  if (rule) return { merchant: rule.merchant, source: "rule", rule };
  const cleaned = cleanMerchant(raw);
  if (cleaned) return { merchant: cleaned, source: "cleaner" };
  return { merchant: raw.replace(/\s+/g, " ").trim(), source: "raw" };
}

/**
 * Learns key -> merchant pairs from rows that carry both a CSV merchant and raw
 * text. When one key maps to several merchants, the most frequent wins.
 */
export function learnRules(pairs: { raw: string; merchant: string }[]): MerchantRule[] {
  const votes = new Map<string, Map<string, number>>();
  for (const { raw, merchant } of pairs) {
    const m = merchant.trim();
    if (!m) continue;
    const key = merchantKey(raw);
    if (key.replace(/[#\s]/g, "").length < 2) continue;
    const tally = votes.get(key) ?? new Map<string, number>();
    tally.set(m, (tally.get(m) ?? 0) + 1);
    votes.set(key, tally);
  }
  const rules: MerchantRule[] = [];
  for (const [pattern, tally] of votes) {
    const [merchant] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    rules.push({ pattern, merchant, source: "learned" });
  }
  return rules;
}
