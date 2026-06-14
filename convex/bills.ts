import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

const billCategory = v.union(v.literal("necessary"), v.literal("luxury"));

/**
 * Creates a new monthly bill for the authenticated user, classified as
 * either "necessary" or "luxury".
 */
export const createBill = mutation({
  args: {
    name: v.string(),
    amount: v.number(), // In cents
    category: billCategory,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const now = Date.now();
    return await ctx.db.insert("bills", {
      userId: user._id,
      name: args.name,
      amount: args.amount,
      category: args.category,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Updates an existing bill for the authenticated user.
 */
export const updateBill = mutation({
  args: {
    billId: v.id("bills"),
    name: v.string(),
    amount: v.number(),
    category: billCategory,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const bill = await ctx.db.get(args.billId);
    if (!bill || bill.userId !== user._id) {
      throw new Error("Bill not found");
    }

    await ctx.db.patch(args.billId, {
      name: args.name,
      amount: args.amount,
      category: args.category,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Permanently deletes a bill.
 */
export const deleteBill = mutation({
  args: {
    billId: v.id("bills"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const bill = await ctx.db.get(args.billId);
    if (!bill || bill.userId !== user._id) {
      throw new Error("Bill not found");
    }

    await ctx.db.delete(args.billId);
  },
});

/**
 * Returns the authenticated user's active bills, sorted newest first.
 */
export const getBills = query({
  args: {
    category: v.optional(billCategory),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    let bills = await ctx.db
      .query("bills")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .order("desc")
      .collect();

    if (args.category) {
      bills = bills.filter((b) => b.category === args.category);
    }

    return bills;
  },
});
