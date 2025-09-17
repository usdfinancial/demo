import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, ApiErrorHandler } from '@/lib/middleware/errorHandler'
import { investmentService } from '@/lib/services/investmentService'
import { transactionService } from '@/lib/services/transactionService'
import { userService } from '@/lib/services/userService'

export const GET = withErrorHandler(async (request: NextRequest, requestId: string) => {
  const { searchParams } = new URL(request.url)
  const detailed = searchParams.get('detailed') === 'true'

  const healthChecks = {
    timestamp: new Date().toISOString(),
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    services: {} as Record<string, any>,
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    }
  }

  const services = [
    { name: 'investmentService', service: investmentService },
    { name: 'transactionService', service: transactionService },
    { name: 'userService', service: userService }
  ]

  let unhealthyCount = 0
  let degradedCount = 0

  // Check each service health
  for (const { name, service } of services) {
    try {
      const serviceHealth = await service.healthCheck()
      healthChecks.services[name] = serviceHealth
      
      if (serviceHealth.status === 'unhealthy') {
        unhealthyCount++
      } else if (serviceHealth.status === 'degraded') {
        degradedCount++
      }
    } catch (error) {
      healthChecks.services[name] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
      unhealthyCount++
    }
  }

  // Determine overall status
  if (unhealthyCount > 0) {
    healthChecks.status = 'unhealthy'
  } else if (degradedCount > 0) {
    healthChecks.status = 'degraded'
  }

  // Add error statistics if requested
  if (detailed) {
    const errorHandler = ApiErrorHandler.getInstance()
    healthChecks.system.errorStats = errorHandler.getErrorStats()
  }

  // Add database connection check
  try {
    const { query } = await import('@/lib/database/connection')
    const startTime = Date.now()
    
    await query('SELECT 1 as test')
    const responseTime = Date.now() - startTime
    
    healthChecks.services.database = {
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    healthChecks.services.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
      timestamp: new Date().toISOString()
    }
    if (healthChecks.status === 'healthy') {
      healthChecks.status = 'unhealthy'
    }
  }

  // Return appropriate status code
  const statusCode = healthChecks.status === 'healthy' ? 200 
                  : healthChecks.status === 'degraded' ? 200 
                  : 503

  return new NextResponse(JSON.stringify(healthChecks, null, 2), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
})

// Readiness probe - checks if the service is ready to serve traffic
export async function HEAD() {
  try {
    // Quick database connectivity check
    const { query } = await import('@/lib/database/connection')
    await query('SELECT 1')
    
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}