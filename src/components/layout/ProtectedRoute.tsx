import { useAuth } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router";
import { useEffect, useState } from "react";

export default function ProtectedRoute() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render auth logic on client side
  if (!isClient) {
    return <div>Loading...</div>;
  }

  return <ClientProtectedRoute />;
}

function ClientProtectedRoute() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}
