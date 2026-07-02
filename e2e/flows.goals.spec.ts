import { test, expect } from "@playwright/test";
import { watchErrors, shot } from "./helpers";

const FLOW = "goals";
const NAME = `E2E Vacation ${Date.now()}`;

test.describe("Goals flow (E4)", () => {
  test("create, validate, contribute, history, archive", async ({ page }) => {
    const errs = watchErrors(page);

    await page.goto("http://localhost:5173/goals");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: /what are you saving toward/i })
    ).toBeVisible({ timeout: 40000 });
    await shot(page, FLOW, "01_landing");

    // open create dialog, validate empty
    await page.getByRole("button", { name: "New Goal" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Create a Goal")).toBeVisible();
    await dialog.getByRole("button", { name: "Create Goal" }).click();
    await expect(dialog.getByText("Name is required")).toBeVisible();
    await expect(dialog.getByText("Target amount is required")).toBeVisible();

    // create
    await dialog.getByPlaceholder("e.g. Vacation Fund").fill(NAME);
    await dialog.getByPlaceholder("0.00").fill("2000");
    await dialog.getByRole("button", { name: "Create Goal" }).click();
    await expect(page.getByText("Goal created").first()).toBeVisible({ timeout: 10000 });

    const card = page.locator('[data-slot="card"]').filter({ hasText: NAME });
    await expect(page.getByText(NAME).first()).toBeVisible();
    await shot(page, FLOW, "02_created");

    // contribute 500 -> 25%
    await card.getByRole("button", { name: "Contribute" }).click();
    const contribDialog = page.getByRole("dialog");
    await expect(contribDialog.getByText(/Contribute to/)).toBeVisible();
    await contribDialog.getByPlaceholder("0.00").first().fill("500");
    await contribDialog.getByRole("button", { name: "Add Contribution" }).click();
    await expect(page.getByText("Contribution added").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("25%").first()).toBeVisible();
    await shot(page, FLOW, "03_contributed");

    // history shows the contribution
    await card.getByRole("button", { name: "View contribution history" }).click();
    const histDialog = page.getByRole("dialog");
    await expect(histDialog.getByText(/contributions/)).toBeVisible();
    await expect(histDialog.getByText("£500.00")).toBeVisible();
    await page.keyboard.press("Escape");
    await shot(page, FLOW, "04_history");

    // archive (cleanup)
    await card.getByRole("button", { name: "Archive goal" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm.getByText("Archive goal?")).toBeVisible();
    await confirm.getByRole("button", { name: "Archive" }).click();
    await expect(page.getByText("Goal archived").first()).toBeVisible({ timeout: 10000 });
    await shot(page, FLOW, "05_archived");

    expect(errs.pageErrors, `uncaught: ${errs.pageErrors.join(" | ")}`).toEqual([]);
  });
});
