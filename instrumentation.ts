// This file is required for Next.js instrumentation
// It must be in the root directory and export a register function

// Regex for ignored paths (health checks, static assets)
const IGNORED_PATHS_REGEX = /^\/api\/health|^\/_next\/|\/favicon\.ico$/;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import to avoid loading OpenTelemetry in edge runtime
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } = await import(
      "@opentelemetry/auto-instrumentations-node"
    );
    const { ZipkinExporter } = await import(
      "@opentelemetry/exporter-zipkin"
    );
    const resourceModule = await import("@opentelemetry/resources");
    const { resourceFromAttributes } = resourceModule;

    // Configure exporter with production-ready settings
    let traceExporter;
    if (process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT) {
      const zipkinUrl = process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT;
      
      console.log(`🔧 OpenTelemetry Zipkin exporter configured for: ${zipkinUrl}`);
      traceExporter = new ZipkinExporter({
        url: zipkinUrl,
      });
    } else {
      console.log("⚠️  No OTEL_EXPORTER_ZIPKIN_ENDPOINT configured - traces will go to console");
    }

    // Enhanced logging for production
    const environment = process.env.NODE_ENV || "development";
    const serviceName = process.env.OTEL_SERVICE_NAME || "syphon-app";
    const serviceVersion = process.env.OTEL_SERVICE_VERSION || process.env.VERSION || "0.2.0";

    // Configure service resource with proper attributes
    const resource = resourceFromAttributes({
      "service.name": serviceName,
      "service.version": serviceVersion,
      "service.instance.id": process.env.HOSTNAME || "unknown",
      "deployment.environment": environment,
    });

    const sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": {
            enabled: false, // Disable to reduce noise
          },
          // Production optimizations
          "@opentelemetry/instrumentation-http": {
            ignoreIncomingRequestHook: (req) => {
              // Ignore health checks and static assets in production
              // Use regex for efficient matching of health checks and static assets
              return IGNORED_PATHS_REGEX.test(req.url || "");
            },
          },
        }),
      ],
    });

    sdk.start();

    if (process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT) {
      console.log(
        `📊 OpenTelemetry started - Service: ${serviceName}@${serviceVersion} (${environment})`
      );
      console.log(
        `   Sending traces to Zipkin: ${process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT}`
      );
    } else {
      console.log(
        `🔍 OpenTelemetry started - Service: ${serviceName}@${serviceVersion} (${environment})`
      );
      console.log("   Console tracing only (no external endpoint configured)");
    }

    // Graceful shutdown with enhanced error handling
    const gracefulShutdown = async () => {
      console.log("🔄 Shutting down OpenTelemetry...");
      try {
        await sdk.shutdown();
        console.log("✅ OpenTelemetry shutdown complete");
      } catch (error) {
        console.error("❌ Error during OpenTelemetry shutdown:", error);
      } finally {
        process.exit(0);
      }
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  }
}
