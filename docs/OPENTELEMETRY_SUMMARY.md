# OpenTelemetry Implementation Summary

## Overview

We've successfully integrated OpenTelemetry into your Syphon financial management application to replace traditional console.log statements with structured, production-ready telemetry. This provides comprehensive observability into your authentication flow, database operations, and API endpoints.

## What is OpenTelemetry?

OpenTelemetry is an open-source observability framework that provides:

- **Tracing**: Track requests across your application
- **Metrics**: Performance and business metrics
- **Logging**: Structured log data
- **Correlation**: Connect related operations across services

Instead of scattered `console.log` statements, you get structured data that can be searched, filtered, and analyzed.

## Files We Created/Modified

### 1. Core Telemetry Setup

#### `/instrumentation.ts` (Root level)

```typescript
// Next.js instrumentation hook - automatically loads OpenTelemetry
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node')

    const sdk = new NodeSDK({
      instrumentations: [getNodeAutoInstrumentations({...})],
    })

    sdk.start()
  }
}
```

**Purpose**: Automatically instruments your Next.js app when it starts

#### `/src/lib/telemetry.ts`

```typescript
import { trace } from "@opentelemetry/api";
export const tracer = trace.getTracer("syphon-app", process.env.OTEL_SERVICE_VERSION || process.env.VERSION || "0.2.0");
```

**Purpose**: Provides the tracer instance used throughout your application

### 2. Enhanced Authentication with Telemetry

#### `/src/lib/auth.ts` - Before vs After

**Before (Console Logging)**:

```typescript
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    let dbUser = await db.user.findUnique({ where: { id: userId } });

    if (!dbUser) {
      // Create user logic...
      console.log(`Created new user in database: ${userId}`);
    }

    return dbUser;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
```

**After (OpenTelemetry)**:

```typescript
export async function getCurrentUser(): Promise<User | null> {
  return tracer.startActiveSpan('auth.getCurrentUser', async (span) => {
    try {
      const { userId } = await auth();

      if (!userId) {
        span.setAttributes({ 'auth.result': 'unauthenticated' });
        span.end();
        return null;
      }

      span.setAttributes({ 'auth.userId': userId });

      // Database lookup with nested span
      let dbUser = await tracer.startActiveSpan('db.user.findUnique', async (dbSpan) => {
        const user = await db.user.findUnique({ where: { id: userId } });
        dbSpan.setAttributes({
          'db.operation': 'findUnique',
          'db.table': 'user',
          'db.result': user ? 'found' : 'not_found',
        });
        dbSpan.end();
        return user;
      });

      // User creation with telemetry
      if (!dbUser) {
        span.addEvent('user.lazy_creation_started');

        dbUser = await tracer.startActiveSpan('db.user.create', async (createSpan) => {
          const newUser = await db.user.create({...});
          createSpan.setAttributes({
            'db.operation': 'create',
            'user.email': newUser.email || 'unknown',
          });
          createSpan.addEvent('user.created_successfully');
          createSpan.end();
          return newUser;
        });
      }

      span.setAttributes({ 'auth.result': 'success' });
      span.end();
      return dbUser;
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        'auth.result': 'error',
        'error.message': (error as Error).message,
      });
      span.end();
      return null;
    }
  });
}
```

**Key Improvements**:

- **Structured attributes** instead of string logs
- **Nested spans** to show operation hierarchy
- **Events** to mark important moments
- **Exception recording** with full context
- **Timing** automatically captured

### 3. API Route Telemetry

#### `/src/app/api/me/route.ts` - Enhanced

```typescript
export async function GET() {
  return tracer.startActiveSpan('api.me.GET', async (span) => {
    try {
      span.setAttributes({
        'http.method': 'GET',
        'http.route': '/api/me',
      });

      const user = await getCurrentUser();

      if (!user) {
        span.setAttributes({
          'http.status_code': 401,
          'auth.result': 'unauthorized',
        });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      span.setAttributes({
        'http.status_code': 200,
        'user.id': user.id,
      });

      return NextResponse.json({...});
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({ 'http.status_code': 500 });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
```

### 4. Environment Configuration

#### `/Users/Mohamed/Workspace/personal/syphon/.env`

```bash
# OpenTelemetry Configuration
OTEL_SDK_DISABLED=false
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_SERVICE_NAME=syphon-app
OTEL_SERVICE_VERSION=0.2.0
```

### 5. Development Tools

#### `docker-compose.telemetry.yml`

```yaml
# Jaeger All-in-One for local development
services:
  jaeger-all-in-one:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686" # Jaeger UI
      - "4317:4317" # OTLP gRPC receiver
      - "4318:4318" # OTLP HTTP receiver
```

#### `start-telemetry.sh`

```bash
# Script to start Jaeger for development
docker-compose -f docker-compose.telemetry.yml up -d
```

## What Telemetry Data We Capture

### 1. Authentication Operations

| Span Name               | Attributes                   | Events                       |
| ----------------------- | ---------------------------- | ---------------------------- |
| `auth.getCurrentUser`   | `auth.result`, `auth.userId` | `user.lazy_creation_started` |
| `auth.requireAuth`      | `auth.result`, `user.id`     | -                            |
| `auth.getCurrentUserId` | `auth.result`                | -                            |

### 2. Database Operations

| Span Name            | Attributes                                    | Events                      |
| -------------------- | --------------------------------------------- | --------------------------- |
| `db.user.findUnique` | `db.operation`, `db.table`, `db.result`       | -                           |
| `db.user.create`     | `db.operation`, `user.email`, `user.currency` | `user.created_successfully` |

### 3. HTTP Requests

| Span Name    | Attributes                                      | Events                |
| ------------ | ----------------------------------------------- | --------------------- |
| `api.me.GET` | `http.method`, `http.route`, `http.status_code` | `user.data_retrieved` |

### 4. Error Tracking

- **Exception recording**: Full stack traces with context
- **Error attributes**: Error messages and types
- **Span status**: Success/failure indication

## Benefits Over Console Logging

### Before (Console Logs)

```
Created new user in database: user_123
Error getting current user: Database connection failed
GET /api/me 401
```

### After (OpenTelemetry)

```json
{
  "traceId": "abc123...",
  "spanId": "def456...",
  "operationName": "auth.getCurrentUser",
  "duration": 45,
  "attributes": {
    "auth.userId": "user_123",
    "auth.result": "success",
    "user.exists_in_db": true
  },
  "events": [
    {
      "timestamp": "2025-08-27T10:30:00Z",
      "name": "user.lazy_creation_started"
    }
  ],
  "spans": [
    {
      "operationName": "db.user.findUnique",
      "duration": 12,
      "attributes": {
        "db.operation": "findUnique",
        "db.table": "user",
        "db.result": "not_found"
      }
    },
    {
      "operationName": "db.user.create",
      "duration": 25,
      "attributes": {
        "db.operation": "create",
        "user.email": "user@example.com"
      }
    }
  ]
}
```

### Key Advantages

1. **Structured Data**: Machine-readable, searchable
2. **Request Correlation**: Follow a request through all operations
3. **Performance Insights**: Built-in timing and metrics
4. **Error Context**: Full context when things go wrong
5. **Production Ready**: No log parsing needed
6. **Alerting**: Set up alerts based on error rates or performance

## How to View Your Telemetry

### Development Setup

#### Option 1: Console Output

- Telemetry appears in your `npm run dev` terminal
- Shows basic operation timing and results

#### Option 2: Jaeger UI (Recommended)

1. **Start Jaeger**: `./start-telemetry.sh`
2. **Open UI**: http://localhost:16686
3. **Use your app**: Sign in, navigate around
4. **Search traces**: Service: `syphon-app`, click "Find Traces"
5. **Explore**: Click any trace to see the full operation hierarchy

### Production Options

- **Jaeger** (Self-hosted, open source)
- **Honeycomb** (SaaS, great for debugging)
- **DataDog** (Full observability platform)
- **New Relic** (APM with distributed tracing)

## Usage Patterns

### Adding Telemetry to New Functions

```typescript
export async function myBusinessFunction(userId: string) {
  return tracer.startActiveSpan("business.myFunction", async (span) => {
    span.setAttributes({
      "user.id": userId,
      "operation.type": "business_logic",
    });

    try {
      const result = await someOperation();
      span.addEvent("operation.completed");
      span.setAttributes({ "operation.result": "success" });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({ "operation.result": "error" });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### Using the Wrapper Utility

```typescript
import { withTelemetry } from "@/lib/telemetry-examples";

const trackedFunction = withTelemetry("my.operation", async (param: string) => {
  return await someAsyncOperation(param);
});
```

## NPM Packages Installed

```json
{
  "@opentelemetry/api": "^1.x.x",
  "@opentelemetry/sdk-node": "^0.x.x",
  "@opentelemetry/auto-instrumentations-node": "^0.x.x",
  "@opentelemetry/exporter-trace-otlp-http": "^0.x.x",
  "@opentelemetry/resources": "^2.x.x",
  "@opentelemetry/sdk-trace-base": "^2.x.x"
}
```

## Configuration Options

### Disable Telemetry

```bash
OTEL_SDK_DISABLED=true
```

### Console Only (No External Service)

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=  # Leave empty
```

### External Service (Production)

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io/v1/traces
OTEL_EXPORTER_OTLP_HEADERS={"x-honeycomb-team":"your-api-key"}
```

## Summary

We've transformed your application from basic console logging to enterprise-grade observability:

1. **Replaced** `console.log` with structured telemetry
2. **Added** comprehensive tracing to authentication flow
3. **Instrumented** database operations with timing and context
4. **Enhanced** API routes with HTTP-specific telemetry
5. **Set up** local development with Jaeger UI
6. **Prepared** for production observability services

Your application now provides rich insights into:

- User authentication and creation patterns
- Database performance and query patterns
- API response times and error rates
- Request flow and operation hierarchy
- Error context and debugging information

This foundation will scale with your application and provide invaluable insights as you grow!

## Troubleshooting: Jaeger Connection Issues

### The Problem We Encountered

**Symptom**: Traces were visible in the console but not appearing in Jaeger UI, even though:

- OpenTelemetry was properly initialized
- Jaeger was running on `http://localhost:16686`
- Environment variables were set correctly
- Custom spans like `auth.getCurrentUser` were being generated

**Root Cause**: The instrumentation was using `ConsoleSpanExporter` instead of `OTLPTraceExporter`, meaning traces were only logged to console and never sent to Jaeger.

### The Fix Explained

#### Before (Console Only)

```typescript
// OLD instrumentation.ts - WRONG
const { ConsoleSpanExporter } = await import("@opentelemetry/sdk-trace-base");

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(), // ❌ Only logs to console
  instrumentations: [getNodeAutoInstrumentations()],
});
```

**Result**: Traces appeared in terminal but never reached Jaeger.

#### After (OTLP Export)

```typescript
// FIXED instrumentation.ts - CORRECT
const { OTLPTraceExporter } = await import(
  "@opentelemetry/exporter-trace-otlp-http"
);

// Choose exporter based on configuration
const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  ? new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT, // ✅ Sends to Jaeger
    })
  : undefined; // ✅ Falls back to default behavior

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});
```

**Result**: Traces are sent to Jaeger via OTLP HTTP protocol.

### Key Changes Made

1. **Added OTLP Exporter Import**:

   ```typescript
   const { OTLPTraceExporter } = await import(
     "@opentelemetry/exporter-trace-otlp-http"
   );
   ```

2. **Environment-Based Exporter Selection**:

   ```typescript
   const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
     ? new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT })
     : undefined;
   ```

3. **Clear Logging**:
   ```typescript
   if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
     console.log(
       `📊 OpenTelemetry started - Sending traces to: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`
     );
   } else {
     console.log("🔍 OpenTelemetry started - Console tracing only");
   }
   ```

### How to Verify the Fix

1. **Check the startup message**:

   ```
   📊 OpenTelemetry started - Sending traces to: http://localhost:4318/v1/traces
   ```

   If you see "Console tracing only", the OTLP endpoint isn't configured.

2. **Test the connection**:

   ```bash
   # Visit your app to generate traces
   curl http://localhost:3001/dashboard

   # Check Jaeger UI
   open http://localhost:16686
   ```

3. **Verify environment variables**:
   ```bash
   grep OTEL .env
   # Should show:
   # OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
   ```

### Common Issues and Solutions

#### Issue 1: "No traces in Jaeger UI"

**Solution**: Check that `OTEL_EXPORTER_OTLP_ENDPOINT` is set in your `.env` file:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

#### Issue 2: "Console tracing only" message

**Solution**: Verify your `.env` file is being loaded by Next.js. Restart your dev server after changing environment variables.

#### Issue 3: "Connection refused to localhost:4318"

**Solution**: Ensure Jaeger is running:

```bash
./start-telemetry.sh
# Should show: ✅ OTLP HTTP endpoint is ready at: http://localhost:4318
```

#### Issue 4: "Traces in console but not Jaeger"

**Solution**: This was our exact issue. The exporter was set to console instead of OTLP. Use the fixed `instrumentation.ts` above.

### Development Workflow

1. **Start Jaeger**: `./start-telemetry.sh`
2. **Verify environment**: Check `.env` has `OTEL_EXPORTER_OTLP_ENDPOINT`
3. **Start app**: `npm run dev`
4. **Look for**: "📊 OpenTelemetry started - Sending traces to: http://localhost:4318/v1/traces"
5. **Generate traces**: Visit your app, sign in, navigate around
6. **View traces**: http://localhost:16686, search for service `syphon-app`

### Advanced Configuration

#### Multiple Exporters (Console + Jaeger)

```typescript
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";

// Send to both console and Jaeger
const processors = [
  new BatchSpanProcessor(new ConsoleSpanExporter()),
  new BatchSpanProcessor(
    new OTLPTraceExporter({ url: "http://localhost:4318/v1/traces" })
  ),
];
```

#### Production Configuration

```bash
# Production .env
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io/v1/traces
OTEL_EXPORTER_OTLP_HEADERS={"x-honeycomb-team":"your-api-key"}
```

This troubleshooting section documents the exact issue we encountered and how to avoid it in the future!
