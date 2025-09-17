import { BaseService } from './baseService'
import { randomBytes } from 'crypto'

export interface UserSession {
  id: string
  userId: string
  sessionToken: string
  refreshToken?: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  isActive: boolean
  createdAt: Date
}

export interface CreateSessionRequest {
  userId: string
  ipAddress?: string
  userAgent?: string
  expiresInHours?: number
}

export interface SessionInfo {
  sessionToken: string
  refreshToken?: string
  expiresAt: Date
}

/**
 * Session Service - Manages user authentication sessions for financial services compliance
 * 
 * Provides comprehensive session tracking required for:
 * - Financial services audit trails
 * - Security monitoring
 * - Regulatory compliance
 */
class SessionService extends BaseService {
  constructor() {
    super('user_sessions')
  }

  /**
   * Create a new authentication session
   */
  async createSession(data: CreateSessionRequest): Promise<SessionInfo> {
    try {
      const sessionToken = this.generateSecureToken()
      const refreshToken = this.generateSecureToken()
      const expiresInHours = data.expiresInHours || 24 // Default 24 hours
      const expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000))

      const query = `
        INSERT INTO user_sessions (
          user_id, session_token, refresh_token, expires_at, 
          ip_address, user_agent, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
        RETURNING session_token, refresh_token, expires_at
      `

      const result = await this.customQuery(query, [
        data.userId,
        sessionToken,
        refreshToken,
        expiresAt,
        data.ipAddress || null,
        data.userAgent || null
      ])

      if (result.length === 0) {
        throw new Error('Failed to create session')
      }

      console.log('✅ Session created:', {
        userId: data.userId,
        ipAddress: data.ipAddress?.replace(/(\d+\.\d+).*/, '$1.x.x'), // Mask IP for logging
        userAgent: data.userAgent?.substring(0, 50),
        expiresAt
      })

      return {
        sessionToken,
        refreshToken,
        expiresAt
      }
    } catch (error) {
      console.error('❌ Error creating session:', error)
      throw error
    }
  }

  /**
   * Validate and retrieve session information
   */
  async validateSession(sessionToken: string): Promise<UserSession | null> {
    try {
      const query = `
        SELECT 
          id, user_id, session_token, refresh_token, expires_at,
          ip_address, user_agent, is_active, created_at
        FROM user_sessions 
        WHERE session_token = $1 
          AND is_active = true 
          AND expires_at > NOW()
        LIMIT 1
      `

      const result = await this.customQuery(query, [sessionToken])

      if (result.length === 0) {
        return null
      }

      const session = this.mapDatabaseRowToSession(result[0])
      
      // Update last activity timestamp
      await this.updateSessionActivity(session.id)

      return session
    } catch (error) {
      console.error('❌ Error validating session:', error)
      return null
    }
  }

  /**
   * Update session activity timestamp
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const query = `
        UPDATE user_sessions 
        SET updated_at = NOW() 
        WHERE id = $1
      `
      await this.customQuery(query, [sessionId])
    } catch (error) {
      console.error('⚠️ Error updating session activity:', error)
      // Don't throw - this is not critical
    }
  }

  /**
   * Invalidate a specific session (logout)
   */
  async invalidateSession(sessionToken: string): Promise<boolean> {
    try {
      const query = `
        UPDATE user_sessions 
        SET is_active = false, updated_at = NOW() 
        WHERE session_token = $1
        RETURNING id
      `

      const result = await this.customQuery(query, [sessionToken])
      
      console.log('✅ Session invalidated:', {
        sessionId: result[0]?.id,
        timestamp: new Date().toISOString()
      })

      return result.length > 0
    } catch (error) {
      console.error('❌ Error invalidating session:', error)
      return false
    }
  }

  /**
   * Invalidate all sessions for a user (security action)
   */
  async invalidateAllUserSessions(userId: string): Promise<number> {
    try {
      const query = `
        UPDATE user_sessions 
        SET is_active = false, updated_at = NOW() 
        WHERE user_id = $1 AND is_active = true
        RETURNING id
      `

      const result = await this.customQuery(query, [userId])
      
      console.log('🔒 All user sessions invalidated:', {
        userId,
        sessionCount: result.length,
        timestamp: new Date().toISOString()
      })

      return result.length
    } catch (error) {
      console.error('❌ Error invalidating user sessions:', error)
      throw error
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    try {
      const query = `
        SELECT 
          id, user_id, session_token, expires_at,
          ip_address, user_agent, is_active, created_at
        FROM user_sessions 
        WHERE user_id = $1 
          AND is_active = true 
          AND expires_at > NOW()
        ORDER BY created_at DESC
      `

      const result = await this.customQuery(query, [userId])
      return result.map(row => this.mapDatabaseRowToSession(row))
    } catch (error) {
      console.error('❌ Error getting user sessions:', error)
      return []
    }
  }

  /**
   * Clean up expired sessions (maintenance function)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const query = `
        UPDATE user_sessions 
        SET is_active = false, updated_at = NOW() 
        WHERE expires_at < NOW() AND is_active = true
        RETURNING id
      `

      const result = await this.customQuery(query, [])
      
      console.log('🧹 Expired sessions cleaned up:', {
        count: result.length,
        timestamp: new Date().toISOString()
      })

      return result.length
    } catch (error) {
      console.error('❌ Error cleaning up sessions:', error)
      return 0
    }
  }

  /**
   * Generate a cryptographically secure token
   */
  private generateSecureToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Map database row to UserSession object
   */
  private mapDatabaseRowToSession(row: any): UserSession {
    return {
      id: row.id,
      userId: row.user_id,
      sessionToken: row.session_token,
      refreshToken: row.refresh_token,
      expiresAt: new Date(row.expires_at),
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      isActive: row.is_active,
      createdAt: new Date(row.created_at)
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService()
export default sessionService