import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR, show loading state
  if (!isClient) {
    return <DashboardLoading />;
  }

  return <DashboardClient />;
}

function DashboardClient() {
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome back! s</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            {currentUser ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Name:</span>{" "}
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Email:</span>{" "}
                  {currentUser.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Currency:</span>{" "}
                  {currentUser.currency || "Not set"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Timezone:</span>{" "}
                  {currentUser.timezone}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Onboarding:</span>{" "}
                  {currentUser.onboardingComplete ? "Complete" : "Incomplete"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Joined:</span>{" "}
                  {new Date(currentUser.createdAt).toLocaleDateString(
                    undefined,
                    {
                      timeZone: currentUser.timezone,
                    }
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Loading user data...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardDescription>Total Transactions</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl">£0.00</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Balance</CardDescription>
              <CardTitle className="text-3xl">£0.00</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Coming Soon */}
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Dashboard features will be added in upcoming sprints.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AppLayout>
  );
}

function DashboardLoading() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="h-9 bg-muted w-48 animate-pulse" />
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted w-32 animate-pulse" />
            <div className="h-4 bg-muted w-48 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted w-full animate-pulse" />
              <div className="h-4 bg-muted w-3/4 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
