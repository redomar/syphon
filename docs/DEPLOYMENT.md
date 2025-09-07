# Production Deployment Guide for Syphon

This guide covers deploying Syphon to production using Dokploy with Nixpack, including the frontend application and OpenTelemetry observability setup.

## 🏗️ Architecture Overview

### Services
1. **Frontend Application** - Next.js app with authentication and financial tracking
2. **OpenTelemetry Stack** - Jaeger for trace collection and visualization
3. **Database** - PostgreSQL (external/managed service recommended)

## 🚀 Deployment with Dokploy

### Prerequisites
- Dokploy instance running
- PostgreSQL database (managed service like Supabase, PlanetScale, or AWS RDS recommended)
- Domain name configured
- SSL certificate (Dokploy can handle this with Let's Encrypt)

### Step 1: Configure Syphon Application

1. **Fork or clone the repository** to your Git provider (GitHub, GitLab, etc.)

2. **Configure environment variables** in Dokploy:
   ```bash
   # Copy the example environment file
   cp .env.production.example .env.production
   ```

3. **Set up the main application** in Dokploy:
   - **Source**: Your Git repository
   - **Build Pack**: Nixpack (auto-detected via `nixpacks.toml`)
   - **Domain**: Your production domain (e.g., `syphon.yourdomain.com`)

### Step 2: Environment Variables Configuration

Configure these environment variables in your Dokploy application settings:

#### Core Application
```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DATABASE_URL=your_postgresql_connection_string
PORT=3000
HOSTNAME=0.0.0.0
```

#### Authentication (Clerk)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### OpenTelemetry Configuration
```bash
OTEL_SDK_DISABLED=false
OTEL_SERVICE_NAME=syphon-app
OTEL_SERVICE_VERSION=0.2.0
OTEL_RESOURCE_ATTRIBUTES=service.name=syphon-app,service.version=0.2.0
```

**Choose one telemetry option:**

**Option A: Self-hosted Jaeger**
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-jaeger-instance.com:4318/v1/traces
```

**Option B: Honeycomb (Recommended for simplicity)**
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io/v1/traces
OTEL_EXPORTER_OTLP_HEADERS={"x-honeycomb-team":"your-api-key","x-honeycomb-dataset":"syphon-production"}
```

**Option C: DataDog**
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.datadoghq.com/api/v2/otlp/v1/traces
OTEL_EXPORTER_OTLP_HEADERS={"DD-API-KEY":"your-datadog-api-key"}
```

### Step 3: Deploy OpenTelemetry Stack (Optional - for self-hosted Jaeger)

If you choose self-hosted Jaeger, deploy it as a separate service:

1. **Create a new Docker Compose application** in Dokploy
2. **Use the production docker-compose configuration**:
   - Upload `docker-compose.production.yml` and `prometheus.yml`
   - Configure domain (e.g., `jaeger.yourdomain.com`)
   - Deploy the stack

3. **Update your main app's OTEL_EXPORTER_OTLP_ENDPOINT** to point to your Jaeger instance

### Step 4: Database Setup

1. **Create a PostgreSQL database** (recommended services):
   - **Supabase** (includes auth, but we're using Clerk)
   - **PlanetScale** (MySQL-compatible)
   - **AWS RDS** or **Google Cloud SQL**
   - **Railway** or **Render** PostgreSQL

2. **Update DATABASE_URL** with your connection string

3. **Run database migrations** (Dokploy will handle this via the build process):
   ```bash
   npx prisma migrate deploy
   ```

## 🔍 Monitoring and Health Checks

### Health Check Endpoint
The application provides a health check endpoint at `/api/health`:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": "healthy",
  "environment": "production",
  "version": "0.2.0",
  "service": "syphon-app",
  "checks": {
    "database": "healthy",
    "telemetry": "healthy"
  }
}
```

### Dokploy Health Check Configuration
Configure Dokploy to use the health check:
- **Health Check Path**: `/api/health`
- **Port**: `3000`
- **Interval**: `30s`

### Monitoring Dashboards

**If using self-hosted Jaeger:**
- **Jaeger UI**: `https://jaeger.yourdomain.com`
- **Prometheus**: `https://prometheus.yourdomain.com` (optional)

**If using SaaS:**
- **Honeycomb**: https://ui.honeycomb.io
- **DataDog**: https://app.datadoghq.com
- **New Relic**: https://one.newrelic.com

## 🔒 Security Considerations

### Environment Variables
- Never commit secrets to your repository
- Use Dokploy's environment variable encryption
- Rotate API keys regularly

### Database Security
- Use connection pooling
- Enable SSL/TLS connections
- Restrict database access to your application IPs only

### Application Security
- HTTPS only (configured via Dokploy)
- Proper CORS configuration
- Rate limiting (consider adding if needed)

## 🚨 Troubleshooting

### Build Issues
1. **Prisma generation fails**: Ensure DATABASE_URL is set during build
2. **Out of memory**: Increase Docker container memory in Dokploy
3. **Missing dependencies**: Check `package.json` and run `npm ci` locally

### Runtime Issues
1. **Database connection**: Check DATABASE_URL and network connectivity
2. **Authentication fails**: Verify Clerk configuration and domain settings
3. **Telemetry not working**: Check OTLP endpoint and headers configuration

### Health Check Failures
```bash
# Check health endpoint manually
curl https://your-domain.com/api/health

# Check logs in Dokploy dashboard
# Look for database connection errors or telemetry issues
```

## 📊 Performance Optimization

### Next.js Configuration
- Static generation for public pages
- Image optimization enabled
- Compression enabled
- Bundle analysis

### Database Optimization
- Connection pooling (Prisma handles this)
- Query optimization
- Proper indexing (already configured in schema)

### Monitoring Performance
Use OpenTelemetry to monitor:
- API response times
- Database query performance
- Authentication flow timing
- Error rates and patterns

## 🔄 CI/CD Integration

### Automated Deployments
1. **Connect your Git repository** to Dokploy
2. **Configure auto-deployment** on push to main branch
3. **Set up staging environment** for testing

### Pre-deployment Checks
```bash
# Lint check
npm run lint

# Type check
npx tsc --noEmit

# Build test
npm run build
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Configure multiple instances in Dokploy
- Use external session storage if needed
- Database connection pooling

### Caching
- Consider adding Redis for session caching
- Static asset caching via CDN
- API response caching where appropriate

## 🆘 Support

### Logs and Debugging
- **Application Logs**: Available in Dokploy dashboard
- **OpenTelemetry Traces**: Available in your chosen observability platform
- **Database Logs**: Check your database provider's dashboard

### Performance Monitoring
- Monitor the `/api/health` endpoint
- Set up alerts for failed health checks
- Monitor OpenTelemetry dashboards for performance issues

---

**Next Steps**: After deployment, visit your application and verify all functionality works correctly. Check the health endpoint and OpenTelemetry dashboard to ensure monitoring is working.