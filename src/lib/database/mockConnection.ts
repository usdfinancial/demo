// Mock database connection for demo mode
// This prevents PostgreSQL import errors when running in demo mode

export interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
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

// Mock database class for demo mode
class MockDatabase {
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
    console.log('🎭 Demo Mode: Using mock database connection')
  }

  async query<T = any>(text: string, params?: any[], options?: QueryOptions): Promise<QueryResult<T>> {
    console.log('🎭 Demo Mode: Mock database query:', text.substring(0, 50) + '...')
    return {
      rows: [],
      rowCount: 0
    }
  }

  async end(): Promise<void> {
    console.log('🎭 Demo Mode: Mock database connection ended')
  }

  get stats() {
    return {
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    }
  }
}

let mockDb: MockDatabase | null = null

export function getDatabase(config?: DatabaseConfig): MockDatabase {
  if (!mockDb) {
    const defaultConfig: DatabaseConfig = {
      connectionString: 'mock://demo-database',
      max: 1,
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 1000,
    }
    mockDb = new MockDatabase({ ...defaultConfig, ...config })
  }
  return mockDb
}

// Mock query functions
export async function query<T = any>(
  text: string, 
  params?: any[], 
  options?: QueryOptions
): Promise<QueryResult<T>> {
  const db = getDatabase()
  return db.query<T>(text, params, options)
}

export async function findOne<T = any>(
  table: string,
  where: Record<string, any>,
  options?: QueryOptions
): Promise<T | null> {
  console.log(`🎭 Demo Mode: Mock findOne in ${table}`)
  return null
}

export async function findMany<T = any>(
  table: string,
  where: Record<string, any> = {},
  orderBy?: string,
  limit?: number,
  offset?: number,
  options?: QueryOptions
): Promise<T[]> {
  console.log(`🎭 Demo Mode: Mock findMany in ${table}`)
  return []
}

export async function insertOne<T = any>(
  table: string,
  data: Record<string, any>,
  returning = '*',
  options?: QueryOptions
): Promise<T> {
  console.log(`🎭 Demo Mode: Mock insertOne in ${table}`)
  return {} as T
}

export async function updateOne<T = any>(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>,
  returning = '*',
  options?: QueryOptions
): Promise<T | null> {
  console.log(`🎭 Demo Mode: Mock updateOne in ${table}`)
  return null
}

export async function deleteOne(
  table: string,
  where: Record<string, any>,
  options?: QueryOptions
): Promise<boolean> {
  console.log(`🎭 Demo Mode: Mock deleteOne in ${table}`)
  return false
}

export async function paginate<T = any>(
  table: string,
  where: Record<string, any> = {},
  page = 1,
  limit = 20,
  orderBy = 'created_at DESC',
  options?: QueryOptions
): Promise<PaginatedResult<T>> {
  console.log(`🎭 Demo Mode: Mock paginate in ${table}`)
  return {
    data: [],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasMore: false
    }
  }
}

export function initializeDatabase(config?: DatabaseConfig): MockDatabase {
  return getDatabase(config)
}

export async function healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime: number }> {
  console.log('🎭 Demo Mode: Mock health check')
  return {
    status: 'healthy',
    responseTime: 1
  }
}

export function resetDatabaseConnection(): void {
  console.log('🎭 Demo Mode: Mock database connection reset')
  mockDb = null
}

export { MockDatabase as Database }
export default getDatabase
