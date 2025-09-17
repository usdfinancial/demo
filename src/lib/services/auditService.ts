import { BaseService } from './baseService'

export interface AuditLog {
  id: string
  userId?: string
  action: string
  resource?: string
  resourceId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface CreateAuditLogRequest {
  userId?: string
  action: string
  resource?: string
  resourceId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Audit Service - Comprehensive activity logging for financial services compliance
 * 
 * Tracks all user actions and system events for:
 * - Regulatory compliance (PCI DSS, SOX, etc.)
 * - Security monitoring and incident response
 * - Forensic analysis and investigation
 * - Audit trails for financial transactions
 */
class AuditService extends BaseService {
  constructor() {
    super('audit_logs')
  }

  /**
   * Log a user or system action
   */
  async logAction(data: CreateAuditLogRequest): Promise<AuditLog> {
    try {
      // Ensure the audit_logs table exists
      await this.ensureAuditLogsTable()

      const auditId = this.generateId()
      const severity = data.severity || 'low'
      
      const query = `
        INSERT INTO audit_logs (
          id, user_id, action, resource, resource_id, 
          details, ip_address, user_agent, severity, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        auditId,
        data.userId || null,
        data.action,
        data.resource || null,
        data.resourceId || null,
        data.details ? JSON.stringify(data.details) : null,
        data.ipAddress || null,
        data.userAgent || null,
        severity
      ])

      if (result.length === 0) {
        throw new Error('Failed to create audit log')
      }

      const auditLog = this.mapDatabaseRowToAuditLog(result[0])

      // Log to console for immediate visibility (can be configured)
      const logLevel = severity === 'critical' ? '🔴' : 
                      severity === 'high' ? '🟠' : 
                      severity === 'medium' ? '🟡' : '🟢'
      
      console.log(`${logLevel} AUDIT:`, {
        action: data.action,
        resource: data.resource,
        userId: data.userId,
        ipAddress: data.ipAddress?.replace(/(\d+\.\d+).*/, '$1.x.x'),
        severity,
        timestamp: new Date().toISOString()
      })

      return auditLog
    } catch (error) {
      console.error('❌ Error creating audit log:', error)
      // Don't throw - audit logging should not break the main flow
      return {
        id: 'error',
        action: data.action,
        severity: data.severity || 'low',
        timestamp: new Date(),
        ...data
      }
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(action: string, data: {
    userId?: string
    email?: string
    method?: string
    success?: boolean
    ipAddress?: string
    userAgent?: string
    details?: any
  }): Promise<void> {
    await this.logAction({
      userId: data.userId,
      action: `auth.${action}`,
      resource: 'authentication',
      details: {
        email: data.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
        method: data.method,
        success: data.success,
        ...data.details
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: data.success ? 'low' : 'medium'
    })
  }

  /**
   * Log financial transactions
   */
  async logTransaction(action: string, data: {
    userId: string
    transactionId?: string
    amount?: string
    currency?: string
    fromAddress?: string
    toAddress?: string
    ipAddress?: string
    userAgent?: string
    details?: any
  }): Promise<void> {
    await this.logAction({
      userId: data.userId,
      action: `transaction.${action}`,
      resource: 'transaction',
      resourceId: data.transactionId,
      details: {
        amount: data.amount,
        currency: data.currency,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        ...data.details
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: 'high' // Financial transactions are always high priority
    })
  }

  /**
   * Log user profile changes
   */
  async logProfileChange(action: string, data: {
    userId: string
    changes?: any
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await this.logAction({
      userId: data.userId,
      action: `profile.${action}`,
      resource: 'user_profile',
      resourceId: data.userId,
      details: {
        changes: data.changes
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: 'medium'
    })
  }

  /**
   * Log security events
   */
  async logSecurity(action: string, data: {
    userId?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    ipAddress?: string
    userAgent?: string
    details?: any
  }): Promise<void> {
    await this.logAction({
      userId: data.userId,
      action: `security.${action}`,
      resource: 'security',
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: data.severity || 'high'
    })
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, limit: number = 100): Promise<AuditLog[]> {
    try {
      const query = `
        SELECT * FROM audit_logs 
        WHERE user_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `

      const result = await this.customQuery(query, [userId, limit])
      return result.map(row => this.mapDatabaseRowToAuditLog(row))
    } catch (error) {
      console.error('❌ Error getting user audit logs:', error)
      return []
    }
  }

  /**
   * Get audit logs by action type
   */
  async getAuditLogsByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
    try {
      const query = `
        SELECT * FROM audit_logs 
        WHERE action LIKE $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `

      const result = await this.customQuery(query, [`%${action}%`, limit])
      return result.map(row => this.mapDatabaseRowToAuditLog(row))
    } catch (error) {
      console.error('❌ Error getting audit logs by action:', error)
      return []
    }
  }

  /**
   * Get high severity audit events
   */
  async getHighSeverityEvents(hours: number = 24): Promise<AuditLog[]> {
    try {
      const query = `
        SELECT * FROM audit_logs 
        WHERE severity IN ('high', 'critical')
          AND timestamp > NOW() - INTERVAL '${hours} hours'
        ORDER BY timestamp DESC 
        LIMIT 500
      `

      const result = await this.customQuery(query, [])
      return result.map(row => this.mapDatabaseRowToAuditLog(row))
    } catch (error) {
      console.error('❌ Error getting high severity events:', error)
      return []
    }
  }

  /**
   * Ensure the audit_logs table exists
   */
  private async ensureAuditLogsTable(): Promise<void> {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(255) NOT NULL,
          resource VARCHAR(100),
          resource_id VARCHAR(255),
          details JSONB,
          ip_address INET,
          user_agent TEXT,
          severity VARCHAR(20) DEFAULT 'low',
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for performance and compliance queries
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
      `

      await this.customQuery(createTableQuery, [])
    } catch (error) {
      console.warn('⚠️ Could not ensure audit_logs table exists:', error.message)
    }
  }

  /**
   * Map database row to AuditLog object
   */
  private mapDatabaseRowToAuditLog(row: any): AuditLog {
    return {
      id: row.id,
      userId: row.user_id,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      details: row.details ? JSON.parse(row.details) : undefined,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      severity: row.severity || 'low',
      timestamp: new Date(row.timestamp)
    }
  }
}

// Export singleton instance
export const auditService = new AuditService()
export default auditService