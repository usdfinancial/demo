import { BaseService } from './baseService'

export interface NetworkError {
  id: string
  userId?: string
  network: string
  chainId: number
  errorType: 'rpc_error' | 'rate_limit' | 'timeout' | 'validation' | 'unknown'
  errorMessage: string
  errorDetails?: Record<string, any>
  endpoint?: string
  ipAddress?: string
  userAgent?: string
  requestId?: string
  retryCount: number
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateNetworkErrorRequest {
  userId?: string
  network: string
  chainId: number
  errorType: 'rpc_error' | 'rate_limit' | 'timeout' | 'validation' | 'unknown'
  errorMessage: string
  errorDetails?: Record<string, any>
  endpoint?: string
  ipAddress?: string
  userAgent?: string
  requestId?: string
  retryCount?: number
}

/**
 * Network Error Service - Track and monitor blockchain network errors
 *
 * This service ensures that network errors are properly logged and tracked
 * for monitoring, debugging, and service reliability improvements.
 */
export class NetworkErrorService extends BaseService {
  constructor() {
    super('network_errors')
  }

  /**
   * Record a network error with comprehensive details
   */
  async recordNetworkError(errorData: CreateNetworkErrorRequest): Promise<NetworkError> {
    await this.ensureNetworkErrorTable()

    try {
      const errorId = this.generateId()

      const query = `
        INSERT INTO network_errors (
          id, user_id, network, chain_id, error_type, error_message,
          error_details, endpoint, ip_address, user_agent, request_id,
          retry_count, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        errorId,
        errorData.userId || null,
        errorData.network,
        errorData.chainId,
        errorData.errorType,
        errorData.errorMessage,
        errorData.errorDetails ? JSON.stringify(errorData.errorDetails) : null,
        errorData.endpoint || null,
        errorData.ipAddress || null,
        errorData.userAgent || null,
        errorData.requestId || null,
        errorData.retryCount || 0
      ])

      if (result.length === 0) {
        throw new Error('Failed to record network error')
      }

      const networkError = this.mapDatabaseRowToNetworkError(result[0])

      console.log(`🚨 Network error recorded:`, {
        network: errorData.network,
        errorType: errorData.errorType,
        errorMessage: errorData.errorMessage?.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      })

      return networkError
    } catch (error) {
      console.error('Error recording network error:', error)
      throw error
    }
  }

  /**
   * Get recent network errors for monitoring
   */
  async getRecentNetworkErrors(
    network?: string,
    errorType?: string,
    hoursBack: number = 24,
    limit: number = 100
  ): Promise<NetworkError[]> {
    try {
      let query = `
        SELECT * FROM network_errors
        WHERE created_at > NOW() - INTERVAL '${hoursBack} hours'
      `
      const params: any[] = []

      if (network) {
        query += ` AND network = $${params.length + 1}`
        params.push(network)
      }

      if (errorType) {
        query += ` AND error_type = $${params.length + 1}`
        params.push(errorType)
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`
      params.push(limit)

      const result = await this.customQuery(query, params)
      return result.map(row => this.mapDatabaseRowToNetworkError(row))
    } catch (error) {
      console.error('Error getting recent network errors:', error)
      return []
    }
  }

  /**
   * Get network error statistics for monitoring dashboard
   */
  async getNetworkErrorStats(hoursBack: number = 24): Promise<{
    totalErrors: number
    errorsByType: Record<string, number>
    errorsByNetwork: Record<string, number>
    topErrors: Array<{ message: string; count: number }>
  }> {
    try {
      const statsQuery = `
        SELECT
          COUNT(*) as total_errors,
          error_type,
          network,
          error_message,
          COUNT(*) OVER() as grand_total
        FROM network_errors
        WHERE created_at > NOW() - INTERVAL '${hoursBack} hours'
        GROUP BY error_type, network, error_message
        ORDER BY COUNT(*) DESC
      `

      const result = await this.customQuery(statsQuery, [])

      const errorsByType: Record<string, number> = {}
      const errorsByNetwork: Record<string, number> = {}
      const topErrors: Array<{ message: string; count: number }> = []

      result.forEach(row => {
        errorsByType[row.error_type] = (errorsByType[row.error_type] || 0) + 1
        errorsByNetwork[row.network] = (errorsByNetwork[row.network] || 0) + 1
      })

      // Get top 10 error messages
      const errorCounts: Record<string, number> = {}
      result.forEach(row => {
        errorCounts[row.error_message] = (errorCounts[row.error_message] || 0) + 1
      })

      Object.entries(errorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([message, count]) => {
          topErrors.push({ message: message.substring(0, 100) + '...', count })
        })

      return {
        totalErrors: result.length > 0 ? parseInt(result[0].grand_total) : 0,
        errorsByType,
        errorsByNetwork,
        topErrors
      }
    } catch (error) {
      console.error('Error getting network error stats:', error)
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsByNetwork: {},
        topErrors: []
      }
    }
  }

  /**
   * Mark network error as resolved
   */
  async resolveNetworkError(errorId: string): Promise<boolean> {
    this.validateUUID(errorId, 'errorId')

    try {
      const query = `
        UPDATE network_errors
        SET resolved_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND resolved_at IS NULL
        RETURNING id
      `

      const result = await this.customQuery(query, [errorId])
      return result.length > 0
    } catch (error) {
      console.error('Error resolving network error:', error)
      return false
    }
  }

  /**
   * Ensure the network_errors table exists
   */
  private async ensureNetworkErrorTable(): Promise<void> {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS network_errors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          network VARCHAR(50) NOT NULL,
          chain_id INTEGER NOT NULL,
          error_type VARCHAR(50) NOT NULL,
          error_message TEXT NOT NULL,
          error_details JSONB,
          endpoint VARCHAR(255),
          ip_address INET,
          user_agent TEXT,
          request_id VARCHAR(255),
          retry_count INTEGER DEFAULT 0,
          resolved_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_network_errors_network ON network_errors(network);
        CREATE INDEX IF NOT EXISTS idx_network_errors_type ON network_errors(error_type);
        CREATE INDEX IF NOT EXISTS idx_network_errors_created_at ON network_errors(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_network_errors_unresolved ON network_errors(resolved_at) WHERE resolved_at IS NULL;
      `

      await this.customQuery(createTableQuery, [])
    } catch (error) {
      console.warn('⚠️ Could not ensure network_errors table exists:', error.message)
    }
  }

  /**
   * Map database row to NetworkError object
   */
  private mapDatabaseRowToNetworkError(row: any): NetworkError {
    return {
      id: row.id,
      userId: row.user_id,
      network: row.network,
      chainId: row.chain_id,
      errorType: row.error_type,
      errorMessage: row.error_message,
      errorDetails: row.error_details ? JSON.parse(row.error_details) : undefined,
      endpoint: row.endpoint,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      requestId: row.request_id,
      retryCount: row.retry_count,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}

// Export singleton instance
export const networkErrorService = new NetworkErrorService()
export default networkErrorService