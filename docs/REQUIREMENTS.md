# Syphon v1.0.0 - Technical Requirements

**Version:** 1.0.0 (complete rewrite from v0.4.0)
**Last Updated:** 2025-11-08
**Status:** Planning Phase

---

## 1. Executive Summary

Syphon is a personal finance management application focused on budgeting, transaction tracking, and financial goal management. Version 1.0.0 represents a complete architectural rewrite to address deployment complexity, build performance, and developer experience issues from previous versions.

### Key Changes from v0.4.0
- **Framework:** Next.js 15 → React Router 7
- **Backend:** API Routes + Prisma → Convex (serverless functions + real-time DB)
- **Deployment:** Docker + GitHub Actions → Netlify + Convex CLI
- **Observability:** OpenTelemetry/Jaeger → Removed (simplified)

---

## 2. Goals & Success Criteria

### Primary Goals
1. **Simplified Deployment:** Zero Docker, push-to-deploy workflow
2. **Faster Development:** Real-time backend, no API boilerplate
3. **Better Performance:** Real-time updates, optimistic UI, instant page loads
4. **Clean Architecture:** Self-contained features, vertical slices

### Success Criteria
- ✅ Deploy to production in <5 minutes
- ✅ Page interactive in <2 seconds
- ✅ Support 100 concurrent users
- ✅ Handle 20,000 transactions per user without performance degradation
- ✅ Real-time updates <500ms latency

---

## 3. Technical Stack

### Frontend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React Router 7 | ^7.0.0 | SPA routing, file-based routes |
| UI Library | React | ^19.0.0 | Component framework |
| Language | TypeScript | ^5.9.0 | Type safety |
| Styling | Tailwind CSS | ^4.0.0 | Utility-first CSS |
| Components | shadcn/ui | Latest | Pre-built Radix UI components |
| Forms | React Hook Form | ^7.0.0 | Form state management |
| Validation | Zod | ^4.0.0 | Schema validation |
| State | Convex React | ^1.0.0 | Real-time queries & mutations |
| Charts | Recharts | ^2.15.0 | Data visualization |
| Icons | Lucide React | ^0.525.0 | Icon library |
| Notifications | Sonner | ^2.0.0 | Toast notifications |

### Backend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Database | Convex | ^1.0.0 | Real-time serverless database |
| Auth | Clerk | ^6.0.0 | Authentication & user management |
| File Storage | Convex Storage | Built-in | Receipt & CSV upload storage |
| Scheduled Jobs | Convex Cron | Built-in | Bill reminders, GDPR cleanup |

### Development Tools
| Tool | Purpose |
|------|---------|
| Vite | Build tool & dev server |
| ESLint | Code linting |
| Prettier | Code formatting |
| TypeScript | Type checking |

### Deployment
| Component | Service | Purpose |
|-----------|---------|---------|
| Frontend | Netlify | Static site hosting |
| Backend | Convex Cloud | Database + serverless functions |
| Auth | Clerk | Managed authentication |

---

## 4. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         React Router 7 App (Netlify)                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │  Routes    │  │ Components │  │   Hooks    │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ WebSocket (real-time)
                    │ REST (auth)
                    │
        ┌───────────┴────────────┬──────────────────┐
        │                        │                  │
        ▼                        ▼                  ▼
┌──────────────┐       ┌─────────────────┐   ┌──────────┐
│    Clerk     │       │     Convex      │   │ Netlify  │
│    (Auth)    │       │   (Backend)     │   │ (CDN)    │
│              │       │                 │   │          │
│ - OAuth      │       │ - Database      │   │ - Static │
│ - Sessions   │       │ - Functions     │   │ - Assets │
│ - Webhooks   │───────│ - Real-time     │   │          │
│              │       │ - File Storage  │   │          │
└──────────────┘       └─────────────────┘   └──────────┘
```

### Data Flow

**Query (Read):**
```
User opens page
  → React component mounts
  → useQuery(convex.transactions.list)
  → WebSocket subscription established
  → Data returned + real-time updates
  → Component re-renders on changes
```

**Mutation (Write):**
```
User submits form
  → useMutation(convex.transactions.create)
  → Optimistic update (immediate UI)
  → Mutation sent to Convex
  → Database updated
  → Real-time subscription pushes update
  → All connected clients receive change
  → Optimistic update confirmed or rolled back
```

**Authentication:**
```
User signs in with Clerk
  → Clerk session created
  → Clerk webhook fires
  → Convex function creates/updates user
  → User metadata synced to Convex
  → Frontend receives Clerk token
  → Token passed to Convex for authorization
```

---

## 5. Core Features

### v1.0.0 Scope (MVP)

#### 5.1 Authentication & User Management
- **Auth Provider:** Clerk
- **Sign In Methods:** Email/password, OAuth (Google, GitHub)
- **User Model:** clerkId, email, name, currency, timezone
- **Lazy User Creation:** User created in Convex on first sign-in
- **Metadata Sync:** Clerk user data synced to Convex on updates

#### 5.2 Transaction Management
- **Types:** Income, Expense
- **Fields:** Amount (stored as cents), description, date, category, account
- **CRUD:** Create, read, update, delete
- **Real-time:** Transaction list updates live
- **Validation:** Amount > 0, date required, category optional
- **Import:** CSV upload with column mapping, duplicate detection

#### 5.3 Recurring Transactions
- **Model:** Template-based with projections
- **Frequency:** Daily, Weekly, Bi-weekly, Monthly, Yearly
- **Start/End Date:** Start required, end optional
- **Projections:** Virtual transactions calculated on query
- **Actualization:** Mark projected as paid, skip, or modify
- **Soft Delete:** Deleted instances can be restored
- **Calculations:** Include recurring in budgets & reports

#### 5.4 Category Management
- **Structure:** Flat list (no nesting)
- **Types:** Income, Expense
- **Fields:** Name, type, color (hex), icon (lucide name)
- **Defaults:** System provides default categories on signup
- **Custom:** Users can create unlimited custom categories
- **Archive:** Soft delete (isArchived flag)

#### 5.5 Account Management
- **Types:** Checking, Savings, Credit Card, Cash
- **Fields:** Name, type, provider, last 4 digits
- **Balance Tracking:** Running balance in ledger view
- **Archive:** Soft delete unused accounts

#### 5.6 Budgeting System
- **Period:** Monthly (fixed start/end dates)
- **Structure:** Budget → Allocations → Categories
- **Budget Groups:** Needs, Wants, Niceties (user-defined)
- **Templates:** 50/30/20 auto-calculation with adjustable ratios
- **Allocation:** Assign amount per category
- **Progress:** Real-time tracking vs budget
- **Alerts:** In-app notifications when approaching limit (90%)
- **Calculations:** Include recurring transactions in budget

#### 5.7 Savings Goals
- **Fields:** Name, target amount, current amount, deadline
- **Contributions:** Manual additions with date & note
- **Progress:** Visual progress bar
- **Auto-Contribution:** Link to recurring transactions
- **Templates:** Emergency fund (3-6 months expenses)

#### 5.8 Debt Tracking
- **Types:** Credit Card, Student Loan, Mortgage, Personal, Auto
- **Fields:** Name, type, initial balance, current balance, APR, min payment, due day
- **Payments:** Record payments with principal/interest split
- **Projections:** Payoff date calculator
- **Snowball/Avalanche:** Debt payoff strategy calculators

#### 5.9 Financial Dashboard
- **Metrics Cards:**
  - Total income (month-to-date)
  - Total expenses (month-to-date)
  - Net income (income - expenses)
  - Budget progress (% of month remaining vs % budget spent)
  - Savings rate (% of income saved)
  - Debt-to-income ratio
  - Days until payday
- **Charts:**
  - Income vs Expense (7-day trend)
  - Spending by category (pie chart)
- **Alerts:** Upcoming bills, over-budget categories
- **Real-time:** All metrics update live

#### 5.10 Ledger Views
- **Multi-View:** Unified, By Category, By Account
- **Columns:** Date, Description, Category, Account, Type, Amount, Balance
- **Running Balance:** Cumulative total
- **Filters:** Date range, category, account, type
- **Recurring Toggle:** Show/hide recurring templates
- **Real-time:** Updates as transactions are added

#### 5.11 Pay Schedule
- **Frequency:** Weekly, Bi-weekly, Semi-monthly, Monthly
- **Next Payday:** Displayed on dashboard
- **Auto-Projection:** Optionally link to recurring income

#### 5.12 Onboarding
- **Welcome Screen:** Option for demo mode or setup
- **Demo Mode:** Pre-populated with sample data (tagged for easy removal)
- **Guided Setup:**
  1. Select currency & timezone
  2. Create/select categories (defaults provided)
  3. Add first account (optional)
  4. Create first budget (optional)
  5. Import CSV or add first transaction

#### 5.13 CSV Import
- **Upload:** Drag-drop or file picker
- **Column Mapping:** User selects which CSV column maps to which field
- **Required Fields:** Date, Amount, Description
- **Optional Fields:** Category, Account
- **Duplicate Detection:** Match on date + amount + description
- **Merge Option:** User chooses to merge or keep duplicate
- **Import Tracking:** Each import has ID + date
- **Undo:** Undo most recent import
- **GDPR:** CSV files stored for 30 days, then auto-deleted

#### 5.14 Receipt Management
- **Upload:** Link receipts to transactions
- **Storage:** Convex file storage
- **Access:** Click transaction to view receipt
- **GDPR:** Deleted when transaction deleted or user requests

---

## 6. Data Model

See `SCHEMA.md` for complete Convex schema definition.

### Key Entities
- **users** - Synced from Clerk
- **categories** - Income/expense categories
- **accounts** - Bank accounts, credit cards
- **transactions** - Actual income/expense records
- **recurring_templates** - Recurring transaction patterns
- **recurring_instances** - Tracks modified/skipped recurring
- **budgets** - Monthly budget periods
- **budget_allocations** - Category assignments & amounts
- **savings_goals** - Goal tracking
- **goal_contributions** - Goal contributions
- **debts** - Debt accounts
- **debt_payments** - Payment history
- **imports** - CSV import tracking
- **receipts** - File storage metadata

---

## 7. Non-Functional Requirements

### 7.1 Performance
| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load (First Paint) | <1s | Lighthouse |
| Page Interactive (TTI) | <2s | Lighthouse |
| Query Latency (p95) | <200ms | Convex dashboard |
| Mutation Latency (p95) | <500ms | Convex dashboard |
| Real-time Update Latency | <500ms | Manual testing |

### 7.2 Scalability
| Resource | Limit | Strategy |
|----------|-------|----------|
| Users | 100 concurrent | Waitlist for >100 |
| Transactions/User | 20,000 | Indexed queries, pagination |
| Transactions/Query | 1,000 | Virtual scrolling, lazy load |
| File Size (CSV) | 10MB | Client-side validation |
| File Size (Receipt) | 5MB | Client-side validation |

### 7.3 Security
- **Authentication:** Clerk managed (OAuth, MFA available)
- **Authorization:** User ID checked on every Convex function
- **Data Isolation:** All queries filtered by userId
- **XSS Protection:** React's built-in escaping
- **CSRF Protection:** Not applicable (no cookies, token-based)
- **Secrets Management:** Environment variables (Netlify, Convex)

### 7.4 Reliability
- **Uptime Target:** 99.9% (Convex SLA)
- **Data Backup:** Convex automatic backups
- **Error Handling:** Try/catch in all Convex functions, toast notifications
- **Optimistic Updates:** Rollback on failure

### 7.5 Accessibility
- **WCAG Level:** AA compliance
- **Keyboard Navigation:** All features accessible via keyboard
- **Screen Readers:** Semantic HTML, ARIA labels where needed
- **Color Contrast:** 4.5:1 minimum (dark theme)

### 7.6 Browser Support
- **Chrome/Edge:** Last 2 versions
- **Firefox:** Last 2 versions
- **Safari:** Last 2 versions
- **Mobile:** iOS Safari 15+, Chrome Android

---

## 8. Out of Scope (v1.0.0)

### Explicitly Excluded
- ❌ Mobile native apps (iOS, Android)
- ❌ Collaborative budgets (multi-user, family accounts)
- ❌ Multi-currency conversion (different rates, exchange tracking)
- ❌ Investment tracking (stocks, crypto, portfolio)
- ❌ Bank sync (Plaid, TrueLayer) - planned for v2.0
- ❌ Light theme - dark mode only
- ❌ Advanced reporting (custom reports, export to Excel) - basic reports only

### Future Considerations (v1.1+)
- ⏳ Account reconciliation (bank statement matching)
- ⏳ Advanced analytics (trends, forecasting, anomaly detection)
- ⏳ Budget templates library (community-shared templates)
- ⏳ Bill reminders (email notifications via Resend)
- ⏳ Waitlist management (>100 users)
- ⏳ Premium tier (payment via Stripe)

---

## 9. Technical Constraints

### 9.1 Limitations
- **Convex Free Tier:** 100,000 function calls/month (should suffice for 100 users)
- **Netlify Free Tier:** 100GB bandwidth/month
- **Clerk Free Tier:** 10,000 MAU (monthly active users)
- **No Server-Side Rendering:** React Router 7 is SPA only
- **No Edge Functions:** All compute in Convex (US region)

### 9.2 Dependencies
- **Convex:** Proprietary database, vendor lock-in risk (mitigated by TypeScript schema as code)
- **Clerk:** Proprietary auth, migration possible but costly
- **Netlify:** Static hosting, easily portable to Vercel/Cloudflare Pages

---

## 10. Testing Strategy

### Unit Tests
- **Coverage Target:** 60% for critical business logic
- **Tools:** Vitest
- **Scope:** Utility functions, calculation logic (budget %, debt payoff)

### Integration Tests
- **Scope:** Convex functions (queries, mutations)
- **Tools:** Convex test framework
- **Examples:** Create transaction, calculate budget progress

### E2E Tests
- **Tool:** Playwright
- **Coverage:** Critical user flows
  - Sign up → onboard → create transaction
  - Create budget → add transaction → check progress
  - Import CSV → verify transactions created

### Manual Testing
- **Smoke Tests:** After each deploy
- **Regression Tests:** Before version releases
- **Browser Testing:** Chrome, Firefox, Safari

---

## 11. Deployment & DevOps

### Development Environment
```bash
# Frontend
npm run dev  # Vite dev server on :5173

# Backend
npx convex dev  # Convex local dev
```

### Staging Environment
- **Frontend:** Netlify preview deploys (per PR)
- **Backend:** Convex dev environment
- **Auth:** Clerk development instance

### Production Environment
- **Frontend:** Netlify production (main branch)
- **Backend:** Convex production environment
- **Auth:** Clerk production instance
- **Domain:** syphon.app (or custom domain)

### CI/CD Pipeline
1. Push to branch → Netlify preview deploy
2. Merge to main → Netlify production deploy
3. Convex functions deployed via CLI (`npx convex deploy`)

### Monitoring
- **Uptime:** Netlify built-in
- **Errors:** Convex logs, browser console (no external APM)
- **Analytics:** Plausible/Simple Analytics (privacy-friendly)

---

## 12. Documentation

### User Documentation
- **In-App Help:** Tooltips, onboarding guide
- **FAQ:** Notion or dedicated FAQ page
- **Video Tutorials:** Optional, Loom recordings

### Developer Documentation
- **README.md:** Setup instructions
- **CONTRIBUTING.md:** Development workflow
- **SCHEMA.md:** Database schema reference
- **API.md:** Convex function reference (auto-generated from types)

---

## 13. Success Metrics

### Product Metrics (v1.0.0)
- 🎯 **50 active users** in first month
- 🎯 **10,000 transactions** tracked
- 🎯 **200 budgets** created
- 🎯 **20 CSV imports** completed

### Technical Metrics
- 🎯 **<2s page load** (Lighthouse score >90)
- 🎯 **0 critical bugs** in production
- 🎯 **99.9% uptime** (Netlify + Convex)

### User Satisfaction
- 🎯 **"Easy to use"** feedback from 80% of users
- 🎯 **<5 support requests** per week
- 🎯 **3+ sessions per week** per active user

---

## 14. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Convex vendor lock-in | Medium | High | Schema as code (TypeScript), export capability |
| Free tier limits exceeded | Low | Medium | Monitor usage, waitlist at 100 users |
| Poor performance with 20k transactions | Low | High | Pagination, indexes, query optimization |
| Clerk auth downtime | Low | High | Status page monitoring, user communication |
| Data loss | Very Low | Critical | Convex automatic backups, user export feature |

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **Budget Allocation** | Amount assigned to a category within a budget |
| **Budget Group** | Collection of categories (Needs, Wants, Niceties) |
| **Lazy User Creation** | User record created in DB on first sign-in, not at auth time |
| **Ledger** | Chronological list of all transactions with running balance |
| **Optimistic Update** | UI updates immediately before server confirms change |
| **Projected Transaction** | Virtual transaction generated from recurring template |
| **Recurring Instance** | Specific occurrence of a recurring transaction |
| **Soft Delete** | Mark as deleted (isArchived) without removing from DB |
| **Vertical Slice** | Feature spanning UI → logic → data in single story |

---

## 16. Approval & Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Owner | Mohamed | 2025-11-08 | ✅ Approved |
| Tech Lead | Mohamed | 2025-11-08 | ✅ Approved |

---

**Document Version:** 1.0
**Next Review:** After v0.5.0 (mid-point check-in)
