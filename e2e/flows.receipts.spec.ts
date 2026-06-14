import { test, expect } from "@playwright/test";
import { watchErrors, shot } from "./helpers";

const FLOW = "receipts";

// A tiny valid 1x1 PNG.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

test.describe("Receipts flow (E8.S2)", () => {
  test("upload a receipt then delete it", async ({ page }) => {
    const errs = watchErrors(page);

    await page.goto("http://localhost:5173/receipts");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: /keep proof of purchase/i })
    ).toBeVisible({ timeout: 40000 });
    await shot(page, FLOW, "01_landing");

    const before = await page.locator('[aria-label="Delete receipt"]').count();

    await page.locator('input[type="file"]').setInputFiles({
      name: "e2e-receipt.png",
      mimeType: "image/png",
      buffer: Buffer.from(PNG_BASE64, "base64"),
    });

    await expect(page.getByText(/Receipt uploaded/).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(async () => {
      const after = await page.locator('[aria-label="Delete receipt"]').count();
      expect(after).toBe(before + 1);
    }).toPass({ timeout: 10000 });
    await shot(page, FLOW, "02_uploaded");

    // delete the newest (cleanup)
    await page.locator('[aria-label="Delete receipt"]').first().click();
    await expect(page.getByText(/Receipt deleted/).first()).toBeVisible({
      timeout: 10000,
    });
    await shot(page, FLOW, "03_deleted");

    expect(errs.pageErrors, `uncaught: ${errs.pageErrors.join(" | ")}`).toEqual([]);
  });
});
