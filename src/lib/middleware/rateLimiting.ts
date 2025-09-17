import { NextRequest } from 'next/server'
import { ServiceError, ErrorCode } from '@/lib/services/baseService'

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
  headers?: boolean
  standardHeaders?: boolean
  legacyHeaders?: boolean
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitInfo | null>
  set(key: string, info: RateLimitInfo): Promise<void>
  increment(key: string): Promise<RateLimitInfo>
  reset(key: string): Promise<void>
}

// In-memory store (for development/small scale)
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; reset: number }>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, data] of this.store.entries()) {
        if (data.reset <= now) {
          this.store.delete(key)
        }
      }
    }, 60000)
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const data = this.store.get(key)
    if (!data) return null

    const now = Date.now()
    if (data.reset <= now) {
      this.store.delete(key)
      return null
    }

    return {
      limit: 0, // Will be set by rate limiter
      remaining: Math.max(0, data.count),
      reset: data.reset
    }
  }

  async set(key: string, info: RateLimitInfo): Promise<void> {
    this.store.set(key, {
      count: info.limit - info.remaining,
      reset: info.reset
    })
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const existing = this.store.get(key)
    const now = Date.now()
    
    if (!existing || existing.reset <= now) {
      // Create new window
      const reset = now + (process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 60000)
      const info: RateLimitInfo = {
        limit: 0, // Will be set by rate limiter
        remaining: -1, // Will be calculated by rate limiter
        reset
      }
      this.store.set(key, { count: 1, reset })
      return info
    }

    // Increment existing
    existing.count++
    this.store.set(key, existing)
    
    return {
      limit: 0, // Will be set by rate limiter
      remaining: existing.count,
      reset: existing.reset
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Redis store (for production/scale)
class RedisStore implements RateLimitStore {
  private redis: any
  
  constructor(redisClient: any) {
    this.redis = redisClient
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const data = await this.redis.get(key)
    if (!data) return null

    const parsed = JSON.parse(data)
    return {
      limit: parsed.limit,
      remaining: parsed.remaining,
      reset: parsed.reset
    }
  }

  async set(key: string, info: RateLimitInfo): Promise<void> {
    const ttl = Math.max(1, Math.ceil((info.reset - Date.now()) / 1000))
    await this.redis.setex(key, ttl, JSON.stringify(info))
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const luaScript = [
      'local key = KEYS[1]',
      'local window = tonumber(ARGV[1])',
      'local limit = tonumber(ARGV[2])',
      'local now = tonumber(ARGV[3])',
      '',
      'local current = redis.call("GET", key)',
      'if current == false then',
      '  redis.call("SETEX", key, window, 1)',
      '  return {1, limit - 1, now + (window * 1000)}',
      'end',
      '',
      'local count = tonumber(current)',
      'local ttl = redis.call("TTL", key)',
      '',
      'if ttl == -1 then',
      '  redis.call("SETEX", key, window, 1)',
      '  return {1, limit - 1, now + (window * 1000)}',
      'end',
      '',
      'redis.call("INCR", key)',
      'local remaining = limit - count - 1',
      'if remaining < 0 then remaining = 0 end',
      'return {count + 1, remaining, now + (ttl * 1000)}'
    ].join('\n')
    
    const windowSeconds = Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')) / 1000)
    const limit = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    const now = Date.now()
    
    const result = await this.redis.eval(luaScript, 1, key, windowSeconds, limit, now)
    
    return {
      limit,
      remaining: result[1],
      reset: result[2]
    }
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key)
  }
}

export class RateLimiter {
  private store: RateLimitStore
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
      skipFailedRequests: config.skipFailedRequests ?? false,
      message: config.message || 'Too many requests from this IP, please try again later',
      headers: config.headers ?? true,
      standardHeaders: config.standardHeaders ?? true,
      legacyHeaders: config.legacyHeaders ?? false
    }

    this.store = store || new MemoryStore()
  }

  private defaultKeyGenerator(request: NextRequest): string {
    return this.getClientIdentifier(request)
  }

  private getClientIdentifier(request: NextRequest): string {
    // Try to get real IP from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = request.headers.get('cf-connecting-ip') // Cloudflare
    const remoteAddr = request.headers.get('remote-addr')
    
    let ip = forwarded?.split(',')[0]?.trim() || 
             realIp || 
             clientIp || 
             remoteAddr || 
             'unknown'

    // Fallback for development
    if (ip === 'unknown' && process.env.NODE_ENV === 'development') {
      ip = '127.0.0.1'
    }

    return ip
  }

  async checkRateLimit(request: NextRequest): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    reset: number
    retryAfter?: number
  }> {
    const key = this.config.keyGenerator(request)
    const info = await this.store.increment(key)
    
    // Set the limit in the response
    info.limit = this.config.maxRequests
    info.remaining = Math.max(0, this.config.maxRequests - (info.limit - info.remaining))

    const allowed = info.remaining > 0
    
    if (!allowed) {
      info.retryAfter = Math.ceil((info.reset - Date.now()) / 1000)
    }

    await this.store.set(key, info)

    return {
      allowed,
      limit: info.limit,
      remaining: info.remaining,
      reset: info.reset,
      retryAfter: info.retryAfter
    }
  }

  async resetRateLimit(request: NextRequest): Promise<void> {
    const key = this.config.keyGenerator(request)
    await this.store.reset(key)
  }

  getHeaders(info: RateLimitInfo): Record<string, string> {
    const headers: Record<string, string> = {}

    if (this.config.standardHeaders) {
      headers['RateLimit-Limit'] = info.limit.toString()
      headers['RateLimit-Remaining'] = info.remaining.toString()
      headers['RateLimit-Reset'] = new Date(info.reset).toISOString()
    }

    if (this.config.legacyHeaders) {
      headers['X-RateLimit-Limit'] = info.limit.toString()
      headers['X-RateLimit-Remaining'] = info.remaining.toString()
      headers['X-RateLimit-Reset'] = Math.ceil(info.reset / 1000).toString()
    }

    if (info.retryAfter) {
      headers['Retry-After'] = info.retryAfter.toString()
    }

    return headers
  }
}

// Preset rate limiter configurations
export const RateLimitPresets = {
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  moderate: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Too many requests from this IP, please try again later'
  },
  lenient: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5000,
    message: 'Too many requests from this IP, please try again later'
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // Very strict for authentication endpoints
    message: 'Too many authentication attempts, please try again after 15 minutes'
  }
}

// Different rate limiters for different endpoints
export const rateLimiters = {
  general: new RateLimiter(RateLimitPresets.moderate),
  auth: new RateLimiter(RateLimitPresets.auth),
  api: new RateLimiter(RateLimitPresets.strict)
}

// Middleware function to apply rate limiting
export async function applyRateLimit(
  request: NextRequest, 
  limiter: RateLimiter
): Promise<void> {
  const result = await limiter.checkRateLimit(request)
  
  if (!result.allowed) {
    const headers = limiter.getHeaders({
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.retryAfter
    })

    throw new ServiceError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      { 
        rateLimitInfo: result,
        headers 
      }
    )
  }
}

// User-specific rate limiting (requires authentication)
export class UserRateLimiter extends RateLimiter {
  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    super({
      ...config,
      keyGenerator: (request: NextRequest) => {
        const userId = request.headers.get('x-user-id') || 
                      request.headers.get('authorization')?.split(' ')[1] || 
                      this.getClientIdentifier(request)
        return `user:${userId}`
      }
    }, store)
  }

  private getClientIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    return forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
  }
}

// API endpoint specific rate limiting
export class EndpointRateLimiter extends RateLimiter {
  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    super({
      ...config,
      keyGenerator: (request: NextRequest) => {
        const ip = this.getClientIdentifier(request)
        const endpoint = request.nextUrl.pathname
        return `endpoint:${ip}:${endpoint}`
      }
    }, store)
  }

  private getClientIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    return forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
  }
}

// Export singleton instances
export const generalRateLimiter = new RateLimiter(RateLimitPresets.moderate)
export const authRateLimiter = new RateLimiter(RateLimitPresets.auth)
export const apiRateLimiter = new RateLimiter(RateLimitPresets.strict)

export default RateLimiter