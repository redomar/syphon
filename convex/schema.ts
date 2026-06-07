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
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
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
  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("INCOME"), v.literal("EXPENSE")),
    amount: v.number(), // In smallest currency unit (e.g., cents)
    description: v.string(),
    date: v.number(), // Unix timestamp ms
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
    isDemoData: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_category", ["userId", "categoryId"])
    .index("by_user_and_account", ["userId", "accountId"]),
  budgets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    periodStart: v.number(), // 1st of month, start of day
    periodEnd: v.number(), // Last of month, end of day
    totalAmount: v.optional(v.number()), // cents
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_period", ["userId", "periodStart"]),
  bills: defineTable({
    userId: v.id("users"),
    name: v.string(),
    amount: v.number(), // Monthly amount, in smallest currency unit (e.g., cents)
    category: v.union(v.literal("necessary"), v.literal("luxury")),
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isArchived"])
    .index("by_user_and_category", ["userId", "category"]),
  monthly_budgets: defineTable({
    userId: v.id("users"),
    month: v.string(), // "YYYY-MM", e.g. "2026-06"
    income: v.number(), // In smallest currency unit (e.g., cents)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_and_month", ["userId", "month"]),
  monthly_allocations: defineTable({
    userId: v.id("users"),
    month: v.string(), // "YYYY-MM", e.g. "2026-06"
    name: v.string(), // e.g. "Activities", "Date nights", "New clothes"
    amount: v.number(), // In smallest currency unit (e.g., cents)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_and_month", ["userId", "month"]),
  budget_allocations: defineTable({
    budgetId: v.id("budgets"),
    categoryId: v.id("categories"),
    userId: v.id("users"),
    budgetGroup: v.union(
      v.literal("NEEDS"),
      v.literal("WANTS"),
      v.literal("NICETIES")
    ),
    allocatedAmount: v.number(), // cents
    createdAt: v.number(),
  })
    .index("by_budget", ["budgetId"])
    .index("by_budget_and_category", ["budgetId", "categoryId"])
    .index("by_user", ["userId"]),
});
