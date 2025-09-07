#!/bin/bash

# Syphon Telemetry Development Setup
echo "🚀 Starting Syphon Telemetry Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start Jaeger
echo "📊 Starting Jaeger All-in-One..."
docker-compose -f docker-compose.telemetry.yml up -d

# Wait a moment for services to start
sleep 3

# Check if services are healthy
if curl -s http://localhost:16686 > /dev/null; then
    echo "✅ Jaeger UI is running at: http://localhost:16686"
else
    echo "⚠️  Jaeger might still be starting up..."
fi

if curl -s http://localhost:4318/v1/traces > /dev/null; then
    echo "✅ OTLP HTTP endpoint is ready at: http://localhost:4318"
else
    echo "⚠️  OTLP endpoint might still be starting up..."
fi

echo ""
echo "🔧 To use Jaeger with your app:"
echo "1. Copy .env.jaeger to .env.local (or merge with your existing .env)"
echo "2. Restart your Next.js dev server: npm run dev"
echo "3. Use your app (sign in, navigate around)"
echo "4. View traces at: http://localhost:16686"
echo ""
echo "🛑 To stop the telemetry stack:"
echo "   docker-compose -f docker-compose.telemetry.yml down"
