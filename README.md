# Syphon

A Next.js application with OpenTelemetry tracing, authentication, and microservice-based deployment architecture.

## Quick Start

### Development

1. **Start services:**
   ```bash
   docker-compose -f deployment/docker-compose.dev.yml up -d
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values (see .env.d.ts for examples)
   ```

3. **Run the application:**
   ```bash
   npm install
   npm run dev
   ```

4. **Access services:**
   - App: http://localhost:3000
   - Jaeger UI: http://localhost:16686
   - Database: localhost:5432

### Production

```bash
# Configure production environment
cp .env .env.production

# Deploy all services  
docker-compose up -d
```

## Project Structure

- **`src/`** - Application source code
- **`docs/`** - Documentation files
- **`deployment/`** - Docker and deployment configurations
- **`.env.d.ts`** - Environment variable definitions and examples
- **`docker-compose.yml`** - Production microservice deployment
- **`deployment/docker-compose.dev.yml`** - Development services

## Environment Configuration

All environment variable examples and TypeScript definitions are in `.env.d.ts`. Copy values to your `.env` file.

## Deployment

The application uses a microservice architecture with:

- **App Service** - Next.js application (Port 3000)
- **Database Service** - PostgreSQL (Port 5432)  
- **Jaeger Service** - Distributed tracing (Port 16686)
- **Prometheus Service** - Metrics collection (Port 9090, optional)

See `deployment/README.md` for detailed deployment instructions.

## Technologies

- **Framework:** Next.js 15
- **Database:** PostgreSQL + Prisma  
- **Authentication:** Clerk
- **Observability:** OpenTelemetry + Jaeger
- **Deployment:** Docker Compose
