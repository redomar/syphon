import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

const rowValidator = v.object({
  type: v.union(v.literal("INCOME"), v.literal("EXPENSE")),
  amount: v.number(), // cents
  description: v.string(),
  date: v.number(), // epoch ms
  categoryId: v.optional(v.id("categories")),
});

/**
 * E8.S1: bulk-creates transactions from parsed CSV rows under a single import
 * record (so the whole batch can be undone). Duplicate filtering is done on the
 * client before calling; rows passed here are imported as-is.
 */
export const importTransactions = mutation({
  args: {
    fileName: v.string(),
    rows: v.array(rowValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.rows.length === 0) throw new Error("No rows to import");

    const now = Date.now();
    const importId = await ctx.db.insert("imports", {
      userId: user._id,
      fileName: args.fileName,
      rowCount: args.rows.length,
      createdAt: now,
    });

    for (const row of args.rows) {
      if (row.amount <= 0) continue; // skip malformed
      await ctx.db.insert("transactions", {
        userId: user._id,
        type: row.type,
        amount: row.amount,
        description: row.description,
        date: row.date,
        categoryId: row.categoryId,
        importId,
        isDemoData: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { importId, count: args.rows.length };
  },
});

/** Import history, newest first. */
export const getImports = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("imports")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

/** Deletes all transactions from an import, then the import record. */
export const undoImport = mutation({
  args: { importId: v.id("imports") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const imp = await ctx.db.get(args.importId);
    if (!imp || imp.userId !== user._id) throw new Error("Import not found");

    const txns = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    let deleted = 0;
    for (const t of txns) {
      if (t.importId === args.importId) {
        await ctx.db.delete(t._id);
        deleted++;
      }
    }
    await ctx.db.delete(args.importId);
    return { deleted };
  },
});
