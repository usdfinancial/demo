import { NextRequest } from 'next/server'
import { auditService } from '@/lib/services/auditService'
import { RequestUtils } from '@/lib/utils/requestUtils'

export interface SecurityError {
  code: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'authentication' | 'authorization' | 'validation' | 'rate_limit' | 'system'
}

/**
 * Security Error Handler - Comprehensive error logging for financial services
 * 
 * Captures and logs all security-relevant errors including:
 * - Authentication failures
 * - Authorization violations  
 * - Input validation errors
 * - Rate limiting triggers
 * - System security events
 */
export class SecurityErrorHandler {
  
  /**
   * Log a security error with full context
   */
  static async logSecurityError(
    request: NextRequest,
    error: SecurityError,
    userId?: string,
    additionalContext?: any
  ): Promise<void> {
    try {
      const requestInfo = RequestUtils.getRequestInfo(request)
      const clientInfo = request.headers.get('X-Client-Info')
      let parsedClientInfo: any = {}
      
      if (clientInfo) {
        try {
          parsedClientInfo = JSON.parse(clientInfo)
        } catch (e) {
          // Ignore invalid client info
        }
      }

      // Determine severity level for console logging
      const severityIcon = error.severity === 'critical' ? '🚨' :
                          error.severity === 'high' ? '🔴' :
                          error.severity === 'medium' ? '🟠' : '⚠️'

      console.error(`${severityIcon} SECURITY ERROR [${error.code}]:`, {
        message: error.message,
        category: error.category,
        severity: error.severity,
        userId,
        path: request.nextUrl.pathname,
        method: request.method,
        ipAddress: RequestUtils.sanitizeIP(requestInfo.ipAddress),
        userAgent: RequestUtils.sanitizeUserAgent(requestInfo.userAgent || parsedClientInfo.userAgent),
        timestamp: new Date().toISOString(),
        additionalContext
      })

      // Log to audit service
      await auditService.logSecurity(`${error.category}.${error.code}`, {
        userId,
        severity: error.severity,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent || parsedClientInfo.userAgent,
        details: {
          errorCode: error.code,
          errorMessage: error.message,
          category: error.category,
          path: request.nextUrl.pathname,
          method: request.method,
          deviceFingerprint: requestInfo.deviceFingerprint || parsedClientInfo.deviceFingerprint,
          geolocation: requestInfo.geolocation,
          riskScore: RequestUtils.calculateRiskScore(request),
          additionalContext
        }
      })

      // Additional alerting for critical errors
      if (error.severity === 'critical') {
        await this.handleCriticalError(request, error, userId, additionalContext)
      }

    } catch (loggingError) {
      // Fallback console logging if audit service fails
      console.error('❌ Failed to log security error:', loggingError)
      console.error('Original error:', error)
    }
  }

  /**
   * Handle authentication errors
   */
  static async logAuthenticationError(
    request: NextRequest,
    errorType: 'invalid_credentials' | 'expired_token' | 'missing_token' | 'invalid_token' | 'account_locked',
    userId?: string,
    details?: any
  ): Promise<void> {
    const errorMap = {
      invalid_credentials: {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid login credentials provided',
        severity: 'medium' as const,
        category: 'authentication' as const
      },
      expired_token: {
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        severity: 'low' as const,
        category: 'authentication' as const
      },
      missing_token: {
        code: 'AUTH_TOKEN_MISSING',
        message: 'Required authentication token is missing',
        severity: 'medium' as const,
        category: 'authentication' as const
      },
      invalid_token: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Authentication token is invalid or malformed',
        severity: 'high' as const,
        category: 'authentication' as const
      },
      account_locked: {
        code: 'AUTH_ACCOUNT_LOCKED',
        message: 'User account is locked due to security concerns',
        severity: 'high' as const,
        category: 'authentication' as const
      }
    }

    const error = errorMap[errorType]
    await this.logSecurityError(request, error, userId, details)
  }

  /**
   * Handle authorization errors
   */
  static async logAuthorizationError(
    request: NextRequest,
    errorType: 'insufficient_permissions' | 'resource_access_denied' | 'idor_attempt',
    userId?: string,
    resourceId?: string,
    details?: any
  ): Promise<void> {
    const errorMap = {
      insufficient_permissions: {
        code: 'AUTHZ_INSUFFICIENT_PERMISSIONS',
        message: 'User lacks required permissions for this action',
        severity: 'medium' as const,
        category: 'authorization' as const
      },
      resource_access_denied: {
        code: 'AUTHZ_RESOURCE_ACCESS_DENIED',
        message: 'Access to requested resource is denied',
        severity: 'high' as const,
        category: 'authorization' as const
      },
      idor_attempt: {
        code: 'AUTHZ_IDOR_ATTEMPT',
        message: 'Possible Insecure Direct Object Reference attack detected',
        severity: 'critical' as const,
        category: 'authorization' as const
      }
    }

    const error = errorMap[errorType]
    await this.logSecurityError(request, error, userId, { resourceId, ...details })
  }

  /**
   * Handle input validation errors
   */
  static async logValidationError(
    request: NextRequest,
    errorType: 'malicious_input' | 'sql_injection_attempt' | 'xss_attempt' | 'invalid_format',
    userId?: string,
    fieldName?: string,
    details?: any
  ): Promise<void> {
    const errorMap = {
      malicious_input: {
        code: 'VALIDATION_MALICIOUS_INPUT',
        message: 'Potentially malicious input detected',
        severity: 'high' as const,
        category: 'validation' as const
      },
      sql_injection_attempt: {
        code: 'VALIDATION_SQL_INJECTION',
        message: 'SQL injection attack pattern detected',
        severity: 'critical' as const,
        category: 'validation' as const
      },
      xss_attempt: {
        code: 'VALIDATION_XSS_ATTEMPT',
        message: 'Cross-site scripting attack pattern detected',
        severity: 'high' as const,
        category: 'validation' as const
      },
      invalid_format: {
        code: 'VALIDATION_INVALID_FORMAT',
        message: 'Input does not match required format',
        severity: 'low' as const,
        category: 'validation' as const
      }
    }

    const error = errorMap[errorType]
    await this.logSecurityError(request, error, userId, { fieldName, ...details })
  }

  /**
   * Handle rate limiting errors
   */
  static async logRateLimitError(
    request: NextRequest,
    errorType: 'too_many_requests' | 'suspicious_activity' | 'bot_detected',
    userId?: string,
    details?: any
  ): Promise<void> {
    const errorMap = {
      too_many_requests: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Request rate limit exceeded',
        severity: 'medium' as const,
        category: 'rate_limit' as const
      },
      suspicious_activity: {
        code: 'RATE_LIMIT_SUSPICIOUS_ACTIVITY',
        message: 'Suspicious request pattern detected',
        severity: 'high' as const,
        category: 'rate_limit' as const
      },
      bot_detected: {
        code: 'RATE_LIMIT_BOT_DETECTED',
        message: 'Automated bot activity detected',
        severity: 'high' as const,
        category: 'rate_limit' as const
      }
    }

    const error = errorMap[errorType]
    await this.logSecurityError(request, error, userId, details)
  }

  /**
   * Handle critical system errors
   */
  static async logSystemError(
    request: NextRequest,
    errorType: 'database_breach_attempt' | 'config_manipulation' | 'privilege_escalation',
    userId?: string,
    details?: any
  ): Promise<void> {
    const errorMap = {
      database_breach_attempt: {
        code: 'SYSTEM_DATABASE_BREACH_ATTEMPT',
        message: 'Possible database breach attempt detected',
        severity: 'critical' as const,
        category: 'system' as const
      },
      config_manipulation: {
        code: 'SYSTEM_CONFIG_MANIPULATION',
        message: 'Unauthorized system configuration change attempt',
        severity: 'critical' as const,
        category: 'system' as const
      },
      privilege_escalation: {
        code: 'SYSTEM_PRIVILEGE_ESCALATION',
        message: 'Privilege escalation attempt detected',
        severity: 'critical' as const,
        category: 'system' as const
      }
    }

    const error = errorMap[errorType]
    await this.logSecurityError(request, error, userId, details)
  }

  /**
   * Handle critical errors with immediate alerting
   */
  private static async handleCriticalError(
    request: NextRequest,
    error: SecurityError,
    userId?: string,
    additionalContext?: any
  ): Promise<void> {
    // In a production environment, this would:
    // 1. Send immediate alerts to security team
    // 2. Potentially block the IP address
    // 3. Escalate to incident response system
    // 4. Create security tickets

    console.error('🚨 CRITICAL SECURITY EVENT - IMMEDIATE ATTENTION REQUIRED', {
      error: error.code,
      message: error.message,
      userId,
      path: request.nextUrl.pathname,
      ipAddress: RequestUtils.sanitizeIP(RequestUtils.getClientIP(request)),
      timestamp: new Date().toISOString(),
      severity: 'CRITICAL',
      action_required: 'INVESTIGATE_IMMEDIATELY'
    })

    // TODO: Integrate with alerting systems (PagerDuty, Slack, etc.)
    // TODO: Consider automatic IP blocking for certain critical events
    // TODO: Generate incident response tickets
  }

  /**
   * Get security error statistics for monitoring
   */
  static async getSecurityStats(hours: number = 24): Promise<any> {
    try {
      // This would query the audit logs for security error statistics
      const highSeverityEvents = await auditService.getHighSeverityEvents(hours)
      
      const stats = {
        totalSecurityEvents: highSeverityEvents.length,
        criticalEvents: highSeverityEvents.filter(e => e.severity === 'critical').length,
        highSeverityEvents: highSeverityEvents.filter(e => e.severity === 'high').length,
        authenticationErrors: highSeverityEvents.filter(e => e.action.includes('auth')).length,
        validationErrors: highSeverityEvents.filter(e => e.action.includes('validation')).length,
        timeRange: `${hours} hours`,
        lastUpdated: new Date().toISOString()
      }

      return stats
    } catch (error) {
      console.error('❌ Error getting security stats:', error)
      return null
    }
  }
}

// Export convenience functions for common use cases
export const logAuthError = SecurityErrorHandler.logAuthenticationError
export const logAuthzError = SecurityErrorHandler.logAuthorizationError  
export const logValidationError = SecurityErrorHandler.logValidationError
export const logRateLimitError = SecurityErrorHandler.logRateLimitError
export const logSystemError = SecurityErrorHandler.logSystemError