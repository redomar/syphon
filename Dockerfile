# =============================================================================
# SYPHON PRODUCTION DOCKERFILE WITH TELEMETRY SUPPORT
# =============================================================================

FROM node:22-alpine AS base
# Install security updates and required packages
RUN apk update && apk upgrade && apk add --no-cache \
    libc6-compat \
    dumb-init \
    wget \
    curl \
    ca-certificates

# =============================================================================
# DEPENDENCIES STAGE - Install only production dependencies
# =============================================================================
FROM base AS deps
WORKDIR /app

# Copy package files with better caching
COPY package.json package-lock.json* ./

# Install dependencies with npm ci for reproducible builds with optimizations
RUN npm ci --omit=dev --frozen-lockfile --prefer-offline --no-audit --no-fund --progress=false && npm cache clean --force

# =============================================================================
# BUILDER STAGE - Build application with dev dependencies
# =============================================================================
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev) for build with optimizations
RUN npm ci --frozen-lockfile --prefer-offline --no-audit --no-fund --progress=false && npm cache clean --force

# Copy source code
COPY . .

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
ARG NODE_ENV=production
ARG VERSION=0.3.0
ENV NODE_ENV=${NODE_ENV}
ENV VERSION=${VERSION}

# Generate Prisma client and build application in one RUN command to reduce layers
RUN npx prisma generate && \
    rm -rf .next && \
    NODE_ENV=production npm run build && \
    npm cache clean --force && \
    rm -rf ~/.npm && \
    rm -rf .git && \
    find . -name "*.map" -delete

# =============================================================================
# PRODUCTION RUNTIME STAGE
# =============================================================================
FROM base AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Ensure Prisma engine binaries are executable
RUN find /app -name "*query_engine*" -exec chmod +x {} \; || echo "No query engines found to make executable"

# Copy instrumentation file for OpenTelemetry (from src directory)
COPY --from=builder --chown=nextjs:nodejs /app/src/instrumentation.ts ./src/instrumentation.ts


# Create logs directory for telemetry
RUN mkdir -p /app/logs && chown -R nextjs:nodejs /app/logs

# Switch to non-root user
USER nextjs

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Expose application port
EXPOSE 3001

# Use dumb-init for proper signal handling in containers
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]