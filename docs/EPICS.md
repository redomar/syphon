# Syphon v1.0.0 - Epic Breakdown

**Version:** 1.0.0
**Last Updated:** 2025-11-08
**Total Epics:** 8

---

## Epic Overview

| Epic | Name | Version | Priority | Est. Duration | Stories |
|------|------|---------|----------|---------------|---------|
| **E1** | Infrastructure & Setup | v0.3.0 | 🔴 Critical | 3-5 days | 5 |
| **E2** | Transaction Management | v0.4.0 | 🔴 Critical | 5-7 days | 4 |
| **E3** | Budget System | v0.5.0 | 🔴 Critical | 5-7 days | 4 |
| **E4** | Savings Goals | v0.6.0 | 🟡 High | 3-5 days | 3 |
| **E5** | Debt Tracking | v0.6.0 | 🟡 High | 3-5 days | 3 |
| **E6** | Recurring Transactions | v0.7.0 | 🟡 High | 5-7 days | 5 |
| **E7** | Analytics & Reports | v0.8.0 | 🟢 Medium | 5-7 days | 4 |
| **E8** | Polish & Launch | v0.9.0 | 🟢 Medium | 5-7 days | 5 |

**Total Estimated Duration:** 35-49 days (7-10 weeks)

---

## E1: Infrastructure & Setup (v0.3.0)

**Goal:** Set up project foundation with all tools wired and working

### Success Criteria
- ✅ React Router 7 app running locally
- ✅ Convex connected and queries working
- ✅ Clerk authentication functional
- ✅ UI framework (shadcn/ui) installed
- ✅ Deployed to Netlify + Convex production
- ✅ Can sign in and create a test record

### Stories
- **E1.S1:** Project Initialization
- **E1.S2:** Convex Integration
- **E1.S3:** Clerk Authentication
- **E1.S4:** UI Foundation
- **E1.S5:** Deployment Pipeline

### Dependencies
- None (starting point)

### Deliverables
- Empty app with working auth
- All pages scaffolded (empty)
- Deployment working (can push to production)

---

## E2: Transaction Management (v0.4.0)

**Goal:** Users can create, view, edit, and delete transactions with categories and accounts

### Success Criteria
- ✅ Can create income/expense transactions
- ✅ Transactions appear in real-time
- ✅ Categories are manageable (CRUD)
- ✅ Accounts are manageable (CRUD)
- ✅ Transaction list filters work (date, category, account)

### Stories
- **E2.S1:** Category Management
- **E2.S2:** Account Management
- **E2.S3:** Create Transaction
- **E2.S4:** Transaction List & Filters

### Dependencies
- E1 (Infrastructure must be complete)

### Deliverables
- Working transaction CRUD
- Category system
- Account system
- Basic ledger view

---

## E3: Budget System (v0.5.0)

**Goal:** Users can create monthly budgets, assign categories to budget groups, and track progress

### Success Criteria
- ✅ Can create a budget for a month
- ✅ Can assign categories to NEEDS/WANTS/NICETIES groups
- ✅ Can allocate amounts to each category
- ✅ Budget progress shows real-time
- ✅ Alerts when approaching 90% of budget
- ✅ 50/30/20 template works (adjustable ratios)

### Stories
- **E3.S1:** Create Budget
- **E3.S2:** Budget Allocations & Groups
- **E3.S3:** Budget Progress Tracking
- **E3.S4:** Budget Templates (50/30/20)

### Dependencies
- E2 (Transactions + Categories must exist)

### Deliverables
- Budget creation flow
- Budget dashboard/page
- Progress bars & alerts
- Template system

---

## E4: Savings Goals (v0.6.0)

**Goal:** Users can set savings goals, track contributions, and see progress

### Success Criteria
- ✅ Can create savings goal with target amount & deadline
- ✅ Can add contributions manually
- ✅ Progress bar shows % complete
- ✅ Can archive completed goals
- ✅ Dashboard shows active goals

### Stories
- **E4.S1:** Create & Manage Goals
- **E4.S2:** Goal Contributions
- **E4.S3:** Goal Progress & Dashboard

### Dependencies
- E2 (Transactions exist for auto-contribution future feature)

### Deliverables
- Goals page
- Contribution tracking
- Goal cards on dashboard

---

## E5: Debt Tracking (v0.6.0)

**Goal:** Users can track debts, record payments, and see payoff projections

### Success Criteria
- ✅ Can create debt accounts (credit card, loan, etc.)
- ✅ Can record payments with principal/interest split
- ✅ Current balance updates automatically
- ✅ Dashboard shows total debt
- ✅ Basic payoff projection (months to payoff at current rate)

### Stories
- **E5.S1:** Create & Manage Debts
- **E5.S2:** Debt Payments
- **E5.S3:** Debt Dashboard & Projections

### Dependencies
- E2 (Transactions for payment linkage)

### Deliverables
- Debt page
- Payment tracking
- Payoff calculator

---

## E6: Recurring Transactions (v0.7.0)

**Goal:** Users can set up recurring transactions, see projections, and mark them as paid

### Success Criteria
- ✅ Can create recurring template (daily/weekly/monthly/yearly)
- ✅ Projections appear in ledger (virtual transactions)
- ✅ Can mark projected as paid/skipped/modified
- ✅ Recurring included in budget calculations
- ✅ Ledger has toggle to show/hide recurring templates

### Stories
- **E6.S1:** Create Recurring Templates
- **E6.S2:** Projection Engine
- **E6.S3:** Actualize Projections (Mark as Paid)
- **E6.S4:** Ledger Integration
- **E6.S5:** Budget Integration

### Dependencies
- E2 (Transactions)
- E3 (Budget calculations)

### Deliverables
- Recurring page
- Projection logic
- Ledger with recurring
- Budget includes recurring

---

## E7: Analytics & Reports (v0.8.0)

**Goal:** Users can view financial reports and trends

### Success Criteria
- ✅ Income vs Expense chart (line chart, last 6 months)
- ✅ Spending by Category chart (pie/bar chart)
- ✅ Net Worth trend (line chart)
- ✅ Date range filters work
- ✅ Reports page polished and useful

### Stories
- **E7.S1:** Income vs Expense Report
- **E7.S2:** Spending by Category Report
- **E7.S3:** Net Worth Trend
- **E7.S4:** Report Filters & Date Ranges

### Dependencies
- E2 (Transactions)
- E4 (Goals for net worth)
- E5 (Debts for net worth)

### Deliverables
- Reports page
- 3 core charts
- Filter system

---

## E8: Polish & Launch (v0.9.0)

**Goal:** Production-ready features (CSV import, receipts, onboarding, bill reminders)

### Success Criteria
- ✅ CSV import works (column mapping, duplicate detection, undo)
- ✅ Receipts can be uploaded and linked to transactions
- ✅ Onboarding flow complete (setup wizard + demo mode)
- ✅ Bill reminders show on dashboard
- ✅ Pay schedule configured
- ✅ Demo mode cleanup works

### Stories
- **E8.S1:** CSV Import
- **E8.S2:** Receipt Management
- **E8.S3:** Onboarding Flow
- **E8.S4:** Bill Reminders
- **E8.S5:** Pay Schedule & Final Polish

### Dependencies
- E2 (Transactions for import)
- E6 (Recurring for bill reminders)

### Deliverables
- Import system
- Receipt uploads
- Onboarding wizard
- Bill alerts
- Pay schedule tracker

---

## Epic Dependency Graph

```
E1 (Infrastructure)
 ↓
E2 (Transactions)
 ↓
 ├──→ E3 (Budgets)
 ├──→ E4 (Goals) ─────┐
 ├──→ E5 (Debts) ─────┼──→ E7 (Reports)
 └──→ E6 (Recurring) ─┘       ↓
       ↓                   E8 (Polish)
      E8 (Polish)
```

**Critical Path:** E1 → E2 → E3 → E6 → E8 (longest dependency chain)

---

## Detailed Epic Descriptions

---

### E1: Infrastructure & Setup (v0.3.0)

#### E1.S1: Project Initialization

**Goal:** Create React Router 7 project with TypeScript and Tailwind

**Tasks:**
1. Create React Router 7 project with Vite
2. Configure TypeScript (tsconfig.json)
3. Set up Tailwind CSS + postcss
4. Add ESLint + Prettier
5. Create folder structure (routes, components, lib, convex)
6. First commit

**Acceptance Criteria:**
- `npm run dev` starts app on port 5173
- TypeScript compiles with no errors
- Tailwind classes work
- ESLint passes

---

#### E1.S2: Convex Integration

**Goal:** Connect Convex database and verify queries work

**Tasks:**
1. Install Convex (`npm install convex`)
2. Run `npx convex dev` and create project
3. Create `convex/schema.ts` with users table
4. Add ConvexProvider to app root
5. Create test query (fetch users)
6. Verify query works in browser

**Acceptance Criteria:**
- Convex dashboard shows project
- Can query users table (empty)
- Real-time updates work (add user in dashboard, see in app)

---

#### E1.S3: Clerk Authentication

**Goal:** Implement Clerk auth with user sync to Convex

**Tasks:**
1. Install Clerk SDK
2. Add ClerkProvider + SignIn/SignUp routes
3. Create protected route wrapper
4. Create Convex function: `syncUser` (webhook handler)
5. Configure Clerk webhook to call Convex
6. Test: Sign up → user appears in Convex `users` table

**Acceptance Criteria:**
- Can sign up with email/password
- Can sign in with existing account
- User record created in Convex on first sign-in
- Protected routes redirect to sign-in when not authenticated

---

#### E1.S4: UI Foundation

**Goal:** Install shadcn/ui and create app layout

**Tasks:**
1. Install shadcn/ui CLI (`npx shadcn-ui@latest init`)
2. Add components: button, card, input, select, dialog, toast
3. Configure dark theme (default)
4. Create app layout (sidebar, header, main content)
5. Create placeholder pages (dashboard, transactions, budgets, etc.)
6. Add navigation (sidebar links)

**Acceptance Criteria:**
- Dark theme applied
- Sidebar navigation works
- All core pages accessible (empty state)
- shadcn components render correctly

---

#### E1.S5: Deployment Pipeline

**Goal:** Deploy to Netlify (frontend) and Convex (backend)

**Tasks:**
1. Deploy Convex to production (`npx convex deploy`)
2. Create Netlify site (connect GitHub repo)
3. Configure environment variables (Clerk keys, Convex URL)
4. Test production deploy
5. Verify auth works in production

**Acceptance Criteria:**
- Production URL accessible
- Can sign in on production
- Convex production environment working
- Environment variables configured

---

### E2: Transaction Management (v0.4.0)

#### E2.S1: Category Management

**Goal:** Users can create, edit, delete categories

**Tasks:**
1. Add categories table to Convex schema
2. Create category form component
3. Create Convex mutations: `createCategory`, `updateCategory`, `deleteCategory`
4. Create Convex query: `getCategories`
5. Wire form to mutations
6. Create category list component (real-time)
7. Add default categories on signup

**Acceptance Criteria:**
- Can create custom category (name, type, color, icon)
- Categories appear instantly (real-time)
- Can edit category
- Can archive category (soft delete)
- Default categories created on signup

---

#### E2.S2: Account Management

**Goal:** Users can create, edit, delete accounts

**Tasks:**
1. Add accounts table to Convex schema
2. Create account form component
3. Create Convex mutations: `createAccount`, `updateAccount`, `deleteAccount`
4. Create Convex query: `getAccounts`
5. Wire form to mutations
6. Create account list component

**Acceptance Criteria:**
- Can create account (name, type, provider, last 4)
- Accounts appear instantly
- Can edit account
- Can archive account

---

#### E2.S3: Create Transaction

**Goal:** Users can create income/expense transactions

**Tasks:**
1. Add transactions table to Convex schema
2. Create transaction form component (amount, description, date, category, account)
3. Add form validation (React Hook Form + Zod)
4. Create Convex mutation: `createTransaction`
5. Wire form to mutation
6. Add optimistic update
7. Show success toast

**Acceptance Criteria:**
- Can create transaction with all fields
- Amount validation (must be positive)
- Date picker works
- Category dropdown populated
- Account dropdown populated
- Transaction appears instantly
- Success toast shows

---

#### E2.S4: Transaction List & Filters

**Goal:** Users can view, filter, edit, delete transactions

**Tasks:**
1. Create transaction list component (table)
2. Create Convex query: `getTransactions` (with filters)
3. Wire list to query (real-time updates)
4. Add date range filter
5. Add category filter
6. Add account filter
7. Add type filter (income/expense)
8. Add delete transaction (mutation + UI)
9. Add edit transaction (modal)

**Acceptance Criteria:**
- Transaction list shows all transactions
- Real-time: new transactions appear without refresh
- Date range filter works
- Category filter works
- Account filter works
- Can delete transaction
- Can edit transaction

---

### E3: Budget System (v0.5.0)

#### E3.S1: Create Budget

**Goal:** Users can create a monthly budget

**Tasks:**
1. Add budgets table to Convex schema
2. Create budget form component (name, period start/end, total amount)
3. Create Convex mutation: `createBudget`
4. Wire form to mutation
5. Create budget list component
6. Add budget detail page

**Acceptance Criteria:**
- Can create budget for any month
- Period dates auto-fill (start = 1st, end = last day of month)
- Can set total budget amount (optional)
- Budget appears in list

---

#### E3.S2: Budget Allocations & Groups

**Goal:** Users can assign categories to budget groups and allocate amounts

**Tasks:**
1. Add budget_allocations table to Convex schema
2. Create allocation UI (category → group assignment)
3. Create amount allocation UI (per category)
4. Create Convex mutations: `createAllocation`, `updateAllocation`, `deleteAllocation`
5. Create Convex query: `getBudgetAllocations`
6. Wire UI to mutations

**Acceptance Criteria:**
- Can assign category to NEEDS/WANTS/NICETIES
- Can set amount per category
- Total per group shows
- Total budget = sum of allocations

---

#### E3.S3: Budget Progress Tracking

**Goal:** Show real-time budget progress with alerts

**Tasks:**
1. Create Convex query: `getBudgetProgress` (calculate spent vs allocated)
2. Create progress bar component
3. Add alert logic (90% threshold)
4. Display alerts at top of page
5. Add progress to budget detail page
6. Add progress to dashboard

**Acceptance Criteria:**
- Progress bar shows % spent per category
- Alert shows when category reaches 90%
- Progress updates in real-time (as transactions added)
- Dashboard shows budget overview

---

#### E3.S4: Budget Templates (50/30/20)

**Goal:** Apply 50/30/20 template with adjustable ratios

**Tasks:**
1. Create template selection UI
2. Create ratio adjustment UI (sliders for 50/30/20)
3. Calculate allocations based on total budget & ratios
4. Apply allocations to categories
5. Allow user to manually adjust after applying template

**Acceptance Criteria:**
- Can select 50/30/20 template
- Can adjust ratios (e.g., 60/20/20)
- Allocations calculated automatically
- User can override auto-calculated amounts

---

### E4: Savings Goals (v0.6.0)

#### E4.S1: Create & Manage Goals

**Goal:** Users can create, edit, delete savings goals

**Tasks:**
1. Add savings_goals table to Convex schema
2. Create goal form component
3. Create Convex mutations: `createGoal`, `updateGoal`, `deleteGoal`
4. Create Convex query: `getGoals`
5. Wire form to mutations
6. Create goal list component

**Acceptance Criteria:**
- Can create goal (name, target amount, deadline)
- Goals appear instantly
- Can edit goal
- Can archive goal

---

#### E4.S2: Goal Contributions

**Goal:** Users can add contributions to goals

**Tasks:**
1. Add goal_contributions table to Convex schema
2. Create contribution form component
3. Create Convex mutation: `addContribution`
4. Create Convex query: `getGoalContributions`
5. Wire form to mutation
6. Update goal currentAmount (cached)
7. Display contribution history

**Acceptance Criteria:**
- Can add contribution (amount, date, note)
- Goal currentAmount updates instantly
- Contribution history shows

---

#### E4.S3: Goal Progress & Dashboard

**Goal:** Display goal progress on dashboard

**Tasks:**
1. Create goal card component (progress bar)
2. Calculate progress % (currentAmount / targetAmount)
3. Add goals to dashboard
4. Show days remaining until deadline
5. Highlight overdue goals

**Acceptance Criteria:**
- Goal cards show progress bar
- Dashboard shows all active goals
- Progress updates in real-time
- Deadline countdown shows

---

### E5: Debt Tracking (v0.6.0)

#### E5.S1: Create & Manage Debts

**Goal:** Users can create, edit, delete debt accounts

**Tasks:**
1. Add debts table to Convex schema
2. Create debt form component
3. Create Convex mutations: `createDebt`, `updateDebt`, `deleteDebt`
4. Create Convex query: `getDebts`
5. Wire form to mutations
6. Create debt list component

**Acceptance Criteria:**
- Can create debt (name, type, balance, APR, min payment)
- Debts appear instantly
- Can edit debt
- Can mark debt as closed

---

#### E5.S2: Debt Payments

**Goal:** Users can record debt payments

**Tasks:**
1. Add debt_payments table to Convex schema
2. Create payment form component
3. Create Convex mutation: `addDebtPayment`
4. Create Convex query: `getDebtPayments`
5. Update debt currentBalance on payment
6. Display payment history

**Acceptance Criteria:**
- Can record payment (amount, date, principal/interest split)
- Debt balance updates instantly
- Payment history shows

---

#### E5.S3: Debt Dashboard & Projections

**Goal:** Display debt overview and payoff projections

**Tasks:**
1. Create debt card component
2. Calculate total debt
3. Calculate debt-to-income ratio (need income data)
4. Create payoff calculator (months to payoff at current rate)
5. Add debt overview to dashboard

**Acceptance Criteria:**
- Dashboard shows total debt
- Debt-to-income ratio calculated
- Payoff projection shows (months remaining)
- Can see payoff date

---

### E6: Recurring Transactions (v0.7.0)

#### E6.S1: Create Recurring Templates

**Goal:** Users can create recurring transaction templates

**Tasks:**
1. Add recurring_templates table to Convex schema
2. Create recurring form component (pattern, frequency, start/end)
3. Create Convex mutations: `createRecurring`, `updateRecurring`, `deleteRecurring`
4. Create Convex query: `getRecurringTemplates`
5. Wire form to mutations
6. Create recurring list component

**Acceptance Criteria:**
- Can create recurring (daily/weekly/monthly/yearly)
- Can set start date (required)
- Can set end date (optional)
- Can set amount, description, category, account
- Templates appear instantly

---

#### E6.S2: Projection Engine

**Goal:** Generate projected transactions from templates

**Tasks:**
1. Create Convex query: `getProjectedTransactions` (expand templates)
2. Add logic to calculate instances for date range
3. Handle different patterns (daily, weekly, monthly, yearly)
4. Handle interval (every X days/weeks)
5. Test projection accuracy

**Acceptance Criteria:**
- Projections generated correctly for all patterns
- Date range filtering works
- Projections don't include skipped/paid instances

---

#### E6.S3: Actualize Projections (Mark as Paid)

**Goal:** Users can mark projected transactions as paid, skipped, or modified

**Tasks:**
1. Add recurring_instances table to Convex schema
2. Create "Mark as Paid" modal (with amount edit option)
3. Create Convex mutations: `markAsPaid`, `skipInstance`, `modifyInstance`
4. Create transaction when marking as paid
5. Record instance in recurring_instances
6. Add soft delete (undo marking)

**Acceptance Criteria:**
- Can mark projected as paid → creates transaction
- Can edit amount before marking as paid
- Can skip instance → doesn't show in future projections
- Can delete instance (soft delete) → can restore

---

#### E6.S4: Ledger Integration

**Goal:** Show recurring transactions in ledger

**Tasks:**
1. Modify ledger query to include projections
2. Merge real + projected transactions, sort by date
3. Add `isProjected` flag to distinguish types
4. Add toggle: "Show Recurring Templates"
5. Style projected transactions differently (lighter color)
6. Add actions (mark as paid) inline

**Acceptance Criteria:**
- Ledger shows real + projected transactions
- Toggle works (show/hide recurring)
- Projected transactions styled differently
- Can mark as paid from ledger

---

#### E6.S5: Budget Integration

**Goal:** Include recurring transactions in budget calculations

**Tasks:**
1. Modify budget progress query to include projections
2. Calculate projected spending for budget period
3. Show projected vs actual in budget progress
4. Update alerts to include recurring
5. Test accuracy of budget calculations

**Acceptance Criteria:**
- Budget progress includes recurring expenses
- Projected spending shown separately
- Alerts trigger for projected expenses
- Calculations accurate

---

### E7: Analytics & Reports (v0.8.0)

#### E7.S1: Income vs Expense Report

**Goal:** Show income vs expense over time

**Tasks:**
1. Create reports page
2. Create Convex query: `getIncomeVsExpense` (aggregate by month)
3. Create line chart component (Recharts)
4. Add date range filter
5. Display chart on reports page

**Acceptance Criteria:**
- Chart shows income vs expense (separate lines)
- X-axis: months, Y-axis: amount
- Date range filter works (3/6/12 months, all-time)
- Data updates in real-time

---

#### E7.S2: Spending by Category Report

**Goal:** Show spending breakdown by category

**Tasks:**
1. Create Convex query: `getSpendingByCategory` (aggregate)
2. Create pie chart component
3. Create bar chart component
4. Add toggle (pie/bar view)
5. Add date range filter

**Acceptance Criteria:**
- Chart shows spending per category
- Pie chart shows %
- Bar chart shows amounts
- Date range filter works

---

#### E7.S3: Net Worth Trend

**Goal:** Show net worth over time

**Tasks:**
1. Create Convex query: `getNetWorthTrend` (income + savings - debts)
2. Create line chart component
3. Add date range filter
4. Display chart on reports page

**Acceptance Criteria:**
- Chart shows net worth trend
- X-axis: months, Y-axis: net worth
- Calculations include income, savings, debts
- Date range filter works

---

#### E7.S4: Report Filters & Date Ranges

**Goal:** Add comprehensive filtering to reports

**Tasks:**
1. Create filter component (date range, category, account)
2. Wire filters to all report queries
3. Add preset ranges (7 days, 30 days, 3/6/12 months, all-time)
4. Add custom date range picker
5. Persist filter state (URL params or local storage)

**Acceptance Criteria:**
- All filters work on all reports
- Preset ranges work
- Custom date range works
- Filter state persists on page refresh

---

### E8: Polish & Launch (v0.9.0)

#### E8.S1: CSV Import

**Goal:** Users can import transactions from CSV

**Tasks:**
1. Add imports table to Convex schema
2. Create CSV upload component (drag-drop)
3. Create column mapping UI
4. Create Convex mutation: `importTransactions`
5. Add duplicate detection logic
6. Add merge/skip duplicate UI
7. Create import history page
8. Add "Undo Import" feature
9. Add GDPR cleanup (30-day expiry)

**Acceptance Criteria:**
- Can upload CSV file
- Can map CSV columns to fields
- Required fields: date, amount, description
- Optional fields: category, account
- Duplicate detection works
- Can undo most recent import
- CSV files expire after 30 days

---

#### E8.S2: Receipt Management

**Goal:** Users can upload receipts and link to transactions

**Tasks:**
1. Add receipts table to Convex schema
2. Set up Convex file storage
3. Create receipt upload component
4. Create Convex mutation: `uploadReceipt`
5. Link receipt to transaction
6. Create receipt viewer (image/PDF)
7. Add GDPR deletion (when transaction deleted)

**Acceptance Criteria:**
- Can upload receipt (image or PDF)
- Max file size: 5MB
- Can link receipt to transaction
- Can view receipt (click to open)
- Receipt deleted when transaction deleted

---

#### E8.S3: Onboarding Flow

**Goal:** Guide new users through setup

**Tasks:**
1. Create welcome screen (demo mode option)
2. Create setup wizard (multi-step)
3. Step 1: Currency & timezone
4. Step 2: Categories (defaults + custom)
5. Step 3: First account (optional)
6. Step 4: First budget (optional)
7. Step 5: First transaction or import
8. Create demo mode (pre-populated data)
9. Add "Clear Demo Data" button

**Acceptance Criteria:**
- Wizard shows on first sign-in
- Can select demo mode or setup
- Each step validates before continuing
- Demo mode creates sample data (tagged)
- Can clear demo data with one click
- Onboarding sets `onboardingComplete = true`

---

#### E8.S4: Bill Reminders

**Goal:** Show upcoming recurring bills on dashboard

**Tasks:**
1. Create Convex query: `getUpcomingBills` (next X days)
2. Add user setting: reminder days (7/14/30/custom)
3. Create bill reminder component (alert at top of page)
4. Display upcoming bills on dashboard
5. Add inline action: mark as paid

**Acceptance Criteria:**
- Dashboard shows bills due in next X days
- Alert appears at top of page
- User can customize reminder threshold
- Can mark bill as paid from reminder

---

#### E8.S5: Pay Schedule & Final Polish

**Goal:** Add pay schedule tracking and final UX polish

**Tasks:**
1. Add pay_schedules table to Convex schema
2. Create pay schedule form
3. Calculate next payday
4. Display "Days until payday" on dashboard
5. Run full UX audit (polish rough edges)
6. Test all features end-to-end
7. Fix bugs found in testing
8. Update documentation (README, user guide)

**Acceptance Criteria:**
- Can set pay schedule (frequency, next payday)
- Dashboard shows days until payday
- All features work as expected
- No critical bugs
- Documentation complete

---

## Version Milestones

| Version | Milestone | Epics | Features Delivered |
|---------|-----------|-------|-------------------|
| **v0.3.0** | Setup Sprint | E1 | Empty app, fully wired, deployable |
| **v0.4.0** | Transactions | E2 | Transaction CRUD, categories, accounts, ledger |
| **v0.5.0** | Budgets | E3 | Budget creation, allocations, progress, templates |
| **v0.6.0** | Goals & Debts | E4, E5 | Savings goals, debt tracking, payoff projections |
| **v0.7.0** | Recurring | E6 | Recurring transactions, projections, ledger integration |
| **v0.8.0** | Reports | E7 | Income vs expense, spending by category, net worth |
| **v0.9.0** | Launch Prep | E8 | CSV import, receipts, onboarding, bill reminders |
| **v1.0.0** | 🎉 MVP | All | Production-ready, all core features complete |

---

## Epic Effort Estimates

| Epic | Stories | Avg Tasks/Story | Total Tasks | Est. Hours | Est. Days |
|------|---------|-----------------|-------------|------------|-----------|
| E1 | 5 | 5 | 25 | 40-60h | 3-5 days |
| E2 | 4 | 7 | 28 | 50-70h | 5-7 days |
| E3 | 4 | 6 | 24 | 45-65h | 5-7 days |
| E4 | 3 | 5 | 15 | 25-40h | 3-5 days |
| E5 | 3 | 5 | 15 | 25-40h | 3-5 days |
| E6 | 5 | 6 | 30 | 50-70h | 5-7 days |
| E7 | 4 | 6 | 24 | 40-60h | 5-7 days |
| E8 | 5 | 7 | 35 | 55-75h | 5-7 days |
| **Total** | **33** | **6** | **196** | **330-480h** | **35-49 days** |

**Note:** Estimates assume 6-8 focused hours/day. Actual duration may vary based on:
- Bug fixing and debugging
- Learning curve (React Router 7, Convex)
- Scope creep
- Testing and polish time

---

## Risk Assessment

| Epic | Risk Level | Key Risks | Mitigation |
|------|-----------|-----------|------------|
| E1 | Low | New tech (RR7, Convex) | Follow official docs closely |
| E2 | Low | Basic CRUD | Well-understood patterns |
| E3 | Medium | Complex calculations | Unit test calculation logic |
| E4 | Low | Simple data model | Straightforward implementation |
| E5 | Low | Similar to E4 | Reuse patterns from goals |
| E6 | High | Projection logic complexity | Break into small tasks, test thoroughly |
| E7 | Medium | Chart library integration | Use Recharts (well-documented) |
| E8 | Medium | CSV parsing, file storage | Use tested libraries (Papa Parse) |

---

## Success Metrics (v1.0.0)

### Product Metrics
- 🎯 50 active users in first month
- 🎯 10,000 transactions tracked
- 🎯 200 budgets created
- 🎯 20 CSV imports completed

### Technical Metrics
- 🎯 <2s page load (Lighthouse score >90)
- 🎯 0 critical bugs in production
- 🎯 99.9% uptime

### User Satisfaction
- 🎯 "Easy to use" feedback from 80% of users
- 🎯 <5 support requests per week
- 🎯 3+ sessions per week per active user

---

**Document Version:** 1.0
**Next Review:** After v0.5.0 (mid-point check-in)
