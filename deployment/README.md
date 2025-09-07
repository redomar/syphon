# Syphon Deployment

This directory contains deployment configurations for Syphon using a microservice architecture.

## Architecture

The application is deployed as microservices using Docker Compose:

- **app**: Main Next.js application
- **database**: PostgreSQL database
- **jaeger**: Distributed tracing service  
- **prometheus**: Metrics collection (optional)

## Quick Start

### Development
```bash
# Start development services (database + telemetry)
docker-compose -f deployment/docker-compose.dev.yml up -d

# Run the app locally
npm run dev
```

### Production
```bash
# Copy and configure environment
cp .env .env.production

# Start all services
docker-compose up -d

# Or build and start
docker-compose up --build -d
```

### Legacy Scripts (Deprecated)
The old deployment scripts are preserved in this directory but deprecated:
- `start-telemetry.sh` → Use `docker-compose -f deployment/docker-compose.dev.yml up -d`  
- `start-telemetry-production.sh` → Use `docker-compose up -d`
- `docker-compose.telemetry.yml` → Merged into main docker-compose.yml
- `docker-compose.production.yml` → Replaced by main docker-compose.yml

## Environment Configuration

All environment variable examples are now in `.env.d.ts` with TypeScript definitions.

## Services

### Application (app)
- **Port**: 3000
- **Health Check**: `/api/health`
- **Dependencies**: database, jaeger

### Database (database)  
- **Port**: 5432
- **Image**: postgres:16-alpine
- **Volumes**: Persistent storage

### Jaeger (jaeger)
- **UI Port**: 16686
- **OTLP HTTP**: 4318
- **OTLP gRPC**: 4317

### Prometheus (prometheus) - Optional
- **Port**: 9090
- **Config**: `deployment/prometheus.yml`