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

# Wait for services to start
echo "⏳ Waiting for services to become healthy..."
sleep 10

# Health check for Jaeger
if curl -s http://localhost:16686/api/services > /dev/null; then
    echo "✅ Jaeger UI is running at: http://localhost:16686"
else
    echo "⚠️  Jaeger might still be starting up..."
fi

# Health check for OTLP endpoint
if curl -s http://localhost:4318/v1/traces > /dev/null 2>&1; then
    echo "✅ OTLP HTTP endpoint is ready at: http://localhost:4318"
else
    echo "⚠️  OTLP endpoint might still be starting up..."
fi

# Check Prometheus (if enabled)
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo "✅ Prometheus is running at: http://localhost:9090"
else
    echo "ℹ️  Prometheus is not accessible (this is optional)"
fi

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