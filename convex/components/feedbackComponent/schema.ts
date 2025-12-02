import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  feedback: defineTable({
    message: v.string(),
    email: v.string(),
    type: v.optional(v.union(v.literal("bug"), v.literal("feature"))),
    createdAt: v.number(), // Unix timestamp (ms)
  }).index("by_email", ["email"]),
});
