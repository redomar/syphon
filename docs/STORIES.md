# Syphon v1.0.0 - User Stories

**Version:** 1.0.0
**Last Updated:** 2025-11-08
**Total Stories:** 33

---

## Story Format

Each story follows this structure:
```
Story ID: E#.S#
Title: User-facing feature name
As a: User role
I want to: Action/goal
So that: Benefit/outcome
Priority: Critical/High/Medium
Size: Small/Medium/Large (story points)
Dependencies: Previous stories required
Acceptance Criteria: Testable conditions
```

---

## Story Index

### E1: Infrastructure & Setup (v0.3.0)
- E1.S1: Project Initialization
- E1.S2: Convex Integration
- E1.S3: Clerk Authentication
- E1.S4: UI Foundation
- E1.S5: Deployment Pipeline

### E2: Transaction Management (v0.4.0)
- E2.S1: Category Management
- E2.S2: Account Management
- E2.S3: Create Transaction
- E2.S4: Transaction List & Filters

### E3: Budget System (v0.5.0)
- E3.S1: Create Budget
- E3.S2: Budget Allocations & Groups
- E3.S3: Budget Progress Tracking
- E3.S4: Budget Templates

### E4: Savings Goals (v0.6.0)
- E4.S1: Create & Manage Goals
- E4.S2: Goal Contributions
- E4.S3: Goal Progress & Dashboard

### E5: Debt Tracking (v0.6.0)
- E5.S1: Create & Manage Debts
- E5.S2: Debt Payments
- E5.S3: Debt Dashboard & Projections

### E6: Recurring Transactions (v0.7.0)
- E6.S1: Create Recurring Templates
- E6.S2: Projection Engine
- E6.S3: Actualize Projections
- E6.S4: Ledger Integration
- E6.S5: Budget Integration

### E7: Analytics & Reports (v0.8.0)
- E7.S1: Income vs Expense Report
- E7.S2: Spending by Category Report
- E7.S3: Net Worth Trend
- E7.S4: Report Filters & Date Ranges

### E8: Polish & Launch (v0.9.0)
- E8.S1: CSV Import
- E8.S2: Receipt Management
- E8.S3: Onboarding Flow
- E8.S4: Bill Reminders
- E8.S5: Pay Schedule & Final Polish

---

## E1: Infrastructure & Setup (v0.3.0)

### E1.S1: Project Initialization

**As a:** Developer
**I want to:** Set up a React Router 7 project with TypeScript and Tailwind
**So that:** I have a solid foundation to build features

**Priority:** 🔴 Critical
**Size:** Small (2-3 hours)
**Dependencies:** None

**Acceptance Criteria:**
- [ ] React Router 7 project created with Vite
- [ ] TypeScript configured (strict mode enabled)
- [ ] Tailwind CSS installed and working
- [ ] ESLint + Prettier configured
- [ ] Project structure created (routes/, components/, lib/, convex/)
- [ ] `npm run dev` starts app on port 5173
- [ ] First commit pushed to branch

**Definition of Done:**
- App runs without errors
- TypeScript compiles successfully
- Tailwind classes apply styles
- Code passes ESLint

---

### E1.S2: Convex Integration

**As a:** Developer
**I want to:** Connect Convex database to the app
**So that:** I can store and query data in real-time

**Priority:** 🔴 Critical
**Size:** Small (2-3 hours)
**Dependencies:** E1.S1

**Acceptance Criteria:**
- [ ] Convex installed and initialized
- [ ] `convex/schema.ts` created with users table
- [ ] ConvexProvider added to app root
- [ ] Test query created and working
- [ ] Can see Convex data in browser
- [ ] Real-time updates verified (add data in dashboard, see in app)

**Definition of Done:**
- Convex dev environment running
- Can query Convex from React
- Real-time subscription works

---

### E1.S3: Clerk Authentication

**As a:** User
**I want to:** Sign up and sign in securely
**So that:** My financial data is protected and private

**Priority:** 🔴 Critical
**Size:** Medium (3-4 hours)
**Dependencies:** E1.S2

**Acceptance Criteria:**
- [ ] Clerk SDK installed
- [ ] Sign-up page functional
- [ ] Sign-in page functional
- [ ] User synced to Convex on first sign-in (lazy creation)
- [ ] Protected routes redirect to sign-in when unauthenticated
- [ ] User metadata (email, name) synced to Convex

**Definition of Done:**
- Can sign up with email/password
- Can sign in with existing account
- User record appears in Convex users table
- Protected routes work

**Technical Notes:**
- Use Clerk webhook to trigger Convex user creation
- Store clerkId, email, firstName, lastName in Convex

---

### E1.S4: UI Foundation

**As a:** Developer
**I want to:** Set up the UI framework and app layout
**So that:** I can build consistent, accessible interfaces

**Priority:** 🔴 Critical
**Size:** Medium (3-4 hours)
**Dependencies:** E1.S3

**Acceptance Criteria:**
- [ ] shadcn/ui installed and configured
- [ ] Essential components added (button, card, input, select, dialog, toast)
- [ ] Dark theme configured as default
- [ ] App layout created (sidebar, header, main content)
- [ ] Sidebar navigation functional
- [ ] All core pages created (dashboard, transactions, budgets, goals, debts, reports, settings)
- [ ] Navigation highlights active page

**Definition of Done:**
- Dark theme applied globally
- Can navigate between pages
- Layout is responsive (mobile: 1 col, desktop: 4-5 cols)
- shadcn components render correctly

---

### E1.S5: Deployment Pipeline

**As a:** Developer
**I want to:** Deploy the app to production
**So that:** I can test in a live environment and show progress

**Priority:** 🔴 Critical
**Size:** Small (2-3 hours)
**Dependencies:** E1.S4

**Acceptance Criteria:**
- [ ] Convex deployed to production environment
- [ ] Netlify site created and connected to GitHub
- [ ] Environment variables configured (Clerk keys, Convex URL)
- [ ] Production build successful
- [ ] Can access production URL
- [ ] Auth works in production

**Definition of Done:**
- Production URL accessible
- Can sign in on production
- No console errors in production
- Environment variables secure

---

## E2: Transaction Management (v0.4.0)

### E2.S1: Category Management

**As a:** User
**I want to:** Create and organize income/expense categories
**So that:** I can classify my transactions meaningfully

**Priority:** 🔴 Critical
**Size:** Medium (4-5 hours)
**Dependencies:** E1.S5

**Acceptance Criteria:**
- [ ] Can create custom category (name, type, color, icon)
- [ ] Category list shows all categories (income & expense tabs)
- [ ] Can edit category (name, color, icon)
- [ ] Can archive category (soft delete)
- [ ] Archived categories hidden by default (toggle to show)
- [ ] Default categories created on first sign-up
- [ ] Categories appear instantly (real-time)
- [ ] Cannot create duplicate names (validation error)

**Default Categories:**

*Income:*
- Salary (Briefcase, #10b981)
- Freelance (Laptop, #3b82f6)
- Investment (TrendingUp, #8b5cf6)
- Gift (Gift, #ec4899)
- Other Income (Plus, #6b7280)

*Expense:*
- Groceries (ShoppingCart, #ef4444)
- Rent/Mortgage (Home, #f59e0b)
- Utilities (Zap, #eab308)
- Transport (Car, #06b6d4)
- Dining Out (Utensils, #f97316)
- Entertainment (Film, #a855f7)
- Healthcare (Heart, #ef4444)
- Shopping (ShoppingBag, #ec4899)
- Other Expense (Plus, #6b7280)

**Definition of Done:**
- Category CRUD functional
- Default categories work
- Real-time updates verified
- Validation prevents duplicates

---

### E2.S2: Account Management

**As a:** User
**I want to:** Track my bank accounts and credit cards
**So that:** I know where my money is and where I'm spending it

**Priority:** 🔴 Critical
**Size:** Medium (3-4 hours)
**Dependencies:** E2.S1

**Acceptance Criteria:**
- [ ] Can create account (name, type, provider, last 4 digits)
- [ ] Account types: Checking, Savings, Credit Card, Debit Card, Cash, Investment, Other
- [ ] Account list shows all accounts
- [ ] Can edit account
- [ ] Can archive account
- [ ] Accounts appear instantly (real-time)
- [ ] Cannot create duplicate names (validation)

**Definition of Done:**
- Account CRUD functional
- All account types supported
- Real-time updates work

---

### E2.S3: Create Transaction

**As a:** User
**I want to:** Record income and expenses quickly
**So that:** I can track my spending and income

**Priority:** 🔴 Critical
**Size:** Medium (4-5 hours)
**Dependencies:** E2.S2

**Acceptance Criteria:**
- [ ] Transaction form has fields: type, amount, description, date, category, account
- [ ] Type: Income or Expense (toggle or radio)
- [ ] Amount validation: must be positive, max 2 decimals
- [ ] Date picker defaults to today
- [ ] Category dropdown shows relevant categories (income or expense based on type)
- [ ] Account dropdown shows all accounts (optional)
- [ ] Form validation shows inline errors
- [ ] Success toast shows after creation
- [ ] Transaction appears instantly in list
- [ ] Optimistic update: form resets immediately

**Validation Rules:**
- Amount required, > 0
- Description required, max 200 characters
- Date required, cannot be in future
- Category optional
- Account optional

**Definition of Done:**
- Form submits successfully
- Validation prevents invalid data
- Transaction appears in ledger
- Optimistic update works

---

### E2.S4: Transaction List & Filters

**As a:** User
**I want to:** View all my transactions with filtering options
**So that:** I can find specific transactions and analyze spending

**Priority:** 🔴 Critical
**Size:** Large (6-7 hours)
**Dependencies:** E2.S3

**Acceptance Criteria:**
- [ ] Transaction list shows all transactions (newest first)
- [ ] Columns: Date, Description, Category, Account, Amount
- [ ] Income shown in green, Expense in red
- [ ] Date range filter works (last 7/30/90 days, custom)
- [ ] Category filter works (multi-select)
- [ ] Account filter works (multi-select)
- [ ] Type filter works (income/expense/all)
- [ ] Can edit transaction (modal or inline)
- [ ] Can delete transaction (with confirmation)
- [ ] Real-time: new transactions appear without refresh
- [ ] Pagination or virtual scrolling for large lists (>100 items)

**Filters:**
- Date Range: Last 7 days, Last 30 days, Last 90 days, Custom (date picker)
- Category: Multi-select dropdown
- Account: Multi-select dropdown
- Type: All, Income Only, Expense Only

**Definition of Done:**
- List displays correctly
- All filters work
- Edit/delete functional
- Real-time updates verified
- Performance good with 1000+ transactions

---

## E3: Budget System (v0.5.0)

### E3.S1: Create Budget

**As a:** User
**I want to:** Create a monthly budget
**So that:** I can plan my spending for the month

**Priority:** 🔴 Critical
**Size:** Medium (4-5 hours)
**Dependencies:** E2.S4

**Acceptance Criteria:**
- [ ] Budget form has fields: name, period (start/end), total amount (optional)
- [ ] Name defaults to "Month YYYY" (e.g., "January 2025")
- [ ] Period start defaults to 1st of month, end to last day
- [ ] Total amount optional (can be sum of allocations)
- [ ] Budget list shows all budgets (sorted by period)
- [ ] Can view budget detail page
- [ ] Can edit budget name and total
- [ ] Can delete budget (with confirmation)

**Definition of Done:**
- Can create budget
- Budget list functional
- Budget detail page shows allocations (empty state)

---

### E3.S2: Budget Allocations & Groups

**As a:** User
**I want to:** Assign categories to budget groups and allocate amounts
**So that:** I can organize my spending into needs, wants, and niceties

**Priority:** 🔴 Critical
**Size:** Large (6-7 hours)
**Dependencies:** E3.S1

**Acceptance Criteria:**
- [ ] Budget detail page shows 3 groups: Needs, Wants, Niceties
- [ ] Can assign category to a group (drag-drop or dropdown)
- [ ] Can set amount per category (input field)
- [ ] Total per group calculates automatically
- [ ] Grand total = sum of all allocations
- [ ] If budget has total amount, show % of total used
- [ ] Can remove category from budget (unassign)
- [ ] Changes save automatically (debounced)

**UI Layout:**
```
Budget: January 2025 | Total: £2,000

NEEDS (50% - £1,000)
  - Rent/Mortgage: £800
  - Groceries: £200
  Total: £1,000 (100% of needs)

WANTS (30% - £600)
  - Dining Out: £300
  - Entertainment: £200
  Total: £500 (83% of wants)

NICETIES (20% - £400)
  - Shopping: £400
  Total: £400 (100% of niceties)
```

**Definition of Done:**
- Category assignment works
- Amount allocation works
- Calculations accurate
- Auto-save functional

---

### E3.S3: Budget Progress Tracking

**As a:** User
**I want to:** See how much I've spent vs my budget in real-time
**So that:** I can stay within my budget and adjust spending

**Priority:** 🔴 Critical
**Size:** Large (6-7 hours)
**Dependencies:** E3.S2

**Acceptance Criteria:**
- [ ] Progress bar shows % spent per category
- [ ] Colors: Green (<75%), Yellow (75-90%), Red (>90%)
- [ ] Spent amount and allocated amount shown
- [ ] Remaining amount calculated
- [ ] Progress updates in real-time (as transactions added)
- [ ] Alert shown at top of page when category >90% spent
- [ ] Alert shows on dashboard (budget overview card)
- [ ] Can dismiss alert (persists until category <90%)

**Progress Formula:**
```
Spent = Sum of transactions in budget period where category matches
Progress % = (Spent / Allocated) * 100
Remaining = Allocated - Spent
```

**Alert Message:**
```
⚠️ Budget Alert: You've spent £180 of £200 (90%) allocated to Groceries.
```

**Definition of Done:**
- Progress bars accurate
- Colors change at thresholds
- Alerts work
- Real-time updates verified

---

### E3.S4: Budget Templates

**As a:** User
**I want to:** Apply a 50/30/20 budget template
**So that:** I can quickly set up a balanced budget

**Priority:** 🟡 High
**Size:** Medium (4-5 hours)
**Dependencies:** E3.S2

**Acceptance Criteria:**
- [ ] Budget creation has "Apply Template" button
- [ ] Template modal shows: 50/30/20 (Needs/Wants/Niceties)
- [ ] Can adjust ratios (sliders or inputs)
- [ ] Ratios must sum to 100%
- [ ] Enter total budget amount
- [ ] Template calculates allocations automatically (total * ratio)
- [ ] Can assign categories to each group before applying
- [ ] Apply button distributes amounts evenly across categories in each group
- [ ] Can manually adjust after applying template

**Example:**
```
Total Budget: £2,000
Ratios: 50% Needs / 30% Wants / 20% Niceties

Auto-calculation:
- Needs: £1,000 (2 categories → £500 each)
- Wants: £600 (3 categories → £200 each)
- Niceties: £400 (1 category → £400)
```

**Definition of Done:**
- Template modal functional
- Ratio adjustment works
- Auto-calculation accurate
- User can override amounts

---

## E4: Savings Goals (v0.6.0)

### E4.S1: Create & Manage Goals

**As a:** User
**I want to:** Set savings goals with target amounts
**So that:** I can work toward specific financial objectives

**Priority:** 🟡 High
**Size:** Medium (3-4 hours)
**Dependencies:** E2.S4

**Acceptance Criteria:**
- [ ] Goal form has fields: name, target amount, deadline (optional)
- [ ] Name required, max 100 characters
- [ ] Target amount required, > 0
- [ ] Deadline optional (date picker)
- [ ] Goal list shows all active goals
- [ ] Can edit goal (modal)
- [ ] Can archive goal (soft delete)
- [ ] Can view archived goals (toggle)

**Definition of Done:**
- Goal CRUD functional
- Validation works
- Archive feature works

---

### E4.S2: Goal Contributions

**As a:** User
**I want to:** Add contributions to my savings goals
**So that:** I can track progress toward my target

**Priority:** 🟡 High
**Size:** Medium (3-4 hours)
**Dependencies:** E4.S1

**Acceptance Criteria:**
- [ ] Contribution form has fields: amount, date, note (optional)
- [ ] Amount required, > 0
- [ ] Date defaults to today
- [ ] Contribution list shows all contributions for goal
- [ ] Goal's current amount updates automatically (sum of contributions)
- [ ] Can delete contribution (currentAmount recalculates)

**Definition of Done:**
- Can add contribution
- currentAmount accurate
- Contribution history shows

---

### E4.S3: Goal Progress & Dashboard

**As a:** User
**I want to:** See my savings goals on the dashboard with progress bars
**So that:** I'm motivated to keep saving

**Priority:** 🟡 High
**Size:** Small (2-3 hours)
**Dependencies:** E4.S2

**Acceptance Criteria:**
- [ ] Dashboard shows goal cards (max 3, or scrollable)
- [ ] Each card shows: name, progress bar, current/target amount, % complete
- [ ] If deadline set, show days remaining or "Overdue"
- [ ] Progress bar color: Blue (<100%), Green (100%+)
- [ ] Click card to view goal detail page
- [ ] If no goals, show empty state with "Create your first goal" CTA

**Goal Card Design:**
```
┌────────────────────────────────┐
│ Vacation Fund                  │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 60%        │
│ £1,200 / £2,000                │
│ 45 days remaining              │
└────────────────────────────────┘
```

**Definition of Done:**
- Goal cards render on dashboard
- Progress accurate
- Empty state works

---

## E5: Debt Tracking (v0.6.0)

### E5.S1: Create & Manage Debts

**As a:** User
**I want to:** Track my debts (credit cards, loans)
**So that:** I can plan repayment and reduce debt

**Priority:** 🟡 High
**Size:** Medium (3-4 hours)
**Dependencies:** E2.S4

**Acceptance Criteria:**
- [ ] Debt form has fields: name, type, initial balance, current balance, APR, min payment, lender, due day
- [ ] Types: Credit Card, Student Loan, Mortgage, Personal, Auto, Other
- [ ] Initial balance required (original amount owed)
- [ ] Current balance defaults to initial balance
- [ ] APR optional (for interest calculations)
- [ ] Min payment required
- [ ] Due day optional (1-31)
- [ ] Debt list shows all debts
- [ ] Can edit debt
- [ ] Can mark debt as closed (isClosed flag)

**Definition of Done:**
- Debt CRUD functional
- All fields validated
- Closed debts hidden by default

---

### E5.S2: Debt Payments

**As a:** User
**I want to:** Record payments toward my debts
**So that:** I can track repayment progress

**Priority:** 🟡 High
**Size:** Medium (3-4 hours)
**Dependencies:** E5.S1

**Acceptance Criteria:**
- [ ] Payment form has fields: amount, date, principal, interest, note
- [ ] Amount required, > 0
- [ ] Date defaults to today
- [ ] Principal/interest optional (for detailed tracking)
- [ ] If principal provided, currentBalance reduces by principal amount
- [ ] If only amount provided, currentBalance reduces by full amount
- [ ] Payment list shows all payments for debt
- [ ] Can delete payment (currentBalance recalculates)

**Payment Calculation:**
```
If principal & interest provided:
  currentBalance -= principal

If only amount provided:
  currentBalance -= amount
```

**Definition of Done:**
- Can record payment
- currentBalance updates correctly
- Payment history shows

---

### E5.S3: Debt Dashboard & Projections

**As a:** User
**I want to:** See my total debt and estimated payoff date
**So that:** I understand my debt situation and stay motivated

**Priority:** 🟡 High
**Size:** Medium (4-5 hours)
**Dependencies:** E5.S2

**Acceptance Criteria:**
- [ ] Dashboard shows debt summary card: Total debt, Debt-to-income ratio
- [ ] Total debt = sum of all currentBalances (non-closed debts)
- [ ] Debt-to-income ratio = Total debt / Monthly income (requires income data)
- [ ] Debt detail page shows payoff projection
- [ ] Projection calculates months to payoff at current payment rate
- [ ] Formula: Months = currentBalance / average monthly payment
- [ ] Shows estimated payoff date

**Debt Summary Card:**
```
┌────────────────────────────────┐
│ Total Debt: £15,000            │
│ Debt-to-Income: 0.5x           │
│ Estimated Payoff: 12 months    │
└────────────────────────────────┘
```

**Definition of Done:**
- Dashboard shows debt summary
- Debt-to-income calculated
- Payoff projection accurate

---

## E6: Recurring Transactions (v0.7.0)

### E6.S1: Create Recurring Templates

**As a:** User
**I want to:** Set up recurring transactions (subscriptions, bills, paychecks)
**So that:** I don't have to manually enter them each time

**Priority:** 🟡 High
**Size:** Large (5-6 hours)
**Dependencies:** E2.S4

**Acceptance Criteria:**
- [ ] Recurring form has fields: type, amount, description, category, account, pattern, start date, end date (optional)
- [ ] Patterns: Daily, Weekly, Bi-weekly, Monthly, Yearly
- [ ] For Monthly: select day of month (1-31)
- [ ] For Weekly: select day of week (Sun-Sat)
- [ ] Start date required
- [ ] End date optional (null = ongoing)
- [ ] Recurring list shows all templates
- [ ] Can edit template (future instances affected)
- [ ] Can delete template (soft delete)
- [ ] Can deactivate template (isActive flag)

**Definition of Done:**
- Template CRUD functional
- All patterns supported
- Validation works

---

### E6.S2: Projection Engine

**As a:** Developer
**I want to:** Generate projected transactions from recurring templates
**So that:** Users can see upcoming bills and income

**Priority:** 🟡 High
**Size:** Large (6-7 hours)
**Dependencies:** E6.S1

**Acceptance Criteria:**
- [ ] Convex query `getProjectedTransactions(userId, startDate, endDate)` works
- [ ] Query expands each active template into instances for date range
- [ ] Handles all patterns correctly (daily, weekly, monthly, yearly)
- [ ] Skips instances already marked as paid, skipped, or deleted
- [ ] Returns projected transactions with `isProjected: true` flag
- [ ] Performance: Generates 100 projections in <200ms

**Algorithm:**
```typescript
For each active template:
  current = max(template.startDate, queryStartDate)
  while current <= min(template.endDate || Infinity, queryEndDate):
    if not (paid or skipped or deleted):
      yield {
        ...template fields,
        date: current,
        isProjected: true
      }
    current = next occurrence based on pattern
```

**Definition of Done:**
- Projection query works
- All patterns generate correctly
- Skipped instances excluded
- Performance acceptable

---

### E6.S3: Actualize Projections

**As a:** User
**I want to:** Mark projected transactions as paid, skipped, or modify amount
**So that:** My actual spending reflects reality

**Priority:** 🟡 High
**Size:** Large (5-6 hours)
**Dependencies:** E6.S2

**Acceptance Criteria:**
- [ ] Projected transactions have "Mark as Paid" button
- [ ] Click opens modal showing: description, original amount, editable amount, date
- [ ] Can edit amount before marking as paid
- [ ] "Mark as Paid" creates actual transaction with edited amount
- [ ] "Skip" button hides this instance (creates recurring_instance with status: SKIPPED)
- [ ] Skipped instances don't appear in future projections
- [ ] Can "un-skip" by deleting recurring_instance (soft delete with deletedAt)
- [ ] If amount modified, creates recurring_instance with status: MODIFIED

**Mark as Paid Flow:**
```
1. Click "Mark as Paid" on projected transaction
2. Modal opens with amount (editable)
3. User changes £10 → £12 (Netflix price increase)
4. User clicks "Confirm"
5. Creates actual transaction:
   - amount: 1200 (£12)
   - recurringTemplateId: template._id
6. Creates recurring_instance:
   - status: MODIFIED
   - actualAmount: 1200
   - actualTransactionId: transaction._id
7. Modal closes, projected transaction disappears
8. Actual transaction appears in ledger
```

**Definition of Done:**
- Mark as paid creates transaction
- Skip creates instance record
- Amount modification works
- Soft delete/restore functional

---

### E6.S4: Ledger Integration

**As a:** User
**I want to:** See both actual and projected transactions in my ledger
**So that:** I can plan for upcoming expenses

**Priority:** 🟡 High
**Size:** Medium (4-5 hours)
**Dependencies:** E6.S3

**Acceptance Criteria:**
- [ ] Ledger query merges actual + projected transactions
- [ ] Sorted by date (ascending or descending)
- [ ] Projected transactions styled differently (lighter text, dashed border)
- [ ] Toggle: "Show Recurring Projections" (on by default)
- [ ] When toggle off, only actual transactions shown
- [ ] Projected transactions show "Projected" badge
- [ ] Can mark as paid inline (button on hover)

**Ledger Layout:**
```
Date       Description         Type    Amount   Actions
---------- ------------------- ------- -------- --------
Jan 10     Salary              Income  £3,000   [Edit] [Delete]
Jan 15     Netflix (Projected) Expense £10      [Mark Paid] [Skip]
Jan 16     Groceries           Expense £50      [Edit] [Delete]
Jan 31     Rent (Projected)    Expense £1,200   [Mark Paid] [Skip]
```

**Definition of Done:**
- Ledger shows mixed transactions
- Toggle works
- Styling distinguishes types
- Inline actions functional

---

### E6.S5: Budget Integration

**As a:** Developer
**I want to:** Include projected recurring expenses in budget calculations
**So that:** Budget progress is accurate and predictive

**Priority:** 🟡 High
**Size:** Medium (3-4 hours)
**Dependencies:** E6.S4

**Acceptance Criteria:**
- [ ] Budget progress query includes projected transactions
- [ ] Spent = actual transactions + projected (not yet paid) in budget period
- [ ] Progress bar shows: Actual spent (solid) + Projected (striped pattern)
- [ ] Budget alerts include projected spending
- [ ] If projected expenses push category >90%, show alert

**Visual Design:**
```
Groceries: £150 / £200

▓▓▓▓▓▓▓░░░░░ (75%)
└─ actual  └─ projected

Spent: £120 (actual) + £30 (projected) = £150
```

**Definition of Done:**
- Budget includes projected
- Progress bar shows both
- Alerts account for projected

---

## E7: Analytics & Reports (v0.8.0)

### E7.S1: Income vs Expense Report

**As a:** User
**I want to:** See my income vs expenses over time
**So that:** I can identify spending trends

**Priority:** 🟢 Medium
**Size:** Large (5-6 hours)
**Dependencies:** E2.S4

**Acceptance Criteria:**
- [ ] Reports page has "Income vs Expense" chart
- [ ] Chart type: Line chart (Recharts)
- [ ] X-axis: Months (e.g., "Jan 2025")
- [ ] Y-axis: Amount (formatted as currency)
- [ ] Two lines: Income (green), Expense (red)
- [ ] Date range filter: Last 3/6/12 months, All time
- [ ] Hover shows exact amounts
- [ ] Chart responsive (mobile-friendly)

**Data Aggregation:**
```typescript
For each month in range:
  income = sum(transactions where type = INCOME and date in month)
  expense = sum(transactions where type = EXPENSE and date in month)
  yield { month, income, expense }
```

**Definition of Done:**
- Chart renders correctly
- Data accurate
- Date range filter works
- Responsive design

---

### E7.S2: Spending by Category Report

**As a:** User
**I want to:** See a breakdown of spending by category
**So that:** I know where my money is going

**Priority:** 🟢 Medium
**Size:** Medium (4-5 hours)
**Dependencies:** E7.S1

**Acceptance Criteria:**
- [ ] Reports page has "Spending by Category" chart
- [ ] Chart type: Pie chart (default) or Bar chart (toggle)
- [ ] Shows expense categories only
- [ ] Each slice/bar colored by category color
- [ ] Percentage and amount shown
- [ ] Date range filter works
- [ ] Can filter by account (optional)

**Data Aggregation:**
```typescript
expenses = transactions where type = EXPENSE and date in range
groupBy category:
  total = sum(expenses.amount)
  percentage = (total / grand total) * 100
  yield { categoryName, categoryColor, total, percentage }
```

**Definition of Done:**
- Pie and bar charts work
- Toggle between views
- Data accurate
- Colors match categories

---

### E7.S3: Net Worth Trend

**As a:** User
**I want to:** Track my net worth over time
**So that:** I can see my overall financial progress

**Priority:** 🟢 Medium
**Size:** Large (5-6 hours)
**Dependencies:** E4.S3, E5.S3

**Acceptance Criteria:**
- [ ] Reports page has "Net Worth Trend" chart
- [ ] Chart type: Line chart
- [ ] X-axis: Months
- [ ] Y-axis: Net worth (formatted as currency)
- [ ] Net Worth = Total Income + Savings - Total Debts
- [ ] Green line if positive, red if negative
- [ ] Date range filter works
- [ ] Hover shows breakdown (income, savings, debts)

**Net Worth Formula:**
```typescript
For each month in range:
  income = sum(all income transactions up to end of month)
  savings = sum(all goal contributions up to end of month)
  debts = sum(all debt currentBalances at end of month)
  netWorth = income + savings - debts
  yield { month, netWorth, income, savings, debts }
```

**Definition of Done:**
- Chart renders
- Calculation accurate
- Breakdown on hover
- Date range filter works

---

### E7.S4: Report Filters & Date Ranges

**As a:** User
**I want to:** Filter all reports by date range, category, and account
**So that:** I can analyze specific subsets of my data

**Priority:** 🟢 Medium
**Size:** Medium (4-5 hours)
**Dependencies:** E7.S3

**Acceptance Criteria:**
- [ ] Filter panel on reports page
- [ ] Date range: Last 7/30/90 days, 3/6/12 months, All time, Custom
- [ ] Custom date range: Start and end date pickers
- [ ] Category filter: Multi-select (applies to spending breakdown)
- [ ] Account filter: Multi-select (applies to all reports)
- [ ] Filters apply to all charts simultaneously
- [ ] Filter state persists (URL params or local storage)
- [ ] "Reset Filters" button

**Definition of Done:**
- All filters functional
- Apply to all charts
- State persists on refresh

---

## E8: Polish & Launch (v0.9.0)

### E8.S1: CSV Import

**As a:** User
**I want to:** Import transactions from a CSV file
**So that:** I can quickly add historical data

**Priority:** 🟢 Medium
**Size:** Large (7-8 hours)
**Dependencies:** E2.S4

**Acceptance Criteria:**
- [ ] Import page has drag-drop area or file picker
- [ ] Supports .csv files up to 10MB
- [ ] After upload, shows column mapping UI
- [ ] User selects which CSV column maps to: Date, Amount, Description, Category (optional), Account (optional)
- [ ] Date formats detected automatically (e.g., "MM/DD/YYYY", "DD-MM-YYYY")
- [ ] Amount parsed correctly (handles commas, currency symbols)
- [ ] Preview shows first 5 rows with mapped fields
- [ ] Duplicate detection: Matches on date + amount + description
- [ ] User chooses: Merge (skip duplicates) or Import All
- [ ] "Import" button creates transactions
- [ ] Progress bar shows import status
- [ ] Import history page shows past imports with row counts
- [ ] "Undo Import" button deletes transactions from most recent import
- [ ] CSV file stored in Convex storage for 30 days (GDPR), then auto-deleted

**Import Flow:**
```
1. Upload CSV
2. Parse and detect columns
3. Show mapping UI
4. User maps columns
5. Show preview + duplicate count
6. User confirms
7. Create transactions
8. Show success message
```

**Definition of Done:**
- CSV upload works
- Column mapping functional
- Duplicate detection accurate
- Undo import works
- GDPR cleanup scheduled

---

### E8.S2: Receipt Management

**As a:** User
**I want to:** Upload receipts and link them to transactions
**So that:** I have proof of purchase for returns or taxes

**Priority:** 🟢 Medium
**Size:** Medium (4-5 hours)
**Dependencies:** E2.S4

**Acceptance Criteria:**
- [ ] Transaction detail has "Upload Receipt" button
- [ ] Supports image (JPG, PNG) and PDF files up to 5MB
- [ ] Receipt uploads to Convex file storage
- [ ] Receipt thumbnail shows on transaction
- [ ] Click thumbnail to view full-size (modal or new tab)
- [ ] Can delete receipt (soft delete)
- [ ] When transaction deleted, receipt also deleted
- [ ] Receipts page shows all receipts (grid view)

**Definition of Done:**
- Upload works
- View receipt works
- Delete works
- GDPR-compliant deletion

---

### E8.S3: Onboarding Flow

**As a:** User
**I want to:** Be guided through initial setup
**So that:** I can start using the app quickly

**Priority:** 🟢 Medium
**Size:** Large (6-7 hours)
**Dependencies:** E1.S3

**Acceptance Criteria:**
- [ ] First sign-in shows welcome screen
- [ ] Two options: "Try Demo Mode" or "Set Up Your Budget"
- [ ] Demo Mode: Creates sample data (transactions, categories, budget, goals, debts) all tagged with `isDemoData: true`
- [ ] "Clear Demo Data" button deletes all demo records
- [ ] Setup Wizard (multi-step modal):
  - Step 1: Select currency (GBP, USD, EUR, CAD, AUD) and timezone
  - Step 2: Categories (show defaults, allow adding custom)
  - Step 3: Add first account (optional, can skip)
  - Step 4: Create first budget (optional, can skip)
  - Step 5: First transaction or CSV import (optional)
- [ ] Each step validates before allowing "Next"
- [ ] Progress indicator shows current step (e.g., "Step 2 of 5")
- [ ] Can go back to previous steps
- [ ] "Skip Setup" button (redirects to empty dashboard)
- [ ] After completion, sets `user.onboardingComplete = true`
- [ ] Onboarding never shows again

**Demo Mode Data:**
```
- 50 transactions (mix of income/expense, last 3 months)
- 1 budget (current month, with allocations)
- 2 savings goals (50% complete)
- 1 debt (credit card with payment history)
- All tagged with isDemoData: true
```

**Definition of Done:**
- Wizard functional
- Demo mode works
- Clear demo works
- Never shows again after completion

---

### E8.S4: Bill Reminders

**As a:** User
**I want to:** Be reminded of upcoming bills
**So that:** I don't miss payments

**Priority:** 🟢 Medium
**Size:** Medium (3-4 hours)
**Dependencies:** E6.S4

**Acceptance Criteria:**
- [ ] Settings has "Bill Reminder Days" option (7/14/30/custom)
- [ ] Dashboard shows "Upcoming Bills" section
- [ ] Lists recurring expenses due in next X days
- [ ] Alert at top of page: "You have 3 bills due in the next 7 days"
- [ ] Each bill shows: Description, Amount, Due date, Days until due
- [ ] Can mark bill as paid from reminder (creates transaction)
- [ ] Reminder disappears after marking as paid

**Upcoming Bills Query:**
```typescript
projected = getProjectedTransactions(userId, today, today + reminderDays)
bills = projected.filter(t => t.type === "EXPENSE")
sort by date ascending
```

**Definition of Done:**
- Reminder setting works
- Upcoming bills show
- Alert functional
- Mark as paid works

---

### E8.S5: Pay Schedule & Final Polish

**As a:** User
**I want to:** Track my payday schedule
**So that:** I know when I'll get paid next

**Priority:** 🟢 Medium
**Size:** Medium (4-5 hours)
**Dependencies:** E2.S4

**Acceptance Criteria:**
- [ ] Settings has "Pay Schedule" form
- [ ] Frequency options: Weekly, Bi-weekly, Semi-monthly, Monthly, Every 4 weeks
- [ ] For Monthly: Select day of month
- [ ] For Bi-weekly: Select anchor date (next payday)
- [ ] Dashboard shows "Days Until Payday" card
- [ ] Card shows: Next payday date, Days remaining, Estimated amount (if linked to recurring income)
- [ ] Can link to recurring income template (optional)

**Pay Schedule Card:**
```
┌────────────────────────────────┐
│ Next Payday: Jan 31            │
│ 14 days remaining              │
│ Expected: £3,000               │
└────────────────────────────────┘
```

**Final Polish Tasks:**
- [ ] Full app UX audit (check all pages)
- [ ] Fix UI inconsistencies (spacing, colors, fonts)
- [ ] Add loading skeletons (Suspense boundaries)
- [ ] Add error boundaries (catch crashes)
- [ ] Test all features end-to-end
- [ ] Fix any bugs found
- [ ] Update README with setup instructions
- [ ] Write user guide (basic usage)

**Definition of Done:**
- Pay schedule works
- Dashboard card shows
- No critical bugs
- Documentation complete
- App feels polished

---

## Story Sizing Guide

**Small (2-4 hours):**
- Single component or simple feature
- Clear requirements
- Minimal dependencies
- Example: E1.S5 (Deployment)

**Medium (4-6 hours):**
- Multiple components or moderate complexity
- Some dependencies
- Requires integration
- Example: E2.S2 (Account Management)

**Large (6-8+ hours):**
- Complex feature with multiple parts
- Heavy business logic
- Multiple dependencies
- Requires testing & polish
- Example: E6.S2 (Projection Engine)

---

## Acceptance Criteria Checklist

Each story is "done" when:
- ✅ All acceptance criteria met
- ✅ Code passes ESLint (no errors)
- ✅ TypeScript compiles (no errors)
- ✅ Manual testing passes
- ✅ Real-time updates verified (if applicable)
- ✅ Responsive design works (mobile + desktop)
- ✅ No console errors
- ✅ Committed to branch

---

**Document Version:** 1.0
**Next Review:** After E3 (mid-project check-in)
