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
    // E8.S4 bill reminders
    reminderDays: v.optional(v.number()), // notify for bills due within N days
    // E8.S5 pay schedule
    payFrequency: v.optional(
      v.union(
        v.literal("weekly"),
        v.literal("biweekly"),
        v.literal("semimonthly"),
        v.literal("monthly"),
        v.literal("fourweekly")
      )
    ),
    payDayOfMonth: v.optional(v.number()), // 1-31, for monthly
    payAnchorDate: v.optional(v.number()), // epoch ms, next payday anchor for cyclic
    payRecurringId: v.optional(v.id("recurring_transactions")), // optional income link
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
    // E9: TRANSFER = money moving between the user's own accounts (excluded from totals).
    type: v.union(v.literal("INCOME"), v.literal("EXPENSE"), v.literal("TRANSFER")),
    amount: v.number(), // In smallest currency unit (e.g., cents)
    description: v.string(),
    date: v.number(), // Unix timestamp ms
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
    recurringTemplateId: v.optional(v.id("recurring_transactions")),
    importId: v.optional(v.id("imports")),
    isDemoData: v.boolean(),
    // E9 importer v2 — all optional; most are stored for future use and not yet shown.
    merchant: v.optional(v.string()), // clean name, e.g. "Eis Cafe"
    merchantSource: v.optional(
      v.union(v.literal("csv"), v.literal("rule"), v.literal("cleaner"), v.literal("raw"))
    ),
    rawDescription: v.optional(v.string()), // exact bank text
    externalCategory: v.optional(v.string()), // source's own category label
    status: v.optional(v.union(v.literal("posted"), v.literal("pending"))),
    isRefund: v.optional(v.boolean()), // EXPENSE that reduces category spend
    direction: v.optional(v.union(v.literal("in"), v.literal("out"))), // for TRANSFER legs
    transferPairId: v.optional(v.id("transactions")),
    dedupeKey: v.optional(v.string()),
    sourceRow: v.optional(v.record(v.string(), v.string())), // original CSV row
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_category", ["userId", "categoryId"])
    .index("by_user_and_account", ["userId", "accountId"])
    .index("by_user_and_dedupe", ["userId", "dedupeKey"])
    .index("by_user_and_import", ["userId", "importId"]),
  budgets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    periodStart: v.number(), // 1st of month, start of day
    periodEnd: v.number(), // Last of month, end of day
    totalAmount: v.optional(v.number()), // cents
    isDemoData: v.optional(v.boolean()),
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
  goals: defineTable({
    userId: v.id("users"),
    name: v.string(),
    targetAmount: v.number(), // cents
    currentAmount: v.number(), // cents, denormalized sum of contributions
    deadline: v.optional(v.number()), // epoch ms, optional
    isArchived: v.boolean(),
    isDemoData: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isArchived"]),
  goal_contributions: defineTable({
    userId: v.id("users"),
    goalId: v.id("goals"),
    amount: v.number(), // cents
    date: v.number(), // epoch ms
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_goal", ["goalId"])
    .index("by_user", ["userId"]),
  debts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("credit_card"),
      v.literal("student_loan"),
      v.literal("mortgage"),
      v.literal("personal"),
      v.literal("auto"),
      v.literal("other")
    ),
    initialBalance: v.number(), // cents
    currentBalance: v.number(), // cents
    apr: v.optional(v.number()), // annual percentage rate, e.g. 19.9
    minPayment: v.number(), // cents
    lender: v.optional(v.string()),
    dueDay: v.optional(v.number()), // 1-31
    isClosed: v.boolean(),
    isDemoData: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_open", ["userId", "isClosed"]),
  debt_payments: defineTable({
    userId: v.id("users"),
    debtId: v.id("debts"),
    amount: v.number(), // cents
    date: v.number(), // epoch ms
    principal: v.optional(v.number()), // cents
    interest: v.optional(v.number()), // cents
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_debt", ["debtId"])
    .index("by_user", ["userId"]),
  recurring_transactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("INCOME"), v.literal("EXPENSE")),
    amount: v.number(), // cents
    description: v.string(),
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
    // Budget group hint (used by bills converged into recurring expenses).
    budgetGroup: v.optional(
      v.union(v.literal("NEEDS"), v.literal("WANTS"), v.literal("NICETIES"))
    ),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("biweekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    dayOfMonth: v.optional(v.number()), // 1-31, for monthly/yearly
    dayOfWeek: v.optional(v.number()), // 0-6, for weekly/biweekly
    startDate: v.number(), // epoch ms
    endDate: v.optional(v.number()), // epoch ms, null = ongoing
    isActive: v.boolean(),
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isArchived"]),
  recurring_instances: defineTable({
    userId: v.id("users"),
    recurringId: v.id("recurring_transactions"),
    occurrenceDate: v.number(), // the projected date this instance resolves
    status: v.union(
      v.literal("PAID"),
      v.literal("SKIPPED"),
      v.literal("MODIFIED")
    ),
    actualAmount: v.optional(v.number()), // cents, if modified
    actualTransactionId: v.optional(v.id("transactions")),
    createdAt: v.number(),
  })
    .index("by_recurring", ["recurringId"])
    .index("by_recurring_and_date", ["recurringId", "occurrenceDate"])
    .index("by_user", ["userId"]),
  imports: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    rowCount: v.number(), // rows actually inserted
    // E9: batched imports
    profileId: v.optional(v.id("import_profiles")),
    status: v.optional(
      v.union(v.literal("in_progress"), v.literal("complete"), v.literal("failed"))
    ),
    counts: v.optional(
      v.object({
        total: v.number(),
        inserted: v.number(),
        duplicate: v.number(),
        excluded: v.number(),
        skipped: v.number(),
        transfers: v.number(),
        refunds: v.number(),
      })
    ),
    mappingSnapshot: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  // E9: remembered per-source import settings, matched by header fingerprint.
  import_profiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    headerFingerprint: v.string(),
    mapping: v.any(), // ImportMapping (src/lib/import/types.ts)
    // CSV value -> categoryId | "__exclude__" | "__transfer__" | "__none__". Stored as pairs, not
    // objects, because CSV values ("Barclaycard™") aren't valid Convex field names.
    categoryTargets: v.optional(v.array(v.object({ value: v.string(), target: v.string() }))),
    accountTargets: v.optional(v.array(v.object({ value: v.string(), target: v.string() }))),
    // legacy (pre-fix) object maps; read-only fallback
    categoryMap: v.optional(v.record(v.string(), v.string())),
    accountMap: v.optional(v.record(v.string(), v.string())),
    lastUsedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_and_fingerprint", ["userId", "headerFingerprint"]),
  // E9: raw-description key -> clean merchant (learned from rich imports or set by hand).
  merchant_rules: defineTable({
    userId: v.id("users"),
    pattern: v.string(),
    merchant: v.string(),
    categoryId: v.optional(v.id("categories")),
    source: v.union(v.literal("learned"), v.literal("manual")),
    hits: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_pattern", ["userId", "pattern"]),
  receipts: defineTable({
    userId: v.id("users"),
    transactionId: v.optional(v.id("transactions")),
    storageId: v.id("_storage"),
    name: v.string(),
    contentType: v.string(),
    size: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_transaction", ["transactionId"]),
});
