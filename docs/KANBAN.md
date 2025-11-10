# Syphon v1.0.0 - Kanban Board

**Version:** 1.0.0
**Last Updated:** 2025-11-08
**Current Sprint:** Sprint 0 (v0.3.0 - Infrastructure)

---

## Initial Board State (Sprint 0 - E1)

### Backlog
- E1.S1.T4: Add ESLint + Prettier (waiting for T2)
- E1.S1.T5: Create Project Structure (waiting for T1)
- E1.S2.T1: Install Convex (waiting for E1.S1)
- E1.S2.T2: Create Schema (waiting for T1)
- E1.S2.T3: Add ConvexProvider (waiting for T2)
- E1.S2.T4: Create Test Query (waiting for T3)
- E1.S2.T5: Checkpoint - Verify Convex Working (waiting for T4)
- E1.S3.T1: Install Clerk (waiting for E1.S2)
- E1.S3.T2: Add ClerkProvider (waiting for T1)
- E1.S3.T3: Create Auth Routes (waiting for T2)
- E1.S3.T4: Create Convex User Sync Function (waiting for T3)
- E1.S3.T5: Wire Clerk Webhook (waiting for T4)
- E1.S3.T6: Checkpoint - Test Auth Flow (waiting for T5)
- E1.S4.T1: Install shadcn/ui (waiting for E1.S3)
- E1.S4.T2: Add Essential Components (waiting for T1)
- E1.S4.T3: Configure Dark Theme (waiting for T1)
- E1.S4.T4: Create App Layout (waiting for T2, T3)
- E1.S4.T5: Create Placeholder Pages (waiting for T4)
- E1.S4.T6: Set Up Routing (waiting for T5)
- E1.S5.T1: Deploy Convex to Production (waiting for E1.S4)
- E1.S5.T2: Deploy to Netlify (waiting for T1)
- E1.S5.T3: Test Production Deploy (waiting for T2)

### Ready
- **E1.S1.T1** 🔵 🔴 Create React Router 7 Project (30min)
- **E1.S1.T2** 🔵 Configure TypeScript (30min)
- **E1.S1.T3** 🔵 Set Up Tailwind CSS (30min)

### In Progress
_(Empty - pick first task from Ready)_

### Testing
_(Empty - tasks move here after code complete)_

### Done
_(Empty - tasks move here after verified)_

---

## Board Columns Explained

### 📦 Backlog
**Purpose:** Future work not yet ready

**Criteria to enter:**
- Task identified and scoped
- Dependencies not yet met
- Lower priority than Ready tasks

**Example:**
```
E1.S2.T1: Install Convex
Dependencies: E1.S1 complete
Status: Blocked until project initialized
```

---

### ✅ Ready
**Purpose:** Tasks ready to be picked up

**Criteria to enter:**
- All dependencies met
- Acceptance criteria clear
- Can be started immediately

**Criteria to exit:**
- Developer starts working on task
- Task moves to "In Progress"

**Example:**
```
E1.S1.T1: Create React Router 7 Project
Dependencies: None ✅
Acceptance: Project runs on npm run dev
Ready to start: YES
```

---

### 🔨 In Progress
**Purpose:** Currently being worked on

**Criteria to enter:**
- Task picked from Ready
- Developer actively working

**WIP Limit:** 1-2 tasks maximum (focus!)

**Criteria to exit:**
- Code complete
- Self-tested locally
- Ready for verification

**Example:**
```
E1.S1.T2: Configure TypeScript
Started: 2025-11-08 10:00
Blocked: NO
ETA: 30min
```

---

### 🧪 Testing
**Purpose:** Verify task meets acceptance criteria

**Criteria to enter:**
- Code committed
- Ready for verification

**Testing Checklist:**
- [ ] Acceptance criteria met
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] ESLint passes
- [ ] Manual testing done

**Criteria to exit:**
- All tests pass → Done
- Test fails → Back to In Progress

---

### ✅ Done
**Purpose:** Task complete and verified

**Criteria to enter:**
- All acceptance criteria met
- Tested and verified
- Committed to branch

**Archive after:** Sprint complete

---

## Task Card Format

```markdown
### E1.S1.T1: Create React Router 7 Project

**Type:** 🔵 Setup, 🔴 Blocker
**Size:** 30min
**Assignee:** Mohamed
**Started:** 2025-11-08 10:00
**Dependencies:** None

**Description:**
Initialize a new React Router 7 project using Vite.

**Acceptance Criteria:**
- [ ] Project created
- [ ] npm run dev starts server on 5173
- [ ] No console errors

**Blockers:** None

**Notes:** None
```

---

## Movement Rules

### Backlog → Ready
**Trigger:** All dependencies complete

**Process:**
1. Check dependency tasks in Done column
2. If all Done, move task to Ready
3. Update status in Linear

**Example:**
```
E1.S2.T1 depends on E1.S1.T6
E1.S1.T6 moved to Done
→ Automatically move E1.S2.T1 to Ready
```

---

### Ready → In Progress
**Trigger:** Developer picks task

**Process:**
1. Check WIP limit (max 2 tasks)
2. If under limit, move task to In Progress
3. Update "Started" timestamp
4. Begin work

**Priority Order:**
1. 🔴 Blockers first
2. 🟢 Quick wins (if motivation low)
3. 🟡 Parallel tasks (can do alongside)
4. Regular tasks

---

### In Progress → Testing
**Trigger:** Code complete

**Process:**
1. Commit code with proper message
2. Move task to Testing
3. Run testing checklist
4. Verify acceptance criteria

**Commit Message:**
```
feat(infra): create React Router 7 project

- Initialize Vite project with TypeScript
- Configure dev server on port 5173

🤖 Syphon v1.0.0 - E1.S1.T1
```

---

### Testing → Done
**Trigger:** All tests pass

**Process:**
1. Mark all acceptance criteria as checked
2. Move to Done
3. Update Linear status
4. Trigger dependent tasks to move to Ready

---

### Testing → In Progress (Rollback)
**Trigger:** Test fails

**Process:**
1. Add note explaining failure
2. Move back to In Progress
3. Fix issue
4. Re-test

**Example:**
```
FAILURE: TypeScript compile error in App.tsx
Moving back to In Progress to fix type issue.
```

---

## Sprint 0 Workflow

### Day 1 Morning (Hours 1-4)
**Goal:** Project initialized, Convex wired

**Tasks:**
1. E1.S1.T1 → E1.S1.T2 → E1.S1.T3 → E1.S1.T4 → E1.S1.T5 → E1.S1.T6 ✅
2. E1.S2.T1 → E1.S2.T2 → E1.S2.T3 → E1.S2.T4 → E1.S2.T5 ✅

**Checkpoint:** Convex working, can query database

---

### Day 1 Afternoon (Hours 5-8)
**Goal:** Auth working, user sync functional

**Tasks:**
1. E1.S3.T1 → E1.S3.T2 → E1.S3.T3 → E1.S3.T4 → E1.S3.T5 → E1.S3.T6 ✅

**Checkpoint:** Can sign up, user appears in Convex

---

### Day 2 Morning (Hours 9-12)
**Goal:** UI framework ready, layout built

**Tasks:**
1. E1.S4.T1 → E1.S4.T2 → E1.S4.T3 (parallel)
2. E1.S4.T4 → E1.S4.T5 (parallel) → E1.S4.T6 ✅

**Checkpoint:** All pages accessible, navigation works

---

### Day 2 Afternoon (Hours 13-16)
**Goal:** Deployed to production

**Tasks:**
1. E1.S5.T1 → E1.S5.T2 → E1.S5.T3 ✅

**Checkpoint:** Production URL works, auth functional

---

## Daily Standup Template

**What did I do yesterday?**
- Completed: [List tasks in Done]
- Blockers: [Any issues]

**What am I doing today?**
- In Progress: [Current tasks]
- Next: [Tasks moving to Ready]

**Any blockers?**
- [List any issues preventing progress]

**Example:**
```
STANDUP - 2025-11-08

YESTERDAY:
✅ E1.S1.T1-T6: Project initialized
✅ E1.S2.T1-T5: Convex wired and working
🔴 Blocker: None

TODAY:
🔨 E1.S3.T1-T3: Setting up Clerk auth
⏭️  E1.S3.T4-T6: User sync

BLOCKERS: None
```

---

## End-of-Day Ritual

**Time:** 5 minutes at end of work session

**Process:**
1. Review board state
2. Move completed tasks to Done
3. Identify tomorrow's first task (move to top of Ready)
4. Update Linear with progress
5. Commit any WIP code (with WIP prefix)

**WIP Commit Example:**
```
WIP: E1.S3.T4 - partial Convex user sync

- Created syncUser mutation
- TODO: Wire Clerk webhook
- Not ready for testing

🤖 Syphon v1.0.0 - E1.S3.T4 (in progress)
```

---

## Task Size Guidelines

### 🟢 Quick Win (15-30min)
**Examples:**
- E1.S1.T6: First Commit
- E1.S2.T5: Checkpoint
- E1.S5.T1: Deploy Convex

**When to pick:**
- Low energy, need motivation
- End of day, little time left
- Between larger tasks

---

### Small (30min-1hr)
**Examples:**
- E1.S1.T1: Create Project
- E1.S1.T2: Configure TypeScript
- E1.S3.T1: Install Clerk

**When to pick:**
- Morning start
- After quick win
- Building momentum

---

### Medium (1-2hrs)
**Examples:**
- E1.S2.T2: Create Schema
- E1.S3.T3: Create Auth Routes
- E1.S4.T4: Create App Layout

**When to pick:**
- Mid-session, focused
- After warmup task
- Uninterrupted time block

---

### Large (2-4hrs)
**Examples:**
- E1.S4.T4: Create App Layout
- E1.S5.T2: Deploy to Netlify

**When to pick:**
- Full morning/afternoon
- Deep focus time
- Sprint end push

**⚠️ If >4hrs:** Break down into smaller tasks

---

## Parallel Task Strategy

**When tasks have 🟡 Parallel tag:**

### Option A: Work Sequentially
Complete one task fully before starting next.

**Pros:** Focus, clear progress
**Cons:** Slower, less variety

---

### Option B: Interleave
Work on multiple tasks in rotation.

**Example:**
```
09:00-10:00: E1.S4.T2 (Add Components) - 80% done
10:00-11:00: E1.S4.T3 (Dark Theme) - 100% done ✅
11:00-12:00: E1.S4.T2 continued - 100% done ✅
```

**Pros:** Variety, break from complex task
**Cons:** Context switching

---

### Option C: Batch Similar Tasks
Group related parallel tasks together.

**Example:**
All UI tasks (T2, T3, T5) in one session.

**Pros:** Reduced context switch, efficient
**Cons:** Longer without checkpoint

---

## Board Health Metrics

### Ideal State
- **Backlog:** 10-20 tasks (2-3 days of work)
- **Ready:** 3-5 tasks (1 day of work)
- **In Progress:** 1-2 tasks (WIP limit)
- **Testing:** 0-2 tasks (test quickly!)
- **Done:** Growing throughout sprint

### Red Flags
- 🔴 **Ready Empty:** Need to unblock tasks
- 🔴 **In Progress > 3:** Too much WIP, focus!
- 🔴 **Testing > 5:** Testing bottleneck, clear queue
- 🔴 **Backlog > 50:** Over-planned, prioritize

---

## Linear Import Format

**For importing to Linear:**

```csv
Title,Description,Priority,Labels,Status
"E1.S1.T1: Create React Router 7 Project","Initialize Vite project with React + TypeScript",1,"🔵 Setup,🔴 Blocker","Ready"
"E1.S1.T2: Configure TypeScript","Set up strict TypeScript config",2,"🔵 Setup","Backlog"
```

**Priority:**
- 1 = Critical (🔴 Blocker)
- 2 = High (regular tasks)
- 3 = Medium (🟡 Parallel)
- 4 = Low (🟢 Quick Win)

**Labels:**
- 🔵 Setup
- 🟣 Feature
- 🟢 Quick Win
- 🟡 Parallel
- 🔴 Blocker

**Status:**
- Backlog
- Ready
- In Progress
- Testing
- Done

---

## Sprint Retrospective Template

**End of Sprint 0:**

**What went well?**
- [List successes]
- [Fast tasks]
- [Good decisions]

**What could improve?**
- [Blockers encountered]
- [Slow tasks]
- [Estimation errors]

**Action items for Sprint 1:**
- [Process changes]
- [Tool improvements]
- [Estimation adjustments]

**Velocity:**
- Planned: 25 tasks, 40-60 hours
- Completed: ___ tasks, ___ hours
- Velocity: ___% (tasks completed / planned)

---

**Document Version:** 1.0
**Next Update:** Daily during Sprint 0, then per sprint
