import { test as setup, expect, type Page } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

const STATE = "e2e/.auth/state.json";
const EMAIL = "e2e+clerk_test@example.com";
const USERNAME = "e2etester";
const CODE = "424242"; // Clerk test-mode fixed code for +clerk_test emails

async function logFields(page: Page, label: string) {
  // Debug-only; never let it fail the setup (it can race navigations).
  try {
    const names = await page
      .locator("input:visible")
      .evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name));
    console.log(`[${label}] url=${page.url()} inputs=[${names.join(", ")}]`);
  } catch {
    console.log(`[${label}] (skipped — navigation in flight)`);
  }
}

async function fillIfPresent(page: Page, selector: string, value: string) {
  const el = page.locator(selector).first();
  if ((await el.count()) && (await el.isVisible().catch(() => false))) {
    await el.fill(value);
    return true;
  }
  return false;
}

async function clickCta(page: Page) {
  // Form primary CTA only — never "Continue with <OAuth>".
  for (const name of ["Continue", "Sign in", "Sign up", "Next"]) {
    const btn = page.getByRole("button", { name, exact: true }).first();
    if ((await btn.count()) && (await btn.isEnabled().catch(() => false))) {
      await btn.click();
      return;
    }
  }
}

async function switchToEmailCode(page: Page) {
  // Clerk defaults to magic-link; switch to the code strategy we can automate.
  const another = page.getByText(/use another method/i).first();
  if (await another.count()) {
    await another.click().catch(() => {});
    await page.waitForTimeout(1200);
    const codeOpt = page
      .getByText(/email.*code|code.*email|verification code/i)
      .first();
    if (await codeOpt.count()) {
      await codeOpt.click().catch(() => {});
      await page.waitForTimeout(1500);
    }
  }
}

async function typeOtp(page: Page) {
  await switchToEmailCode(page);
  const otp = page
    .locator('input[autocomplete="one-time-code"], input[name^="codeInput"], input[inputmode="numeric"]')
    .first();
  await otp.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  if ((await otp.count()) && (await otp.isVisible().catch(() => false))) {
    await otp.click();
    await page.keyboard.type(CODE, { delay: 90 });
    return true;
  }
  return false;
}

setup("authenticate via Clerk test email", async ({ page }) => {
  await setupClerkTestingToken({ page });

  // --- Primary: sign in (passwordless email code) ---
  await page.goto("http://localhost:5173/sign-in");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  await logFields(page, "signin-1");
  await fillIfPresent(page, 'input[name="identifier"]', EMAIL);
  await fillIfPresent(page, 'input[name="emailAddress"]', EMAIL);
  await clickCta(page);
  await page.waitForTimeout(2500);
  await logFields(page, "signin-2");

  const needSignup = /no account|couldn't find|can't find|not found/i.test(
    await page.locator("body").innerText()
  );

  if (needSignup) {
    // --- Fallback: sign up to create the user ---
    console.log("[flow] signing up new user");
    await page.goto("http://localhost:5173/sign-up");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await fillIfPresent(page, 'input[name="firstName"]', "E2E");
    await fillIfPresent(page, 'input[name="lastName"]', "Tester");
    await fillIfPresent(page, 'input[name="username"]', USERNAME);
    await fillIfPresent(page, 'input[name="emailAddress"]', EMAIL);
    await clickCta(page);
    await page.waitForTimeout(2500);
  }

  // Both paths converge on the email verification code step.
  await typeOtp(page);
  await page.waitForTimeout(4000);
  await logFields(page, "after-otp");

  // Verify a real session against a protected route. Generous timeout: Vite
  // dev compiles the dashboard route on first hit (cold compile can be slow).
  await page.goto("http://localhost:5173/dashboard");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);
  await logFields(page, "final");
  await page.screenshot({ path: "e2e/.auth/final.png", fullPage: true });

  expect(page.url(), `bounced to sign-in: ${page.url()}`).toContain("/dashboard");

  // Dismiss the onboarding gate FIRST — it's a modal that aria-hides the rest of
  // the page (incl. the nav), so it must be closed before asserting app chrome.
  // (Persists onboardingComplete so it won't reappear in later flows.)
  const skip = page.getByText("Skip for now");
  await skip.waitFor({ state: "visible", timeout: 120000 }).catch(() => {});
  if (await skip.count()) {
    await skip.click().catch(() => {});
    await page.waitForTimeout(2000);
  }

  await expect(page.getByRole("navigation").first()).toBeVisible({ timeout: 30000 });
  await page.context().storageState({ path: STATE });
});
