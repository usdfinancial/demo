import { NextRequest, NextResponse } from 'next/server'
import { ServiceError, ErrorCode } from '@/lib/services/baseService'

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
  requestId?: string
  path?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  timestamp: string
  requestId: string
}

export class ApiErrorHandler {
  private static instance: ApiErrorHandler
  private errorCounts = new Map<string, number>()
  private readonly ERROR_RATE_LIMIT = 100 // Max errors per hour per error type
  private readonly ERROR_WINDOW = 60 * 60 * 1000 // 1 hour

  static getInstance(): ApiErrorHandler {
    if (!this.instance) {
      this.instance = new ApiErrorHandler()
    }
    return this.instance
  }

  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  handleError(
    error: any,
    request: NextRequest,
    requestId: string
  ): NextResponse {
    const timestamp = new Date().toISOString()
    const path = request.nextUrl.pathname

    // Log error for monitoring
    this.logError(error, request, requestId, timestamp)

    // Check if we're hitting error rate limits
    this.checkErrorRateLimit(error)

    let statusCode = 500
    let errorCode = ErrorCode.UNKNOWN_ERROR
    let message = 'Internal server error'
    let details: any = undefined

    // Handle ServiceError
    if (error instanceof ServiceError) {
      errorCode = error.code as ErrorCode
      message = error.message
      details = error.details
      statusCode = this.getStatusCodeFromError(error.code as ErrorCode)
    }
    // Handle standard Error
    else if (error instanceof Error) {
      message = error.message
      
      // Map common error patterns
      if (error.message.includes('not found')) {
        errorCode = ErrorCode.NOT_FOUND
        statusCode = 404
      } else if (error.message.includes('validation') || error.message.includes('required')) {
        errorCode = ErrorCode.VALIDATION_ERROR
        statusCode = 400
      } else if (error.message.includes('unauthorized') || error.message.includes('permission')) {
        errorCode = ErrorCode.PERMISSION_DENIED
        statusCode = 403
      }
    }
    // Handle string errors
    else if (typeof error === 'string') {
      message = error
    }

    const apiError: ApiError = {
      code: errorCode,
      message: this.sanitizeErrorMessage(message),
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp,
      requestId,
      path
    }

    const response: ApiResponse = {
      success: false,
      error: apiError,
      timestamp,
      requestId
    }

    return NextResponse.json(response, { status: statusCode })
  }

  createSuccessResponse<T>(
    data: T,
    requestId: string,
    statusCode = 200
  ): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId
    }

    return NextResponse.json(response, { status: statusCode })
  }

  private getStatusCodeFromError(errorCode: ErrorCode): number {
    switch (errorCode) {
      case ErrorCode.VALIDATION_ERROR:
        return 400
      case ErrorCode.NOT_FOUND:
        return 404
      case ErrorCode.PERMISSION_DENIED:
        return 403
      case ErrorCode.DUPLICATE_ENTRY:
        return 409
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        return 429
      case ErrorCode.EXTERNAL_SERVICE_ERROR:
        return 502
      case ErrorCode.DATABASE_ERROR:
        return 503
      default:
        return 500
    }
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    const sensitivePatterns = [
      /password/gi,
      /secret/gi,
      /token/gi,
      /key/gi,
      /database.*connection.*string/gi,
      /0x[a-fA-F0-9]{40}/g, // Ethereum addresses
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g // UUIDs
    ]

    let sanitized = message
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    })

    return sanitized
  }

  private logError(
    error: any,
    request: NextRequest,
    requestId: string,
    timestamp: string
  ): void {
    const errorLog = {
      timestamp,
      requestId,
      method: request.method,
      url: request.url,
      pathname: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      error: {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        service: error?.service,
        operation: error?.operation
      }
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // monitoringService.logError(errorLog)
      console.error('[API_ERROR]', JSON.stringify(errorLog, null, 2))
    } else {
      console.error('[API_ERROR]', errorLog)
    }
  }

  private checkErrorRateLimit(error: any): void {
    const errorType = error instanceof ServiceError ? error.code : 'UNKNOWN_ERROR'
    const now = Date.now()
    const windowStart = now - this.ERROR_WINDOW

    // Clean old entries
    for (const [key, timestamp] of this.errorCounts.entries()) {
      if (timestamp < windowStart) {
        this.errorCounts.delete(key)
      }
    }

    // Count current error
    const errorKey = `${errorType}_${Math.floor(now / this.ERROR_WINDOW)}`
    const currentCount = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, currentCount + 1)

    // Check if rate limit exceeded
    if (currentCount >= this.ERROR_RATE_LIMIT) {
      console.warn(`[RATE_LIMIT] Error rate limit exceeded for ${errorType}: ${currentCount} errors in window`)
      
      // In production, trigger alerts
      // alertingService.triggerAlert('HIGH_ERROR_RATE', { errorType, count: currentCount })
    }
  }

  getErrorStats(): Record<string, any> {
    const stats: Record<string, number> = {}
    
    for (const [key, count] of this.errorCounts.entries()) {
      const errorType = key.split('_')[0]
      stats[errorType] = (stats[errorType] || 0) + count
    }

    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorsByType: stats,
      timestamp: new Date().toISOString()
    }
  }
}

// Utility function to wrap API handlers with error handling
export function withErrorHandler<T>(
  handler: (request: NextRequest, requestId: string) => Promise<NextResponse | T>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const errorHandler = ApiErrorHandler.getInstance()
    const requestId = errorHandler.generateRequestId()

    try {
      const result = await handler(request, requestId)
      
      // If handler returns raw data, wrap it in success response
      if (!(result instanceof NextResponse)) {
        return errorHandler.createSuccessResponse(result, requestId)
      }
      
      return result
    } catch (error) {
      return errorHandler.handleError(error, request, requestId)
    }
  }
}

// Validation middleware
export function validateRequestBody(
  schema: Record<string, any>,
  body: any
): void {
  for (const [field, config] of Object.entries(schema)) {
    const value = body[field]
    
    if (config.required && (value === undefined || value === null)) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `Missing required field: ${field}`
      )
    }
    
    if (value !== undefined && config.type && typeof value !== config.type) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid type for ${field}: expected ${config.type}, got ${typeof value}`
      )
    }
    
    if (config.pattern && typeof value === 'string' && !config.pattern.test(value)) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid format for ${field}`
      )
    }
  }
}

// Rate limiting middleware
export class RateLimiter {
  private requests = new Map<string, number[]>()
  private readonly WINDOW_SIZE = 60 * 1000 // 1 minute
  private readonly MAX_REQUESTS = 100 // requests per minute

  checkRateLimit(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - this.WINDOW_SIZE
    
    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || []
    
    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (requests.length >= this.MAX_REQUESTS) {
      return false // Rate limit exceeded
    }
    
    // Add current request
    requests.push(now)
    this.requests.set(identifier, requests)
    
    return true // Within rate limit
  }
}

export const rateLimiter = new RateLimiter()