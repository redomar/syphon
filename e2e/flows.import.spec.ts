import { test, expect, type Page } from "@playwright/test";
import { watchErrors, shot } from "./helpers";

const FLOW = "import";
const TOKEN = Date.now().toString(36).toUpperCase();

// Synthetic files only. Stable account/category names so repeat runs reuse
// what the first run created; the token keeps rows unique per run.
const AGGREGATOR = [
  "Date,Merchant Name,Description,Amount,Category,Notes,Account Provider,Account Name,Status,Sub Type",
  `2026-01-15,E2E Cafe,SQ *E2E CAFE ${TOKEN}  Birmingham  GBR,-12.50,Eating Out,,E2E Bank,E2E Current,,`,
  `2026-01-15,,E2E EMPLOYER ${TOKEN}  payroll,1500.00,Income,,E2E Bank,E2E Current,,`,
  `2026-01-16,E2E Shop,E2E SHOP ${TOKEN},-30.00,Shopping,,E2E Bank,E2E Current,,`,
  `2026-01-17,E2E Shop,E2E SHOP ${TOKEN},30.00,Shopping,,E2E Bank,E2E Current,,`,
  `2026-01-18,E2E Current,TO SAVER ${TOKEN},-200.00,Internal Transfers,,E2E Bank,E2E Current,,`,
  `2026-01-18,E2E Saver,FROM CURRENT ${TOKEN},200.00,Internal Transfers,,E2E Bank,E2E Saver,,`,
  `2026-01-19,E2E Cafe,SQ *E2E CAFE ${TOKEN},-4.00,Eating Out,,E2E Bank,E2E Current,Pending,`,
].join("\n");

const SIMPLE = [
  "Transaction Date,Transaction Description,Debit Amount,Credit Amount,Balance",
  `21/01/2026,SQ *EIS CAFE  Birmingham  ${TOKEN},3.90,,100.00`,
  `22/01/2026,E2E REFUND ${TOKEN},,9.99,109.99`,
].join("\n");

async function upload(page: Page, name: string, csv: string) {
  await page.locator("#import-file").setInputFiles({ name, mimeType: "text/csv", buffer: Buffer.from(csv) });
}

/** Handles both first-run (columns step) and recognised-layout (straight to review). */
async function toColumns(page: Page) {
  const columns = page.getByText(/MATCH COLUMNS/);
  const review = page.getByText(/^REVIEW/);
  await expect(columns.or(review).first()).toBeVisible({ timeout: 20000 });
  if (await review.isVisible()) {
    await expect(page.getByText(/Recognised this file layout/)).toBeVisible();
    await page.getByRole("button", { name: "Edit settings" }).click();
    await expect(columns).toBeVisible();
  }
}

async function undoTop(page: Page, fileName: string) {
  const row = page.getByTestId("import-history-row").filter({ hasText: fileName }).first();
  await row.getByRole("button", { name: "Undo" }).click();
  await row.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText(/Removed \d+ transactions/).first()).toBeVisible({ timeout: 30000 });
}

test.describe("CSV import v2 (E9)", () => {
  test("aggregator export: merchant vs bank text, categories, transfers, refunds, pending", async ({ page }) => {
    const errs = watchErrors(page);
    await page.goto("http://localhost:5173/import");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /bring in your transactions/i })).toBeVisible({ timeout: 40000 });
    await shot(page, FLOW, "01_landing");

    const file = `e2e-aggregator-${TOKEN}.csv`;
    await upload(page, file, AGGREGATOR);
    await toColumns(page);

    // auto-mapping picked Description as bank text and Merchant Name as merchant
    await expect(page.locator("#map-description")).toContainText("Description");
    await expect(page.locator("#map-merchant")).toContainText("Merchant Name");
    await expect(page.locator("#map-category")).toContainText("Category");
    await expect(page.locator("#map-account")).toContainText("Account Name");
    await expect(page.getByText("E2E Cafe").first()).toBeVisible();
    await shot(page, FLOW, "02_columns");

    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("CATEGORIES", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Syphon category for Internal Transfers")).toContainText("Transfer between my accounts");
    // matches the default "Dining Out" when the user has it, otherwise offers to create it
    await expect(page.getByLabel("Syphon category for Eating Out")).toContainText(/Dining Out|Create “Eating Out”|^Eating Out$/);
    await shot(page, FLOW, "03_values");

    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("tab", { name: /Transfers \(2\)/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Refunds \(1\)/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Skipped \(1\)/ })).toBeVisible();
    // the blank-merchant payroll row is kept (the E8 importer dropped these)
    await expect(page.getByText(/E2E EMPLOYER/).first()).toBeVisible();
    await shot(page, FLOW, "04_review");

    await page.getByRole("button", { name: /Import 6 rows/ }).click();
    await expect(page.getByText("IMPORT COMPLETE")).toBeVisible({ timeout: 60000 });
    await expect(page.getByText(/6\s*transactions added/)).toBeVisible();
    await expect(page.getByText(/1 matched pairs/)).toBeVisible();
    await shot(page, FLOW, "05_done");

    // ledger shows the merchant, the refund tag and the transfers tab
    await page.getByRole("link", { name: "View transactions" }).click();
    await page.getByRole("button", { name: "All time", exact: true }).dispatchEvent("mousedown");
    await expect(page.getByText("E2E Cafe").first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("refund").first()).toBeVisible();
    await page.getByRole("button", { name: "Transfers", exact: true }).dispatchEvent("mousedown");
    await expect(page.getByText(/⇄/).first()).toBeVisible();
    await shot(page, FLOW, "06_ledger_transfers");

    await page.goto("http://localhost:5173/import");
    await undoTop(page, file);
    expect(errs.pageErrors, `uncaught: ${errs.pageErrors.join(" | ")}`).toEqual([]);
  });

  test("simple debit/credit CSV: cleaned merchants, day-first dates, idempotent re-import", async ({ page }) => {
    const errs = watchErrors(page);
    await page.goto("http://localhost:5173/import");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /bring in your transactions/i })).toBeVisible({ timeout: 40000 });

    const file = `e2e-simple-${TOKEN}.csv`;
    await upload(page, file, SIMPLE);
    await toColumns(page);
    await expect(page.getByRole("radio", { name: "Paid in / paid out" })).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("#map-date-format")).toContainText("Day first");
    // no merchant column: the cleaner names it
    await expect(page.getByText("Eis Cafe").first()).toBeVisible();
    await shot(page, FLOW, "07_simple_columns");

    // no category/account columns -> straight to review
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: /Import 2 rows/ }).click();
    await expect(page.getByText(/2\s*transactions added/)).toBeVisible({ timeout: 60000 });

    // same file again: recognised layout, rows already in Syphon are skipped
    await page.getByRole("button", { name: "Import another file" }).click();
    await upload(page, file, SIMPLE);
    await expect(page.getByText(/Recognised this file layout/)).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: /Import 2 rows/ }).click();
    await expect(page.getByText(/0\s*transactions added/)).toBeVisible({ timeout: 60000 });
    await expect(page.getByText(/2 already in Syphon, skipped/)).toBeVisible();
    await shot(page, FLOW, "08_simple_reimport");

    await undoTop(page, file);
    await undoTop(page, file);
    expect(errs.pageErrors, `uncaught: ${errs.pageErrors.join(" | ")}`).toEqual([]);
  });
});
