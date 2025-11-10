# Syphon v1.0.0 - Database Schema

**Database:** Convex
**Version:** 1.0.0
**Last Updated:** 2025-11-08

---

## Overview

This document defines the complete Convex schema for Syphon v1.0.0. All tables, fields, indexes, and relationships are documented here.

### Design Principles
1. **User Isolation:** All tables have userId for multi-tenancy
2. **Soft Deletes:** Archive flag instead of hard deletes where appropriate
3. **Denormalization:** Cache frequently calculated values (e.g., currentAmount)
4. **Timestamps:** All tables have createdAt, some have updatedAt
5. **Currency as Cents:** Store amounts as integers (cents) to avoid floating-point errors

---

## Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ========================================
  // USERS
  // ========================================
  users: defineTable({
    clerkId: v.string(),        // Clerk user ID (unique)
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    currency: v.union(
      v.literal("GBP"),
      v.literal("USD"),
      v.literal("EUR"),
      v.literal("CAD"),
      v.literal("AUD")
    ),
    timezone: v.string(),       // e.g., "Europe/London", "America/New_York"
    onboardingComplete: v.boolean(),
    isDemoMode: v.boolean(),    // Track if user is in demo mode
    createdAt: v.number(),      // Unix timestamp
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // ========================================
  // CATEGORIES
  // ========================================
  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),           // e.g., "Groceries", "Rent", "Salary"
    type: v.union(
      v.literal("INCOME"),
      v.literal("EXPENSE")
    ),
    color: v.string(),          // Hex color, e.g., "#3b82f6"
    icon: v.string(),           // Lucide icon name, e.g., "ShoppingCart"
    isArchived: v.boolean(),
    isDefault: v.boolean(),     // System-provided default category
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_active", ["userId", "isArchived"]),

  // ========================================
  // ACCOUNTS
  // ========================================
  accounts: defineTable({
    userId: v.id("users"),
    name: v.string(),           // e.g., "Chase Checking"
    type: v.union(
      v.literal("CHECKING"),
      v.literal("SAVINGS"),
      v.literal("CREDIT_CARD"),
      v.literal("DEBIT_CARD"),
      v.literal("CASH"),
      v.literal("INVESTMENT"),
      v.literal("OTHER")
    ),
    provider: v.optional(v.string()),        // e.g., "Chase", "Monzo"
    lastFourDigits: v.optional(v.string()),  // e.g., "4242"
    isArchived: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isArchived"]),

  // ========================================
  // TRANSACTIONS
  // ========================================
  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("INCOME"),
      v.literal("EXPENSE")
    ),
    amount: v.number(),         // Stored as cents (£10.50 = 1050)
    description: v.string(),
    date: v.number(),           // Unix timestamp
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
    recurringTemplateId: v.optional(v.id("recurring_templates")),
    importId: v.optional(v.id("imports")),
    receiptId: v.optional(v.id("receipts")),
    isDemoData: v.boolean(),    // For demo mode cleanup
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_category", ["userId", "categoryId"])
    .index("by_user_and_account", ["userId", "accountId"])
    .index("by_import", ["importId"])
    .index("by_recurring_template", ["recurringTemplateId"]),

  // ========================================
  // RECURRING TEMPLATES
  // ========================================
  recurring_templates: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("INCOME"),
      v.literal("EXPENSE")
    ),
    amount: v.number(),         // Stored as cents
    description: v.string(),
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
    pattern: v.union(
      v.literal("DAILY"),
      v.literal("WEEKLY"),
      v.literal("BIWEEKLY"),
      v.literal("MONTHLY"),
      v.literal("YEARLY")
    ),
    interval: v.number(),       // Every X pattern units (default 1)
    dayOfMonth: v.optional(v.number()),  // 1-31 for MONTHLY
    dayOfWeek: v.optional(v.number()),   // 0-6 for WEEKLY (0=Sunday)
    startDate: v.number(),      // Unix timestamp
    endDate: v.optional(v.number()),     // Optional end date
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  // ========================================
  // RECURRING INSTANCES
  // ========================================
  recurring_instances: defineTable({
    templateId: v.id("recurring_templates"),
    userId: v.id("users"),
    instanceDate: v.number(),   // Date this instance occurs
    status: v.union(
      v.literal("PAID"),        // User marked as paid
      v.literal("SKIPPED"),     // User skipped this instance
      v.literal("MODIFIED")     // Amount was changed
    ),
    actualAmount: v.optional(v.number()),       // If modified
    actualTransactionId: v.optional(v.id("transactions")), // If paid
    deletedAt: v.optional(v.number()),  // Soft delete timestamp
    createdAt: v.number(),
  })
    .index("by_template", ["templateId"])
    .index("by_template_and_date", ["templateId", "instanceDate"])
    .index("by_user", ["userId"]),

  // ========================================
  // BUDGETS
  // ========================================
  budgets: defineTable({
    userId: v.id("users"),
    name: v.string(),           // e.g., "January 2025"
    periodStart: v.number(),    // Start of budget period (timestamp)
    periodEnd: v.number(),      // End of budget period (timestamp)
    totalAmount: v.optional(v.number()), // Optional total (can be sum of allocations)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_period", ["userId", "periodStart"])
    .index("by_period", ["periodStart", "periodEnd"]),

  // ========================================
  // BUDGET ALLOCATIONS
  // ========================================
  budget_allocations: defineTable({
    budgetId: v.id("budgets"),
    categoryId: v.id("categories"),
    userId: v.id("users"),
    budgetGroup: v.union(
      v.literal("NEEDS"),
      v.literal("WANTS"),
      v.literal("NICETIES")
    ),
    allocatedAmount: v.number(), // Amount allocated to this category (cents)
    createdAt: v.number(),
  })
    .index("by_budget", ["budgetId"])
    .index("by_budget_and_category", ["budgetId", "categoryId"])
    .index("by_user", ["userId"]),

  // ========================================
  // SAVINGS GOALS
  // ========================================
  savings_goals: defineTable({
    userId: v.id("users"),
    name: v.string(),           // e.g., "Vacation Fund"
    targetAmount: v.number(),   // Target in cents
    currentAmount: v.number(),  // Cached sum of contributions (cents)
    deadline: v.optional(v.number()),    // Optional target date
    isArchived: v.boolean(),
    isDemoData: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isArchived"]),

  // ========================================
  // GOAL CONTRIBUTIONS
  // ========================================
  goal_contributions: defineTable({
    goalId: v.id("savings_goals"),
    userId: v.id("users"),
    amount: v.number(),         // Contribution amount (cents)
    date: v.number(),           // When contribution was made
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_goal", ["goalId"])
    .index("by_goal_and_date", ["goalId", "date"])
    .index("by_user", ["userId"]),

  // ========================================
  // DEBTS
  // ========================================
  debts: defineTable({
    userId: v.id("users"),
    name: v.string(),           // e.g., "Chase Credit Card"
    type: v.union(
      v.literal("CREDIT_CARD"),
      v.literal("STUDENT_LOAN"),
      v.literal("MORTGAGE"),
      v.literal("PERSONAL"),
      v.literal("AUTO"),
      v.literal("OTHER")
    ),
    initialBalance: v.number(), // Original debt amount (cents)
    currentBalance: v.number(), // Current balance (cents)
    apr: v.optional(v.number()),         // Annual percentage rate (e.g., 19.99)
    minPayment: v.number(),     // Minimum monthly payment (cents)
    lender: v.optional(v.string()),      // e.g., "Chase Bank"
    dueDayOfMonth: v.optional(v.number()), // Day payment is due (1-31)
    isClosed: v.boolean(),
    isDemoData: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isClosed"]),

  // ========================================
  // DEBT PAYMENTS
  // ========================================
  debt_payments: defineTable({
    debtId: v.id("debts"),
    userId: v.id("users"),
    amount: v.number(),         // Payment amount (cents)
    date: v.number(),           // Payment date
    principal: v.optional(v.number()),   // Amount toward principal (cents)
    interest: v.optional(v.number()),    // Amount toward interest (cents)
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_debt", ["debtId"])
    .index("by_debt_and_date", ["debtId", "date"])
    .index("by_user", ["userId"]),

  // ========================================
  // PAY SCHEDULES
  // ========================================
  pay_schedules: defineTable({
    userId: v.id("users"),
    frequency: v.union(
      v.literal("WEEKLY"),
      v.literal("BIWEEKLY"),
      v.literal("SEMI_MONTHLY"),
      v.literal("MONTHLY"),
      v.literal("EVERY_4_WEEKS")
    ),
    nextPayday: v.number(),     // Next expected payday (timestamp)
    anchorDate: v.optional(v.number()),  // Reference date for calculations
    dayOfMonth: v.optional(v.number()),  // For monthly/semi-monthly (1-31)
    timezone: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  // ========================================
  // IMPORTS (CSV)
  // ========================================
  imports: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    storageId: v.id("_storage"), // Convex file storage ID
    rowCount: v.number(),       // Number of transactions imported
    columnMapping: v.object({
      date: v.string(),         // CSV column name for date
      amount: v.string(),       // CSV column name for amount
      description: v.string(),  // CSV column name for description
      category: v.optional(v.string()),
      account: v.optional(v.string()),
    }),
    importedAt: v.number(),
    expiresAt: v.number(),      // 30 days from import (GDPR)
  })
    .index("by_user", ["userId"])
    .index("by_expires_at", ["expiresAt"]),

  // ========================================
  // RECEIPTS
  // ========================================
  receipts: defineTable({
    userId: v.id("users"),
    transactionId: v.optional(v.id("transactions")),
    storageId: v.id("_storage"), // Convex file storage ID
    fileName: v.string(),
    fileSize: v.number(),       // Bytes
    mimeType: v.string(),       // e.g., "image/jpeg", "application/pdf"
    uploadedAt: v.number(),
    deletedAt: v.optional(v.number()), // Soft delete
  })
    .index("by_user", ["userId"])
    .index("by_transaction", ["transactionId"])
    .index("by_storage_id", ["storageId"]),
});
```

---

## Table Details

### 1. users

**Purpose:** Store user profile data synced from Clerk

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clerkId | string | ✅ | Clerk user ID (unique identifier) |
| email | string | ✅ | User email address |
| firstName | string | ❌ | User's first name |
| lastName | string | ❌ | User's last name |
| currency | enum | ✅ | Default currency (GBP, USD, EUR, CAD, AUD) |
| timezone | string | ✅ | User timezone (IANA format) |
| onboardingComplete | boolean | ✅ | Has user completed onboarding? |
| isDemoMode | boolean | ✅ | Is user in demo mode? |
| createdAt | number | ✅ | Account creation timestamp |

**Indexes:**
- `by_clerk_id`: Fast lookup by Clerk ID
- `by_email`: Fast lookup by email

**Example:**
```typescript
{
  clerkId: "user_2abc123",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  currency: "GBP",
  timezone: "Europe/London",
  onboardingComplete: true,
  isDemoMode: false,
  createdAt: 1699564800000
}
```

---

### 2. categories

**Purpose:** Define income/expense categories

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Id<users> | ✅ | Owner of category |
| name | string | ✅ | Category name (e.g., "Groceries") |
| type | enum | ✅ | INCOME or EXPENSE |
| color | string | ✅ | Hex color for UI (e.g., "#3b82f6") |
| icon | string | ✅ | Lucide icon name (e.g., "ShoppingCart") |
| isArchived | boolean | ✅ | Soft delete flag |
| isDefault | boolean | ✅ | System-provided default? |
| createdAt | number | ✅ | Creation timestamp |

**Indexes:**
- `by_user`: All categories for a user
- `by_user_and_type`: Filter by income/expense
- `by_user_active`: Exclude archived categories

**Default Categories:**

*Income:*
- Salary (💼 Briefcase, #10b981)
- Freelance (💻 Laptop, #3b82f6)
- Investment (📈 TrendingUp, #8b5cf6)
- Gift (🎁 Gift, #ec4899)
- Other Income (➕ Plus, #6b7280)

*Expense:*
- Groceries (🛒 ShoppingCart, #ef4444)
- Rent/Mortgage (🏠 Home, #f59e0b)
- Utilities (⚡ Zap, #eab308)
- Transport (🚗 Car, #06b6d4)
- Dining Out (🍴 Utensils, #f97316)
- Entertainment (🎬 Film, #a855f7)
- Healthcare (🏥 Heart, #ef4444)
- Shopping (🛍️ ShoppingBag, #ec4899)
- Other Expense (➕ Plus, #6b7280)

---

### 3. accounts

**Purpose:** Track bank accounts, credit cards, cash

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Id<users> | ✅ | Owner of account |
| name | string | ✅ | Account name (e.g., "Chase Checking") |
| type | enum | ✅ | Account type |
| provider | string | ❌ | Bank/provider name (e.g., "Chase") |
| lastFourDigits | string | ❌ | Last 4 digits (e.g., "4242") |
| isArchived | boolean | ✅ | Soft delete flag |
| createdAt | number | ✅ | Creation timestamp |

**Account Types:**
- CHECKING
- SAVINGS
- CREDIT_CARD
- DEBIT_CARD
- CASH
- INVESTMENT
- OTHER

---

### 4. transactions

**Purpose:** Record actual income/expense transactions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Id<users> | ✅ | Owner of transaction |
| type | enum | ✅ | INCOME or EXPENSE |
| amount | number | ✅ | Amount in cents (£10.50 = 1050) |
| description | string | ✅ | Transaction description |
| date | number | ✅ | Transaction date (timestamp) |
| categoryId | Id<categories> | ❌ | Associated category |
| accountId | Id<accounts> | ❌ | Associated account |
| recurringTemplateId | Id<recurring_templates> | ❌ | If created from recurring |
| importId | Id<imports> | ❌ | If imported from CSV |
| receiptId | Id<receipts> | ❌ | Attached receipt |
| isDemoData | boolean | ✅ | For demo mode cleanup |
| createdAt | number | ✅ | Creation timestamp |
| updatedAt | number | ✅ | Last update timestamp |

**Indexes:**
- `by_user`: All transactions for user
- `by_user_and_date`: Query by date range (most common)
- `by_user_and_type`: Filter by income/expense
- `by_user_and_category`: Spending by category
- `by_user_and_account`: Transactions per account
- `by_import`: Find transactions from specific import
- `by_recurring_template`: Find instances of recurring

---

### 5. recurring_templates

**Purpose:** Define recurring transaction patterns

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Id<users> | ✅ | Owner of template |
| type | enum | ✅ | INCOME or EXPENSE |
| amount | number | ✅ | Amount in cents |
| description | string | ✅ | Description |
| categoryId | Id<categories> | ❌ | Default category |
| accountId | Id<accounts> | ❌ | Default account |
| pattern | enum | ✅ | Recurrence pattern |
| interval | number | ✅ | Every X pattern units (default 1) |
| dayOfMonth | number | ❌ | For MONTHLY (1-31) |
| dayOfWeek | number | ❌ | For WEEKLY (0-6, 0=Sunday) |
| startDate | number | ✅ | When recurrence starts |
| endDate | number | ❌ | Optional end date |
| isActive | boolean | ✅ | Is template active? |
| createdAt | number | ✅ | Creation timestamp |

**Patterns:**
- DAILY: Every day
- WEEKLY: Every week (on dayOfWeek)
- BIWEEKLY: Every 2 weeks
- MONTHLY: Every month (on dayOfMonth)
- YEARLY: Every year (on same date)

**Examples:**
```typescript
// Netflix subscription - £10 on 15th of each month
{
  type: "EXPENSE",
  amount: 1000,
  description: "Netflix",
  pattern: "MONTHLY",
  interval: 1,
  dayOfMonth: 15,
  startDate: 1699564800000,
  endDate: null,
  isActive: true
}

// Salary - £3000 on last Friday of month
{
  type: "INCOME",
  amount: 300000,
  description: "Salary",
  pattern: "MONTHLY",
  interval: 1,
  dayOfWeek: 5, // Friday
  startDate: 1699564800000,
  isActive: true
}
```

---

### 6. recurring_instances

**Purpose:** Track modifications to projected recurring transactions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | Id<recurring_templates> | ✅ | Parent template |
| userId | Id<users> | ✅ | Owner |
| instanceDate | number | ✅ | Date of this instance |
| status | enum | ✅ | PAID, SKIPPED, or MODIFIED |
| actualAmount | number | ❌ | If modified (cents) |
| actualTransactionId | Id<transactions> | ❌ | If paid (link to transaction) |
| deletedAt | number | ❌ | Soft delete timestamp |
| createdAt | number | ✅ | Creation timestamp |

**Status Values:**
- **PAID:** User marked as paid (actualTransactionId set)
- **SKIPPED:** User skipped this instance
- **MODIFIED:** Amount changed (actualAmount set)

---

### 7. budgets

**Purpose:** Define budget periods

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Id<users> | ✅ | Owner |
| name | string | ✅ | Budget name (e.g., "January 2025") |
| periodStart | number | ✅ | Start of period (timestamp) |
| periodEnd | number | ✅ | End of period (timestamp) |
| totalAmount | number | ❌ | Optional total budget (cents) |
| createdAt | number | ✅ | Creation timestamp |

---

### 8. budget_allocations

**Purpose:** Assign categories to budget groups with amounts

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| budgetId | Id<budgets> | ✅ | Parent budget |
| categoryId | Id<categories> | ✅ | Category being budgeted |
| userId | Id<users> | ✅ | Owner |
| budgetGroup | enum | ✅ | NEEDS, WANTS, or NICETIES |
| allocatedAmount | number | ✅ | Amount allocated (cents) |
| createdAt | number | ✅ | Creation timestamp |

**Budget Groups:**
- **NEEDS:** Essential expenses (50% in 50/30/20 rule)
- **WANTS:** Non-essential expenses (30%)
- **NICETIES:** Discretionary spending (20%)

---

### 9. savings_goals

**Purpose:** Track savings goals

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Id<users> | ✅ | Owner |
| name | string | ✅ | Goal name (e.g., "Vacation Fund") |
| targetAmount | number | ✅ | Target in cents |
| currentAmount | number | ✅ | Cached sum of contributions (cents) |
| deadline | number | ❌ | Target date |
| isArchived | boolean | ✅ | Soft delete flag |
| isDemoData | boolean | ✅ | For demo mode cleanup |
| createdAt | number | ✅ | Creation timestamp |

---

### 10. goal_contributions

**Purpose:** Record contributions to savings goals

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| goalId | Id<savings_goals> | ✅ | Parent goal |
| userId | Id<users> | ✅ | Owner |
| amount | number | ✅ | Contribution amount (cents) |
| date | number | ✅ | Contribution date |
| note | string | ❌ | Optional note |
| createdAt | number | ✅ | Creation timestamp |

---

### 11. debts

**Purpose:** Track debt accounts

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Id<users> | ✅ | Owner |
| name | string | ✅ | Debt name (e.g., "Chase Credit Card") |
| type | enum | ✅ | Debt type |
| initialBalance | number | ✅ | Original amount (cents) |
| currentBalance | number | ✅ | Current balance (cents) |
| apr | number | ❌ | Annual percentage rate (e.g., 19.99) |
| minPayment | number | ✅ | Min monthly payment (cents) |
| lender | string | ❌ | Lender name |
| dueDayOfMonth | number | ❌ | Payment due day (1-31) |
| isClosed | boolean | ✅ | Is debt paid off? |
| isDemoData | boolean | ✅ | For demo mode |
| createdAt | number | ✅ | Creation timestamp |

**Debt Types:**
- CREDIT_CARD
- STUDENT_LOAN
- MORTGAGE
- PERSONAL
- AUTO
- OTHER

---

### 12. debt_payments

**Purpose:** Record debt payments

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| debtId | Id<debts> | ✅ | Parent debt |
| userId | Id<users> | ✅ | Owner |
| amount | number | ✅ | Payment amount (cents) |
| date | number | ✅ | Payment date |
| principal | number | ❌ | Amount toward principal (cents) |
| interest | number | ❌ | Amount toward interest (cents) |
| note | string | ❌ | Optional note |
| createdAt | number | ✅ | Creation timestamp |

---

### 13. pay_schedules

**Purpose:** Track payday schedule

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Id<users> | ✅ | Owner |
| frequency | enum | ✅ | Pay frequency |
| nextPayday | number | ✅ | Next payday (timestamp) |
| anchorDate | number | ❌ | Reference date |
| dayOfMonth | number | ❌ | For monthly/semi-monthly (1-31) |
| timezone | string | ✅ | User timezone |
| isActive | boolean | ✅ | Is active? |
| createdAt | number | ✅ | Creation timestamp |

**Frequencies:**
- WEEKLY
- BIWEEKLY
- SEMI_MONTHLY (twice per month)
- MONTHLY
- EVERY_4_WEEKS

---

### 14. imports

**Purpose:** Track CSV imports

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Id<users> | ✅ | Owner |
| fileName | string | ✅ | Original filename |
| storageId | Id<_storage> | ✅ | Convex file storage ID |
| rowCount | number | ✅ | Number of rows imported |
| columnMapping | object | ✅ | CSV column → field mapping |
| importedAt | number | ✅ | Import timestamp |
| expiresAt | number | ✅ | 30 days from import (GDPR) |

**Column Mapping Structure:**
```typescript
{
  date: "Transaction Date",      // CSV column name
  amount: "Amount",
  description: "Description",
  category: "Category",           // Optional
  account: "Account"              // Optional
}
```

---

### 15. receipts

**Purpose:** Store receipt metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Id<users> | ✅ | Owner |
| transactionId | Id<transactions> | ❌ | Linked transaction |
| storageId | Id<_storage> | ✅ | Convex file storage ID |
| fileName | string | ✅ | Original filename |
| fileSize | number | ✅ | File size in bytes |
| mimeType | string | ✅ | MIME type (e.g., "image/jpeg") |
| uploadedAt | number | ✅ | Upload timestamp |
| deletedAt | number | ❌ | Soft delete timestamp |

---

## Relationships

```
users (1) ──────────< (N) transactions
users (1) ──────────< (N) categories
users (1) ──────────< (N) accounts
users (1) ──────────< (N) recurring_templates
users (1) ──────────< (N) budgets
users (1) ──────────< (N) savings_goals
users (1) ──────────< (N) debts
users (1) ──────────< (N) imports
users (1) ──────────< (N) receipts

categories (1) ──────< (N) transactions
accounts (1) ────────< (N) transactions
recurring_templates (1) ──< (N) transactions
recurring_templates (1) ──< (N) recurring_instances
imports (1) ─────────< (N) transactions
receipts (1) ────────── (0..1) transactions

budgets (1) ─────────< (N) budget_allocations
categories (1) ──────< (N) budget_allocations

savings_goals (1) ───< (N) goal_contributions
debts (1) ───────────< (N) debt_payments
```

---

## Data Integrity Rules

### 1. User Isolation
- All queries **MUST** filter by `userId`
- All mutations **MUST** verify userId matches authenticated user

### 2. Soft Deletes
- Categories: `isArchived = true`
- Accounts: `isArchived = true`
- Goals: `isArchived = true`
- Debts: `isClosed = true`
- Recurring Instances: `deletedAt != null`
- Receipts: `deletedAt != null`

### 3. Cascade Deletes
When user deletes account:
- ❌ Hard delete user from Convex
- ✅ Delete all related records (transactions, categories, budgets, etc.)

### 4. Amount Precision
- Store as **integers** (cents) to avoid floating-point errors
- Convert to decimal for display: `amount / 100`
- Format with currency: `new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount / 100)`

### 5. Timestamp Format
- Use Unix timestamps (milliseconds since epoch)
- JavaScript: `Date.now()`
- Convert to Date: `new Date(timestamp)`

---

## Computed Fields

### Budget Progress
```typescript
// Calculate spending for a budget period
const spent = transactions
  .filter(t => t.date >= budget.periodStart && t.date <= budget.periodEnd)
  .filter(t => t.type === "EXPENSE")
  .reduce((sum, t) => sum + t.amount, 0);

const progress = (spent / budget.totalAmount) * 100;
```

### Goal Progress
```typescript
const progress = (goal.currentAmount / goal.targetAmount) * 100;
```

### Net Worth
```typescript
// Assets (positive)
const totalIncome = transactions
  .filter(t => t.type === "INCOME")
  .reduce((sum, t) => sum + t.amount, 0);

const savingsTotal = savings_goals
  .reduce((sum, g) => sum + g.currentAmount, 0);

// Liabilities (negative)
const debtTotal = debts
  .filter(d => !d.isClosed)
  .reduce((sum, d) => sum + d.currentBalance, 0);

const netWorth = totalIncome + savingsTotal - debtTotal;
```

---

## Scheduled Jobs (Convex Cron)

### 1. GDPR Cleanup (Daily)
```typescript
// Delete expired CSV imports (>30 days old)
// Delete associated files from storage
```

### 2. Bill Reminders (Daily)
```typescript
// Find recurring templates with instances in next 7/14/30 days
// Create notifications for users
```

---

## Migration Notes

### From Prisma (v0.4.0) to Convex (v1.0.0)

**Not migrating data** - fresh start.

Key schema changes:
1. **Users:** `id` (string) → `clerkId` (string), separate `_id` (Convex ID)
2. **Amounts:** `Decimal` → `number` (cents as integers)
3. **Timestamps:** `DateTime` → `number` (Unix timestamp)
4. **Enums:** Prisma enums → TypeScript union types
5. **Indexes:** Prisma indexes → Convex `.index()` definitions
6. **Relations:** Foreign keys → Convex `Id<table>` type references

---

**Schema Version:** 1.0.0
**Next Review:** After v0.5.0 implementation
