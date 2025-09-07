# Version Management Strategy

## Single Source of Truth

The project version is managed through a **hierarchical fallback system**:

1. **`package.json`** - Primary source of truth
2. **`VERSION` environment variable** - Runtime override
3. **Hardcoded fallback** - Last resort (0.2.0)

## Implementation

### Code Usage Pattern
```typescript
// Recommended pattern for all version usage:
const version = process.env.VERSION || process.env.npm_package_version || "0.2.0"

// For OpenTelemetry:
const serviceVersion = process.env.OTEL_SERVICE_VERSION || process.env.VERSION || "0.2.0"
```

### Environment Configuration
```bash
# .env / .env.production
VERSION=0.2.0
OTEL_SERVICE_VERSION=0.2.0  # Can be different for telemetry if needed
```

### Files Using Version

**Primary Sources:**
- `package.json` - Main version definition
- `.env` / `.env.production` - Runtime configuration

**Code Files:**
- `src/lib/telemetry.ts` - Tracer initialization
- `instrumentation.ts` - OpenTelemetry setup
- `src/app/api/health/route.ts` - Health check endpoint

**Docker:**
- `docker-compose.yml` - Uses `${VERSION:-0.2.0}` pattern

## Version Update Process

### 1. Update package.json
```bash
npm version patch|minor|major
# or manually edit package.json
```

### 2. Update Environment Files
```bash
# Update .env and .env.production
VERSION=X.Y.Z
OTEL_SERVICE_VERSION=X.Y.Z
```

### 3. Regenerate package-lock.json
```bash
npm install
```

### 4. Git Tagging
```bash
git add .
git commit -m "feat: bump version to X.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

## Automated Version Management (Future)

Consider implementing these automation tools:

### Option 1: npm scripts
```json
{
  "scripts": {
    "version:patch": "npm version patch && npm run version:sync",
    "version:minor": "npm version minor && npm run version:sync", 
    "version:major": "npm version major && npm run version:sync",
    "version:sync": "node scripts/sync-version.js"
  }
}
```

### Option 2: Semantic Release
Automatically determine version based on conventional commits.

### Option 3: Build-time Injection
Inject package.json version at build time to eliminate environment variable dependency.

## Current Status (v0.2.0)

✅ All hardcoded versions removed  
✅ Environment variable fallback implemented  
✅ Documentation updated  
✅ Docker configuration uses environment variables  
✅ Single source of truth established

## Benefits

1. **Consistency** - Single version across all components
2. **Flexibility** - Can override version via environment
3. **Automation Ready** - Easy to integrate with CI/CD
4. **Maintainability** - No scattered hardcoded versions
5. **Docker Friendly** - Environment variable based configuration