import { convexTest } from "convex-test";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

export const TEST_USER_IDENTITY = {
  subject: "clerk_test_user_a",
  issuer: "https://clerk.test",
  name: "Test User A",
  email: "a@test.com",
};

export const TEST_USER_B_IDENTITY = {
  subject: "clerk_test_user_b",
  issuer: "https://clerk.test",
  name: "Test User B",
  email: "b@test.com",
};

export async function setupTestWithUser() {
  const t = convexTest(schema, modules);

  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      clerkId: TEST_USER_IDENTITY.subject,
      email: "a@test.com",
      firstName: "Test",
      lastName: "User A",
      currency: "GBP",
      timezone: "Europe/London",
      onboardingComplete: true,
      isDemoMode: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  const asUser = t.withIdentity(TEST_USER_IDENTITY);

  return { t, asUser, userId };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedUserB(t: any) {
  const userId = await t.run(async (ctx: any) => {
    return await ctx.db.insert("users", {
      clerkId: TEST_USER_B_IDENTITY.subject,
      email: "b@test.com",
      firstName: "Test",
      lastName: "User B",
      currency: "GBP",
      timezone: "Europe/London",
      onboardingComplete: true,
      isDemoMode: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  const asUserB = t.withIdentity(TEST_USER_B_IDENTITY);
  return { asUserB, userBId: userId };
}
