import { useConvexAuth } from "convex/react";
import { Navigate, Outlet } from "react-router";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ProtectedRoute() {
  const [isClient, setIsClient] = useState(false);

  // Only run Convex hooks on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // During SSR, show loading state
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Loading...
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}
