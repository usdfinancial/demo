import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { securityMiddleware } from '@/lib/middleware/security'
import { generalRateLimiter, authRateLimiter } from '@/lib/middleware/rateLimiting'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply security headers and CORS to all requests
  let response = securityMiddleware.middleware(request)
  if (response) {
    return response
  }

  // Apply rate limiting based on path
  try {
    if (pathname.startsWith('/api/auth')) {
      // Strict rate limiting for auth endpoints
      const rateLimitResult = await authRateLimiter.checkRateLimit(request)
      if (!rateLimitResult.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many authentication attempts. Please try again later.',
            retryAfter: rateLimitResult.retryAfter
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
              ...authRateLimiter.getHeaders({
                limit: rateLimitResult.limit,
                remaining: rateLimitResult.remaining,
                reset: rateLimitResult.reset,
                retryAfter: rateLimitResult.retryAfter
              })
            }
          }
        )
      }
    } else if (pathname.startsWith('/api/')) {
      // General rate limiting for API endpoints
      const rateLimitResult = await generalRateLimiter.checkRateLimit(request)
      if (!rateLimitResult.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: rateLimitResult.retryAfter
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
              ...generalRateLimiter.getHeaders({
                limit: rateLimitResult.limit,
                remaining: rateLimitResult.remaining,
                reset: rateLimitResult.reset,
                retryAfter: rateLimitResult.retryAfter
              })
            }
          }
        )
      }
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Continue processing if rate limiting fails
  }

  // Create response with security headers
  response = NextResponse.next()
  return securityMiddleware.createSecureResponse(request, response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}