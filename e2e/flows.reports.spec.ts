import { test, expect } from "@playwright/test";
import { watchErrors, shot } from "./helpers";

const FLOW = "reports";

test.describe("Reports flow (E7)", () => {
  test("renders charts and range toggle works", async ({ page }) => {
    const errs = watchErrors(page);

    await page.goto("http://localhost:5173/reports");
    await page.waitForLoadState("networkidle");
    // recharts is a heavy module — generous timeout for Vite cold-compile.
    await expect(
      page.getByRole("heading", { name: /see where your money goes/i })
    ).toBeVisible({ timeout: 150000 });

    // all three chart sections render
    await expect(page.getByText("INCOME VS EXPENSE")).toBeVisible();
    await expect(page.getByText("SPENDING BY CATEGORY")).toBeVisible();
    await expect(page.getByText("NET WORTH TREND")).toBeVisible();
    // summary cards
    await expect(page.getByText("Net worth").first()).toBeVisible();
    await shot(page, FLOW, "01_default_6m");

    // range toggle re-renders without error
    await page.getByRole("button", { name: "12M", exact: true }).click();
    await page.waitForTimeout(1200);
    await expect(page.getByText("INCOME VS EXPENSE")).toBeVisible();
    await shot(page, FLOW, "02_12m");

    await page.getByRole("button", { name: "3M", exact: true }).click();
    await page.waitForTimeout(1200);
    await expect(page.getByText("NET WORTH TREND")).toBeVisible();
    await shot(page, FLOW, "03_3m");

    expect(errs.pageErrors, `uncaught: ${errs.pageErrors.join(" | ")}`).toEqual([]);
  });
});
