import type { Route } from "./+types/home";
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { useConvexAuth } from "convex/react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Syphon - Personal Finance Tracker" },
    { name: "description", content: "Track your finances with Syphon" },
  ];
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <HomeClient />;
}

function HomeClient() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/sign-in" replace />;
}
