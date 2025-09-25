# Optimized Next.js Dockerfile for fast builds and reliable Prisma downloads
FROM node:22-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json package-lock.json* ./

# Configure npm for reliability and install production dependencies
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set maxsockets 3 && \
    npm ci --only=production --frozen-lockfile && \
    npm cache clean --force

# Build stage with enhanced Prisma handling
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./

# Configure npm and Prisma for better reliability
ENV PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set maxsockets 3 && \
    npm ci --frozen-lockfile

COPY . .

# Build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1

# Generate Prisma client with retries and build
RUN for i in 1 2 3; do \
        echo "Attempt $i: Generating Prisma client..." && \
        npx prisma generate && break || \
        (echo "Attempt $i failed, retrying in 15s..." && sleep 15); \
    done && \
    npm run build

# Production runtime
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]