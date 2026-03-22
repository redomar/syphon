import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    currency: v.union(
      v.literal("GBP"),
      v.literal("USD"),
      v.literal("EUR"),
      v.literal("CAD"),
      v.literal("AUD")
    ),
    timezone: v.string(), // Timezone identifier (e.g., "Europe/London", "America/New_York")
    onboardingComplete: v.boolean(),
    isDemoMode: v.boolean(),
    createdAt: v.number(), // Unix timestamp (ms)
    updatedAt: v.number(), // Unix timestamp (ms)
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),
  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    color: v.string(), // Hex color code (e.g., "#FF5733")
    icon: v.string(), // Icon name from lucide-react
    isArchived: v.boolean(),
    isDefault: v.boolean(),
    createdAt: v.number(), // Unix timestamp (ms)
    updatedAt: v.number(), // Unix timestamp (ms)
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_active", ["userId", "isArchived"])
    .index("by_user_type_active", ["userId", "type", "isArchived"]),
  accounts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("checking"),
      v.literal("savings"),
      v.literal("credit_card"),
      v.literal("debit_card"),
      v.literal("cash"),
      v.literal("investment"),
      v.literal("other")
    ),
    provider: v.string(),
    lastFourDigits: v.string(),
    balance: v.number(), // In smallest currency unit (e.g., cents)
    currency: v.union(
      v.literal("GBP"),
      v.literal("USD"),
      v.literal("EUR"),
      v.literal("CAD"),
      v.literal("AUD")
    ),
    isArchived: v.boolean(),
    createdAt: v.number(), // Unix timestamp (ms)
    updatedAt: v.number(), // Unix timestamp (ms)
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isArchived"]),
});
