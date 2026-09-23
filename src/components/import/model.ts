import { CREATE, EXCLUDE, NONE, TRANSFER, tidyLabel } from "@/lib/import/suggest";
import type { CategoryTarget, ValueMaps } from "@/lib/import/types";

/** Placeholder id for a category/account that will be created on import. */
export const NEW_PREFIX = "__new__:";

export interface ValueStat {
  value: string;
  rows: number;
  positive: number;
  negative: number;
}

export interface CategoryLite {
  _id: string;
  name: string;
  type: "income" | "expense";
}

/** New categories take the direction most of their rows go in. */
export function newCategoryType(stat: ValueStat | undefined): "income" | "expense" {
  return stat && stat.positive > stat.negative ? "income" : "expense";
}

/**
 * Turns the user's choices into pipeline value maps. "Create" choices become
 * placeholder ids so the review can be computed before anything is written.
 */
export function buildValueMaps(
  catChoices: Record<string, string>,
  acctChoices: Record<string, string>,
  catStats: ValueStat[],
  categories: CategoryLite[]
): ValueMaps {
  const byId = new Map(categories.map((c) => [c._id, c]));
  const stats = new Map(catStats.map((s) => [s.value, s]));
  const category: Record<string, CategoryTarget> = {};
  for (const [value, choice] of Object.entries(catChoices)) {
    if (choice === TRANSFER) category[value] = { kind: "transfer" };
    else if (choice === EXCLUDE) category[value] = { kind: "exclude" };
    else if (choice === NONE) category[value] = { kind: "none" };
    else if (choice === CREATE) {
      category[value] = {
        kind: "category",
        id: NEW_PREFIX + tidyLabel(value),
        type: newCategoryType(stats.get(value)),
      };
    } else {
      const cat = byId.get(choice);
      category[value] = cat ? { kind: "category", id: cat._id, type: cat.type } : { kind: "none" };
    }
  }
  const account: Record<string, string | undefined> = {};
  for (const [value, choice] of Object.entries(acctChoices)) {
    account[value] = choice === NONE ? undefined : choice === CREATE ? NEW_PREFIX + value : choice;
  }
  return { category, account };
}

/** Replaces placeholder ids with real ones once created. */
export function resolvePlaceholders(maps: ValueMaps, created: Map<string, string>): ValueMaps {
  const category: Record<string, CategoryTarget> = {};
  for (const [k, t] of Object.entries(maps.category)) {
    category[k] = t.kind === "category" && created.has(t.id) ? { ...t, id: created.get(t.id)! } : t;
  }
  const account: Record<string, string | undefined> = {};
  for (const [k, id] of Object.entries(maps.account)) {
    account[k] = id && created.has(id) ? created.get(id) : id;
  }
  return { category, account };
}

export const isPlaceholder = (id: string | undefined) => !!id && id.startsWith(NEW_PREFIX);

const PALETTE = ["#F97316", "#0EA5E9", "#22C55E", "#A855F7", "#EAB308", "#EF4444", "#14B8A6", "#EC4899", "#6366F1", "#84CC16"];
export const colorFor = (i: number) => PALETTE[i % PALETTE.length];

export function formatGBP(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}
