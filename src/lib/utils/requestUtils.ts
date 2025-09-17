import { NextRequest } from 'next/server'

export interface RequestInfo {
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  geolocation?: any
}

/**
 * Request utilities for extracting security-relevant information
 * Used for audit logging, session tracking, and fraud detection
 */
export class RequestUtils {
  
  /**
   * Extract IP address from request with proxy support
   */
  static getClientIP(request: NextRequest): string | undefined {
    // Check common proxy headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare
    const awsClientIP = request.headers.get('x-amzn-trace-id') // AWS ALB
    
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, first one is the original client
      return forwardedFor.split(',')[0]?.trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP
    }
    
    // Fallback to request IP (may be proxy IP)
    return request.ip || undefined
  }

  /**
   * Extract user agent from request
   */
  static getUserAgent(request: NextRequest): string | undefined {
    return request.headers.get('user-agent') || undefined
  }

  /**
   * Generate a simple device fingerprint from request headers
   */
  static generateDeviceFingerprint(request: NextRequest): string {
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''
    const acceptEncoding = request.headers.get('accept-encoding') || ''
    const accept = request.headers.get('accept') || ''
    
    // Create a simple hash from headers (not cryptographically secure, but sufficient for basic tracking)
    const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${accept}`
    return Buffer.from(fingerprint).toString('base64').slice(0, 32)
  }

  /**
   * Extract geolocation information from request headers (if available)
   */
  static getGeolocation(request: NextRequest): any {
    // Common geolocation headers from CDNs and proxies
    const country = request.headers.get('cf-ipcountry') || // Cloudflare
                   request.headers.get('x-country-code') || 
                   request.headers.get('x-forwarded-country')
    
    const city = request.headers.get('cf-ipcity') || // Cloudflare
                request.headers.get('x-city')
    
    const region = request.headers.get('cf-region') || // Cloudflare
                  request.headers.get('x-region')
    
    if (country || city || region) {
      return {
        country: country || undefined,
        city: city || undefined,
        region: region || undefined,
        timestamp: new Date().toISOString()
      }
    }
    
    return undefined
  }

  /**
   * Get comprehensive request information for security logging
   */
  static getRequestInfo(request: NextRequest): RequestInfo {
    return {
      ipAddress: this.getClientIP(request),
      userAgent: this.getUserAgent(request),
      deviceFingerprint: this.generateDeviceFingerprint(request),
      geolocation: this.getGeolocation(request)
    }
  }

  /**
   * Check if request appears suspicious based on headers
   */
  static isSuspiciousRequest(request: NextRequest): boolean {
    const userAgent = this.getUserAgent(request)
    const ipAddress = this.getClientIP(request)
    
    // Basic suspicious patterns
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /postman/i
    ]
    
    // Check user agent
    if (!userAgent || suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      return true
    }
    
    // Check for missing IP (unusual)
    if (!ipAddress) {
      return true
    }
    
    // Check for localhost/private IPs in production (could indicate proxy issues)
    if (process.env.NODE_ENV === 'production' && ipAddress) {
      const privateIPRegex = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.)/
      if (privateIPRegex.test(ipAddress)) {
        return true
      }
    }
    
    return false
  }

  /**
   * Calculate a simple risk score for the request
   */
  static calculateRiskScore(request: NextRequest): number {
    let score = 0
    
    // Suspicious request patterns
    if (this.isSuspiciousRequest(request)) {
      score += 30
    }
    
    // Missing or minimal user agent
    const userAgent = this.getUserAgent(request)
    if (!userAgent || userAgent.length < 20) {
      score += 20
    }
    
    // No geolocation data (less reliable)
    if (!this.getGeolocation(request)) {
      score += 10
    }
    
    // Missing IP address
    if (!this.getClientIP(request)) {
      score += 40
    }
    
    return Math.min(score, 100) // Cap at 100
  }

  /**
   * Sanitize IP address for logging (mask last octet for privacy)
   */
  static sanitizeIP(ipAddress?: string): string {
    if (!ipAddress) return 'unknown'
    return ipAddress.replace(/(\d+\.\d+\.\d+)\.\d+/, '$1.xxx')
  }

  /**
   * Sanitize user agent for logging (truncate if too long)
   */
  static sanitizeUserAgent(userAgent?: string): string {
    if (!userAgent) return 'unknown'
    return userAgent.length > 100 ? userAgent.substring(0, 100) + '...' : userAgent
  }
}