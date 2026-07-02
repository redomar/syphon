/** Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

/** Parses a money string like "£1,234.56", "(50.00)", "-12.5" to cents. */
export function parseAmountToCents(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  s = s.replace(/[^0-9.]/g, "");
  if (s === "" || isNaN(Number(s))) return null;
  const cents = Math.round(parseFloat(s) * 100);
  return negative ? -cents : cents;
}

/** Best-effort date parse supporting common formats; returns epoch ms or null. */
export function parseDate(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;

  // DD/MM/YYYY or DD-MM-YYYY (assume day-first for ambiguous UK data)
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return Date.UTC(year, month - 1, day);
    }
  }
  // ISO or anything Date understands
  const parsed = Date.parse(s);
  return isNaN(parsed) ? null : parsed;
}
