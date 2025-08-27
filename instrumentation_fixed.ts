// This file is required for Next.js instrumentation
// It must be in the root directory and export a register function

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import to avoid loading OpenTelemetry in edge runtime
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } = await import(
      "@opentelemetry/auto-instrumentations-node"
    );
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    );

    // Choose exporter based on configuration
    const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      ? new OTLPTraceExporter({
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        })
      : undefined;

    const sdk = new NodeSDK({
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": {
            enabled: false, // Disable to reduce noise
          },
        }),
      ],
    });

    sdk.start();

    if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      console.log(
        `📊 OpenTelemetry started - Sending traces to: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`
      );
    } else {
      console.log("🔍 OpenTelemetry started - Console tracing only");
    }

    // Graceful shutdown
    process.on("SIGTERM", () => {
      sdk
        .shutdown()
        .then(() => console.log("OpenTelemetry terminated"))
        .catch((error: Error) =>
          console.error("Error terminating OpenTelemetry", error)
        )
        .finally(() => process.exit(0));
    });
  }
}
