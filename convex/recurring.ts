import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireUser } from "./lib/auth";

const recurringType = v.union(v.literal("INCOME"), v.literal("EXPENSE"));
const frequency = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("biweekly"),
  v.literal("monthly"),
  v.literal("yearly")
);
const budgetGroup = v.union(
  v.literal("NEEDS"),
  v.literal("WANTS"),
  v.literal("NICETIES")
);

const DAY = 86400000;

/** Normalizes a timestamp to UTC midnight so occurrence dates match stably. */
function midnight(ts: number): number {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/**
 * Expands a template into occurrence timestamps within [from, to] (inclusive),
 * normalized to UTC midnight. Capped to avoid runaway loops.
 */
export function expandOccurrences(
  template: Pick<
    Doc<"recurring_transactions">,
    "frequency" | "startDate" | "endDate" | "dayOfMonth" | "dayOfWeek"
  >,
  from: number,
  to: number
): number[] {
  const out: number[] = [];
  const start = midnight(template.startDate);
  const hardEnd = Math.min(
    to,
    template.endDate !== undefined ? midnight(template.endDate) : to
  );
  if (hardEnd < start) return out;

  const { frequency: freq, dayOfMonth } = template;

  if (freq === "daily" || freq === "weekly" || freq === "biweekly") {
    const step = freq === "daily" ? DAY : freq === "weekly" ? 7 * DAY : 14 * DAY;
    // advance to the first occurrence >= from without iterating from epoch
    let cur = start;
    if (cur < from) {
      const steps = Math.ceil((from - cur) / step);
      cur += steps * step;
    }
    for (let i = 0; cur <= hardEnd && i < 1000; i++) {
      out.push(cur);
      cur += step;
    }
    return out;
  }

  // monthly / yearly: step by calendar month/year, clamping the day.
  const startD = new Date(start);
  const targetDay = dayOfMonth ?? startD.getUTCDate();
  let year = startD.getUTCFullYear();
  let month = startD.getUTCMonth();
  const monthStep = freq === "yearly" ? 12 : 1;

  for (let i = 0; i < 1200; i++) {
    const day = Math.min(targetDay, daysInMonth(year, month));
    const occ = Date.UTC(year, month, day);
    if (occ > hardEnd) break;
    if (occ >= from && occ >= start) out.push(occ);
    month += monthStep;
    if (month > 11) {
      year += Math.floor(month / 12);
      month = month % 12;
    }
  }
  return out;
}

function validate(args: {
  amount: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: number;
  endDate?: number;
}) {
  if (args.amount <= 0) throw new Error("Amount must be positive");
  if (args.dayOfMonth !== undefined && (args.dayOfMonth < 1 || args.dayOfMonth > 31))
    throw new Error("Day of month must be between 1 and 31");
  if (args.dayOfWeek !== undefined && (args.dayOfWeek < 0 || args.dayOfWeek > 6))
    throw new Error("Day of week must be between 0 and 6");
  if (args.endDate !== undefined && args.endDate < args.startDate)
    throw new Error("End date must be after start date");
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const createRecurring = mutation({
  args: {
    type: recurringType,
    amount: v.number(),
    description: v.string(),
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
    budgetGroup: v.optional(budgetGroup),
    frequency,
    dayOfMonth: v.optional(v.number()),
    dayOfWeek: v.optional(v.number()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    validate(args);
    const now = Date.now();
    return await ctx.db.insert("recurring_transactions", {
      userId: user._id,
      ...args,
      isActive: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateRecurring = mutation({
  args: {
    recurringId: v.id("recurring_transactions"),
    type: recurringType,
    amount: v.number(),
    description: v.string(),
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
    budgetGroup: v.optional(budgetGroup),
    frequency,
    dayOfMonth: v.optional(v.number()),
    dayOfWeek: v.optional(v.number()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    validate(args);
    const tpl = await ctx.db.get(args.recurringId);
    if (!tpl || tpl.userId !== user._id) throw new Error("Recurring template not found");
    const { recurringId, ...rest } = args;
    await ctx.db.patch(recurringId, { ...rest, updatedAt: Date.now() });
  },
});

export const setRecurringActive = mutation({
  args: { recurringId: v.id("recurring_transactions"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const tpl = await ctx.db.get(args.recurringId);
    if (!tpl || tpl.userId !== user._id) throw new Error("Recurring template not found");
    await ctx.db.patch(args.recurringId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
  },
});

export const deleteRecurring = mutation({
  args: { recurringId: v.id("recurring_transactions") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const tpl = await ctx.db.get(args.recurringId);
    if (!tpl || tpl.userId !== user._id) throw new Error("Recurring template not found");
    // soft delete: archive so historical actualized transactions keep their link
    await ctx.db.patch(args.recurringId, {
      isArchived: true,
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

export const getRecurring = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("recurring_transactions")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .order("desc")
      .collect();
  },
});

// ─── Projection engine (E6.S2) ──────────────────────────────────────────────

export const getProjectedTransactions = query({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const templates = await ctx.db
      .query("recurring_transactions")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .collect();

    const projected: Array<{
      recurringId: string;
      type: "INCOME" | "EXPENSE";
      amount: number;
      description: string;
      categoryId?: string;
      accountId?: string;
      budgetGroup?: "NEEDS" | "WANTS" | "NICETIES";
      date: number;
      isProjected: true;
    }> = [];

    for (const tpl of templates) {
      if (!tpl.isActive) continue;

      const occurrences = expandOccurrences(tpl, args.startDate, args.endDate);
      if (occurrences.length === 0) continue;

      // Resolved instances (PAID/SKIPPED/MODIFIED) are excluded from projections.
      const instances = await ctx.db
        .query("recurring_instances")
        .withIndex("by_recurring", (q) => q.eq("recurringId", tpl._id))
        .collect();
      const resolved = new Set(instances.map((i) => i.occurrenceDate));

      for (const occ of occurrences) {
        if (resolved.has(occ)) continue;
        projected.push({
          recurringId: tpl._id,
          type: tpl.type,
          amount: tpl.amount,
          description: tpl.description,
          categoryId: tpl.categoryId,
          accountId: tpl.accountId,
          budgetGroup: tpl.budgetGroup,
          date: occ,
          isProjected: true,
        });
      }
    }

    projected.sort((a, b) => a.date - b.date);
    return projected;
  },
});

// ─── Actualize (E6.S3) ──────────────────────────────────────────────────────

export const markPaid = mutation({
  args: {
    recurringId: v.id("recurring_transactions"),
    occurrenceDate: v.number(),
    amount: v.number(), // possibly edited
    accountId: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.amount <= 0) throw new Error("Amount must be positive");

    const tpl = await ctx.db.get(args.recurringId);
    if (!tpl || tpl.userId !== user._id) throw new Error("Recurring template not found");

    const occ = midnight(args.occurrenceDate);

    // Guard against double-actualizing the same occurrence.
    const existing = await ctx.db
      .query("recurring_instances")
      .withIndex("by_recurring_and_date", (q) =>
        q.eq("recurringId", args.recurringId).eq("occurrenceDate", occ)
      )
      .unique();
    if (existing) throw new Error("This occurrence has already been resolved");

    const now = Date.now();
    const txId = await ctx.db.insert("transactions", {
      userId: user._id,
      type: tpl.type,
      amount: args.amount,
      description: tpl.description,
      date: occ,
      categoryId: tpl.categoryId,
      accountId: args.accountId ?? tpl.accountId,
      recurringTemplateId: tpl._id,
      isDemoData: false,
      createdAt: now,
      updatedAt: now,
    });

    const modified = args.amount !== tpl.amount;
    await ctx.db.insert("recurring_instances", {
      userId: user._id,
      recurringId: args.recurringId,
      occurrenceDate: occ,
      status: modified ? "MODIFIED" : "PAID",
      actualAmount: modified ? args.amount : undefined,
      actualTransactionId: txId,
      createdAt: now,
    });

    return txId;
  },
});

export const skipOccurrence = mutation({
  args: {
    recurringId: v.id("recurring_transactions"),
    occurrenceDate: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const tpl = await ctx.db.get(args.recurringId);
    if (!tpl || tpl.userId !== user._id) throw new Error("Recurring template not found");

    const occ = midnight(args.occurrenceDate);
    const existing = await ctx.db
      .query("recurring_instances")
      .withIndex("by_recurring_and_date", (q) =>
        q.eq("recurringId", args.recurringId).eq("occurrenceDate", occ)
      )
      .unique();
    if (existing) throw new Error("This occurrence has already been resolved");

    await ctx.db.insert("recurring_instances", {
      userId: user._id,
      recurringId: args.recurringId,
      occurrenceDate: occ,
      status: "SKIPPED",
      createdAt: Date.now(),
    });
  },
});

/** Un-resolves an occurrence (un-skip, or undo a mark-as-paid). */
export const unresolveOccurrence = mutation({
  args: {
    recurringId: v.id("recurring_transactions"),
    occurrenceDate: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const occ = midnight(args.occurrenceDate);
    const instance = await ctx.db
      .query("recurring_instances")
      .withIndex("by_recurring_and_date", (q) =>
        q.eq("recurringId", args.recurringId).eq("occurrenceDate", occ)
      )
      .unique();
    if (!instance || instance.userId !== user._id)
      throw new Error("Instance not found");

    // remove the actualized transaction too, if any
    if (instance.actualTransactionId) {
      const tx = await ctx.db.get(instance.actualTransactionId);
      if (tx && tx.userId === user._id) await ctx.db.delete(tx._id);
    }
    await ctx.db.delete(instance._id);
  },
});

// ─── Convergence: bills → recurring expenses ─────────────────────────────────

/**
 * Migrates the user's active bills into monthly recurring EXPENSE templates,
 * mapping necessary→NEEDS and luxury→WANTS, then archives the bills.
 * Idempotent-friendly: only migrates non-archived bills.
 */
export const migrateBillsToRecurring = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const bills = await ctx.db
      .query("bills")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .collect();

    const now = Date.now();
    const startOfMonth = (() => {
      const d = new Date();
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    })();

    let migrated = 0;
    for (const bill of bills) {
      await ctx.db.insert("recurring_transactions", {
        userId: user._id,
        type: "EXPENSE",
        amount: bill.amount,
        description: bill.name,
        budgetGroup: bill.category === "necessary" ? "NEEDS" : "WANTS",
        frequency: "monthly",
        dayOfMonth: 1,
        startDate: startOfMonth,
        isActive: true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.patch(bill._id, { isArchived: true, updatedAt: now });
      migrated++;
    }

    return { migrated };
  },
});
