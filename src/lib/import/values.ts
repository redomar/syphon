import type { DateFormat } from "./types";

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function utc(y: number, m: number, d: number): number | null {
  if (m < 0 || m > 11 || d < 1 || d > 31) return null;
  const ms = Date.UTC(y, m, d);
  // reject rollovers like 31/02
  return new Date(ms).getUTCDate() === d ? ms : null;
}

function year(y: string): number {
  const n = parseInt(y, 10);
  return y.length <= 2 ? 2000 + n : n;
}

/** Parses a date in the given field order to UTC-midnight epoch ms. Time parts are ignored. */
export function parseDateAs(raw: string, format: DateFormat): number | null {
  const s = raw.trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T].*)?$/);
  if (iso) return utc(+iso[1], +iso[2] - 1, +iso[3]);

  const num = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:[ T].*)?$/);
  if (num) {
    const [a, b, y] = [+num[1], +num[2], year(num[3])];
    return format === "mdy" ? utc(y, a - 1, b) : utc(y, b - 1, a);
  }

  // "21 Sep 2026", "21-Sep-26", "Sep 21, 2026"
  const dMonY = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3,9})[\s-,]*(\d{2,4})$/);
  if (dMonY) {
    const m = MONTHS[dMonY[2].slice(0, 3).toLowerCase()];
    if (m !== undefined) return utc(year(dMonY[3]), m, +dMonY[1]);
  }
  const monDY = s.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})$/);
  if (monDY) {
    const m = MONTHS[monDY[1].slice(0, 3).toLowerCase()];
    if (m !== undefined) return utc(year(monDY[3]), m, +monDY[2]);
  }
  return null;
}

/**
 * Infers field order from sample values. A first part > 12 proves day-first; a
 * second part > 12 proves month-first. Ambiguous numeric data defaults to dmy (UK).
 */
export function inferDateFormat(values: string[]): { format: DateFormat; ambiguous: boolean } {
  let iso = 0;
  let numeric = 0;
  let dayFirst = false;
  let monthFirst = false;
  for (const raw of values) {
    const s = raw.trim();
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(s)) { iso++; continue; }
    const m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.]\d{2,4}/);
    if (!m) continue;
    numeric++;
    if (+m[1] > 12) dayFirst = true;
    if (+m[2] > 12) monthFirst = true;
  }
  if (numeric === 0) return { format: iso > 0 ? "ymd" : "dmy", ambiguous: false };
  if (dayFirst && !monthFirst) return { format: "dmy", ambiguous: false };
  if (monthFirst && !dayFirst) return { format: "mdy", ambiguous: false };
  return { format: "dmy", ambiguous: true };
}

/**
 * Parses a money string to signed pence. Handles "£1,234.56", "(50.00)", "-12.5",
 * "12.50 CR" / "12.50 DR", "1.234,56" is NOT supported (UK/US formats only).
 */
export function parseMoney(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  let sign = 1;
  if (/\bDR\.?$/i.test(s)) { sign = -1; s = s.replace(/\bDR\.?$/i, ""); }
  else if (/\bCR\.?$/i.test(s)) { s = s.replace(/\bCR\.?$/i, ""); }
  s = s.trim();
  if (/^\(.*\)$/.test(s)) { sign = -sign; s = s.slice(1, -1); }
  if (/^[-−–]/.test(s) || /[-−–]$/.test(s)) { sign = -sign; s = s.replace(/^[-−–]|[-−–]$/g, ""); }
  if (s.startsWith("+")) s = s.slice(1);
  s = s.replace(/[£$€\s,]/g, "");
  if (!/^\d*\.?\d+$/.test(s)) return null;
  return sign * Math.round(parseFloat(s) * 100);
}
