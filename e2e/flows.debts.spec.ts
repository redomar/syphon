import { test, expect } from "@playwright/test";
import { watchErrors, shot } from "./helpers";

const FLOW = "debts";
const NAME = `E2E Visa ${Date.now()}`;

test.describe("Debts flow (E5)", () => {
  test("create, validate, pay, history, close", async ({ page }) => {
    const errs = watchErrors(page);

    await page.goto("http://localhost:5173/debts");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: /track what you owe/i })
    ).toBeVisible({ timeout: 40000 });
    await shot(page, FLOW, "01_landing");

    // open dialog, validate empty
    await page.getByRole("button", { name: "New Debt" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Add a Debt")).toBeVisible();
    await dialog.getByRole("button", { name: "Add Debt" }).click();
    await expect(dialog.getByText("Name is required")).toBeVisible();

    // create: name, initial 1000, min payment 100 (currentBalance defaults to initial)
    await dialog.getByPlaceholder("e.g. Barclaycard").fill(NAME);
    await dialog.getByPlaceholder("0.00").first().fill("1000"); // initial balance
    // only two inputs use the 0.00 placeholder: initial (0) and min payment (1)
    await dialog.getByPlaceholder("0.00").nth(1).fill("100");
    await dialog.getByRole("button", { name: "Add Debt" }).click();
    await expect(page.getByText("Debt added").first()).toBeVisible({ timeout: 10000 });

    const card = page.locator('[data-slot="card"]').filter({ hasText: NAME });
    await expect(page.getByText(NAME).first()).toBeVisible();
    await shot(page, FLOW, "02_created");

    // record a payment of 250 -> balance 750, 25% paid
    await card.getByRole("button", { name: "Payment", exact: true }).click();
    const payDialog = page.getByRole("dialog");
    await expect(payDialog.getByText(/Record payment/)).toBeVisible();
    await payDialog.getByPlaceholder("0.00").first().fill("250");
    await payDialog.getByRole("button", { name: "Record Payment" }).click();
    await expect(page.getByText("Payment recorded").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("25% paid").first()).toBeVisible();
    await shot(page, FLOW, "03_paid");

    // history
    await card.getByRole("button", { name: "Payment history" }).click();
    const histDialog = page.getByRole("dialog");
    await expect(histDialog.getByText(/payments/)).toBeVisible();
    await expect(histDialog.getByText("£250.00")).toBeVisible();
    await page.keyboard.press("Escape");
    await shot(page, FLOW, "04_history");

    // close (cleanup)
    await page.keyboard.press("Escape");
    await card.getByRole("button", { name: "Close debt" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm.getByText("Close this debt?")).toBeVisible();
    await confirm.getByRole("button", { name: "Close debt" }).click();
    await expect(page.getByText("Debt closed").first()).toBeVisible({ timeout: 10000 });
    await shot(page, FLOW, "05_closed");

    expect(errs.pageErrors, `uncaught: ${errs.pageErrors.join(" | ")}`).toEqual([]);
  });
});
