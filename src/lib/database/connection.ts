import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'

let pool: Pool | null = null

// Force reset of singleton for configuration changes
export function resetDatabaseConnection(): void {
  if (pool) {
    pool.end().catch(() => {}) // Ignore errors during shutdown
  }
  pool = null
}

export interface QueryOptions {
  timeout?: number
  retries?: number
}

export interface DatabaseConfig {
  connectionString?: string
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  ssl?: boolean | object
  max?: number
  idleTimeoutMillis?: number
  connectionTimeoutMillis?: number
}

class Database {
  private pool: Pool
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
    
    // Parse connection string for AWS RDS compatibility
    const connStr = config.connectionString || process.env.DATABASE_URL
    let poolConfig: any = {
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 10000,
      ssl: this.getSSLConfig(config.ssl),
    }

    if (connStr && connStr.includes('rds.amazonaws.com')) {
      // For AWS RDS, parse the connection string manually to ensure SSL works
      const url = new URL(connStr)
      poolConfig = {
        ...poolConfig,
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1), // remove leading /
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
      }
    } else {
      // Use connection string for other providers
      poolConfig.connectionString = connStr
      poolConfig.host = config.host || process.env.DB_HOST
      poolConfig.port = config.port || parseInt(process.env.DB_PORT || '5432')
      poolConfig.database = config.database || process.env.DB_NAME
      poolConfig.user = config.user || process.env.DB_USER
      poolConfig.password = config.password || process.env.DB_PASSWORD
    }

    this.pool = new Pool(poolConfig)

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })
  }

  private getSSLConfig(ssl?: boolean | object): boolean | object | undefined {
    if (ssl !== undefined) {
      return ssl
    }
    
    // Auto-detect SSL based on environment
    if (process.env.NODE_ENV === 'production' || 
        process.env.DATABASE_URL?.includes('.rds.amazonaws.com') ||
        process.env.DATABASE_URL?.includes('supabase.co') ||
        process.env.DATABASE_URL?.includes('neon.tech')) {
      
      // AWS RDS requires special SSL handling
      if (process.env.DATABASE_URL?.includes('.rds.amazonaws.com')) {
        return { 
          rejectUnauthorized: false, // AWS RDS uses Amazon RDS root certificates
          require: true
        }
      }
      
      // Other cloud providers
      return { 
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA || undefined,
        key: process.env.DB_SSL_KEY || undefined,
        cert: process.env.DB_SSL_CERT || undefined
      }
    }
    
    return false
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect()
  }

  async query<T extends QueryResultRow = any>(
    text: string, 
    params?: any[], 
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const client = await this.getClient()
    try {
      return await client.query<T>(text, params)
    } finally {
      client.release()
    }
  }

  async end(): Promise<void> {
    await this.pool.end()
  }

  get stats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    }
  }
}

export function getDatabase(config?: DatabaseConfig): Database {
  // Force recreation for AWS RDS SSL fix
  const defaultConfig: DatabaseConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }
  
  if (pool && process.env.DATABASE_URL?.includes('rds.amazonaws.com')) {
    // Reset connection for AWS RDS SSL configuration changes
    try {
      pool.end().catch(() => {}) // Ignore errors
    } catch (e) {
      // Ignore cleanup errors
    }
    pool = null
  }
  
  if (!pool) {
    pool = new Database({ ...defaultConfig, ...config }) as any
  }
  return pool as any
}

// Query helper functions
export async function query<T extends QueryResultRow = any>(
  text: string, 
  params?: any[], 
  options?: QueryOptions
): Promise<QueryResult<T>> {
  const db = getDatabase()
  return db.query<T>(text, params, options)
}

export async function findOne<T extends QueryResultRow = any>(
  table: string,
  where: Record<string, any>,
  options?: QueryOptions
): Promise<T | null> {
  const keys = Object.keys(where)
  if (keys.length === 0) {
    throw new Error('Where clause cannot be empty')
  }

  const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ')
  const values = Object.values(where)

  try {
    const result = await query<T>(
      `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`,
      values,
      options
    )
    return result.rows[0] || null
  } catch (error: any) {
    throw new Error(`Database query failed: ${error.message}`)
  }
}

export async function findMany<T extends QueryResultRow = any>(
  table: string,
  where: Record<string, any> = {},
  orderBy?: string,
  limit?: number,
  offset?: number,
  options?: QueryOptions
): Promise<T[]> {
  let queryText = `SELECT * FROM ${table}`
  const params: any[] = []
  let paramIndex = 1

  // Add WHERE clause
  if (Object.keys(where).length > 0) {
    const whereClause = Object.keys(where)
      .map(key => `${key} = $${paramIndex++}`)
      .join(' AND ')
    queryText += ` WHERE ${whereClause}`
    params.push(...Object.values(where))
  }

  // Add ORDER BY clause
  if (orderBy) {
    queryText += ` ORDER BY ${orderBy}`
  }

  // Add LIMIT clause
  if (limit) {
    queryText += ` LIMIT $${paramIndex++}`
    params.push(limit)
  }

  // Add OFFSET clause
  if (offset) {
    queryText += ` OFFSET $${paramIndex++}`
    params.push(offset)
  }

  try {
    const result = await query<T>(queryText, params, options)
    return result.rows
  } catch (error: any) {
    throw new Error(`Database query failed: ${error.message}`)
  }
}

export async function insertOne<T extends QueryResultRow = any>(
  table: string,
  data: Record<string, any>,
  returning = '*',
  options?: QueryOptions
): Promise<T> {
  const keys = Object.keys(data)
  if (keys.length === 0) {
    throw new Error('Insert data cannot be empty')
  }

  const columns = keys.join(', ')
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ')
  const values = Object.values(data)

  try {
    const result = await query<T>(
      `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING ${returning}`,
      values,
      options
    )
    
    if (!result.rows[0]) {
      throw new Error('Insert operation failed')
    }
    
    return result.rows[0]
  } catch (error: any) {
    throw new Error(`Database insert failed: ${error.message}`)
  }
}

export async function updateOne<T extends QueryResultRow = any>(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>,
  returning = '*',
  options?: QueryOptions
): Promise<T | null> {
  const dataKeys = Object.keys(data)
  const whereKeys = Object.keys(where)
  
  if (dataKeys.length === 0) {
    throw new Error('Update data cannot be empty')
  }
  
  if (whereKeys.length === 0) {
    throw new Error('Where clause cannot be empty')
  }

  let paramIndex = 1
  const setClause = dataKeys.map(key => `${key} = $${paramIndex++}`).join(', ')
  const whereClause = whereKeys.map(key => `${key} = $${paramIndex++}`).join(' AND ')
  
  const values = [...Object.values(data), ...Object.values(where)]

  try {
    const result = await query<T>(
      `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING ${returning}`,
      values,
      options
    )
    return result.rows[0] || null
  } catch (error: any) {
    throw new Error(`Database update failed: ${error.message}`)
  }
}

export async function deleteOne(
  table: string,
  where: Record<string, any>,
  options?: QueryOptions
): Promise<boolean> {
  const whereKeys = Object.keys(where)
  
  if (whereKeys.length === 0) {
    throw new Error('Where clause cannot be empty')
  }

  const whereClause = whereKeys.map((key, index) => `${key} = $${index + 1}`).join(' AND ')
  const values = Object.values(where)

  try {
    const result = await query(
      `DELETE FROM ${table} WHERE ${whereClause}`,
      values,
      options
    )
    return (result.rowCount || 0) > 0
  } catch (error: any) {
    throw new Error(`Database delete failed: ${error.message}`)
  }
}

export interface PaginatedResult<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export async function paginate<T extends QueryResultRow = any>(
  table: string,
  where: Record<string, any> = {},
  page = 1,
  limit = 20,
  orderBy = 'created_at DESC',
  options?: QueryOptions
): Promise<PaginatedResult<T>> {
  const offset = (page - 1) * limit
  
  // Get total count
  let countQuery = `SELECT COUNT(*) as count FROM ${table}`
  const params: any[] = []
  
  if (Object.keys(where).length > 0) {
    const whereClause = Object.keys(where)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ')
    countQuery += ` WHERE ${whereClause}`
    params.push(...Object.values(where))
  }

  // Get data
  const data = await findMany<T>(table, where, orderBy, limit, offset, options)
  
  try {
    const countResult = await query<{ count: string }>(countQuery, params, options)
    const total = parseInt(countResult.rows[0].count)
    const totalPages = Math.ceil(total / limit)
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    }
  } catch (error: any) {
    throw new Error(`Database pagination failed: ${error.message}`)
  }
}

// Initialize database connection
export function initializeDatabase(config?: DatabaseConfig): Database {
  return getDatabase(config)
}

// Health check function
export async function healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime: number }> {
  const startTime = Date.now()
  
  try {
    await query('SELECT 1 as test')
    const responseTime = Date.now() - startTime
    
    return {
      status: responseTime > 1000 ? 'unhealthy' : 'healthy',
      responseTime
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime
    }
  }
}

// Export database instance for direct access if needed
export { Database }
export default getDatabase