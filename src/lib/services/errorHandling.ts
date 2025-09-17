'use client'

// Network error handling and circuit breaker patterns

export interface NetworkError {
  code: string
  message: string
  network: string
  timestamp: number
  isRateLimited: boolean
  isTimeout: boolean
  isNetworkFailure: boolean
}

export interface CircuitBreakerState {
  network: string
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureCount: number
  lastFailureTime: number
  nextAttemptTime: number
  successCount: number
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  exponentialBase: number
  jitterMax: number
}

export interface TimeoutConfig {
  rpcTimeout: number
  contractCallTimeout: number
  networkSwitchTimeout: number
}

export interface RateLimitConfig {
  requestsPerSecond: number
  burstLimit: number
  windowMs: number
}

export class NetworkErrorHandler {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map()
  private rateLimiters: Map<string, RateLimiter> = new Map()
  private errorMetrics: Map<string, NetworkError[]> = new Map()
  
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    exponentialBase: 2,
    jitterMax: 1000 // 1 second jitter
  }
  
  private readonly defaultTimeoutConfig: TimeoutConfig = {
    rpcTimeout: 10000, // 10 seconds
    contractCallTimeout: 15000, // 15 seconds
    networkSwitchTimeout: 5000 // 5 seconds
  }
  
  private readonly circuitBreakerConfig = {
    failureThreshold: 5,
    timeout: 60000, // 1 minute
    successThreshold: 2
  }

  constructor() {
    // Initialize rate limiters for Alchemy endpoints
    this.initializeRateLimiters()
    
    // Cleanup old circuit breaker data periodically
    setInterval(() => this.cleanupOldData(), 300000) // 5 minutes
  }

  private initializeRateLimiters() {
    // Alchemy free tier: 300 requests per second
    const alchemyConfig: RateLimitConfig = {
      requestsPerSecond: 250, // Conservative limit
      burstLimit: 500,
      windowMs: 1000
    }
    
    // Different limits for public RPCs
    const publicRpcConfig: RateLimitConfig = {
      requestsPerSecond: 10,
      burstLimit: 20,
      windowMs: 1000
    }
    
    this.rateLimiters.set('alchemy', new RateLimiter(alchemyConfig))
    this.rateLimiters.set('public', new RateLimiter(publicRpcConfig))
  }

  /**
   * Check if network is available (circuit breaker)
   */
  isNetworkAvailable(network: string): boolean {
    const breaker = this.getCircuitBreaker(network)
    
    switch (breaker.state) {
      case 'CLOSED':
        return true
      case 'OPEN':
        if (Date.now() >= breaker.nextAttemptTime) {
          breaker.state = 'HALF_OPEN'
          breaker.successCount = 0
          return true
        }
        return false
      case 'HALF_OPEN':
        return true
      default:
        return true
    }
  }

  /**
   * Record network success
   */
  recordSuccess(network: string) {
    const breaker = this.getCircuitBreaker(network)
    
    if (breaker.state === 'HALF_OPEN') {
      breaker.successCount++
      if (breaker.successCount >= this.circuitBreakerConfig.successThreshold) {
        breaker.state = 'CLOSED'
        breaker.failureCount = 0
      }
    } else if (breaker.state === 'CLOSED') {
      breaker.failureCount = Math.max(0, breaker.failureCount - 1)
    }
  }

  /**
   * Record network failure
   */
  recordFailure(network: string, error: any) {
    const breaker = this.getCircuitBreaker(network)
    const networkError = this.classifyError(network, error)
    
    // Store error for metrics
    this.storeError(network, networkError)
    
    // Update circuit breaker
    breaker.failureCount++
    breaker.lastFailureTime = Date.now()
    
    if (breaker.failureCount >= this.circuitBreakerConfig.failureThreshold) {
      breaker.state = 'OPEN'
      breaker.nextAttemptTime = Date.now() + this.circuitBreakerConfig.timeout
      console.warn(`🔴 Circuit breaker OPEN for ${network} after ${breaker.failureCount} failures`)
    }
    
    return networkError
  }

  /**
   * Check rate limit before making request
   */
  async checkRateLimit(endpoint: 'alchemy' | 'public'): Promise<boolean> {
    const rateLimiter = this.rateLimiters.get(endpoint)
    if (!rateLimiter) return true
    
    return rateLimiter.allowRequest()
  }

  /**
   * Create timeout-enabled fetch function
   */
  createTimeoutFetch(timeoutMs: number) {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      
      try {
        const response = await fetch(input, {
          ...init,
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        return response
      } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeoutMs}ms`)
        }
        throw error
      }
    }
  }

  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    network: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config }
    let lastError: any
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Check if network is still available
          if (!this.isNetworkAvailable(network)) {
            throw new Error(`Circuit breaker OPEN for ${network}`)
          }
          
          // Calculate delay with exponential backoff and jitter
          const baseDelay = Math.min(
            retryConfig.baseDelay * Math.pow(retryConfig.exponentialBase, attempt - 1),
            retryConfig.maxDelay
          )
          const jitter = Math.random() * retryConfig.jitterMax
          const delay = baseDelay + jitter
          
          console.log(`🔄 Retrying ${network} request (attempt ${attempt}/${retryConfig.maxRetries}) after ${Math.round(delay)}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
        const result = await operation()
        
        // Record success
        if (attempt > 0) {
          this.recordSuccess(network)
        }
        
        return result
      } catch (error) {
        lastError = error
        
        // Record failure
        const networkError = this.recordFailure(network, error)
        
        // Don't retry for certain error types
        if (networkError.isRateLimited && attempt < retryConfig.maxRetries) {
          // For rate limiting, wait longer
          await new Promise(resolve => setTimeout(resolve, 5000))
        } else if (attempt === retryConfig.maxRetries) {
          // Last attempt, throw the error
          break
        }
      }
    }
    
    throw lastError
  }

  /**
   * Get circuit breaker state
   */
  private getCircuitBreaker(network: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(network)) {
      this.circuitBreakers.set(network, {
        network,
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        successCount: 0
      })
    }
    return this.circuitBreakers.get(network)!
  }

  /**
   * Classify error type
   */
  private classifyError(network: string, error: any): NetworkError {
    const message = error?.message || error?.toString() || 'Unknown error'
    const lowerMessage = message.toLowerCase()
    
    return {
      code: error?.code || 'UNKNOWN',
      message,
      network,
      timestamp: Date.now(),
      isRateLimited: lowerMessage.includes('rate limit') || 
                    lowerMessage.includes('too many requests') || 
                    error?.status === 429,
      isTimeout: lowerMessage.includes('timeout') || 
                lowerMessage.includes('aborted') ||
                error?.name === 'AbortError',
      isNetworkFailure: lowerMessage.includes('network') ||
                       lowerMessage.includes('connection') ||
                       lowerMessage.includes('fetch')
    }
  }

  /**
   * Store error for metrics
   */
  private storeError(network: string, error: NetworkError) {
    if (!this.errorMetrics.has(network)) {
      this.errorMetrics.set(network, [])
    }
    
    const errors = this.errorMetrics.get(network)!
    errors.push(error)
    
    // Keep only last 100 errors per network
    if (errors.length > 100) {
      errors.shift()
    }
  }

  /**
   * Cleanup old data
   */
  private cleanupOldData() {
    const oneHourAgo = Date.now() - 3600000
    
    // Reset circuit breakers that have been open too long
    for (const breaker of this.circuitBreakers.values()) {
      if (breaker.state === 'OPEN' && breaker.lastFailureTime < oneHourAgo) {
        breaker.state = 'CLOSED'
        breaker.failureCount = 0
        console.log(`♻️ Reset circuit breaker for ${breaker.network}`)
      }
    }
    
    // Clean old error metrics
    for (const [network, errors] of this.errorMetrics.entries()) {
      this.errorMetrics.set(
        network, 
        errors.filter(error => error.timestamp > oneHourAgo)
      )
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(network?: string) {
    if (network) {
      const errors = this.errorMetrics.get(network) || []
      const breaker = this.getCircuitBreaker(network)
      return {
        network,
        circuitBreakerState: breaker.state,
        failureCount: breaker.failureCount,
        recentErrors: errors.length,
        lastFailure: breaker.lastFailureTime,
        errors: errors.slice(-10) // Last 10 errors
      }
    }
    
    // All networks
    const stats: any = {}
    for (const [net, errors] of this.errorMetrics.entries()) {
      const breaker = this.getCircuitBreaker(net)
      stats[net] = {
        circuitBreakerState: breaker.state,
        failureCount: breaker.failureCount,
        recentErrors: errors.length,
        lastFailure: breaker.lastFailureTime
      }
    }
    return stats
  }
}

/**
 * Rate Limiter implementation
 */
class RateLimiter {
  private tokens: number
  private lastRefill: number
  private requests: number[] = []

  constructor(private config: RateLimitConfig) {
    this.tokens = config.burstLimit
    this.lastRefill = Date.now()
  }

  async allowRequest(): Promise<boolean> {
    this.refillTokens()
    this.cleanOldRequests()
    
    // Check burst limit
    if (this.tokens <= 0) {
      return false
    }
    
    // Check rate limit
    if (this.requests.length >= this.config.requestsPerSecond) {
      return false
    }
    
    // Allow request
    this.tokens--
    this.requests.push(Date.now())
    return true
  }

  private refillTokens() {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = Math.floor(timePassed / this.config.windowMs * this.config.requestsPerSecond)
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.config.burstLimit, this.tokens + tokensToAdd)
      this.lastRefill = now
    }
  }

  private cleanOldRequests() {
    const cutoff = Date.now() - this.config.windowMs
    this.requests = this.requests.filter(time => time > cutoff)
  }
}

// Global error handler instance
export const networkErrorHandler = new NetworkErrorHandler()