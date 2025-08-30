import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TelemetryDashboardProps {
  className?: string;
}

export function TelemetryDashboard({ className }: TelemetryDashboardProps) {
  const telemetryEnabled = process.env.OTEL_SDK_DISABLED !== "true";

  return (
    <Card
      className={`bg-neutral-900 border-neutral-700 relative overflow-hidden ${className}`}
    >
      {/* Diagonal hatched lines background */}
      <div className="absolute inset-0 overflow-hidden  ">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgb(115, 280, 115) 2px,
              rgb(115, 280, 115) 4px
            )`,
          }}
        />
      </div>
      <CardHeader>
        <CardTitle className="text-purple-500 flex items-center gap-2">
          📊 Telemetry Status
          <Badge variant={telemetryEnabled ? "default" : "secondary"}>
            {telemetryEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-neutral-400">
          <p className="mb-2">OpenTelemetry is providing observability for:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>User authentication flows</li>
            <li>Database operations (Prisma)</li>
            <li>API request/response cycles</li>
            <li>Error tracking and performance metrics</li>
          </ul>
        </div>

        {telemetryEnabled && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-orange-500 mb-2">
              Monitored Operations
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Badge variant="outline" className="text-center">
                auth.getCurrentUser
              </Badge>
              <Badge variant="outline" className="text-center">
                auth.requireAuth
              </Badge>
              <Badge variant="outline" className="text-center">
                db.user.findUnique
              </Badge>
              <Badge variant="outline" className="text-center">
                db.user.create
              </Badge>
              <Badge variant="outline" className="text-center">
                api.me.GET
              </Badge>
            </div>
          </div>
        )}

        <div className="text-xs text-neutral-500 border-t border-neutral-700 pt-2">
          {process.env.NODE_ENV === "development" ? (
            <p>🔧 Development mode: Traces logged to console</p>
          ) : (
            <p>🚀 Production mode: Traces exported to configured endpoint</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
