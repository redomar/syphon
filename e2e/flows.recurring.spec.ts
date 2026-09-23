import { test, expect } from "@playwright/test";
import { watchErrors, shot } from "./helpers";

const FLOW = "recurring";
const NAME = `E2E Sub ${Date.now()}`;

test.describe("Recurring flow (E6)", () => {
  test("create template, see projection, mark paid, pause, delete", async ({ page }) => {
    const errs = watchErrors(page);

    await page.goto("http://localhost:5173/recurring");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: /set it once/i })
    ).toBeVisible({ timeout: 40000 });
    await shot(page, FLOW, "01_landing");

    // create a monthly expense template (dayOfMonth defaults to today's day)
    await page.getByRole("button", { name: "New Template" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("New Recurring Template")).toBeVisible();
    await dialog.getByPlaceholder("0.00").fill("9.99");
    await dialog.getByPlaceholder(/Netflix, Salary, Rent/).fill(NAME);
    await dialog.getByRole("button", { name: "Create Template" }).click();
    await expect(page.getByText("Recurring template created").first()).toBeVisible({
      timeout: 10000,
    });

    // appears in templates list
    await expect(page.getByText(NAME).first()).toBeVisible();
    await shot(page, FLOW, "02_created");

    // appears in upcoming projections, mark the occurrence paid
    const row = page
      .locator("div")
      .filter({ has: page.getByText(NAME) })
      .filter({ has: page.getByRole("button", { name: "Mark paid" }) })
      .last();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Mark paid" }).click();
    const payDialog = page.getByRole("dialog");
    await expect(payDialog.getByText(/Mark as paid/)).toBeVisible();
    await payDialog.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Marked as paid").first()).toBeVisible({ timeout: 10000 });
    await shot(page, FLOW, "03_marked_paid");

    // pause the template (scope row by the stable Delete button — Pause's
    // aria-label flips to "Resume template" after clicking)
    const tplRow = page
      .locator("div")
      .filter({ has: page.getByText(NAME) })
      .filter({ has: page.getByRole("button", { name: "Delete template" }) })
      .last();
    await tplRow.getByRole("button", { name: "Pause template" }).click();
    await expect(tplRow.getByText("Paused", { exact: true })).toBeVisible({
      timeout: 10000,
    });
    await shot(page, FLOW, "04_paused");

    // delete (cleanup)
    await tplRow.getByRole("button", { name: "Delete template" }).click();
    await expect(page.getByText("Template removed").first()).toBeVisible({ timeout: 10000 });
    await shot(page, FLOW, "05_deleted");

    expect(errs.pageErrors, `uncaught: ${errs.pageErrors.join(" | ")}`).toEqual([]);
  });
});
