import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TelemetryDashboard } from "@/components/TelemetryDashboard";

// This page requires authentication, so it must be dynamically rendered
export const dynamic = 'force-dynamic';

export default async function Settings() {
  // This will automatically create the user in our database if they don't exist
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-400">
          Please sign in to access the Settings page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-orange-500">User Settings</h1>
        <p className="text-neutral-400">
          Welcome back, {user.firstName || user.email}!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-orange-500">User Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-neutral-400">Name: </span>
              <span>
                {user.firstName} {user.lastName}
              </span>
            </div>
            <div>
              <span className="text-neutral-400">Email: </span>
              <span>{user.email}</span>
            </div>
            <div>
              <span className="text-neutral-400">Currency: </span>
              <Badge variant="outline">{user.currency}</Badge>
            </div>
            <div>
              <span className="text-neutral-400">Timezone: </span>
              <span>{user.timezone}</span>
            </div>
            <div>
              <span className="text-neutral-400">Member since: </span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-green-500">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-400">
              Financial data will appear here once you start tracking
              transactions.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-blue-500">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-400">No recent transactions yet.</p>
          </CardContent>
        </Card>

        {/* Telemetry Dashboard spans full width */}
        <div className="md:col-span-2 lg:col-span-3">
          <TelemetryDashboard />
        </div>
      </div>
    </div>
  );
}
