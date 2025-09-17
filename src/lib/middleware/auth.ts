import { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'
import { ServiceError, ErrorCode } from '@/lib/services/baseService'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  permissions: string[]
  sessionId: string
  iat: number
  exp: number
}

export interface AuthConfig {
  secret: string
  algorithm: 'HS256' | 'RS256'
  publicKey?: string
  issuer: string
  audience: string
  expirationTime: string
}

export class AuthenticationService {
  private static instance: AuthenticationService
  private readonly config: AuthConfig

  private constructor() {
    // Get JWT configuration from environment variables
    this.config = {
      secret: process.env.JWT_SECRET || '',
      algorithm: (process.env.JWT_ALGORITHM as 'HS256' | 'RS256') || 'HS256',
      publicKey: process.env.JWT_PUBLIC_KEY,
      issuer: process.env.JWT_ISSUER || 'USD-Financial',
      audience: process.env.JWT_AUDIENCE || 'USD-Financial-API',
      expirationTime: process.env.JWT_EXPIRATION || '24h'
    }

    if (!this.config.secret && this.config.algorithm === 'HS256') {
      throw new Error('JWT_SECRET environment variable is required for HS256 algorithm')
    }

    if (!this.config.publicKey && this.config.algorithm === 'RS256') {
      throw new Error('JWT_PUBLIC_KEY environment variable is required for RS256 algorithm')
    }
  }

  static getInstance(): AuthenticationService {
    if (!this.instance) {
      this.instance = new AuthenticationService()
    }
    return this.instance
  }

  async verifyToken(token: string): Promise<AuthenticatedUser> {
    try {
      const key = this.config.algorithm === 'RS256' 
        ? this.config.publicKey 
        : this.config.secret

      if (!key) {
        throw new Error('No verification key available')
      }

      const decoded = verify(token, key, {
        algorithms: [this.config.algorithm],
        issuer: this.config.issuer,
        audience: this.config.audience
      }) as any

      // Validate required fields
      if (!decoded.id || !decoded.email || !decoded.role) {
        throw new Error('Invalid token payload')
      }

      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
        sessionId: decoded.sessionId,
        iat: decoded.iat,
        exp: decoded.exp
      }
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new ServiceError(
          ErrorCode.PERMISSION_DENIED,
          'Token has expired',
          { reason: 'TOKEN_EXPIRED' }
        )
      } else if (error.name === 'JsonWebTokenError') {
        throw new ServiceError(
          ErrorCode.PERMISSION_DENIED,
          'Invalid token',
          { reason: 'INVALID_TOKEN' }
        )
      } else {
        throw new ServiceError(
          ErrorCode.PERMISSION_DENIED,
          'Authentication failed',
          { reason: 'AUTH_ERROR', originalError: error.message }
        )
      }
    }
  }

  extractTokenFromRequest(request: NextRequest): string | null {
    // Try Authorization header first (Bearer token)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    // Try cookie fallback for browser requests
    const tokenCookie = request.cookies.get('auth-token')
    if (tokenCookie) {
      return tokenCookie.value
    }

    return null
  }

  async authenticateRequest(request: NextRequest): Promise<AuthenticatedUser> {
    const token = this.extractTokenFromRequest(request)
    
    if (!token) {
      throw new ServiceError(
        ErrorCode.PERMISSION_DENIED,
        'No authentication token provided',
        { reason: 'MISSING_TOKEN' }
      )
    }

    return await this.verifyToken(token)
  }

  checkPermission(user: AuthenticatedUser, requiredPermission: string): boolean {
    return user.permissions.includes(requiredPermission) || 
           user.permissions.includes('*') ||
           user.role === 'admin'
  }

  checkResourceAccess(user: AuthenticatedUser, resourceOwnerId: string): boolean {
    // Users can only access their own resources unless they have admin role
    return user.id === resourceOwnerId || user.role === 'admin'
  }
}

// Middleware function to authenticate API requests
export async function authenticateApiRequest(request: NextRequest): Promise<AuthenticatedUser> {
  const authService = AuthenticationService.getInstance()
  return await authService.authenticateRequest(request)
}

// Middleware function to check user permissions
export function requirePermission(permission: string) {
  return (user: AuthenticatedUser) => {
    const authService = AuthenticationService.getInstance()
    if (!authService.checkPermission(user, permission)) {
      throw new ServiceError(
        ErrorCode.PERMISSION_DENIED,
        `Insufficient permissions. Required: ${permission}`,
        { requiredPermission: permission, userPermissions: user.permissions }
      )
    }
  }
}

// Middleware function to check resource ownership
export function requireResourceAccess(resourceOwnerId: string) {
  return (user: AuthenticatedUser) => {
    const authService = AuthenticationService.getInstance()
    if (!authService.checkResourceAccess(user, resourceOwnerId)) {
      throw new ServiceError(
        ErrorCode.PERMISSION_DENIED,
        'Access denied to this resource',
        { reason: 'INSUFFICIENT_ACCESS', resourceOwnerId, userId: user.id }
      )
    }
  }
}

// Rate limiting per user
const userRateLimits = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // requests per minute per user

export function checkUserRateLimit(userId: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW
  
  // Get existing requests for this user
  let requests = userRateLimits.get(userId) || []
  
  // Remove old requests outside the window
  requests = requests.filter(timestamp => timestamp > windowStart)
  
  // Check if limit exceeded
  if (requests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false // Rate limit exceeded
  }
  
  // Add current request
  requests.push(now)
  userRateLimits.set(userId, requests)
  
  return true // Within rate limit
}

export default AuthenticationService