// main.tsx equivalent

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ClerkProvider } from "@clerk/clerk-react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      >
        <ConvexProvider client={convex}>
          <HydratedRouter />
        </ConvexProvider>
      </ClerkProvider>
    </StrictMode>,
    {
      onRecoverableError: (error: unknown) => {
        // Suppress hydration warnings in development (VS Code browser injects styles)
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("Hydration") || message.includes("hydrated")) {
          return;
        }
        console.error(error);
      },
    }
  );
});
