import { 
  query, 
  findOne, 
  findMany, 
  insertOne, 
  updateOne, 
  deleteOne, 
  paginate,
  type QueryOptions,
  type PaginatedResult
} from '@/lib/database/index'
import { randomUUID } from 'crypto'

export class ServiceError extends Error {
  public code: string
  public details?: any
  public timestamp: Date
  public operation?: string
  public service?: string

  constructor(code: string, message: string, operation?: string, details?: any) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.details = details
    this.timestamp = new Date()
    this.operation = operation
  }
}

// Error codes for better error handling
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  DATABASE_ERROR = 'DATABASE_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class BaseService {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  protected handleError(error: any, operation: string): never {
    const serviceName = this.constructor.name
    console.error(`${serviceName} ${operation} error:`, error)
    
    // Log error for monitoring (in production, this would go to monitoring service)
    this.logError(error, operation, serviceName)
    
    let errorCode = ErrorCode.UNKNOWN_ERROR
    let message = `${operation} failed`
    
    // Map specific database errors to error codes
    if (error?.code) {
      switch (error.code) {
        case '23505': // Unique violation
          errorCode = ErrorCode.DUPLICATE_ENTRY
          message = 'Record already exists'
          break
        case '23503': // Foreign key violation
          errorCode = ErrorCode.VALIDATION_ERROR
          message = 'Referenced record not found'
          break
        case '23502': // Not null violation
          errorCode = ErrorCode.VALIDATION_ERROR
          message = 'Required field missing'
          break
        case '42P01': // Undefined table
        case '42703': // Undefined column
          errorCode = ErrorCode.DATABASE_ERROR
          message = 'Database schema error'
          break
        default:
          if (error.code.startsWith('08')) { // Connection errors
            errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR
            message = 'Database connection error'
          }
      }
    }
    
    if (error?.message?.includes('not found') || error?.message?.includes('no rows')) {
      errorCode = ErrorCode.NOT_FOUND
      message = 'Record not found'
    }
    
    const serviceError = new ServiceError(
      errorCode,
      error?.message || message,
      operation,
      error?.detail || error
    )
    
    serviceError.service = serviceName
    throw serviceError
  }

  private logError(error: any, operation: string, serviceName: string): void {
    // In production, this would send to monitoring service like Sentry, DataDog, etc.
    const errorLog = {
      timestamp: new Date().toISOString(),
      service: serviceName,
      operation,
      error: {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        stack: error?.stack
      },
      tableName: this.tableName
    }
    
    // For now, just console.error, but in production would be:
    // monitoringService.logError(errorLog)
    console.error('[ERROR_LOG]', JSON.stringify(errorLog, null, 2))
  }

  protected async findOne<T = any>(
    where: Record<string, any>,
    options?: QueryOptions
  ): Promise<T | null> {
    try {
      return await findOne<T>(this.tableName, where, options)
    } catch (error) {
      this.handleError(error, 'findOne')
    }
  }

  protected async findMany<T = any>(
    where: Record<string, any> = {},
    orderBy?: string,
    limit?: number,
    offset?: number,
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      return await findMany<T>(this.tableName, where, orderBy, limit, offset, options)
    } catch (error) {
      this.handleError(error, 'findMany')
    }
  }

  protected async insertOne<T = any>(
    data: Record<string, any>,
    returning = '*',
    options?: QueryOptions
  ): Promise<T> {
    try {
      return await insertOne<T>(this.tableName, data, returning, options)
    } catch (error) {
      this.handleError(error, 'insertOne')
    }
  }

  protected async updateOne<T = any>(
    data: Record<string, any>,
    where: Record<string, any>,
    returning = '*',
    options?: QueryOptions
  ): Promise<T | null> {
    try {
      return await updateOne<T>(this.tableName, data, where, returning, options)
    } catch (error) {
      this.handleError(error, 'updateOne')
    }
  }

  protected async deleteOne(
    where: Record<string, any>,
    options?: QueryOptions
  ): Promise<boolean> {
    try {
      return await deleteOne(this.tableName, where, options)
    } catch (error) {
      this.handleError(error, 'deleteOne')
    }
  }

  protected async paginate<T = any>(
    where: Record<string, any> = {},
    page = 1,
    limit = 20,
    orderBy = 'created_at DESC',
    options?: QueryOptions
  ): Promise<PaginatedResult<T>> {
    try {
      return await paginate<T>(this.tableName, where, page, limit, orderBy, options)
    } catch (error) {
      this.handleError(error, 'paginate')
    }
  }

  protected async customQuery<T = any>(
    sql: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      const result = await query<T>(sql, params, options)
      return result.rows
    } catch (error) {
      this.handleError(error, 'customQuery')
    }
  }

  /**
   * Generate a UUID for new records
   */
  protected generateId(): string {
    return randomUUID()
  }

  // Cache utilities for better performance
  private cache = new Map<string, { data: any; timestamp: number; hits: number }>()
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0
  }

  protected getCacheKey(operation: string, params: any): string {
    return `${this.tableName}:${operation}:${JSON.stringify(params)}`
  }

  protected setCache(key: string, data: any, ttl = this.DEFAULT_CACHE_TTL): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsed()
    }
    
    this.cache.set(key, { 
      data, 
      timestamp: Date.now() + ttl,
      hits: 0
    })
  }

  protected getCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) {
      this.cacheStats.misses++
      return null
    }
    
    if (Date.now() > cached.timestamp) {
      this.cache.delete(key)
      this.cacheStats.misses++
      return null
    }
    
    // Update cache hit statistics and access tracking for LRU
    cached.hits++
    this.cacheStats.hits++
    
    return cached.data
  }

  protected clearCache(pattern?: string): void {
    if (!pattern) {
      const evicted = this.cache.size
      this.cache.clear()
      this.cacheStats.evictions += evicted
      return
    }

    let evicted = 0
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        evicted++
      }
    }
    this.cacheStats.evictions += evicted
  }

  private evictLeastRecentlyUsed(): void {
    let leastUsedKey = ''
    let leastHits = Infinity
    let oldestTimestamp = Infinity
    
    for (const [key, value] of this.cache.entries()) {
      if (value.hits < leastHits || (value.hits === leastHits && value.timestamp < oldestTimestamp)) {
        leastUsedKey = key
        leastHits = value.hits
        oldestTimestamp = value.timestamp
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
      this.cacheStats.evictions++
    }
  }

  protected getCacheStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2)
      : '0.00'
    
    return {
      ...this.cacheStats,
      size: this.cache.size,
      hitRate: `${hitRate}%`
    }
  }

  // Validation helpers
  protected validateRequired(data: Record<string, any>, required: string[]): void {
    const missing = required.filter(field => 
      data[field] === undefined || 
      data[field] === null || 
      (typeof data[field] === 'string' && data[field].trim() === '')
    )
    if (missing.length > 0) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `Required fields missing: ${missing.join(', ')}`,
        'validation'
      )
    }
  }

  protected validateUUID(value: string, fieldName = 'id'): void {
    if (!value || typeof value !== 'string') {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be a valid UUID string`,
        'validation'
      )
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid UUID format for ${fieldName}: ${value}`,
        'validation'
      )
    }
  }

  protected validateDecimal(value: string | number, fieldName: string, options?: { min?: number; max?: number }): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    
    if (isNaN(numValue)) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be a valid number`,
        'validation'
      )
    }
    
    if (options?.min !== undefined && numValue < options.min) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be at least ${options.min}`,
        'validation'
      )
    }
    
    if (options?.max !== undefined && numValue > options.max) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be at most ${options.max}`,
        'validation'
      )
    }
    
    return numValue.toString()
  }

  protected validateEnum(value: string, allowedValues: string[], fieldName: string): void {
    if (!allowedValues.includes(value)) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        'validation'
      )
    }
  }

  protected validateAddress(address: string, fieldName = 'address'): void {
    if (!address || typeof address !== 'string') {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be a valid address string`,
        'validation'
      )
    }
    
    // Basic Ethereum address validation (42 characters, starts with 0x)
    const addressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!addressRegex.test(address)) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid address format for ${fieldName}: ${address}`,
        'validation'
      )
    }
  }

  // Transaction support with retry logic
  protected async withTransaction<T>(
    callback: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const db = (await import('@/lib/database/connection')).getDatabase()
      const client = await db.getClient()
      
      try {
        await client.query('BEGIN')
        const result = await callback()
        await client.query('COMMIT')
        
        // Clear relevant cache on successful transaction (cross-table invalidation)
        this.invalidateRelatedCaches()
        
        return result
      } catch (error: any) {
        await client.query('ROLLBACK')
        lastError = error
        
        // Don't retry validation errors or not found errors
        if (error instanceof ServiceError && 
            [ErrorCode.VALIDATION_ERROR, ErrorCode.NOT_FOUND].includes(error.code as ErrorCode)) {
          throw error
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break
        }
        
        // Exponential backoff: wait 100ms, 200ms, 400ms
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        console.warn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms:`, error.message)
      } finally {
        client.release()
      }
    }
    
    throw lastError
  }

  // Database connection for transactions
  protected async getConnection() {
    const db = (await import('@/lib/database/connection')).getDatabase()
    return await db.getClient()
  }

  /**
   * Invalidate related caches based on table relationships
   */
  protected invalidateRelatedCaches(): void {
    // Clear cache for current table
    this.clearCache(this.tableName)

    // Define table relationships for cross-cache invalidation
    const tableRelationships: Record<string, string[]> = {
      'users': ['user_investments', 'stablecoin_balances', 'user_sessions', 'login_history'],
      'user_investments': ['users', 'tokenized_assets'],
      'stablecoin_balances': ['users', 'transactions'],
      'transactions': ['users', 'stablecoin_balances'],
      'tokenized_assets': ['user_investments'],
      'login_history': ['users'],
      'user_sessions': ['users']
    }

    // Clear related table caches
    const relatedTables = tableRelationships[this.tableName] || []
    relatedTables.forEach(table => {
      this.clearCache(table)
    })

    console.log(`🧹 Cache invalidated for ${this.tableName} and ${relatedTables.length} related tables`)
  }

  // Health check for service monitoring
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const testQuery = `SELECT 1 as test`
      await this.customQuery(testQuery)
      
      return {
        status: 'healthy',
        details: {
          service: this.constructor.name,
          tableName: this.tableName,
          cacheStats: this.getCacheStats(),
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          service: this.constructor.name,
          tableName: this.tableName,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }
    }
  }
}