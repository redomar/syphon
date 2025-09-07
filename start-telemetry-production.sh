#!/bin/bash

# Production Telemetry Stack Startup Script for Dokploy
echo "🚀 Starting Syphon Production Telemetry Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if we're in production environment
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Warning: NODE_ENV is not set to 'production'"
    echo "   Current NODE_ENV: ${NODE_ENV:-'not set'}"
fi

# Start production telemetry stack
echo "📊 Starting production observability stack..."
docker compose -f docker-compose.production.yml up -d

# Wait for services to become healthy with retries
echo "⏳ Waiting for services to become healthy..."

MAX_RETRIES=30
SLEEP_SECONDS=2

wait_for_service() {
    local name="$1"
    local url="$2"
    local optional="$3"
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $name is running at: $url"
            return 0
        fi
        retries=$((retries+1))
        sleep $SLEEP_SECONDS
    done
    if [ "$optional" = "true" ]; then
        echo "ℹ️  $name is not accessible (this is optional)"
    else
        echo "⚠️  $name did not become healthy after $((MAX_RETRIES * SLEEP_SECONDS)) seconds."
    fi
}

wait_for_service "Jaeger UI" "http://localhost:16686/api/services" "false"
wait_for_service "OTLP HTTP endpoint" "http://localhost:4318/v1/traces" "false"
wait_for_service "Prometheus" "http://localhost:9090/-/healthy" "true"

echo ""
echo "🔧 Production Environment Configuration:"
echo "   Service Name: ${OTEL_SERVICE_NAME:-'syphon-app'}"
echo "   Service Version: ${OTEL_SERVICE_VERSION:-'0.1.0'}"
echo "   Telemetry Disabled: ${OTEL_SDK_DISABLED:-'false'}"
echo "   OTLP Endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT:-'not configured'}"
echo ""
echo "📊 Available Endpoints:"
echo "   - Jaeger UI: http://localhost:16686"
echo "   - OTLP HTTP: http://localhost:4318/v1/traces"
echo "   - OTLP gRPC: http://localhost:4317"
echo "   - Prometheus: http://localhost:9090 (optional)"
echo ""
echo "🛑 To stop the telemetry stack:"
echo "   docker compose -f docker-compose.production.yml down"
echo ""
echo "🔍 To view logs:"
echo "   docker compose -f docker-compose.production.yml logs -f"