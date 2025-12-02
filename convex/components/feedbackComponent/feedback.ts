import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createFeedback = mutation({
  args: {
    message: v.string(),
    email: v.string(),
    type: v.optional(v.union(v.literal("bug"), v.literal("feature"))),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("feedback", {
      message: args.message,
      type: args.type === null ? undefined : args.type,
      email: args.email,
      createdAt: Date.now(),
    });
  },
});
