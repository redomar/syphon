import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

/**
 * Creates a new savings goal for the authenticated user.
 */
export const createGoal = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(), // cents
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.targetAmount <= 0) {
      throw new Error("Target amount must be positive");
    }

    const now = Date.now();
    return await ctx.db.insert("goals", {
      userId: user._id,
      name: args.name,
      targetAmount: args.targetAmount,
      currentAmount: 0,
      deadline: args.deadline,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Updates a goal's name, target, and deadline.
 */
export const updateGoal = mutation({
  args: {
    goalId: v.id("goals"),
    name: v.string(),
    targetAmount: v.number(),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.targetAmount <= 0) {
      throw new Error("Target amount must be positive");
    }

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== user._id) {
      throw new Error("Goal not found");
    }

    await ctx.db.patch(args.goalId, {
      name: args.name,
      targetAmount: args.targetAmount,
      deadline: args.deadline,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Archives a goal (soft delete).
 */
export const archiveGoal = mutation({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== user._id) {
      throw new Error("Goal not found");
    }
    if (goal.isArchived) {
      throw new Error("Goal is already archived");
    }

    await ctx.db.patch(args.goalId, { isArchived: true, updatedAt: Date.now() });
  },
});

/**
 * Restores an archived goal.
 */
export const unarchiveGoal = mutation({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== user._id) {
      throw new Error("Goal not found");
    }
    if (!goal.isArchived) {
      throw new Error("Goal is not archived");
    }

    await ctx.db.patch(args.goalId, { isArchived: false, updatedAt: Date.now() });
  },
});

/**
 * Permanently deletes a goal and all its contributions.
 */
export const deleteGoal = mutation({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== user._id) {
      throw new Error("Goal not found");
    }

    const contributions = await ctx.db
      .query("goal_contributions")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();
    for (const c of contributions) {
      await ctx.db.delete(c._id);
    }

    await ctx.db.delete(args.goalId);
  },
});

/**
 * Adds a contribution to a goal and updates the denormalized currentAmount.
 */
export const addContribution = mutation({
  args: {
    goalId: v.id("goals"),
    amount: v.number(), // cents
    date: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== user._id) {
      throw new Error("Goal not found");
    }

    const id = await ctx.db.insert("goal_contributions", {
      userId: user._id,
      goalId: args.goalId,
      amount: args.amount,
      date: args.date,
      note: args.note,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.goalId, {
      currentAmount: goal.currentAmount + args.amount,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Deletes a contribution and recalculates the goal's currentAmount.
 */
export const deleteContribution = mutation({
  args: { contributionId: v.id("goal_contributions") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const contribution = await ctx.db.get(args.contributionId);
    if (!contribution || contribution.userId !== user._id) {
      throw new Error("Contribution not found");
    }

    const goal = await ctx.db.get(contribution.goalId);
    await ctx.db.delete(args.contributionId);

    if (goal) {
      await ctx.db.patch(goal._id, {
        currentAmount: Math.max(0, goal.currentAmount - contribution.amount),
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Active (non-archived) goals, newest first.
 */
export const getGoals = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("goals")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .order("desc")
      .collect();
  },
});

/**
 * Archived goals, newest first.
 */
export const getArchivedGoals = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("goals")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", true)
      )
      .order("desc")
      .collect();
  },
});

/**
 * A single goal (ownership enforced).
 */
export const getGoal = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== user._id) {
      throw new Error("Goal not found");
    }
    return goal;
  },
});

/**
 * Contributions for a goal, newest first (ownership enforced).
 */
export const getContributions = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== user._id) {
      throw new Error("Goal not found");
    }
    return await ctx.db
      .query("goal_contributions")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .order("desc")
      .collect();
  },
});

/**
 * Top active goals for the dashboard, with derived progress, sorted by
 * proximity to completion (closest first).
 */
export const getActiveGoalsSummary = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .collect();

    const withProgress = goals.map((g) => ({
      ...g,
      percentage:
        g.targetAmount > 0
          ? Math.round((g.currentAmount / g.targetAmount) * 100)
          : 0,
    }));

    withProgress.sort((a, b) => b.percentage - a.percentage);
    return withProgress.slice(0, args.limit ?? 3);
  },
});
