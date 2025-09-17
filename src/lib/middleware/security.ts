import { NextRequest, NextResponse } from 'next/server'

export interface CorsConfig {
  origin?: string | string[] | boolean | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    directives?: Record<string, string[]>
    reportOnly?: boolean
    nonce?: string
  }
  hsts?: {
    maxAge?: number
    includeSubDomains?: boolean
    preload?: boolean
  }
  nosniff?: boolean
  frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'
  xssProtection?: boolean
  referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url'
  permissionsPolicy?: Record<string, string[]>
}

export class SecurityMiddleware {
  private corsConfig: Required<CorsConfig>
  private headersConfig: Required<SecurityHeadersConfig>

  constructor(corsConfig?: CorsConfig, headersConfig?: SecurityHeadersConfig) {
    this.corsConfig = {
      origin: corsConfig?.origin ?? this.getDefaultOrigin(),
      methods: corsConfig?.methods ?? ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: corsConfig?.allowedHeaders ?? [
        'Accept',
        'Accept-Language',
        'Authorization',
        'Cache-Control',
        'Content-Language',
        'Content-Type',
        'DNT',
        'If-Match',
        'If-Modified-Since',
        'If-None-Match',
        'If-Unmodified-Since',
        'Origin',
        'Range',
        'User-Agent',
        'X-CSRF-Token',
        'X-HTTP-Method-Override',
        'X-Requested-With'
      ],
      exposedHeaders: corsConfig?.exposedHeaders ?? [
        'Content-Length',
        'Content-Range',
        'X-Content-Type-Options'
      ],
      credentials: corsConfig?.credentials ?? true,
      maxAge: corsConfig?.maxAge ?? 86400, // 24 hours
      preflightContinue: corsConfig?.preflightContinue ?? false,
      optionsSuccessStatus: corsConfig?.optionsSuccessStatus ?? 204
    }

    this.headersConfig = {
      contentSecurityPolicy: {
        directives: headersConfig?.contentSecurityPolicy?.directives ?? this.getDefaultCSPDirectives(),
        reportOnly: headersConfig?.contentSecurityPolicy?.reportOnly ?? false,
        nonce: headersConfig?.contentSecurityPolicy?.nonce
      },
      hsts: {
        maxAge: headersConfig?.hsts?.maxAge ?? 31536000, // 1 year
        includeSubDomains: headersConfig?.hsts?.includeSubDomains ?? true,
        preload: headersConfig?.hsts?.preload ?? true
      },
      nosniff: headersConfig?.nosniff ?? true,
      frameOptions: headersConfig?.frameOptions ?? 'DENY',
      xssProtection: headersConfig?.xssProtection ?? true,
      referrerPolicy: headersConfig?.referrerPolicy ?? 'strict-origin-when-cross-origin',
      permissionsPolicy: headersConfig?.permissionsPolicy ?? {
        camera: ['()'],
        microphone: ['()'],
        geolocation: ['self'],
        payment: ['self']
      }
    }
  }

  private getDefaultOrigin(): string | string[] {
    const corsOrigin = process.env.CORS_ORIGIN
    if (corsOrigin) {
      return corsOrigin.split(',').map(origin => origin.trim())
    }

    // Development defaults
    if (process.env.NODE_ENV === 'development') {
      return [
        'http://localhost:3000',
        'http://localhost:9002',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:9002'
      ]
    }

    // Production should always specify CORS_ORIGIN
    return false
  }

  private getDefaultCSPDirectives(): Record<string, string[]> {
    const nonce = this.headersConfig.contentSecurityPolicy?.nonce
    const nonceDirective = nonce ? [`'nonce-${nonce}'`] : []

    return {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-eval'", // Required for Next.js in development
        ...nonceDirective,
        'https://cdn.jsdelivr.net',
        'https://unpkg.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS libraries
        'https://fonts.googleapis.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:'
      ],
      'connect-src': [
        "'self'",
        'https://api.circle.com',
        'https://*.alchemy.com',
        'https://*.infura.io',
        'wss://'
      ],
      'frame-src': [
        "'none'"
      ],
      'object-src': [
        "'none'"
      ],
      'base-uri': [
        "'self'"
      ],
      'form-action': [
        "'self'"
      ],
      'upgrade-insecure-requests': []
    }
  }

  private isOriginAllowed(origin: string): boolean {
    if (this.corsConfig.origin === true) return true
    if (this.corsConfig.origin === false) return false
    
    if (typeof this.corsConfig.origin === 'string') {
      return this.corsConfig.origin === origin
    }
    
    if (Array.isArray(this.corsConfig.origin)) {
      return this.corsConfig.origin.includes(origin)
    }
    
    if (typeof this.corsConfig.origin === 'function') {
      return this.corsConfig.origin(origin)
    }

    return false
  }

  handleCors(request: NextRequest): { headers: Record<string, string>; allowed: boolean } {
    const origin = request.headers.get('origin') || ''
    const method = request.method
    const headers: Record<string, string> = {}

    // Check if origin is allowed
    const originAllowed = this.isOriginAllowed(origin)

    if (originAllowed && origin) {
      headers['Access-Control-Allow-Origin'] = origin
    } else if (this.corsConfig.origin === true) {
      headers['Access-Control-Allow-Origin'] = '*'
    }

    // Handle credentials
    if (this.corsConfig.credentials && originAllowed) {
      headers['Access-Control-Allow-Credentials'] = 'true'
    }

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const requestMethod = request.headers.get('access-control-request-method')
      const requestHeaders = request.headers.get('access-control-request-headers')

      if (requestMethod && this.corsConfig.methods.includes(requestMethod)) {
        headers['Access-Control-Allow-Methods'] = this.corsConfig.methods.join(', ')
      }

      if (requestHeaders) {
        const requestedHeaders = requestHeaders.split(',').map(h => h.trim().toLowerCase())
        const allowedHeaders = this.corsConfig.allowedHeaders.map(h => h.toLowerCase())
        const validHeaders = requestedHeaders.filter(h => allowedHeaders.includes(h))
        
        if (validHeaders.length > 0) {
          headers['Access-Control-Allow-Headers'] = validHeaders.join(', ')
        }
      }

      headers['Access-Control-Max-Age'] = this.corsConfig.maxAge.toString()
    } else {
      // Handle actual request
      if (this.corsConfig.exposedHeaders.length > 0) {
        headers['Access-Control-Expose-Headers'] = this.corsConfig.exposedHeaders.join(', ')
      }
    }

    return { headers, allowed: originAllowed || this.corsConfig.origin === true }
  }

  getSecurityHeaders(request: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {}
    const isHttps = request.nextUrl.protocol === 'https:' || 
                    request.headers.get('x-forwarded-proto') === 'https'

    // Content Security Policy
    if (this.headersConfig.contentSecurityPolicy) {
      const directives = Object.entries(this.headersConfig.contentSecurityPolicy.directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ')

      const headerName = this.headersConfig.contentSecurityPolicy.reportOnly
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy'

      headers[headerName] = directives
    }

    // HTTP Strict Transport Security (HTTPS only)
    if (isHttps && this.headersConfig.hsts) {
      let hstsValue = `max-age=${this.headersConfig.hsts.maxAge}`
      if (this.headersConfig.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains'
      }
      if (this.headersConfig.hsts.preload) {
        hstsValue += '; preload'
      }
      headers['Strict-Transport-Security'] = hstsValue
    }

    // X-Content-Type-Options
    if (this.headersConfig.nosniff) {
      headers['X-Content-Type-Options'] = 'nosniff'
    }

    // X-Frame-Options
    headers['X-Frame-Options'] = this.headersConfig.frameOptions

    // X-XSS-Protection (legacy, but still useful for older browsers)
    if (this.headersConfig.xssProtection) {
      headers['X-XSS-Protection'] = '1; mode=block'
    }

    // Referrer Policy
    headers['Referrer-Policy'] = this.headersConfig.referrerPolicy

    // Permissions Policy
    if (this.headersConfig.permissionsPolicy) {
      const policies = Object.entries(this.headersConfig.permissionsPolicy)
        .map(([feature, allowlist]) => `${feature}=(${allowlist.join(' ')})`)
        .join(', ')
      headers['Permissions-Policy'] = policies
    }

    // Additional security headers
    headers['X-DNS-Prefetch-Control'] = 'off'
    headers['X-Download-Options'] = 'noopen'
    headers['X-Permitted-Cross-Domain-Policies'] = 'none'

    return headers
  }

  createSecureResponse(
    request: NextRequest, 
    response: NextResponse | Response | null = null
  ): NextResponse {
    // Handle CORS
    const corsResult = this.handleCors(request)
    
    // If it's a preflight request, return early
    if (request.method === 'OPTIONS') {
      const optionsResponse = new NextResponse(null, { 
        status: this.corsConfig.optionsSuccessStatus 
      })
      
      Object.entries(corsResult.headers).forEach(([key, value]) => {
        optionsResponse.headers.set(key, value)
      })
      
      return optionsResponse
    }

    // Create response if not provided
    let nextResponse: NextResponse
    if (response instanceof NextResponse) {
      nextResponse = response
    } else if (response instanceof Response) {
      nextResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
    } else {
      nextResponse = new NextResponse()
    }

    // Apply CORS headers
    Object.entries(corsResult.headers).forEach(([key, value]) => {
      nextResponse.headers.set(key, value)
    })

    // Apply security headers
    const securityHeaders = this.getSecurityHeaders(request)
    Object.entries(securityHeaders).forEach(([key, value]) => {
      nextResponse.headers.set(key, value)
    })

    return nextResponse
  }

  // Middleware function for easy integration
  middleware(request: NextRequest): NextResponse | null {
    const corsResult = this.handleCors(request)
    
    // Block requests from disallowed origins
    if (!corsResult.allowed && request.headers.get('origin')) {
      return new NextResponse(
        JSON.stringify({ error: 'CORS: Origin not allowed' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return this.createSecureResponse(request)
    }

    return null // Continue to next middleware
  }
}

// Create default security middleware instance
const defaultSecurityConfig: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https:'],
      'font-src': ["'self'", 'https:', 'data:'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    }
  }
}

export const securityMiddleware = new SecurityMiddleware(undefined, defaultSecurityConfig)

// Export utility functions
export function applyCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  return securityMiddleware.createSecureResponse(request, response)
}

export function getSecurityHeaders(request: NextRequest): Record<string, string> {
  return securityMiddleware.getSecurityHeaders(request)
}

export function handleCors(request: NextRequest): { headers: Record<string, string>; allowed: boolean } {
  return securityMiddleware.handleCors(request)
}

export default SecurityMiddleware