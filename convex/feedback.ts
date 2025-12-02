import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { components } from "./_generated/api";

export const createFeedback = mutation({
  args: {
    message: v.string(),
    email: v.string(),
    type: v.optional(v.union(v.literal("bug"), v.literal("feature"))),
  },
  handler: async (ctx, args) => {
    // Call the feedback component's internal mutation
    await ctx.runMutation(components.feedbackComponent.feedback.createFeedback, {
      message: args.message,
      email: args.email,
      type: args.type,
    });
  },
});
