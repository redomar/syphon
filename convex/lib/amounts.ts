/**
 * E9: how a transaction counts toward totals. Refunds are stored as EXPENSE with
 * isRefund=true and reduce spend; TRANSFER never counts as income or spend.
 */
type Countable = { type: string; amount: number; isRefund?: boolean };

/** Signed contribution to spending (refunds are negative). 0 for non-expenses. */
export function spendAmount(t: Countable): number {
  if (t.type !== "EXPENSE") return 0;
  return t.isRefund ? -t.amount : t.amount;
}

/** Contribution to income. 0 for non-income. */
export function incomeAmount(t: Countable): number {
  return t.type === "INCOME" ? t.amount : 0;
}

export function sumSpend(txns: Countable[]): number {
  return txns.reduce((s, t) => s + spendAmount(t), 0);
}

export function sumIncome(txns: Countable[]): number {
  return txns.reduce((s, t) => s + incomeAmount(t), 0);
}
