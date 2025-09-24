# =============================================================================
# OPTIMIZED SYPHON DOCKERFILE - SPEED FOCUSED (Refined)
# =============================================================================

FROM node:22-alpine AS base
# Minimal packages: Add curl for healthcheck (wget alternative if preferred)
RUN apk add --no-cache libc6-compat dumb-init curl

# =============================================================================
# DEPENDENCIES - Prod-only, optimized caching
# =============================================================================
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Aggressive caching, no dev deps
RUN npm ci --omit=dev --frozen-lockfile --prefer-offline --no-audit --no-fund --progress=false && \
    npm cache clean --force

# =============================================================================
# BUILDER - Single prisma gen, Turbopack, skip validation
# =============================================================================
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile --prefer-offline --no-audit --no-fund --progress=false && \
    npm cache clean --force
# Ensure .dockerignore excludes: node_modules, .next, .git, logs, src (if not needed post-build)
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
# Single RUN: Prisma once, Turbopack for speed, aggressive cleanup
RUN npx prisma generate && \
    npx next build --turbo && \  
    npm cache clean --force && \
    rm -rf ~/.npm && \
    rm -rf .git node_modules .next/cache && \  
    rm -rf src && \  
    find . -name "*.map" -delete