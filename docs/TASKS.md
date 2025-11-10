# Syphon v1.0.0 - Task Breakdown

**Version:** 1.0.0
**Last Updated:** 2025-11-08

---

## Task Format

```
Task ID: E#.S#.T#
Title: Specific, actionable task
Size: 30min / 1hr / 2hr / 4hr
Type: 🔵 Setup / 🟣 Feature / 🟢 Quick Win / 🟡 Parallel / 🔴 Blocker
Dependencies: [List of task IDs]
Description: What needs to be done
Files: Which files to create/modify
Acceptance: How to verify it's done
Commands: Terminal commands (if applicable)
```

---

## E1: Infrastructure & Setup (v0.3.0) - DETAILED

This epic has **25 tasks** totaling ~40-60 hours (3-5 days).

---

### E1.S1: Project Initialization (5 tasks, ~3 hours)

#### E1.S1.T1: Create React Router 7 Project
**Size:** 30min
**Type:** 🔵 Setup, 🔴 Blocker
**Dependencies:** None

**Description:**
Initialize a new React Router 7 project using Vite as the build tool.

**Commands:**
```bash
npm create vite@latest syphon-v1 -- --template react-ts
cd syphon-v1
npm install
npm install react-router@7 react-router-dom@7
npm run dev
```

**Files Created:**
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `src/main.tsx`
- `src/App.tsx`

**Acceptance Criteria:**
- [ ] Project created
- [ ] `npm run dev` starts server on port 5173
- [ ] Browser shows "React + TypeScript + Vite" page
- [ ] No console errors

---

#### E1.S1.T2: Configure TypeScript
**Size:** 30min
**Type:** 🔵 Setup
**Dependencies:** E1.S1.T1

**Description:**
Configure TypeScript with strict mode and appropriate compiler options.

**Files Modified:**
- `tsconfig.json`

**Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Acceptance Criteria:**
- [ ] `tsc --noEmit` runs without errors
- [ ] Strict mode enabled
- [ ] Path aliases work (`@/components/...`)

---

#### E1.S1.T3: Set Up Tailwind CSS
**Size:** 30min
**Type:** 🔵 Setup
**Dependencies:** E1.S1.T1

**Description:**
Install and configure Tailwind CSS v4 with dark theme as default.

**Commands:**
```bash
npm install -D tailwindcss@next postcss autoprefixer
npx tailwindcss init -p
```

**Files Created/Modified:**
- `tailwind.config.js`
- `postcss.config.js`
- `src/index.css`

**Tailwind Config:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class', // Enable dark mode
  plugins: [],
}
```

**index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }

  html {
    @apply bg-background text-foreground;
  }
}
```

**Acceptance Criteria:**
- [ ] Tailwind classes work (test with `className="text-blue-500"`)
- [ ] Dark theme applied by default
- [ ] No build errors

---

#### E1.S1.T4: Add ESLint + Prettier
**Size:** 1hr
**Type:** 🔵 Setup, 🟡 Parallel
**Dependencies:** E1.S1.T2

**Description:**
Configure ESLint and Prettier for code quality and formatting.

**Commands:**
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

**Files Created:**
- `.eslintrc.cjs`
- `.prettierrc`
- `.prettierignore`

**ESLint Config:**
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'prettier'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  },
}
```

**Prettier Config:**
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Acceptance Criteria:**
- [ ] `npm run lint` passes
- [ ] Prettier formats on save (if using VS Code)
- [ ] No linting errors in existing code

---

#### E1.S1.T5: Create Project Structure
**Size:** 30min
**Type:** 🔵 Setup
**Dependencies:** E1.S1.T1

**Description:**
Create organized folder structure for the application.

**Folders to Create:**
```
src/
├── routes/              # React Router routes
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components
│   └── layout/         # Layout components
├── lib/                 # Utilities
│   ├── utils.ts
│   └── cn.ts           # className utility
├── hooks/               # Custom React hooks
├── convex/              # Convex functions (root level)
│   ├── schema.ts
│   ├── users.ts
│   └── _generated/     # Convex generated files
```

**Files to Create:**
- `src/lib/utils.ts`
- `src/lib/cn.ts` (className merger)

**cn.ts:**
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Acceptance Criteria:**
- [ ] Folder structure created
- [ ] All folders exist
- [ ] `utils.ts` and `cn.ts` created

---

#### E1.S1.T6: First Commit
**Size:** 🟢 15min
**Type:** 🔵 Setup, 🔴 Blocker
**Dependencies:** E1.S1.T1-T5

**Description:**
Initialize git and create first commit.

**Commands:**
```bash
git add .
git commit -m "chore: initial React Router 7 project with TypeScript and Tailwind

- Initialize Vite project with React 19 + TypeScript
- Configure Tailwind CSS v4 with dark theme
- Set up ESLint + Prettier
- Create project folder structure

🤖 Syphon v1.0.0 - Sprint 0 (E1.S1)"
```

**Acceptance Criteria:**
- [ ] Git initialized
- [ ] All files committed
- [ ] Commit message follows convention

---

### E1.S2: Convex Integration (5 tasks, ~3 hours)

#### E1.S2.T1: Install Convex
**Size:** 🟢 30min
**Type:** 🔵 Setup
**Dependencies:** E1.S1.T6

**Description:**
Install Convex and initialize project.

**Commands:**
```bash
npm install convex
npx convex dev
```

**Prompts:**
- Create new project? **Yes**
- Project name: **syphon-v1**
- Region: **US East**

**Acceptance Criteria:**
- [ ] Convex installed
- [ ] `.env.local` created with `CONVEX_URL`
- [ ] `convex/` folder created
- [ ] Convex dashboard accessible

---

#### E1.S2.T2: Create Schema
**Size:** 1hr
**Type:** 🔵 Setup, 🔴 Blocker
**Dependencies:** E1.S2.T1

**Description:**
Create initial Convex schema with users table.

**Files Created:**
- `convex/schema.ts`

**Schema:**
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
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
    timezone: v.string(),
    onboardingComplete: v.boolean(),
    isDemoMode: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),
});
```

**Acceptance Criteria:**
- [ ] Schema file created
- [ ] `npx convex dev` runs without errors
- [ ] Dashboard shows users table

---

#### E1.S2.T3: Add ConvexProvider
**Size:** 30min
**Type:** 🟣 Feature
**Dependencies:** E1.S2.T2

**Description:**
Wrap app with ConvexProvider for real-time queries.

**Files Modified:**
- `src/main.tsx`

**Code:**
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import App from './App.tsx'
import './index.css'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>
)
```

**Environment Variable:**
Add to `.env.local`:
```
VITE_CONVEX_URL=<your-convex-url>
```

**Acceptance Criteria:**
- [ ] ConvexProvider wraps app
- [ ] Environment variable set
- [ ] No errors in console

---

#### E1.S2.T4: Create Test Query
**Size:** 30min
**Type:** 🟣 Feature
**Dependencies:** E1.S2.T3

**Description:**
Create a simple query to test Convex connection.

**Files Created:**
- `convex/users.ts`

**Query:**
```typescript
import { query } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
```

**Files Modified:**
- `src/App.tsx`

**Code:**
```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const users = useQuery(api.users.list);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Syphon v1.0.0</h1>
      <p className="mt-2">Users in database: {users?.length ?? "Loading..."}</p>
    </div>
  );
}

export default App;
```

**Acceptance Criteria:**
- [ ] Query file created
- [ ] App displays user count
- [ ] Shows "0" if no users

---

#### E1.S2.T5: Checkpoint - Verify Convex Working
**Size:** 🟢 15min
**Type:** 🔴 Blocker
**Dependencies:** E1.S2.T4

**Description:**
Manually test that Convex is fully wired and functional.

**Test Steps:**
1. Open Convex dashboard
2. Go to Data tab → users table
3. Add a user manually (Insert Document):
   ```json
   {
     "clerkId": "test_123",
     "email": "test@example.com",
     "currency": "GBP",
     "timezone": "Europe/London",
     "onboardingComplete": false,
     "isDemoMode": false,
     "createdAt": 1699564800000
   }
   ```
4. Check app - should show "Users in database: 1"
5. Delete test user

**Acceptance Criteria:**
- [ ] Can add user in dashboard
- [ ] App updates in real-time (shows user count)
- [ ] Can delete user from dashboard

---

### E1.S3: Clerk Authentication (6 tasks, ~4 hours)

#### E1.S3.T1: Install Clerk
**Size:** 🟢 30min
**Type:** 🔵 Setup
**Dependencies:** E1.S2.T5

**Description:**
Install Clerk React SDK and set up environment variables.

**Commands:**
```bash
npm install @clerk/clerk-react
```

**Environment Variables (.env.local):**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Get Keys:**
1. Go to https://dashboard.clerk.com
2. Create new application: "Syphon v1"
3. Copy publishable key and secret key

**Acceptance Criteria:**
- [ ] Clerk installed
- [ ] Environment variables set
- [ ] Keys copied from dashboard

---

#### E1.S3.T2: Add ClerkProvider
**Size:** 30min
**Type:** 🟣 Feature
**Dependencies:** E1.S3.T1

**Description:**
Wrap app with ClerkProvider.

**Files Modified:**
- `src/main.tsx`

**Code:**
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import App from './App.tsx'
import './index.css'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </ClerkProvider>
  </React.StrictMode>
)
```

**Acceptance Criteria:**
- [ ] ClerkProvider added
- [ ] No console errors
- [ ] App still loads

---

#### E1.S3.T3: Create Auth Routes
**Size:** 1hr
**Type:** 🟣 Feature
**Dependencies:** E1.S3.T2

**Description:**
Create sign-in, sign-up, and protected route components.

**Files Created:**
- `src/routes/sign-in.tsx`
- `src/routes/sign-up.tsx`
- `src/components/layout/ProtectedRoute.tsx`

**sign-in.tsx:**
```typescript
import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

**sign-up.tsx:**
```typescript
import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

**ProtectedRoute.tsx:**
```typescript
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}
```

**Acceptance Criteria:**
- [ ] Sign-in page renders
- [ ] Sign-up page renders
- [ ] ProtectedRoute redirects when not signed in

---

#### E1.S3.T4: Create Convex User Sync Function
**Size:** 1hr
**Type:** 🟣 Feature, 🔴 Blocker
**Dependencies:** E1.S3.T3

**Description:**
Create Convex mutation to sync Clerk user to database (lazy creation).

**Files Created:**
- `convex/users.ts` (add mutation)

**Mutation:**
```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
      });
      return existing._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      currency: "GBP",
      timezone: "Europe/London",
      onboardingComplete: false,
      isDemoMode: false,
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});
```

**Acceptance Criteria:**
- [ ] syncUser mutation created
- [ ] getCurrentUser query created
- [ ] No TypeScript errors

---

#### E1.S3.T5: Wire Clerk Webhook
**Size:** 1hr
**Type:** 🟣 Feature
**Dependencies:** E1.S3.T4

**Description:**
Configure Clerk webhook to trigger user sync on sign-up/sign-in.

**Option A: Use Convex HTTP Action (Recommended)**

**Files Created:**
- `convex/http.ts`

**Code:**
```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();

    if (payload.type === "user.created" || payload.type === "user.updated") {
      const user = payload.data;
      await ctx.runMutation(api.users.syncUser, {
        clerkId: user.id,
        email: user.email_addresses[0]?.email_address ?? "",
        firstName: user.first_name,
        lastName: user.last_name,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
```

**Clerk Webhook Setup:**
1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://YOUR_CONVEX_SITE_URL/clerk-webhook`
3. Subscribe to events: `user.created`, `user.updated`
4. Save

**Option B: Call from Client (Alternative)**

**Files Created:**
- `src/hooks/useUserSync.ts`

**Code:**
```typescript
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useUserSync() {
  const { user } = useUser();
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    if (user) {
      syncUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
      });
    }
  }, [user, syncUser]);
}
```

Use in `App.tsx`:
```typescript
import { useUserSync } from "./hooks/useUserSync";

function App() {
  useUserSync(); // Call on mount
  // ... rest of component
}
```

**Acceptance Criteria:**
- [ ] Webhook configured OR client sync working
- [ ] User created in Convex on sign-up
- [ ] User updated in Convex on profile change

---

#### E1.S3.T6: Checkpoint - Test Auth Flow
**Size:** 🟢 30min
**Type:** 🔴 Blocker
**Dependencies:** E1.S3.T5

**Description:**
End-to-end test of authentication and user sync.

**Test Steps:**
1. Clear all users from Convex (Data tab)
2. Sign up with new email
3. Verify user appears in Convex `users` table
4. Sign out
5. Sign in with same email
6. Verify protected routes work

**Acceptance Criteria:**
- [ ] Sign-up creates user in Convex
- [ ] Sign-in works
- [ ] Protected routes redirect when not signed in
- [ ] Protected routes accessible when signed in
- [ ] User data accurate (email, name)

---

### E1.S4: UI Foundation (6 tasks, ~4 hours)

#### E1.S4.T1: Install shadcn/ui
**Size:** 🟢 30min
**Type:** 🔵 Setup
**Dependencies:** E1.S3.T6

**Description:**
Initialize shadcn/ui and configure components.

**Commands:**
```bash
npx shadcn-ui@latest init
```

**Prompts:**
- TypeScript: **Yes**
- Style: **Default**
- Base color: **Slate**
- Global CSS: **src/index.css**
- CSS variables: **Yes**
- Tailwind config: **tailwind.config.js**
- Components: **src/components/ui**
- Utils: **src/lib/utils.ts**
- React Server Components: **No**

**Acceptance Criteria:**
- [ ] shadcn/ui configured
- [ ] `components.json` created
- [ ] Can add components via CLI

---

#### E1.S4.T2: Add Essential Components
**Size:** 1hr
**Type:** 🔵 Setup, 🟡 Parallel
**Dependencies:** E1.S4.T1

**Description:**
Add frequently-used shadcn/ui components.

**Commands:**
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
```

**Files Created:**
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/badge.tsx`

**Acceptance Criteria:**
- [ ] All components added
- [ ] No TypeScript errors
- [ ] Can import components

---

#### E1.S4.T3: Configure Dark Theme
**Size:** 🟢 30min
**Type:** 🔵 Setup
**Dependencies:** E1.S4.T1

**Description:**
Ensure dark theme is default and applied globally.

**Files Modified:**
- `src/index.css`
- `index.html`

**index.html:**
```html
<html lang="en" class="dark">
```

**index.css:**
```css
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Acceptance Criteria:**
- [ ] Dark theme applied
- [ ] All components use dark colors
- [ ] No white backgrounds

---

#### E1.S4.T4: Create App Layout
**Size:** 2hrs
**Type:** 🟣 Feature, 🔴 Blocker
**Dependencies:** E1.S4.T2, E1.S4.T3

**Description:**
Create main app layout with sidebar, header, and content area.

**Files Created:**
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`

**AppLayout.tsx:**
```typescript
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Sidebar.tsx:**
```typescript
import { Link, useLocation } from "react-router-dom";
import { Home, DollarSign, TrendingUp, Target, CreditCard, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Transactions", href: "/transactions", icon: DollarSign },
  { name: "Budgets", href: "/budgets", icon: TrendingUp },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Debts", href: "/debts", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Syphon</h1>
      </div>
      <nav className="space-y-1 px-3">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Header.tsx:**
```typescript
import { UserButton } from "@clerk/clerk-react";

export function Header() {
  return (
    <header className="h-16 border-b flex items-center justify-between px-6">
      <div className="text-sm text-muted-foreground">
        {new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        })}
      </div>
      <UserButton afterSignOutUrl="/sign-in" />
    </header>
  );
}
```

**Acceptance Criteria:**
- [ ] Sidebar shows on left
- [ ] Navigation items highlight active page
- [ ] Header shows date and user button
- [ ] Layout responsive (mobile collapses sidebar)

---

#### E1.S4.T5: Create Placeholder Pages
**Size:** 1hr
**Type:** 🟡 Parallel
**Dependencies:** E1.S4.T4

**Description:**
Create empty pages for all routes.

**Files Created:**
- `src/routes/dashboard.tsx`
- `src/routes/transactions.tsx`
- `src/routes/budgets.tsx`
- `src/routes/goals.tsx`
- `src/routes/debts.tsx`
- `src/routes/reports.tsx`
- `src/routes/settings.tsx`

**Template (dashboard.tsx):**
```typescript
import { AppLayout } from "@/components/layout/AppLayout";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="mt-2 text-muted-foreground">Coming soon...</p>
      </div>
    </AppLayout>
  );
}
```

**Repeat for all pages, changing title.**

**Acceptance Criteria:**
- [ ] All pages created
- [ ] Pages render with AppLayout
- [ ] No errors when navigating

---

#### E1.S4.T6: Set Up Routing
**Size:** 1hr
**Type:** 🟣 Feature, 🔴 Blocker
**Dependencies:** E1.S4.T5

**Description:**
Configure React Router 7 with all routes.

**Files Modified:**
- `src/main.tsx`
- `src/App.tsx`

**App.tsx:**
```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import SignInPage from "./routes/sign-in";
import SignUpPage from "./routes/sign-up";
import DashboardPage from "./routes/dashboard";
import TransactionsPage from "./routes/transactions";
import BudgetsPage from "./routes/budgets";
import GoalsPage from "./routes/goals";
import DebtsPage from "./routes/debts";
import ReportsPage from "./routes/reports";
import SettingsPage from "./routes/settings";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budgets"
          element={
            <ProtectedRoute>
              <BudgetsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <GoalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/debts"
          element={
            <ProtectedRoute>
              <DebtsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Acceptance Criteria:**
- [ ] All routes work
- [ ] Protected routes redirect when not signed in
- [ ] Navigation between pages works
- [ ] Active page highlights in sidebar

---

### E1.S5: Deployment Pipeline (3 tasks, ~2 hours)

#### E1.S5.T1: Deploy Convex to Production
**Size:** 🟢 30min
**Type:** 🔵 Setup
**Dependencies:** E1.S4.T6

**Description:**
Deploy Convex backend to production environment.

**Commands:**
```bash
npx convex deploy
```

**Prompts:**
- Create production project? **Yes**
- Project name: **syphon-v1-prod**

**Outputs:**
- Production Convex URL (save for Netlify)

**Acceptance Criteria:**
- [ ] Convex production deployed
- [ ] Production dashboard accessible
- [ ] URL saved

---

#### E1.S5.T2: Deploy to Netlify
**Size:** 1hr
**Type:** 🔵 Setup
**Dependencies:** E1.S5.T1

**Description:**
Deploy frontend to Netlify.

**Steps:**
1. Go to https://app.netlify.com
2. "Add new site" → "Import an existing project"
3. Connect GitHub repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables:
   - `VITE_CONVEX_URL`: (production URL from T1)
   - `VITE_CLERK_PUBLISHABLE_KEY`: (production key from Clerk)
6. Deploy

**Clerk Production Setup:**
1. Go to Clerk Dashboard → Instances
2. Create production instance: "Syphon v1 Prod"
3. Copy production publishable key
4. Update Netlify environment variable

**Acceptance Criteria:**
- [ ] Site deployed to Netlify
- [ ] Environment variables configured
- [ ] Production URL accessible

---

#### E1.S5.T3: Test Production Deploy
**Size:** 🟢 30min
**Type:** 🔴 Blocker
**Dependencies:** E1.S5.T2

**Description:**
End-to-end test of production deployment.

**Test Steps:**
1. Open production URL
2. Sign up with test account
3. Verify user created in Convex production
4. Navigate to all pages
5. Sign out
6. Sign in
7. Verify protected routes work

**Acceptance Criteria:**
- [ ] Production site loads
- [ ] Auth works in production
- [ ] User synced to Convex
- [ ] All pages accessible
- [ ] No console errors

---

## E2-E8: Summary Task Counts

**Note:** Full task breakdowns for E2-E8 will be created as needed during development. Below are estimated task counts per story.

### E2: Transaction Management (v0.4.0)
- **E2.S1: Category Management** (~7 tasks, 4-5 hours)
- **E2.S2: Account Management** (~5 tasks, 3-4 hours)
- **E2.S3: Create Transaction** (~6 tasks, 4-5 hours)
- **E2.S4: Transaction List & Filters** (~10 tasks, 6-7 hours)

**Total: ~28 tasks, 17-21 hours**

### E3: Budget System (v0.5.0)
- **E3.S1: Create Budget** (~6 tasks, 4-5 hours)
- **E3.S2: Budget Allocations & Groups** (~8 tasks, 6-7 hours)
- **E3.S3: Budget Progress Tracking** (~7 tasks, 6-7 hours)
- **E3.S4: Budget Templates** (~5 tasks, 4-5 hours)

**Total: ~26 tasks, 20-24 hours**

### E4: Savings Goals (v0.6.0)
- **E4.S1: Create & Manage Goals** (~5 tasks, 3-4 hours)
- **E4.S2: Goal Contributions** (~4 tasks, 3-4 hours)
- **E4.S3: Goal Progress & Dashboard** (~3 tasks, 2-3 hours)

**Total: ~12 tasks, 8-11 hours**

### E5: Debt Tracking (v0.6.0)
- **E5.S1: Create & Manage Debts** (~5 tasks, 3-4 hours)
- **E5.S2: Debt Payments** (~4 tasks, 3-4 hours)
- **E5.S3: Debt Dashboard & Projections** (~5 tasks, 4-5 hours)

**Total: ~14 tasks, 10-13 hours**

### E6: Recurring Transactions (v0.7.0)
- **E6.S1: Create Recurring Templates** (~7 tasks, 5-6 hours)
- **E6.S2: Projection Engine** (~6 tasks, 6-7 hours)
- **E6.S3: Actualize Projections** (~6 tasks, 5-6 hours)
- **E6.S4: Ledger Integration** (~5 tasks, 4-5 hours)
- **E6.S5: Budget Integration** (~4 tasks, 3-4 hours)

**Total: ~28 tasks, 23-28 hours**

### E7: Analytics & Reports (v0.8.0)
- **E7.S1: Income vs Expense Report** (~6 tasks, 5-6 hours)
- **E7.S2: Spending by Category Report** (~5 tasks, 4-5 hours)
- **E7.S3: Net Worth Trend** (~6 tasks, 5-6 hours)
- **E7.S4: Report Filters & Date Ranges** (~5 tasks, 4-5 hours)

**Total: ~22 tasks, 18-22 hours**

### E8: Polish & Launch (v0.9.0)
- **E8.S1: CSV Import** (~10 tasks, 7-8 hours)
- **E8.S2: Receipt Management** (~6 tasks, 4-5 hours)
- **E8.S3: Onboarding Flow** (~8 tasks, 6-7 hours)
- **E8.S4: Bill Reminders** (~4 tasks, 3-4 hours)
- **E8.S5: Pay Schedule & Final Polish** (~7 tasks, 4-5 hours)

**Total: ~35 tasks, 24-29 hours**

---

## Task Status Legend

**Type:**
- 🔵 Setup - Infrastructure/tooling
- 🟣 Feature - User-facing functionality
- 🟢 Quick Win - <1 hour, easy
- 🟡 Parallel - Can be done alongside other tasks
- 🔴 Blocker - Must complete before other tasks

**Size:**
- 🟢 15-30min
- 30min-1hr
- 1-2hrs
- 2-4hrs
- 4hrs+ (should be broken down)

---

## Commit Message Convention

**Format:**
```
<type>(<scope>): <subject>

<body>

🤖 Syphon v1.0.0 - <epic>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `chore`: Maintenance (build, config)
- `docs`: Documentation
- `style`: Formatting, styling
- `refactor`: Code restructure (no behavior change)

**Example:**
```
feat(auth): add Clerk authentication with user sync

- Install Clerk SDK
- Create sign-in/sign-up pages
- Wire Clerk webhook to Convex
- Lazy user creation on first sign-in

🤖 Syphon v1.0.0 - E1.S3
```

---

**Document Version:** 1.0
**Next Update:** After E1 completion (create E2 tasks)
