# OpenTelemetry Integration

This project uses OpenTelemetry for comprehensive observability, replacing traditional console.log statements with structured telemetry data.

## What's Being Monitored

### Authentication Flow

- `auth.getCurrentUser` - User retrieval and lazy creation
- `auth.requireAuth` - Authentication validation
- `auth.getCurrentUserId` - User ID extraction

### Database Operations

- `db.user.findUnique` - User lookup operations
- `db.user.create` - New user creation (lazy loading)

### API Endpoints

- `api.me.GET` - User profile endpoint
- HTTP status codes, response times, and error tracking

## Development Setup

### Basic Configuration (Console Output)

```bash
# In your .env file
OTEL_SDK_DISABLED=false
```

This will output traces to the console in a structured format during development.

### Production Setup (External Service)

For production, configure an OTLP endpoint:

```bash
# Example for Jaeger
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Example for Honeycomb
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io/v1/traces
OTEL_EXPORTER_OTLP_HEADERS={"x-honeycomb-team":"your-api-key"}

# Example for DataDog
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.datadoghq.com/api/v2/otlp/v1/traces
OTEL_EXPORTER_OTLP_HEADERS={"DD-API-KEY":"your-api-key"}
```

## Key Features

### Span Attributes

- `auth.result`: success/unauthorized/error
- `user.id`: User identifier
- `db.operation`: Database operation type
- `http.status_code`: Response status
- `error.message`: Error details

### Events

- `user.lazy_creation_started`
- `user.created_successfully`
- `user.data_retrieved`

### Error Tracking

All exceptions are automatically recorded with full stack traces and context.

## Benefits Over Console Logging

1. **Structured Data**: Machine-readable format
2. **Correlation**: Trace requests across services
3. **Performance**: Built-in timing and performance metrics
4. **Production Ready**: No log parsing needed
5. **Searchable**: Query by attributes and time ranges
6. **Alerting**: Set up alerts based on error rates or performance

## Usage Examples

### Adding Telemetry to New Functions

```typescript
import { tracer } from "@/lib/telemetry";

export async function myFunction(userId: string) {
  return tracer.startActiveSpan("business.myFunction", async (span) => {
    span.setAttributes({
      "user.id": userId,
      "operation.type": "business_logic",
    });

    try {
      // Your business logic here
      const result = await someOperation();

      span.addEvent("operation.completed");
      span.setAttributes({
        "operation.result": "success",
      });

      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        "operation.result": "error",
      });
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

const trackedFunction = withTelemetry(
  "my.operation",
  async (param1: string) => {
    // Your function logic
    return await someAsyncOperation(param1);
  }
);
```

## Viewing Traces

### Development (Console)

Traces appear in your Next.js console with structured output showing:

- Trace ID
- Span hierarchy
- Timing information
- Attributes and events

### Production Services

Popular observability platforms that work with OpenTelemetry:

- **Jaeger** (Open source, self-hosted)
- **Honeycomb** (SaaS, excellent for complex debugging)
- **DataDog** (Full observability platform)
- **New Relic** (APM with distributed tracing)
- **Grafana Tempo** (Open source, works with Grafana)

## Disabling Telemetry

To completely disable OpenTelemetry:

```bash
OTEL_SDK_DISABLED=true
```

This is useful for testing or if you want to revert to simple console logging temporarily.
