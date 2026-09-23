/** E9 importer v2 — shared types for the pure import pipeline. Column refs are header indexes. */

export type DateFormat = "ymd" | "dmy" | "mdy";

export type AmountMapping =
  | { mode: "signed"; column: number; invert?: boolean }
  | { mode: "split"; inColumn: number; outColumn: number }
  | { mode: "indicator"; column: number; indicator: number; creditValues: string[] };

export interface ImportMapping {
  date: number;
  dateFormat: DateFormat;
  amount: AmountMapping;
  rawDescription: number;
  merchant?: number;
  category?: number;
  account?: number;
  accountProvider?: number;
  status?: number;
  pendingValues?: string[];
  notes?: number;
}

/** What a CSV category value becomes in Syphon. */
export type CategoryTarget =
  | { kind: "category"; id: string; type: "income" | "expense" }
  | { kind: "exclude" }
  | { kind: "transfer" }
  | { kind: "none" };

export interface ValueMaps {
  category: Record<string, CategoryTarget>;
  /** CSV account value -> Syphon accountId */
  account: Record<string, string | undefined>;
}

export type MerchantSource = "csv" | "rule" | "cleaner" | "raw";

export interface MerchantRule {
  pattern: string;
  merchant: string;
  categoryId?: string;
  source: "learned" | "manual";
}

export type SkipReason =
  | "unparseable date"
  | "unparseable amount"
  | "zero amount"
  | "pending"
  | "no description";

export interface PreparedRow {
  /** 0-based index into the data rows (header excluded). */
  index: number;
  outcome: "import" | "excluded" | "skipped";
  reason?: SkipReason | "excluded category";
  /** Signed amount in pence as read from the file (negative = money out). */
  signed: number;
  date: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  /** Unsigned pence, as stored. */
  amount: number;
  description: string;
  merchant?: string;
  merchantSource?: MerchantSource;
  rawDescription: string;
  externalCategory?: string;
  categoryId?: string;
  accountId?: string;
  /** CSV account value, used for transfer pairing and dedupe. */
  accountKey: string;
  status: "posted" | "pending";
  isRefund: boolean;
  direction?: "in" | "out";
  /** Index of the other leg when paired as a transfer. */
  pairIndex?: number;
  dedupeKey: string;
  sourceRow: Record<string, string>;
}

export interface ImportSummary {
  total: number;
  toImport: number;
  income: number;
  /** Spend net of refunds, pence. */
  spend: number;
  transfers: number;
  transferPairs: number;
  refunds: number;
  refundAmount: number;
  excluded: number;
  skipped: number;
  skippedByReason: Partial<Record<SkipReason, number>>;
}
