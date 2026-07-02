import { useConvexAuth } from "convex/react";
import { Navigate, Outlet } from "react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTheme } from "next-themes";
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
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-card border border-border shadow-inner">
            <Spinner className="h-6 w-6 text-orange-500" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
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
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      syncUser()
        .then(() => setIsSynced(true))
        .catch((error) => {
          console.error("Failed to sync user:", error);
          setIsSynced(true);
        });
    }
  }, [isAuthenticated, syncUser]);

  // Apply the user's saved theme preference (e.g. set on another device).
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );
  const { setTheme } = useTheme();

  useEffect(() => {
    if (currentUser?.theme) {
      setTheme(currentUser.theme);
    }
  }, [currentUser?.theme, setTheme]);

  if (isLoading || (isAuthenticated && !isSynced)) {
    return (
      <AppLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-card border border-border shadow-inner">
            <Spinner className="h-6 w-6 text-orange-500" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
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
