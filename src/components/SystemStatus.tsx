"use client";

import { useEffect, useState } from "react";

interface HealthCheck {
  timestamp: string;
  status: "healthy" | "degraded" | "unhealthy";
  environment: string;
  version: string;
  branch?: string;
  service: string;
  checks: {
    database: string;
    telemetry:
      | "healthy"
      | "console-only"
      | "disabled"
      | "timeout"
      | "unreachable"
      | "unhealthy"
      | string;
  };
}

export function SystemStatus() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("/api/health");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();

    // Refresh health status every 30 seconds
    const interval = setInterval(fetchHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "unhealthy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "healthy":
        return "SYSTEM ONLINE";
      case "degraded":
        return "SYSTEM DEGRADED";
      case "unhealthy":
        return "SYSTEM OFFLINE";
      default:
        return "SYSTEM UNKNOWN";
    }
  };

  const getStatusTextColor = (status?: string) => {
    switch (status) {
      case "healthy":
        return "text-green-400";
      case "degraded":
        return "text-yellow-400";
      case "unhealthy":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-1 border border-neutral-800 bg-neutral-600/5 p-4 text-xs mt-auto">
        <div className="flex gap-2 items-center">
          <div className="size-2 bg-gray-500 animate-pulse"></div>
          <span className="text-gray-400">CHECKING SYSTEM...</span>
        </div>
        <div className="text-neutral-500">
          <p>Loading system status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-1 border border-neutral-800 bg-neutral-600/5 p-4 text-xs mt-auto">
        <div className="flex gap-2 items-center">
          <div className="size-2 bg-red-500 animate-pulse"></div>
          <span className="text-red-400">SYSTEM ERROR</span>
        </div>
        <div className="text-neutral-500">
          <p>Failed to check system status: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 border border-neutral-800 bg-neutral-600/5 p-4 text-xs mt-auto">
      <div className="flex gap-2 items-center">
        <div
          className={`size-2 ${getStatusColor(health?.status)} ${
            health?.status === "healthy" ? "" : "animate-pulse"
          }`}
        ></div>
        <span className={getStatusTextColor(health?.status)}>
          {getStatusText(health?.status)}
        </span>
      </div>
      <div className="text-neutral-500">
        {health?.status === "healthy" && <p>All systems operational</p>}
        {health?.status === "degraded" && (
          <p>Some services experiencing issues</p>
        )}
        {health?.status === "unhealthy" && (
          <p>System experiencing critical issues</p>
        )}
        <div className="mt-1 flex gap-2 text-xs">
          <span
            className={`${
              health?.checks.database === "healthy"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            DB: {health?.checks.database}
          </span>
          <span
            className={`${
              health?.checks.telemetry === "healthy"
                ? "text-green-400"
                : health?.checks.telemetry === "console-only"
                  ? "text-green-400"
                  : health?.checks.telemetry === "timeout"
                    ? "text-yellow-400"
                    : health?.checks.telemetry === "unreachable"
                      ? "text-red-400"
                      : health?.checks.telemetry === "disabled"
                        ? "text-gray-400"
                        : "text-yellow-400"
            }`}
          >
            SYS: {health?.checks.telemetry}
          </span>
        </div>
        {health && (
          <div className="mt-1 text-xs text-neutral-600">
            v{health.version} {health.branch} • {health.environment}
          </div>
        )}
      </div>
    </div>
  );
}
