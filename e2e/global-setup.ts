import { clerkSetup } from "@clerk/testing/playwright";

// Fetches a Clerk Testing Token so headless automation bypasses bot protection.
export default async function globalSetup() {
  await clerkSetup({
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
  });
}
