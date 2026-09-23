/**
 * E9 value matching: pre-fills what each CSV category / account becomes in Syphon.
 * Choices are plain strings so they survive in an import profile:
 *   "<categoryId>" | "__create__" | "__transfer__" | "__exclude__" | "__none__"
 */

export const CREATE = "__create__";
export const TRANSFER = "__transfer__";
export const EXCLUDE = "__exclude__";
export const NONE = "__none__";

export interface SyphonCategory {
  _id: string;
  name: string;
  type: "income" | "expense";
  isArchived?: boolean;
}

export interface SyphonAccount {
  _id: string;
  name: string;
  provider: string;
  isArchived?: boolean;
}

const key = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

// CSV label (normalised) -> Syphon default category name, or a special target.
const SYNONYMS: Record<string, string> = {
  eatingout: "Dining Out",
  restaurants: "Dining Out",
  takeaway: "Dining Out",
  takeaways: "Dining Out",
  food: "Dining Out",
  foodanddrink: "Dining Out",
  supermarket: "Groceries",
  supermarkets: "Groceries",
  bills: "Utilities",
  billsandutilities: "Utilities",
  utilities: "Utilities",
  hobby: "Entertainment",
  hobbies: "Entertainment",
  leisure: "Entertainment",
  income: "Salary",
  wages: "Salary",
  payroll: "Salary",
  internaltransfers: TRANSFER,
  internaltransfer: TRANSFER,
  transfers: TRANSFER,
  transfer: TRANSFER,
  savings: TRANSFER,
  pots: TRANSFER,
  lending: EXCLUDE,
};

/** Suggests a target for one CSV category value. `positiveShare` ~1 means mostly money in. */
export function suggestCategory(
  value: string,
  positiveShare: number,
  categories: SyphonCategory[]
): string {
  const active = categories.filter((c) => !c.isArchived);
  const k = key(value);
  const wantType: "income" | "expense" = positiveShare > 0.5 ? "income" : "expense";

  const direct =
    active.find((c) => key(c.name) === k && c.type === wantType) ??
    active.find((c) => key(c.name) === k);
  if (direct) return direct._id;

  const syn = SYNONYMS[k];
  if (syn === TRANSFER || syn === EXCLUDE) return syn;
  if (syn) {
    const hit = active.find((c) => key(c.name) === key(syn));
    if (hit) return hit._id;
  }
  return CREATE;
}

/** Suggests an existing account by name/provider, else create. */
export function suggestAccount(value: string, accounts: SyphonAccount[]): string {
  const k = key(value);
  const hit =
    accounts.find((a) => !a.isArchived && key(a.name) === k) ??
    accounts.find((a) => !a.isArchived && key(a.provider) === k);
  return hit ? hit._id : CREATE;
}

/** Guesses the Syphon account type for a new account from its CSV name/provider. */
export function guessAccountType(name: string, provider = ""): "checking" | "credit_card" | "savings" {
  const s = `${name} ${provider}`.toLowerCase();
  if (/barclaycard|amex|american express|credit|flex|capital one|mbna|vanquis|aqua/.test(s)) return "credit_card";
  if (/saver|savings|isa\b|pot\b/.test(s)) return "savings";
  return "checking";
}

/** Cleans a CSV label for use as a new category name ("Hotel " -> "Hotel"). */
export function tidyLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
