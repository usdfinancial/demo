// Database connection utilities for USD Financial
// Handles Netlify DB (Neon) connections with proper pooling and error handling

import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg'

interface DatabaseConfig {
  connectionString: string
  directUrl?: string
  maxConnections?: number
  connectionTimeout?: number
  idleTimeout?: number
  ssl?: boolean
}

interface QueryOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
}

class DatabaseConnection {
  private pool: Pool | null = null
  private directPool: Pool | null = null
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = {
      maxConnections: 20,
      connectionTimeout: 30000,
      idleTimeout: 10000,
      ssl: true,
      ...config
    }
  }

  /**
   * Initialize database connection pool
   */
  public async initialize(): Promise<void> {
    if (this.pool) {
      return // Already initialized
    }

    const poolConfig: PoolConfig = {
      connectionString: this.config.connectionString,
      max: this.config.maxConnections,
      connectionTimeoutMillis: this.config.connectionTimeout,
      idleTimeoutMillis: this.config.idleTimeout,
      ssl: this.config.ssl ? { 
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        ca: process.env.DB_SSL_CA || undefined,
        key: process.env.DB_SSL_KEY || undefined,
        cert: process.env.DB_SSL_CERT || undefined
      } : false,
      application_name: 'USD_Financial_App'
    }

    this.pool = new Pool(poolConfig)

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Database pool error:', err)
    })

    // Initialize direct connection pool if URL provided (for migrations)
    if (this.config.directUrl) {
      this.directPool = new Pool({
        ...poolConfig,
        connectionString: this.config.directUrl,
        max: 5, // Fewer connections for direct pool
        application_name: 'USD_Financial_Direct'
      })

      this.directPool.on('error', (err) => {
        console.error('Direct database pool error:', err)
      })
    }

    // Test connection
    await this.testConnection()
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database pool not initialized')
    }

    try {
      const client = await this.pool.connect()
      await client.query('SELECT 1')
      client.release()
      console.log('✅ Database connection established')
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      throw error
    }
  }

  /**
   * Execute a query with automatic retry and connection management
   */
  public async query<T extends QueryResultRow = QueryResultRow>(
    text: string, 
    params?: unknown[], 
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      await this.initialize()
    }

    const { timeout = 30000, retries = 3, retryDelay = 1000 } = options
    let lastError: Error

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const client = await this.pool!.connect()
        
        try {
          // Set query timeout
          if (timeout) {
            await client.query(`SET statement_timeout = ${timeout}`)
          }

          const result = await client.query<T>(text, params)
          return result
        } finally {
          client.release()
        }
      } catch (error) {
        lastError = error as Error
        
        if (attempt === retries) {
          console.error(`Query failed after ${retries} attempts:`, {
            query: text.substring(0, 100) + '...',
            error: (error as Error).message,
            attempt
          })
          break
        }

        // Wait before retry
        if (retryDelay && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        }
      }
    }

    throw lastError!
  }

  /**
   * Execute a query using direct connection (for migrations)
   */
  public async directQuery<T extends QueryResultRow = QueryResultRow>(
    text: string, 
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    if (!this.directPool) {
      throw new Error('Direct database connection not configured')
    }

    const client = await this.directPool.connect()
    try {
      return await client.query<T>(text, params)
    } finally {
      client.release()
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  public async transaction<T>(
    queries: Array<{ text: string; params?: unknown[] }>
  ): Promise<T[]> {
    if (!this.pool) {
      await this.initialize()
    }

    const client = await this.pool!.connect()
    const results: T[] = []

    try {
      await client.query('BEGIN')

      for (const query of queries) {
        const result = await client.query<QueryResultRow>(query.text, query.params)
        results.push(result.rows as T)
      }

      await client.query('COMMIT')
      return results
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get a client for manual transaction management
   */
  public async getClient() {
    if (!this.pool) {
      await this.initialize()
    }
    return await this.pool!.connect()
  }

  /**
   * Get connection pool stats
   */
  public getPoolStats() {
    if (!this.pool) {
      return null
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    }
  }

  /**
   * Close all connections
   */
  public async close(): Promise<void> {
    const promises = []
    
    if (this.pool) {
      promises.push(this.pool.end())
      this.pool = null
    }

    if (this.directPool) {
      promises.push(this.directPool.end())
      this.directPool = null
    }

    await Promise.all(promises)
    console.log('📪 Database connections closed')
  }

  /**
   * Health check for monitoring
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    timestamp: string
    poolStats?: {
      totalCount: number
      idleCount: number
      waitingCount: number
    } | null
    latency?: number
  }> {
    try {
      const start = Date.now()
      await this.query('SELECT 1')
      const latency = Date.now() - start

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        poolStats: this.getPoolStats(),
        latency
      }
    } catch {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Create singleton instance
let dbInstance: DatabaseConnection | null = null

/**
 * Get database instance with configuration from environment
 */
export function getDatabase(): DatabaseConnection {
  if (!dbInstance) {
    // AWS RDS requires SSL in production, optional in development
    const isProduction = process.env.NODE_ENV === 'production'
    const isAWS = process.env.DATABASE_URL?.includes('.rds.amazonaws.com')
    
    const config: DatabaseConfig = {
      connectionString: process.env.DATABASE_URL!,
      directUrl: process.env.DIRECT_URL,
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || (isProduction ? '20' : '10')),
      connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
      ssl: isProduction || isAWS // Enable SSL for AWS RDS or production
    }

    if (!config.connectionString) {
      throw new Error('DATABASE_URL environment variable is required. Please check your .env.local file.')
    }

    // Validate connection string format
    if (!config.connectionString.startsWith('postgresql://') && !config.connectionString.startsWith('postgres://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql:// or postgres://')
    }

    dbInstance = new DatabaseConnection(config)
  }

  return dbInstance
}

/**
 * Convenience function for simple queries
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string, 
  params?: unknown[],
  options?: QueryOptions
): Promise<QueryResult<T>> {
  const db = getDatabase()
  return await db.query<T>(text, params, options)
}

/**
 * Convenience function for transactions
 */
export async function transaction<T>(
  queries: Array<{ text: string; params?: unknown[] }>
): Promise<T[]> {
  const db = getDatabase()
  return await db.transaction<T>(queries)
}

/**
 * Database health check endpoint
 */
export async function healthCheck() {
  const db = getDatabase()
  return await db.healthCheck()
}

// Enhanced query helpers for service layer
export async function findOne<T extends QueryResultRow = QueryResultRow>(
  table: string,
  where: Record<string, unknown>,
  options?: QueryOptions
): Promise<T | null> {
  const whereClause = Object.keys(where)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(' AND ')
  
  const result = await query<T>(
    `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`,
    Object.values(where),
    options
  )
  
  return result.rows[0] || null
}

export async function findMany<T extends QueryResultRow = QueryResultRow>(
  table: string,
  where: Record<string, unknown> = {},
  orderBy?: string,
  limit?: number,
  offset?: number,
  options?: QueryOptions
): Promise<T[]> {
  let sql = `SELECT * FROM ${table}`
  const params: unknown[] = []
  
  if (Object.keys(where).length > 0) {
    const whereClause = Object.keys(where)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ')
    sql += ` WHERE ${whereClause}`
    params.push(...Object.values(where))
  }
  
  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`
  }
  
  if (limit) {
    sql += ` LIMIT $${params.length + 1}`
    params.push(limit)
  }
  
  if (offset) {
    sql += ` OFFSET $${params.length + 1}`
    params.push(offset)
  }
  
  const result = await query<T>(sql, params, options)
  return result.rows
}

export async function insertOne<T extends QueryResultRow = QueryResultRow>(
  table: string,
  data: Record<string, unknown>,
  returning = '*',
  options?: QueryOptions
): Promise<T> {
  const columns = Object.keys(data)
  const values = Object.values(data)
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ')
  
  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    RETURNING ${returning}
  `
  
  const result = await query<T>(sql, values, options)
  return result.rows[0]
}

export async function updateOne<T extends QueryResultRow = QueryResultRow>(
  table: string,
  data: Record<string, unknown>,
  where: Record<string, unknown>,
  returning = '*',
  options?: QueryOptions
): Promise<T | null> {
  const setClause = Object.keys(data)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ')
  
  const whereClause = Object.keys(where)
    .map((key, index) => `${key} = $${Object.keys(data).length + index + 1}`)
    .join(' AND ')
  
  const sql = `
    UPDATE ${table}
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE ${whereClause}
    RETURNING ${returning}
  `
  
  const result = await query<T>(sql, [...Object.values(data), ...Object.values(where)], options)
  return result.rows[0] || null
}

export async function deleteOne(
  table: string,
  where: Record<string, unknown>,
  options?: QueryOptions
): Promise<boolean> {
  const whereClause = Object.keys(where)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(' AND ')
  
  const result = await query(
    `DELETE FROM ${table} WHERE ${whereClause}`,
    Object.values(where),
    options
  )
  
  return (result.rowCount ?? 0) > 0
}

// Enhanced pagination helper
export async function paginate<T extends QueryResultRow = QueryResultRow>(
  table: string,
  where: Record<string, unknown> = {},
  page = 1,
  limit = 20,
  orderBy = 'created_at DESC',
  options?: QueryOptions
): Promise<{
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}> {
  const offset = (page - 1) * limit
  
  // Get total count
  let countSql = `SELECT COUNT(*) as count FROM ${table}`
  const countParams: unknown[] = []
  
  if (Object.keys(where).length > 0) {
    const whereClause = Object.keys(where)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ')
    countSql += ` WHERE ${whereClause}`
    countParams.push(...Object.values(where))
  }
  
  const countResult = await query<{ count: string }>(countSql, countParams, options)
  const total = parseInt(countResult.rows[0].count)
  
  // Get paginated data
  const data = await findMany<T>(table, where, orderBy, limit, offset, options)
  
  const totalPages = Math.ceil(total / limit)
  
  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

// Export the connection class for advanced usage
export { DatabaseConnection }
export type { DatabaseConfig, QueryOptions }