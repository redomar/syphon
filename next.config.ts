import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack: (config, { isServer }) => {
    // Ignore OpenTelemetry warnings for optional dependencies
    if (isServer) {
      config.ignoreWarnings = [
        { message: /Critical dependency: the request of a dependency is an expression/ },
        { message: /Module not found: Can't resolve '@opentelemetry\/winston-transport'/ },
        { message: /Module not found: Can't resolve '@opentelemetry\/exporter-jaeger'/ },
      ];
    }
    return config;
  },
};

export default nextConfig;
