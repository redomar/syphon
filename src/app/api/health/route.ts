import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Health check endpoint for deployment monitoring
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0',
    service: 'syphon-app',
    checks: {
      database: 'unknown',
      telemetry: 'unknown'
    }
  };

  try {
    // Check database connectivity
    const prisma = new PrismaClient();
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.checks.database = 'healthy';
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      checks.checks.database = 'unhealthy';
      checks.status = 'degraded';
    } finally {
      await prisma.$disconnect();
    }

    // Check OpenTelemetry status
    const telemetryEnabled = process.env.OTEL_SDK_DISABLED !== 'true';
    const telemetryEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    
    if (telemetryEnabled) {
      if (telemetryEndpoint) {
        checks.checks.telemetry = 'healthy';
      } else {
        checks.checks.telemetry = 'console-only';
      }
    } else {
      checks.checks.telemetry = 'disabled';
    }

  } catch (error) {
    console.error('Health check error:', error);
    checks.status = 'unhealthy';
    checks.checks.database = 'error';
  }

  // Return appropriate HTTP status
  const statusCode = checks.status === 'healthy' ? 200 : 
                    checks.status === 'degraded' ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}

// Simple readiness check (for load balancers)
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}