import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    currency: v.optional(v.union(
      v.literal("GBP"),
      v.literal("USD"),
      v.literal("EUR"),
      v.literal("CAD"),
      v.literal("AUD")
    )),
    timezone: v.string(), // Timezone identifier (e.g., "Europe/London", "America/New_York")
    onboardingComplete: v.boolean(),
    isDemoMode: v.boolean(),
    createdAt: v.string(), // ISO8601 UTC string
    updatedAt: v.string(), // ISO8601 UTC string
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),
});
