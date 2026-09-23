import { type Page } from "@playwright/test";

// Dev-only console/page-error noise we ignore.
const NOISE = [
  /posthog/i,
  /clerk.*development/i,
  /Future Flag/i,
  /favicon/i,
  /Download the React DevTools/i,
  /\[vite\]/i,
];

export function watchErrors(page: Page) {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => {
    if (!NOISE.some((r) => r.test(e.message))) pageErrors.push(e.message);
  });
  return { pageErrors };
}

export async function shot(page: Page, flow: string, step: string) {
  await page.screenshot({ path: `e2e/screenshots/${flow}/${step}.png` });
}
