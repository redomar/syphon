# Spec: Importer v2 (E9)

**Status:** Implemented 2026-09-23 on `feat/importer-v2` (see §10 for commits, §14 for deviations) · **Owner:** Mohamed · **Created:** 2026-09-23
**Branch (when started):** `feat/importer-v2` off `v1.0.0-epics`, merged back into `v1.0.0-epics`
**Supersedes:** E8.S1 CSV import (`src/routes/import.tsx`, `convex/imports.ts`)

---

## 1. Why

An aggregator export (8,494 rows, 6 accounts, Apr 2019 → Sep 2026) was replayed through the
current importer. With the default mapping it would record **£0 income and £643,758 of spending**.
It would also silently drop 354 rows (£47k of inflows, including payroll), discard every category,
and count 875 transfers between the user's own accounts as both income and spending. With a
correct mapping the same file gives 7,617 rows, about £232k in and £215k out.

Root causes in the current code:

| # | Defect | Where |
|---|--------|-------|
| 1 | Type auto-maps to `Sub Type` (0% filled), so every row becomes EXPENSE | `import.tsx` `guess("type")` + `/inc\|credit\|cr\b/` |
| 2 | Description auto-maps to `Merchant Name`, so rows with a blank merchant are dropped silently | `import.tsx` `guess("desc","name",…)`, first header match wins |
| 3 | Category is guessed, never shown, never sent | `import.tsx` `mapping.category` unused |
| 4 | No accounts, no transfer concept, so transfers double-count | schema: type is `INCOME \| EXPENSE` |
| 5 | Refunds (positive rows in spending categories) are read as income | server rejects `amount <= 0` |
| 6 | Whole file goes in one mutation (~8k inserts), near Convex limits | `imports.ts` `importTransactions` |
| 7 | `rowCount` counts rows that were skipped; Pending rows imported | `imports.ts` |

## 2. Goals

1. **Fully support the aggregator export**: every column is stored, even where the UI doesn't show it yet.
2. **Handle simpler bank CSVs well**: a single raw text column, separate Paid In / Paid Out
   columns, a DR/CR indicator, day-first or month-first dates.
3. **Keep merchant name and raw description separate**, and derive a merchant name when the CSV has none.
4. **Never lose a row silently**: every skipped, excluded or duplicate row is listed with a reason.
5. **Re-importable**: importing an overlapping file is idempotent, and a failed import can resume.
6. **Learn from each import**: a second import from the same source should take one click.

## 3. Non-goals (this epic)

- Live bank feeds or Open Banking.
- Linking imported rows to recurring templates (the `recurringTemplateId` link).
- ML or LLM categorisation. Rules only (§6).
- UI for most of the new fields beyond what §8 lists. They are stored for later.

## 4. Decisions (agreed 2026-09-23)

| Topic | Decision |
|-------|----------|
| Transfers | New transaction type: `INCOME \| EXPENSE \| TRANSFER`. The two legs of a transfer are linked by `transferPairId`. |
| Refunds | Stored as `EXPENSE` with `isRefund: true`. Reports and budgets **subtract** them from category spend. |
| Merchant vs description | Both kept: `merchant` (clean, shown) + `rawDescription` (exact bank text, dedupe key). `description` stays as the display/user-editable field. |
| Unmapped columns | The original row is kept verbatim in `sourceRow` (hidden). |
| Tracking | This file. Tick the boxes in §10 as work lands. |

## 5. Data model (additive; every new field is optional, so existing rows stay valid)

### `transactions` (extend)
```ts
type: v.union(v.literal("INCOME"), v.literal("EXPENSE"), v.literal("TRANSFER")),
merchant: v.optional(v.string()),            // clean name, e.g. "Eis Cafe"
merchantSource: v.optional(v.union(v.literal("csv"), v.literal("rule"), v.literal("cleaner"), v.literal("raw"))),
rawDescription: v.optional(v.string()),      // exact bank text, whitespace preserved
externalCategory: v.optional(v.string()),    // source's own label, e.g. "Eating Out"
status: v.optional(v.union(v.literal("posted"), v.literal("pending"))),
isRefund: v.optional(v.boolean()),
transferPairId: v.optional(v.id("transactions")),
dedupeKey: v.optional(v.string()),           // see §7.4
sourceRow: v.optional(v.record(v.string(), v.string())), // original CSV row, header → value
```
New index: `by_user_and_dedupe` on `["userId", "dedupeKey"]`.

### `imports` (extend)
```ts
profileId: v.optional(v.id("import_profiles")),
status: v.optional(v.union(v.literal("in_progress"), v.literal("complete"), v.literal("failed"))),
counts: v.optional(v.object({
  total: v.number(), inserted: v.number(), duplicate: v.number(),
  excluded: v.number(), skipped: v.number(), transfers: v.number(), refunds: v.number(),
})),
mappingSnapshot: v.optional(v.any()),       // the ImportMapping used (§7.1), for audit/replay
```
`rowCount` stays for back-compat and is set equal to `counts.inserted`.

### `import_profiles` (new)
One per source, e.g. "Aggregator export" or "TSB statement".
```ts
userId, name,
headerFingerprint: v.string(),   // normalised, sorted header list, hashed
mapping: v.any(),                // ImportMapping (§7.1)
categoryMap: v.record(v.string(), v.union(v.id("categories"), v.literal("__exclude__"), v.literal("__transfer__"))),
accountMap: v.record(v.string(), v.id("accounts")),
lastUsedAt, createdAt, updatedAt
```
Index `by_user_and_fingerprint`.

### `merchant_rules` (new)
```ts
userId,
pattern: v.string(),             // normalised raw-description key (§6.2)
matchType: v.union(v.literal("exact"), v.literal("prefix")),
merchant: v.string(),
categoryId: v.optional(v.id("categories")),
source: v.union(v.literal("learned"), v.literal("manual")),
hits: v.number(),
createdAt, updatedAt
```
Index `by_user_and_pattern`.

### `accounts` (relax)
Make `lastFourDigits` and `balance` optional so accounts can be created during an import.
The UI prompts to fill them in later.

## 6. Merchant resolution (the part for simple CSVs)

Every row ends up with a `merchant` and a `merchantSource`. Resolution runs in this order and stops at the first hit:

1. **`csv`**: the CSV has a mapped merchant column and it's non-blank → use it.
2. **`rule`**: look up `merchant_rules` by the normalised key (§6.2), exact match first, then longest prefix.
3. **`cleaner`**: the deterministic cleaner (§6.1) produces a plausible name (≥ 2 letters, not purely a reference).
4. **`raw`**: fall back to the trimmed raw description.

### 6.1 Cleaner (pure, `src/lib/import/merchant.ts`)
Ordered transforms, each unit-tested with real-shaped examples:
- Collapse whitespace runs. Strip `PENDING`.
- Strip payment-processor prefixes: `SQ *`, `SumUp *`, `ZTL*`, `IZ *`, `PAYPAL *`, `AMZ*`, `NYA*`, `SP `, `UBR*`, `CRV*`.
- Strip card and terminal refs: `CD \d{4}`, `\b\d{4,}\b` store numbers, `FP dd/mm/yy …` Faster Payments tails, long alphanumeric references.
- Strip the trailing location block: `<TOWN> <GBR|ENG|LND|IRL|NLD|…>` and `, <amount> pound sterling …`.
- Strip the domain tail: `.co.uk`, `.com/bill`.
- Title-case, keeping known brand casing via a small table (`ASDA`, `KFC`, `TSB`).

Example: `SumUp *MAK HALAL CHEF Sheffield GBR` → `Mak Halal Chef`.

### 6.2 Learning
- **Normalised key:** lowercase, cleaner applied, digits collapsed to `#`, first 40 characters.
- **From rich imports:** when a row has both a CSV merchant and a raw description, upsert a `learned` rule `key → merchant`. Categories are stored only when the user mapped them. The reference export alone yields about 7,100 pairs, collapsing to far fewer distinct keys.
- **From corrections:** editing a merchant in Review (or later on a transaction) upserts a `manual` rule. Manual rules always beat learned ones.
- Rules are applied at import time only. Existing rows are never rewritten without the user acting.

## 7. Import pipeline

All parsing and analysis is pure TypeScript in `src/lib/import/*`, fully unit-tested with no Convex dependency.

### 7.1 Mapping model
```ts
type ImportMapping = {
  date: ColumnRef; dateFormat: "ymd" | "dmy" | "mdy";
  amount:
    | { mode: "signed"; column: ColumnRef; invert?: boolean }
    | { mode: "split"; inColumn: ColumnRef; outColumn: ColumnRef }
    | { mode: "indicator"; column: ColumnRef; indicator: ColumnRef; creditValues: string[] };
  merchant?: ColumnRef; rawDescription: ColumnRef;
  category?: ColumnRef; account?: ColumnRef; accountProvider?: ColumnRef;
  status?: ColumnRef; pendingValues?: string[];
  notes?: ColumnRef;
};
```

### 7.2 Auto-mapping (sniffing)
For each target field, score every column on three things:
1. An exact header name match (`Description`, `Merchant Name`).
2. A synonym match (`Narrative`, `Details`, `Payee`, `Paid in`, `Money out`, …).
3. **Content**, from the first 200 rows: date parse rate, amount parse rate, sign mix, fill rate, distinct-value count.

Rules:
- A column that is **0% filled is never auto-mapped.**
- `dateFormat` is inferred: any first part > 12 means `dmy`, any second part > 12 means `mdy`. When it's ambiguous, default to `dmy` (UK) and show a notice.
- Two numeric columns that are mostly mutually exclusive (one blank when the other isn't) mean `split` mode.
- Type always comes from the amount; there is no longer a free "Type" column.

### 7.3 Classification (per row, in order)
1. Unparseable date or amount → **skipped** (reason recorded).
2. Amount = 0 → **skipped**.
3. Status is pending → **skipped** (it will arrive later as posted).
4. Category mapped to `__exclude__` → **excluded**.
5. Category mapped to `__transfer__`, or matched as a transfer pair (§7.5) → **TRANSFER**.
6. Positive amount in a category whose Syphon category is an expense category → **EXPENSE + isRefund**.
7. Otherwise → **INCOME** if positive, **EXPENSE** if negative.

### 7.4 Dedupe
`dedupeKey = sha1(accountKey | yyyy-mm-dd | amountPence | normalise(rawDescription) | occurrence)`,
where `occurrence` is the row's index among identical rows **within the same file** (0, 1, 2…).
This keeps real repeats (two £1 Tesco items on the same day) while making re-imports idempotent.
Duplicates are checked server-side against `by_user_and_dedupe`, so the client doesn't need to load every transaction.

### 7.5 Transfer pairing
Rows with the same date (±1 day), the same absolute amount and opposite signs, on **different** accounts,
are paired, greedily and nearest-date first. Both legs become `TRANSFER` with `transferPairId` set.
An unpaired row in a `__transfer__` category is still `TRANSFER`, just unpaired.
The reference file has 360 such pairs.

### 7.6 Write path
- `imports.startImport({ fileName, profileId, mappingSnapshot, total })` → `importId` (`in_progress`)
- `imports.appendBatch({ importId, rows })`, ≤ 500 rows per call. The server re-checks `dedupeKey`, inserts, and returns per-batch counts.
- `imports.finishImport({ importId })` → sets `complete` and final `counts`, then learns rules (§6.2) and updates the profile.
- A partial import can resume: re-sending batches is safe because of `dedupeKey`.
- `undoImport` deletes in batches too (index `by_user_and_import` added), then removes the import record.
- The client shows a progress bar across batches.

## 8. UI

`/import` becomes a five-step wizard (the upload step stays as it is today):

1. **Upload.** Parse the file and look up an `import_profile` by header fingerprint. If one matches, skip straight to step 4 with a banner saying "Using profile *X* · edit mapping".
2. **Map columns.** Pickers for §7.1, with amount mode as a segmented control. A live preview of 10 rows shows the resolved merchant with a small source tag (csv/rule/cleaner/raw).
3. **Match values.** One row per distinct CSV category, each with a dropdown: existing Syphon category / "Create '…'" / Transfer / Exclude. Pre-filled by case-insensitive name and a synonym table (e.g. Eating Out → Dining Out, Bills → Utilities). Accounts work the same way: existing account / create new, with the provider taken from the provider column.
4. **Review.** A ledger showing the income, spending, transfer and refund totals Syphon will record. Below it, tabs list rows by outcome: Will import / Transfers / Refunds / Duplicates / Excluded / Skipped (with reasons). Merchant names can be edited inline, and each edit becomes a manual rule.
5. **Import.** Progress bar, then a summary with the real counts. Import history shows the counts and status for each import and keeps Undo.

Outside `/import`:
- **Transactions list:** the text column shows `merchant ?? description`, and hovering or opening the row shows `rawDescription`. `TRANSFER` rows get a neutral ⇄ style. The type filter gains "Transfers". Transfers are hidden by default.
- **Reports and budgets:** refunds subtract from their category's spend; transfers are excluded (they already are, via the explicit `=== "INCOME"/"EXPENSE"` filters).
- Nothing else is surfaced (`sourceRow`, `externalCategory`, `status`, profiles UI) until a future epic.

## 9. Type-union audit (adding `TRANSFER`)

Files that reference the transaction type (19). Each needs a check. Most need no change, because totals already filter explicitly:

- `convex/schema.ts`, `convex/transactions.ts` (validator; `getDashboardStats` ok), `convex/imports.ts`
- `convex/reports.ts`: ok for transfers; **needs** refund netting in `getSpendingByCategory` / `getIncomeExpenseByMonth` / `getNetWorthTrend`
- `convex/budgets.ts` (L336, L453): **needs** refund netting
- `convex/demo.ts`: optionally seed one transfer + one refund
- `convex/recurring.ts`: separate `recurringType` union; **stays** INCOME/EXPENSE
- `src/components/transactions/TransactionList.tsx`: L162 `isIncome` ternary would style TRANSFER as expense; add a third style and a filter tab
- `src/components/transactions/TransactionForm.tsx`: keep the manual form at INCOME/EXPENSE for now
- `src/routes/settings.tsx`, `src/routes/recurring.tsx`, `src/components/recurring/RecurringForm.tsx`: recurring only, no change
- Tests: `transactions`, `reports`, `budgets`, `imports`, `recurring`, `receipts` `.test.ts`

A shared helper `convex/lib/amounts.ts` → `spendAmount(t)` (`isRefund ? -amount : amount`) keeps the netting in one place.

## 10. Work breakdown & tracking

Each story is its own commit, gated on `pnpm typecheck` + `pnpm test:once` + `pnpm build`, like E4–E8.

- [x] `55e5f2c` **E9.S1 Schema & helpers**: extend `transactions`/`imports`/`accounts`; add `import_profiles`, `merchant_rules`, indexes; `spendAmount` helper; TRANSFER in the validators. Existing 185 tests still green.
- [x] `d920d16` **E9.S2 Parsing & sniffing** (`src/lib/import/`): mapping model, auto-mapper with content sniffing, date-format inference, split/indicator amount modes. Tests: the reference-shaped fixture + a simple TSB-style + a split-column fixture.
- [x] `17b0453` **E9.S3 Merchant resolution**: cleaner + normalised key + rule lookup. Tests: ≥ 30 raw→merchant cases.
- [x] `a73291f` **E9.S4 Classification, dedupe & transfer pairing**: §7.3–7.5 as pure functions. Tests cover each outcome and the reference numbers (7,617 imported / 875+ transfers / 360 pairs / 1 pending / 1 zero) on an anonymised fixture.
- [x] `7192998` **E9.S5 Batched write path**: `startImport`/`appendBatch`/`finishImport`, server-side dedupe, batched undo, rule learning, profile upsert. Convex tests, including resume after a partial import.
- [x] `ea21c1f` **E9.S6 Wizard UI**: steps 1–5, profile detection, value matching, review tabs, progress.
- [x] `2bac784` **E9.S7 Surfacing**: transactions list merchant/raw/transfer styling and filter; refund netting in reports and budgets.
- [x] `c716eea` **E9.S8 E2E + real-file dry run**: extend `e2e/flows.import.spec.ts` (rich + simple CSV). Manually import the real export on the dev backend (2026 slice first, then the full file) and reconcile totals against the reconciliation report.
- [x] **E9.S9 Docs**: update `docs/SCHEMA.md` and `docs/EPICS.md` (add E9, fix the stale E4–E8 status line); note the prod `convex deploy` requirement.

## 11. Acceptance criteria

- Importing the reference export with its saved profile records **£0 of transfers in income/spending totals**, **0 silently dropped rows**, and income/spending within £1 of the reconciliation figures (after refund netting).
- Re-importing the same file inserts **0** rows.
- A simple CSV with only `Date, Description, Paid In, Paid Out` imports with correct types and a merchant derived for every row (`merchantSource` ≠ `raw` for ≥ 80% of common UK merchants in the fixture).
- An 8,500-row import completes in batches with a visible progress bar; killing it midway and re-running completes it without duplicates.
- Undo removes exactly the rows inserted by that import.
- All existing tests pass; new pure modules have ≥ 90% line coverage.

## 12. Test data & privacy

- The user's real export **never** goes into the repo. The fixtures are synthetic rows reproducing its *shapes*: blank merchants, processor prefixes, transfer pairs, refunds, a pending row, a zero row, in-file repeats.
- The real file is used only in the manual E9.S8 dry run against the **dev** Convex deployment.

## 13. Risks

- **The TRANSFER union change** touches 19 files. Mitigated by the §9 audit and existing tests.
- **Convex limits** on large undo and dedupe lookups. Mitigated by indexes and batching.
- **Cleaner over-stripping** real names. Mitigated by the source tag, inline correction and manual rules.
- **Prod deploy**: schema changes need `convex deploy` alongside the release (already pending for v1.0.0).

## 14. Deviations from this spec (as built)

- **Accounts stay strict.** Instead of making `lastFourDigits`/`balance` optional (§5), accounts
  created during an import get `""` and `0`. Same outcome, no change to account UI or validation.
- **Rule categories.** `merchant_rules.categoryId` exists and is applied when a file has no
  category column, but nothing sets it yet (no UI). Learned rules store merchant names only.
- **Duplicates are counted at write time**, not shown in Review (the server checks `dedupeKey`
  per batch). The Review page says so; the done screen and history show the duplicate count.
- **Editing an imported row** keeps `merchant` in step with the edited description. Editing a
  TRANSFER leg in the form turns it into income/expense and un-pairs its partner (the form has
  no transfer option).
- **"All" in the ledger hides transfers**; they have their own filter tab.
- **Manual rules come from the Review step only.** Renaming a merchant later on the Transactions
  page updates that row but doesn't create a rule yet.
- **No `matchType` on rules.** Lookup is always exact key first, then longest prefix on a word
  boundary (`RuleIndex`), so the field wasn't needed.
- **Real-file dry run** (E9.S8) was done up to the Review step in the browser (no write, to keep
  personal data off the dev backend). The full write path was exercised at the same scale with a
  synthetic 8,500-row file in the same layout. See the final report for numbers.

