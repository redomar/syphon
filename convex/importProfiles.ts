import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

/** E9: the saved profile for a CSV layout (matched by header fingerprint), if any. */
export const getByFingerprint = query({
  args: { headerFingerprint: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("import_profiles")
      .withIndex("by_user_and_fingerprint", (q) =>
        q.eq("userId", user._id).eq("headerFingerprint", args.headerFingerprint)
      )
      .first();
  },
});

export const deleteProfile = mutation({
  args: { profileId: v.id("import_profiles") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const p = await ctx.db.get(args.profileId);
    if (!p || p.userId !== user._id) throw new Error("Profile not found");
    await ctx.db.delete(args.profileId);
  },
});
