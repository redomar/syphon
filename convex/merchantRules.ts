import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

/**
 * E9: raw-description key -> clean merchant. Learned rules come from rich imports
 * (CSV merchant + raw text); manual rules come from corrections and always win.
 */

const MAX_UPSERT = 500;

export const listRules = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rules = await ctx.db
      .query("merchant_rules")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return rules.map((r) => ({
      pattern: r.pattern,
      merchant: r.merchant,
      categoryId: r.categoryId,
      source: r.source,
    }));
  },
});

export const upsertRules = mutation({
  args: {
    rules: v.array(
      v.object({
        pattern: v.string(),
        merchant: v.string(),
        categoryId: v.optional(v.id("categories")),
        source: v.union(v.literal("learned"), v.literal("manual")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.rules.length > MAX_UPSERT) throw new Error(`At most ${MAX_UPSERT} rules per call`);
    const now = Date.now();
    let created = 0;
    let updated = 0;
    for (const rule of args.rules) {
      const pattern = rule.pattern.trim();
      const merchant = rule.merchant.trim();
      if (!pattern || !merchant) continue;
      if (rule.categoryId) {
        const cat = await ctx.db.get(rule.categoryId);
        if (!cat || cat.userId !== user._id) throw new Error("Category not found");
      }
      const existing = await ctx.db
        .query("merchant_rules")
        .withIndex("by_user_and_pattern", (q) => q.eq("userId", user._id).eq("pattern", pattern))
        .first();
      if (!existing) {
        await ctx.db.insert("merchant_rules", {
          userId: user._id,
          pattern,
          merchant,
          categoryId: rule.categoryId,
          source: rule.source,
          hits: 1,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      } else if (rule.source === "manual" || existing.source === "learned") {
        await ctx.db.patch(existing._id, {
          merchant,
          categoryId: rule.categoryId ?? existing.categoryId,
          source: rule.source === "manual" ? "manual" : existing.source,
          hits: existing.hits + 1,
          updatedAt: now,
        });
        updated++;
      }
      // a learned rule never overwrites a manual one
    }
    return { created, updated };
  },
});
