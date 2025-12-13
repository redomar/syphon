// main.tsx equivalent

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// Initialize PostHog
posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: "/ingest",
  ui_host: "https://eu.posthog.com",
  person_profiles: "identified_only",
  capture_pageview: true,
  capture_pageleave: true,
  capture_exceptions: true,
  debug: import.meta.env.MODE === "development",
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <PostHogProvider client={posthog}>
        <ClerkProvider
          publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        >
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <HydratedRouter />
          </ConvexProviderWithClerk>
        </ClerkProvider>
      </PostHogProvider>
    </StrictMode>
  );
});
