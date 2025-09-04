import {
  auth,
  clerkClient,
  currentUser,
  type User as ClerkUser,
} from "@clerk/nextjs/server";
import { db } from "./db";
import { tracer } from "./telemetry";
import type { User, CurrencyCode } from "../../generated/prisma";
import { Span } from "@opentelemetry/api";

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Performance thresholds for monitoring and alerting
 */
const PERFORMANCE_THRESHOLDS = {
  DB_QUERY_SLOW_MS: 200,
  CLERK_API_SLOW_MS: 300,
  TOTAL_AUTH_SLOW_MS: 1000,
  METADATA_UPDATE_SLOW_MS: 100,
} as const;

/**
 * Default values for user creation
 */
const DEFAULTS = {
  COUNTRY_CODE: "GB",
  CURRENCY: "GBP" as CurrencyCode,
  TIMEZONE: "Europe/London",
} as const;

/**
 * Currency mapping for different countries/regions
 */
const CURRENCY_MAP: Record<string, CurrencyCode> = {
  US: "USD",
  GB: "GBP",
  EU: "EUR",
  CA: "CAD",
  AU: "AUD",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  /**  Future expansion
   *  JP: "JPY",
   *  IN: "INR",
   *  BR: "BRL",
   *  MX: "MXN",
   */
} as const;

// ============================================================================
// TELEMETRY HELPER FUNCTIONS
// ============================================================================

/**
 * Extract comprehensive telemetry attributes from Clerk user object
 * Used for monitoring user authentication patterns and security
 */
function getClerkUserTelemetryAttributes(clerkUser: ClerkUser) {
  const now = Date.now();
  const createdAt = clerkUser.createdAt
    ? new Date(clerkUser.createdAt).getTime()
    : now;
  const lastSignInAt = clerkUser.lastSignInAt
    ? new Date(clerkUser.lastSignInAt).getTime()
    : null;

  // Calculate user lifecycle metrics
  const accountAgeMs = now - createdAt;
  const daysSinceCreation = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));
  const daysSinceLastSignIn = lastSignInAt
    ? Math.floor((now - lastSignInAt) / (1000 * 60 * 60 * 24))
    : null;

  return {
    // Core user identification
    "clerk.user.id": clerkUser.id,
    "clerk.user.primary_email":
      clerkUser.emailAddresses?.[0]?.emailAddress || "unknown",

    // User profile completeness (affects onboarding UX)
    "clerk.user.email_count": clerkUser.emailAddresses?.length || 0,
    "clerk.user.has_first_name": !!clerkUser.firstName,
    "clerk.user.has_last_name": !!clerkUser.lastName,
    "clerk.user.profile_completeness_score":
      calculateProfileCompleteness(clerkUser),

    // Temporal patterns (for user lifecycle analysis)
    "clerk.user.created_at": clerkUser.createdAt
      ? new Date(clerkUser.createdAt).toISOString()
      : "unknown",
    "clerk.user.last_sign_in_at": lastSignInAt
      ? new Date(lastSignInAt).toISOString()
      : "never",
    "clerk.user.account_age_days": daysSinceCreation,
    "clerk.user.days_since_last_sign_in": daysSinceLastSignIn,
    "clerk.user.lifecycle_stage": getUserLifecycleStage(
      daysSinceCreation,
      daysSinceLastSignIn
    ),

    // Security & compliance indicators
    "clerk.user.email_verified":
      clerkUser.emailAddresses?.[0]?.verification?.status === "verified",
    "clerk.user.has_private_metadata":
      !!clerkUser.privateMetadata &&
      Object.keys(clerkUser.privateMetadata).length > 0,
    "clerk.user.has_public_metadata":
      !!clerkUser.publicMetadata &&
      Object.keys(clerkUser.publicMetadata).length > 0,
    "clerk.user.metadata_completeness": getMetadataCompleteness(clerkUser),

    // Behavioral patterns (for product analytics)
    "clerk.user.is_first_time": !lastSignInAt,
    "clerk.user.is_returning_recent":
      daysSinceLastSignIn !== null && daysSinceLastSignIn <= 7,
    "clerk.user.is_dormant":
      daysSinceLastSignIn !== null && daysSinceLastSignIn > 30,
  };
}

/**
 * Calculate user profile completeness score (0-100)
 * Used for onboarding optimization and user experience metrics
 */
function calculateProfileCompleteness(clerkUser: ClerkUser): number {
  let score = 0;
  const maxScore = 100;

  // Email verification (30 points)
  if (clerkUser.emailAddresses?.[0]?.verification?.status === "verified")
    score += 30;

  // Basic profile info (40 points total)
  if (clerkUser.firstName) score += 20;
  if (clerkUser.lastName) score += 20;

  // Metadata presence (30 points total)
  if (
    clerkUser.privateMetadata &&
    Object.keys(clerkUser.privateMetadata).length > 0
  )
    score += 15;
  if (
    clerkUser.publicMetadata &&
    Object.keys(clerkUser.publicMetadata).length > 0
  )
    score += 15;

  return Math.min(score, maxScore);
}

/**
 * Determine user lifecycle stage for product analytics
 */
function getUserLifecycleStage(
  accountAgeDays: number,
  daysSinceLastSignIn: number | null
): string {
  if (daysSinceLastSignIn === null) return "first_time";
  if (accountAgeDays <= 7) return "new_user";
  if (daysSinceLastSignIn <= 1) return "active_daily";
  if (daysSinceLastSignIn <= 7) return "active_weekly";
  if (daysSinceLastSignIn <= 30) return "active_monthly";
  if (daysSinceLastSignIn <= 90) return "dormant";
  return "churned";
}

/**
 * Calculate metadata completeness for compliance tracking
 */
function getMetadataCompleteness(clerkUser: ClerkUser): string {
  const hasPrivate =
    clerkUser.privateMetadata &&
    Object.keys(clerkUser.privateMetadata).length > 0;
  const hasPublic =
    clerkUser.publicMetadata &&
    Object.keys(clerkUser.publicMetadata).length > 0;

  if (hasPrivate && hasPublic) return "complete";
  if (hasPrivate || hasPublic) return "partial";
  return "empty";
}

/**
 * Add performance classification attributes to spans
 */
function addPerformanceAttributes(
  span: Span,
  operationType: string,
  durationMs: number
) {
  const thresholds = PERFORMANCE_THRESHOLDS;
  let classification = "fast";
  let threshold = 0;

  switch (operationType) {
    case "db_query":
      threshold = thresholds.DB_QUERY_SLOW_MS;
      break;
    case "clerk_api":
      threshold = thresholds.CLERK_API_SLOW_MS;
      break;
    case "auth_total":
      threshold = thresholds.TOTAL_AUTH_SLOW_MS;
      break;
    case "metadata_update":
      threshold = thresholds.METADATA_UPDATE_SLOW_MS;
      break;
  }

  if (durationMs > threshold * 2) classification = "very_slow";
  else if (durationMs > threshold) classification = "slow";

  span.setAttributes({
    [`performance.${operationType}.duration_ms`]: durationMs,
    [`performance.${operationType}.classification`]: classification,
    [`performance.${operationType}.threshold_ms`]: threshold,
    [`performance.${operationType}.exceeds_threshold`]: durationMs > threshold,
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determine currency code from country code with fallback logic
 * Supports regional preferences and business requirements
 */
function getCurrencyFromLocale(countryCode?: string): CurrencyCode {
  if (!countryCode) return DEFAULTS.CURRENCY;

  const currency = CURRENCY_MAP[countryCode.toUpperCase()];
  return currency || DEFAULTS.CURRENCY;
}

/**
 * Get user's country code from browser locale with robust fallback
 * Used for localization and regional compliance
 */
function getLocationCountryCode(): string {
  try {
    const { locale } = Intl.DateTimeFormat().resolvedOptions();
    const countryCode = locale?.split("-")[1]?.toUpperCase();
    return countryCode || DEFAULTS.COUNTRY_CODE;
  } catch (error) {
    console.warn("Failed to detect user location from locale:", error);
    return DEFAULTS.COUNTRY_CODE;
  }
}

/**
 * Get user's timezone with fallback handling
 * Critical for scheduling and time-sensitive features
 */
function getTimezoneFromLocale(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || DEFAULTS.TIMEZONE;
  } catch (error) {
    console.warn("Failed to detect user timezone:", error);
    return DEFAULTS.TIMEZONE;
  }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Find user in database with comprehensive telemetry
 * Tracks query performance and data patterns
 */
async function findUserInDatabase(userId: string): Promise<User | null> {
  return tracer.startActiveSpan("db.user.findUnique", async (span) => {
    const startTime = Date.now();

    try {
      span.setAttributes({
        "db.operation": "findUnique",
        "db.table": "user",
        "db.query.type": "point_lookup",
        "user.id": userId,
      });

      const user = await db.user.findUnique({
        where: { id: userId },
      });

      const duration = Date.now() - startTime;
      const found = !!user;

      span.setAttributes({
        "db.result": found ? "found" : "not_found",
        "db.query.cache_hit": false, // Set to true if using query cache
        "user.exists_in_db": found,
      });

      addPerformanceAttributes(span, "db_query", duration);

      if (found && user) {
        span.setAttributes({
          "user.currency": user.currency,
          "user.timezone": user.timezone || "unknown",
          "user.has_email": !!user.email,
          "user.profile_updated_at": user.updatedAt?.toISOString() || "unknown",
        });

        span.addEvent("user.found_in_database", {
          "user.id": userId,
          "user.email": user.email || "redacted",
          "query.duration_ms": duration,
        });
      } else {
        span.addEvent("user.not_found_in_database", {
          "user.id": userId,
          "trigger.lazy_creation": true,
        });
      }

      return user;
    } catch (error) {
      const duration = Date.now() - startTime;

      span.recordException(error as Error);
      span.setAttributes({
        "db.result": "error",
        "error.type": "database_error",
        "error.message": (error as Error).message,
      });

      addPerformanceAttributes(span, "db_query", duration);

      span.addEvent("database.query_failed", {
        "error.message": (error as Error).message,
        "query.duration_ms": duration,
      });

      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Create new user in database with comprehensive tracking
 * Critical for user acquisition metrics and onboarding analytics
 */
async function createUserInDatabase(
  userId: string,
  clerkUser: ClerkUser,
  currency: CurrencyCode,
  timezone: string
): Promise<User> {
  return tracer.startActiveSpan("db.user.create", async (span) => {
    const startTime = Date.now();
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    try {
      span.setAttributes({
        "db.operation": "create",
        "db.table": "user",
        "user.source": "clerk_lazy_creation",
        "user.creation.trigger": "first_app_access",
        "user.onboarding.stage": "initial_creation",

        // User data quality metrics
        "user.has_email": !!userEmail,
        "user.has_first_name": !!clerkUser.firstName,
        "user.has_last_name": !!clerkUser.lastName,
        "user.email_verified":
          clerkUser.emailAddresses[0]?.verification?.status === "verified",

        // Localization data
        "user.currency": currency,
        "user.timezone": timezone,
        "user.locale.detected_country": getLocationCountryCode(),

        // Business metrics
        "user.acquisition.channel": "organic", // Could be enhanced with UTM tracking
        "user.profile_completeness": calculateProfileCompleteness(clerkUser),

        // Operational metrics
        "clerk.user.email_addresses_count": clerkUser.emailAddresses.length,
        "clerk.user.account_age_seconds": clerkUser.createdAt
          ? Math.floor(
              (Date.now() - new Date(clerkUser.createdAt).getTime()) / 1000
            )
          : 0,
      });

      const newUser = await db.user.create({
        data: {
          id: userId,
          email: userEmail,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          currency,
          timezone,
        },
      });

      const duration = Date.now() - startTime;

      span.setAttributes({
        "user.creation.success": true,
        "user.email": userEmail || "no_email",
        "user.creation.timestamp": new Date().toISOString(),
        "database.write.latency_acceptable":
          duration < PERFORMANCE_THRESHOLDS.DB_QUERY_SLOW_MS,
      });

      addPerformanceAttributes(span, "db_query", duration);

      span.addEvent("user.created_successfully", {
        "user.id": userId,
        "user.email": userEmail || "no_email",
        "user.currency": currency,
        "user.timezone": timezone,
        "creation.duration_ms": duration,
        "business.new_user_acquired": true,
      });

      // Additional business analytics event
      span.addEvent("business.user_acquisition", {
        "acquisition.method": "lazy_creation",
        "acquisition.timestamp": new Date().toISOString(),
        "user.profile_completeness_score":
          calculateProfileCompleteness(clerkUser),
        "user.lifecycle_stage": "new_user",
      });

      return newUser;
    } catch (error) {
      const duration = Date.now() - startTime;

      span.recordException(error as Error);
      span.setAttributes({
        "user.creation.success": false,
        "error.type": "user_creation_failed",
        "error.message": (error as Error).message,
        "business.user_acquisition_failed": true,
      });

      addPerformanceAttributes(span, "db_query", duration);

      span.addEvent("user.creation_failed", {
        "user.id": userId,
        "error.message": (error as Error).message,
        "creation.duration_ms": duration,
        "business.impact": "user_acquisition_blocked",
      });

      throw error;
    } finally {
      span.end();
    }
  });
}

// ============================================================================
// CLERK INTEGRATION
// ============================================================================

/**
 * Fetch current user from Clerk with comprehensive telemetry
 * Tracks API performance and user authentication patterns
 */
async function fetchClerkUser(): Promise<ClerkUser | null> {
  return tracer.startActiveSpan("clerk.currentUser", async (span) => {
    const startTime = Date.now();

    try {
      span.setAttributes({
        "clerk.operation": "currentUser",
        "clerk.api.method": "GET",
        "clerk.api.endpoint": "/users/current",
      });

      const user = await currentUser();
      const duration = Date.now() - startTime;

      if (user) {
        const baseAttributes = getClerkUserTelemetryAttributes(user);

        span.setAttributes({
          "clerk.result": "success",
          "clerk.api.response_time_acceptable":
            duration < PERFORMANCE_THRESHOLDS.CLERK_API_SLOW_MS,
          ...baseAttributes,
          "clerk.user.days_since_last_sign_in":
            baseAttributes["clerk.user.days_since_last_sign_in"] ?? undefined,
        });

        addPerformanceAttributes(span, "clerk_api", duration);

        // Track metadata richness for data quality monitoring
        if (
          user.privateMetadata &&
          Object.keys(user.privateMetadata).length > 0
        ) {
          span.setAttributes({
            "clerk.user.private_metadata_keys": Object.keys(
              user.privateMetadata
            ).join(","),
            "clerk.user.private_metadata_count": Object.keys(
              user.privateMetadata
            ).length,
          });
        }

        if (
          user.publicMetadata &&
          Object.keys(user.publicMetadata).length > 0
        ) {
          span.setAttributes({
            "clerk.user.public_metadata_keys": Object.keys(
              user.publicMetadata
            ).join(","),
            "clerk.user.public_metadata_count": Object.keys(user.publicMetadata)
              .length,
          });
        }

        span.addEvent("clerk.user_fetched_successfully", {
          "user.id": user.id,
          "user.email": user.emailAddresses[0]?.emailAddress || "no_email",
          "api.duration_ms": duration,
          "user.lifecycle_stage": baseAttributes["clerk.user.lifecycle_stage"],
        });
      } else {
        span.setAttributes({
          "clerk.result": "not_found",
          "clerk.api.user_exists": false,
        });

        addPerformanceAttributes(span, "clerk_api", duration);

        span.addEvent("clerk.user_not_found", {
          "api.duration_ms": duration,
          "auth.issue": "no_current_user",
        });
      }

      return user;
    } catch (error) {
      const duration = Date.now() - startTime;

      span.recordException(error as Error);
      span.setAttributes({
        "clerk.result": "error",
        "error.type": "clerk_api_error",
        "error.message": (error as Error).message,
        "auth.service": "clerk",
        "auth.operation_failed": true,
      });

      addPerformanceAttributes(span, "clerk_api", duration);

      span.addEvent("clerk.api_error", {
        "error.message": (error as Error).message,
        "api.duration_ms": duration,
        "service.availability": "degraded",
      });

      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Update Clerk user metadata with location information
 * Critical for localization and regional compliance
 */
async function updateClerkMetadata(clerkUser: ClerkUser): Promise<void> {
  return tracer.startActiveSpan("clerk.metadata.update", async (span) => {
    const startTime = Date.now();

    try {
      const countryCode = clerkUser.privateMetadata?.countryCode as string;

      span.setAttributes({
        "clerk.operation": "updateUserMetadata",
        "clerk.metadata.has_country_code": !!countryCode,
        "clerk.metadata.country_code": countryCode || "not_set",
        "clerk.metadata.update_reason": countryCode
          ? "none_needed"
          : "missing_country_code",
      });

      // Only update if country code is missing
      if (!countryCode) {
        const detectedCountryCode = getLocationCountryCode();
        const client = await clerkClient();

        span.setAttributes({
          "clerk.metadata.detected_country_code": detectedCountryCode,
          "clerk.metadata.detection_method": "browser_locale",
          "clerk.metadata.will_update": true,
        });

        span.addEvent("clerk.metadata.updating_country_code", {
          detected_country_code: detectedCountryCode,
          "user.id": clerkUser.id,
          "update.reason": "missing_location_data",
        });

        await client.users.updateUserMetadata(clerkUser.id, {
          privateMetadata: {
            countryCode: detectedCountryCode,
          },
        });

        const duration = Date.now() - startTime;

        span.setAttributes({
          "clerk.result": "success",
          "clerk.metadata.updated_country_code": detectedCountryCode,
          "clerk.metadata.update_timestamp": new Date().toISOString(),
          "clerk.metadata.compliance.location_tracked": true,
        });

        addPerformanceAttributes(span, "metadata_update", duration);

        span.addEvent("clerk.metadata.country_code_updated", {
          country_code: detectedCountryCode,
          "update.duration_ms": duration,
          "compliance.gdpr_location_tracking":
            detectedCountryCode.startsWith("EU"),
        });
      } else {
        const duration = Date.now() - startTime;

        span.setAttributes({
          "clerk.result": "no_update_needed",
          "clerk.metadata.skip_reason": "country_code_exists",
        });

        addPerformanceAttributes(span, "metadata_update", duration);

        span.addEvent("clerk.metadata.update_skipped", {
          reason: "country_code_already_exists",
          existing_country_code: countryCode,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      span.recordException(error as Error);
      span.setAttributes({
        "clerk.result": "error",
        "error.type": "metadata_update_failed",
        "error.message": (error as Error).message,
        "clerk.metadata.update_failed": true,
        "service.resilience": "degraded_but_continuing",
      });

      addPerformanceAttributes(span, "metadata_update", duration);

      span.addEvent("clerk.metadata.update_failed", {
        "error.message": (error as Error).message,
        "update.duration_ms": duration,
        impact: "location_detection_unavailable",
      });

      // Don't throw - metadata update failure shouldn't block user creation
      console.error("Failed to update user metadata (non-blocking):", error);
    } finally {
      span.end();
    }
  });
}

// ============================================================================
// MAIN AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Get the current authenticated user and ensure they exist in our database
 *
 * Implements lazy user creation pattern:
 * 1. Check authentication with Clerk
 * 2. Look for user in our database
 * 3. If not found, fetch from Clerk and create in our DB
 * 4. Update metadata as needed
 *
 * This approach reduces initial signup friction while ensuring data consistency
 *
 * @returns Promise<User | null> - User object if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<User | null> {
  return tracer.startActiveSpan("auth.getCurrentUser", async (span) => {
    const authStartTime = Date.now();

    try {
      // Step 1: Check Clerk authentication
      const { userId } = await auth();

      if (!userId) {
        span.setAttributes({
          "auth.result": "unauthenticated",
          "auth.user_id": "none",
          "auth.method": "clerk_session",
          "security.anonymous_access": true,
        });

        span.addEvent("auth.unauthenticated_access", {
          "access.timestamp": new Date().toISOString(),
          "security.impact": "none",
        });

        return null;
      }

      span.setAttributes({
        "auth.user_id": userId,
        "auth.method": "clerk_session",
        "auth.session.valid": true,
        "security.authenticated_access": true,
      });

      // Step 2: Check if user exists in our database
      let dbUser = await findUserInDatabase(userId);

      // Step 3: Implement lazy user creation if needed
      if (!dbUser) {
        span.addEvent("user.lazy_creation_started", {
          "user.id": userId,
          trigger: "first_app_access",
          "creation.method": "lazy",
        });

        // Fetch user data from Clerk
        const clerkUser = await fetchClerkUser();
        if (!clerkUser) {
          span.setAttributes({
            "auth.result": "clerk_user_not_found",
            "error.type": "clerk_user_missing",
            "auth.consistency_issue": true,
          });

          span.addEvent("auth.consistency_error", {
            issue: "clerk_session_valid_but_user_not_found",
            "user.id": userId,
            impact: "authentication_blocked",
          });

          return null;
        }

        // Update Clerk metadata if needed (non-blocking)
        await updateClerkMetadata(clerkUser);

        // Prepare user data for database creation
        const detectedCountryCode =
          (clerkUser.privateMetadata?.countryCode as string) ||
          getLocationCountryCode();
        const currency = getCurrencyFromLocale(detectedCountryCode);
        const timezone = getTimezoneFromLocale();

        // Create user in our database
        dbUser = await createUserInDatabase(
          userId,
          clerkUser,
          currency,
          timezone
        );

        const creationDuration = Date.now() - authStartTime;

        span.addEvent("user.lazy_creation_completed", {
          "user.id": userId,
          "user.email": dbUser.email || "no_email",
          "user.currency": dbUser.currency,
          "user.timezone": dbUser.timezone,
          "creation.total_duration_ms": creationDuration,
          "business.metric": "new_user_onboarded",
        });
      }

      const totalDuration = Date.now() - authStartTime;
      const isReturningUser = !!dbUser;

      span.setAttributes({
        "auth.result": "success",
        "user.exists_in_db": true,
        "user.id": userId,
        "user.email": dbUser.email || "no_email",
        "user.currency": dbUser.currency,
        "user.timezone": dbUser.timezone,
        "user.creation_flow": isReturningUser
          ? "existing_user"
          : "lazy_created",

        // Business intelligence attributes
        "user.returning": isReturningUser,
        "user.onboarding.completed": isReturningUser,
        "business.user_type": isReturningUser ? "returning" : "new",

        // Performance and operational metrics
        "auth.total_latency_acceptable":
          totalDuration < PERFORMANCE_THRESHOLDS.TOTAL_AUTH_SLOW_MS,
        "system.database.healthy": true,
        "system.clerk_service.healthy": true,
      });

      addPerformanceAttributes(span, "auth_total", totalDuration);

      span.addEvent("auth.success", {
        "user.id": userId,
        "user.type": isReturningUser ? "returning" : "new",
        "auth.total_duration_ms": totalDuration,
        "business.impact": isReturningUser
          ? "user_retention"
          : "user_acquisition",
      });

      return dbUser;
    } catch (error) {
      const totalDuration = Date.now() - authStartTime;

      span.recordException(error as Error);
      span.setAttributes({
        "auth.result": "error",
        "error.type": "authentication_system_error",
        "error.message": (error as Error).message,
        "system.availability": "degraded",
        "business.impact": "user_access_blocked",
      });

      addPerformanceAttributes(span, "auth_total", totalDuration);

      span.addEvent("auth.system_error", {
        "error.message": (error as Error).message,
        "error.duration_ms": totalDuration,
        "system.component": "authentication",
        "business.impact": "user_experience_degraded",
      });

      console.error("Authentication system error:", error);
      return null;
    } finally {
      span.end();
    }
  });
}

/**
 * Require authentication and return the user
 * Throws an error if the user is not authenticated - use for protected routes
 *
 * @throws {Error} When user is not authenticated
 * @returns Promise<User> - Authenticated user object
 */
export async function requireAuth(): Promise<User> {
  return tracer.startActiveSpan("auth.requireAuth", async (span) => {
    const startTime = Date.now();

    try {
      span.setAttributes({
        "auth.operation": "require",
        "auth.enforcement": "strict",
        "security.protection_level": "authenticated_only",
      });

      const user = await getCurrentUser();
      const duration = Date.now() - startTime;

      if (!user) {
        span.setAttributes({
          "auth.result": "unauthorized",
          "auth.enforcement.triggered": true,
          "security.access_denied": true,
          "error.type": "authorization_required",
        });

        addPerformanceAttributes(span, "auth_total", duration);

        span.addEvent("auth.access_denied", {
          reason: "authentication_required",
          "security.protection": "route_protected",
          "auth.duration_ms": duration,
        });

        throw new Error("Authentication required");
      }

      span.setAttributes({
        "auth.result": "success",
        "auth.enforcement.passed": true,
        "user.id": user.id,
        "security.access_granted": true,
      });

      addPerformanceAttributes(span, "auth_total", duration);

      span.addEvent("auth.access_granted", {
        "user.id": user.id,
        "security.level": "authenticated",
        "auth.duration_ms": duration,
      });

      return user;
    } catch (error) {
      const duration = Date.now() - startTime;

      if ((error as Error).message === "Authentication required") {
        // This is expected behavior, not a system error
        span.setAttributes({
          "auth.result": "unauthorized",
          "error.type": "expected_unauthorized",
        });
      } else {
        span.recordException(error as Error);
        span.setAttributes({
          "auth.result": "error",
          "error.type": "require_auth_system_error",
          "error.message": (error as Error).message,
        });
      }

      addPerformanceAttributes(span, "auth_total", duration);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Get just the Clerk user ID without database interaction
 * Lightweight authentication check - use when you only need the ID
 *
 * @returns Promise<string | null> - User ID if authenticated, null otherwise
 */
export async function getCurrentUserId(): Promise<string | null> {
  return tracer.startActiveSpan("auth.getCurrentUserId", async (span) => {
    const startTime = Date.now();

    try {
      span.setAttributes({
        "auth.operation": "get_user_id",
        "auth.scope": "id_only",
        "performance.optimization": "lightweight_auth_check",
        "database.interaction": false,
      });

      const { userId } = await auth();
      const duration = Date.now() - startTime;

      span.setAttributes({
        "auth.result": userId ? "success" : "unauthenticated",
        "auth.user_id": userId || "none",
      });

      addPerformanceAttributes(span, "auth_total", duration);

      if (userId) {
        span.addEvent("auth.user_id_retrieved", {
          "user.id": userId,
          "auth.duration_ms": duration,
          "operation.lightweight": true,
        });
      } else {
        span.addEvent("auth.user_id_unavailable", {
          reason: "not_authenticated",
          "auth.duration_ms": duration,
        });
      }

      return userId;
    } catch (error) {
      const duration = Date.now() - startTime;

      span.recordException(error as Error);
      span.setAttributes({
        "auth.result": "error",
        "error.type": "get_user_id_error",
        "error.message": (error as Error).message,
      });

      addPerformanceAttributes(span, "auth_total", duration);

      span.addEvent("auth.get_user_id_error", {
        "error.message": (error as Error).message,
        "auth.duration_ms": duration,
      });

      console.error("Get user ID error:", error);
      return null;
    } finally {
      span.end();
    }
  });
}
