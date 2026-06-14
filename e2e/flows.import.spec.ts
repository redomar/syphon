import { test, expect } from "@playwright/test";
import { watchErrors, shot } from "./helpers";

const FLOW = "import";
const TOKEN = Date.now();

test.describe("CSV import flow (E8.S1)", () => {
  test("upload, map, import, then undo", async ({ page }) => {
    const errs = watchErrors(page);

    await page.goto("http://localhost:5173/import");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: /bring in your transactions/i })
    ).toBeVisible({ timeout: 40000 });
    await shot(page, FLOW, "01_landing");

    const csv = [
      "Date,Amount,Description",
      `2026-01-15,-12.50,E2E Coffee ${TOKEN}`,
      `2026-01-16,1500.00,E2E Payment ${TOKEN}`,
    ].join("\n");

    await page.locator('input[type="file"]').setInputFiles({
      name: "e2e-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });

    // mapping card + preview render (auto-mapped by header)
    await expect(page.getByText(/MAP COLUMNS/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`E2E Coffee ${TOKEN}`)).toBeVisible();
    await shot(page, FLOW, "02_mapped");

    // import
    await page.getByRole("button", { name: /Import \d+ rows/ }).click();
    await expect(page.getByText(/Imported 2 transactions/).first()).toBeVisible({
      timeout: 10000,
    });
    await shot(page, FLOW, "03_imported");

    // history shows the import; undo it (cleanup)
    await expect(page.getByText("IMPORT HISTORY")).toBeVisible();
    const historyRow = page
      .locator("div")
      .filter({ has: page.getByText("e2e-import.csv") })
      .filter({ has: page.getByRole("button", { name: "Undo" }) })
      .last();
    await historyRow.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText(/Removed 2 transactions/).first()).toBeVisible({
      timeout: 10000,
    });
    await shot(page, FLOW, "04_undone");

    expect(errs.pageErrors, `uncaught: ${errs.pageErrors.join(" | ")}`).toEqual([]);
  });
});
