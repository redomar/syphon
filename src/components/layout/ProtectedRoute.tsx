import { useConvexAuth } from "convex/react";
import { Navigate, Outlet } from "react-router";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";
import { AppLayout } from "./AppLayout";

export default function ProtectedRoute() {
  const [isClient, setIsClient] = useState(false);

  // Only run Convex hooks on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // During SSR, show loading state without AppLayout (to avoid Convex hook issues)
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 shadow-inner">
            <Spinner className="h-6 w-6 text-orange-500" />
          </div>
          <p className="text-sm font-medium text-neutral-500 animate-pulse">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  return <ProtectedRouteClient />;
}

function ProtectedRouteClient() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const syncUser = useMutation(api.users.syncUser);

  // Sync user to Convex when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      syncUser().catch((error) => {
        console.error("Failed to sync user:", error);
      });
    }
  }, [isAuthenticated, syncUser]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 shadow-inner">
            <Spinner className="h-6 w-6 text-orange-500" />
          </div>
          <p className="text-sm font-medium text-neutral-500 animate-pulse">
            Loading your workspace...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}
