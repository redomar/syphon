import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

const budgetGroup = v.union(
  v.literal("NEEDS"),
  v.literal("WANTS"),
  v.literal("NICETIES")
);

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createBudget = mutation({
  args: {
    name: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    totalAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.periodEnd <= args.periodStart) {
      throw new Error("Period end must be after period start");
    }

    if (args.totalAmount !== undefined && args.totalAmount <= 0) {
      throw new Error("Total amount must be positive");
    }

    // Check for overlapping budgets
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const overlap = existing.find(
      (b) => args.periodStart < b.periodEnd && args.periodEnd > b.periodStart
    );
    if (overlap) {
      throw new Error(
        `Budget "${overlap.name}" already covers this period`
      );
    }

    return await ctx.db.insert("budgets", {
      userId: user._id,
      name: args.name,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      totalAmount: args.totalAmount,
      createdAt: Date.now(),
    });
  },
});

export const updateBudget = mutation({
  args: {
    budgetId: v.id("budgets"),
    name: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== user._id) {
      throw new Error("Budget not found");
    }

    await ctx.db.patch(args.budgetId, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.totalAmount !== undefined && { totalAmount: args.totalAmount }),
    });
  },
});

export const deleteBudget = mutation({
  args: { budgetId: v.id("budgets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== user._id) {
      throw new Error("Budget not found");
    }

    // Cascade: delete all allocations
    const allocations = await ctx.db
      .query("budget_allocations")
      .withIndex("by_budget", (q) => q.eq("budgetId", args.budgetId))
      .collect();

    for (const alloc of allocations) {
      await ctx.db.delete(alloc._id);
    }

    await ctx.db.delete(args.budgetId);
  },
});

export const upsertAllocation = mutation({
  args: {
    budgetId: v.id("budgets"),
    categoryId: v.id("categories"),
    budgetGroup,
    allocatedAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.allocatedAmount < 0) {
      throw new Error("Allocated amount must not be negative");
    }

    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== user._id) {
      throw new Error("Budget not found");
    }

    const existing = await ctx.db
      .query("budget_allocations")
      .withIndex("by_budget_and_category", (q) =>
        q.eq("budgetId", args.budgetId).eq("categoryId", args.categoryId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        budgetGroup: args.budgetGroup,
        allocatedAmount: args.allocatedAmount,
      });
    } else {
      await ctx.db.insert("budget_allocations", {
        budgetId: args.budgetId,
        categoryId: args.categoryId,
        userId: user._id,
        budgetGroup: args.budgetGroup,
        allocatedAmount: args.allocatedAmount,
        createdAt: Date.now(),
      });
    }
  },
});

export const deleteAllocation = mutation({
  args: { allocationId: v.id("budget_allocations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const alloc = await ctx.db.get(args.allocationId);
    if (!alloc || alloc.userId !== user._id) {
      throw new Error("Allocation not found");
    }

    await ctx.db.delete(args.allocationId);
  },
});

export const applyTemplate = mutation({
  args: {
    budgetId: v.id("budgets"),
    totalAmount: v.number(),
    ratios: v.object({
      needs: v.number(),
      wants: v.number(),
      niceties: v.number(),
    }),
    assignments: v.array(
      v.object({
        categoryId: v.id("categories"),
        group: budgetGroup,
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== user._id) {
      throw new Error("Budget not found");
    }

    if (args.totalAmount <= 0) {
      throw new Error("Total amount must be positive");
    }

    const { needs, wants, niceties } = args.ratios;
    if (needs < 0 || wants < 0 || niceties < 0) {
      throw new Error("Ratios must be non-negative");
    }
    if (Math.round(needs + wants + niceties) !== 100) {
      throw new Error("Ratios must sum to 100");
    }

    // Update budget total
    await ctx.db.patch(args.budgetId, { totalAmount: args.totalAmount });

    // Delete existing allocations
    const existing = await ctx.db
      .query("budget_allocations")
      .withIndex("by_budget", (q) => q.eq("budgetId", args.budgetId))
      .collect();

    for (const alloc of existing) {
      await ctx.db.delete(alloc._id);
    }

    // Group assignments
    const groups: Record<"NEEDS" | "WANTS" | "NICETIES", Id<"categories">[]> = {
      NEEDS: [],
      WANTS: [],
      NICETIES: [],
    };
    for (const a of args.assignments) {
      groups[a.group].push(a.categoryId);
    }

    const ratioMap = { NEEDS: needs, WANTS: wants, NICETIES: niceties } as const;
    const now = Date.now();
    let count = 0;

    for (const [group, categoryIds] of Object.entries(groups)) {
      if (categoryIds.length === 0) continue;
      const groupTotal = Math.round(
        (args.totalAmount * ratioMap[group as keyof typeof ratioMap]) / 100
      );
      const perCategory = Math.round(groupTotal / categoryIds.length);

      for (const categoryId of categoryIds) {
        await ctx.db.insert("budget_allocations", {
          budgetId: args.budgetId,
          categoryId,
          userId: user._id,
          budgetGroup: group as "NEEDS" | "WANTS" | "NICETIES",
          allocatedAmount: perCategory,
          createdAt: now,
        });
        count++;
      }
    }

    return { created: count };
  },
});

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getBudgets = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return budgets.toSorted((a, b) => b.periodStart - a.periodStart);
  },
});

export const getBudget = query({
  args: { budgetId: v.id("budgets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== user._id) {
      throw new Error("Budget not found");
    }

    return budget;
  },
});

export const getAllocations = query({
  args: { budgetId: v.id("budgets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== user._id) {
      throw new Error("Budget not found");
    }

    const allocations = await ctx.db
      .query("budget_allocations")
      .withIndex("by_budget", (q) => q.eq("budgetId", args.budgetId))
      .collect();

    // Enrich with category info
    const enriched = await Promise.all(
      allocations.map(async (alloc) => {
        const category = await ctx.db.get(alloc.categoryId);
        return {
          ...alloc,
          categoryName: category?.name ?? "Unknown",
          categoryColor: category?.color ?? "#666",
          categoryIcon: category?.icon ?? "Circle",
        };
      })
    );

    return enriched;
  },
});

export const getBudgetProgress = query({
  args: { budgetId: v.id("budgets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== user._id) {
      throw new Error("Budget not found");
    }

    const allocations = await ctx.db
      .query("budget_allocations")
      .withIndex("by_budget", (q) => q.eq("budgetId", args.budgetId))
      .collect();

    // Get all expense transactions in budget period
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", user._id)
          .gte("date", budget.periodStart)
          .lte("date", budget.periodEnd)
      )
      .collect();

    const expenses = transactions.filter((t) => t.type === "EXPENSE");

    // Sum spent per category
    const spentByCategory = new Map<string, number>();
    for (const tx of expenses) {
      if (tx.categoryId) {
        spentByCategory.set(
          tx.categoryId,
          (spentByCategory.get(tx.categoryId) ?? 0) + tx.amount
        );
      }
    }

    return allocations.map((alloc) => {
      const category = alloc.categoryId;
      const spentAmount = spentByCategory.get(category) ?? 0;
      const remainingAmount = alloc.allocatedAmount - spentAmount;
      const percentage =
        alloc.allocatedAmount > 0
          ? Math.round((spentAmount / alloc.allocatedAmount) * 100)
          : 0;

      let status: "green" | "yellow" | "red" = "green";
      if (percentage >= 90) status = "red";
      else if (percentage >= 75) status = "yellow";

      return {
        allocationId: alloc._id,
        categoryId: alloc.categoryId,
        budgetGroup: alloc.budgetGroup,
        allocatedAmount: alloc.allocatedAmount,
        spentAmount,
        remainingAmount,
        percentage,
        status,
      };
    });
  },
});

export const getActiveBudgetSummary = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const now = Date.now();

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const activeBudget = budgets.find(
      (b) => b.periodStart <= now && now <= b.periodEnd
    );

    if (!activeBudget) return null;

    const allocations = await ctx.db
      .query("budget_allocations")
      .withIndex("by_budget", (q) => q.eq("budgetId", activeBudget._id))
      .collect();

    if (allocations.length === 0) {
      return {
        budgetId: activeBudget._id,
        budgetName: activeBudget.name,
        totalAllocated: 0,
        totalSpent: 0,
        overallPercentage: 0,
        alertCategories: [],
      };
    }

    // Get expense transactions in budget period
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", user._id)
          .gte("date", activeBudget.periodStart)
          .lte("date", activeBudget.periodEnd)
      )
      .collect();

    const expenses = transactions.filter((t) => t.type === "EXPENSE");
    const spentByCategory = new Map<string, number>();
    for (const tx of expenses) {
      if (tx.categoryId) {
        spentByCategory.set(
          tx.categoryId,
          (spentByCategory.get(tx.categoryId) ?? 0) + tx.amount
        );
      }
    }

    const totalAllocated = allocations.reduce(
      (sum, a) => sum + a.allocatedAmount,
      0
    );
    const totalSpent = allocations.reduce(
      (sum, a) => sum + (spentByCategory.get(a.categoryId) ?? 0),
      0
    );
    const overallPercentage =
      totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

    // Find categories over 90%
    const alertCategories: { name: string; percentage: number }[] = [];
    for (const alloc of allocations) {
      const spent = spentByCategory.get(alloc.categoryId) ?? 0;
      const pct =
        alloc.allocatedAmount > 0
          ? Math.round((spent / alloc.allocatedAmount) * 100)
          : 0;
      if (pct >= 90) {
        const cat = await ctx.db.get(alloc.categoryId);
        alertCategories.push({
          name: cat?.name ?? "Unknown",
          percentage: pct,
        });
      }
    }

    return {
      budgetId: activeBudget._id,
      budgetName: activeBudget.name,
      totalAllocated,
      totalSpent,
      overallPercentage,
      alertCategories,
    };
  },
});
