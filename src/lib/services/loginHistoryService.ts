import { BaseService } from './baseService'

export interface LoginAttempt {
  id: string
  userId?: string
  email?: string
  loginMethod: 'email' | 'google' | 'passkey' | 'wallet'
  loginStatus: 'success' | 'failed' | 'suspicious' | 'blocked'
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  geolocation?: any
  riskScore?: number
  failureReason?: string
  createdAt: Date
}

export interface CreateLoginAttemptRequest {
  userId?: string
  email?: string
  loginMethod: 'email' | 'google' | 'passkey' | 'wallet'
  loginStatus: 'success' | 'failed' | 'suspicious' | 'blocked'
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  geolocation?: any
  riskScore?: number
  failureReason?: string
}

/**
 * Login History Service - Comprehensive authentication tracking for financial services
 * 
 * Required for:
 * - Regulatory compliance and audit trails
 * - Fraud detection and prevention
 * - Security monitoring and alerting
 * - Customer support and investigation
 */
class LoginHistoryService extends BaseService {
  constructor() {
    super('login_history')
  }

  /**
   * Record a login attempt (success or failure) - with duplicate prevention
   */
  async recordLoginAttempt(data: CreateLoginAttemptRequest): Promise<LoginAttempt> {
    try {
      // First, ensure the login_history table exists
      await this.ensureLoginHistoryTable()

      // Validate and enhance login method accuracy for USD Financial compliance
      const validatedData = this.validateAndEnhanceLoginData(data)

      // Check for recent duplicate login attempts to prevent double recording
      if (validatedData.loginStatus === 'success') {
        const recentAttempts = await this.getRecentSuccessfulAttempts(
          validatedData.userId,
          validatedData.email,
          validatedData.ipAddress,
          2 // Check last 2 minutes
        )

        if (recentAttempts.length > 0) {
          console.log('🚫 Duplicate successful login attempt detected, skipping:', {
            userId: validatedData.userId,
            email: validatedData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
            recentAttempts: recentAttempts.length,
            lastAttempt: recentAttempts[0].createdAt
          })

          // Return the most recent existing attempt instead of creating duplicate
          return recentAttempts[0]
        }
      }

      const loginId = this.generateId()

      const query = `
        INSERT INTO login_history (
          id, user_id, email, login_method, login_status,
          ip_address, user_agent, device_fingerprint, geolocation,
          risk_score, failure_reason, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        loginId,
        validatedData.userId || null,
        validatedData.email?.toLowerCase() || null,
        validatedData.loginMethod,
        validatedData.loginStatus,
        validatedData.ipAddress || null,
        validatedData.userAgent || null,
        validatedData.deviceFingerprint || null,
        validatedData.geolocation ? JSON.stringify(validatedData.geolocation) : null,
        validatedData.riskScore || null,
        validatedData.failureReason || null
      ])

      if (result.length === 0) {
        throw new Error('Failed to record login attempt')
      }

      const loginAttempt = this.mapDatabaseRowToLoginAttempt(result[0])

      // Enhanced security logging with validation details
      console.log(`${validatedData.loginStatus === 'success' ? '✅' : '❌'} Login attempt recorded:`, {
        originalMethod: data.loginMethod,
        validatedMethod: validatedData.loginMethod,
        methodCorrected: data.loginMethod !== validatedData.loginMethod,
        status: validatedData.loginStatus,
        email: validatedData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
        ipAddress: validatedData.ipAddress?.replace(/(\d+\.\d+).*/, '$1.x.x'),
        riskScore: validatedData.riskScore,
        timestamp: new Date().toISOString()
      })

      // Check for suspicious patterns
      if (validatedData.loginStatus === 'failed') {
        await this.checkForSuspiciousActivity(validatedData.email, validatedData.ipAddress)
      }

      return loginAttempt
    } catch (error) {
      console.error('❌ Error recording login attempt:', error)
      throw error
    }
  }

  /**
   * Get login history for a user
   */
  async getUserLoginHistory(userId: string, limit: number = 50): Promise<LoginAttempt[]> {
    try {
      const query = `
        SELECT * FROM login_history 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `

      const result = await this.customQuery(query, [userId, limit])
      return result.map(row => this.mapDatabaseRowToLoginAttempt(row))
    } catch (error) {
      console.error('❌ Error getting user login history:', error)
      return []
    }
  }

  /**
   * Get recent successful login attempts for duplicate detection
   */
  async getRecentSuccessfulAttempts(
    userId?: string,
    email?: string,
    ipAddress?: string,
    minutesBack: number = 2
  ): Promise<LoginAttempt[]> {
    try {
      let query = `
        SELECT * FROM login_history
        WHERE login_status = 'success'
          AND created_at > NOW() - INTERVAL '${minutesBack} minutes'
      `
      const params: any[] = []

      // Match by userId (most reliable) or email + IP combination
      if (userId) {
        query += ` AND user_id = $${params.length + 1}`
        params.push(userId)
      } else if (email && ipAddress) {
        query += ` AND email = $${params.length + 1} AND ip_address = $${params.length + 2}`
        params.push(email.toLowerCase(), ipAddress)
      } else if (email) {
        query += ` AND email = $${params.length + 1}`
        params.push(email.toLowerCase())
      } else {
        // No reliable identifier, skip duplicate check
        return []
      }

      query += ` ORDER BY created_at DESC LIMIT 5`

      const result = await this.customQuery(query, params)
      return result.map(row => this.mapDatabaseRowToLoginAttempt(row))
    } catch (error) {
      console.error('❌ Error getting recent successful attempts:', error)
      return []
    }
  }

  /**
   * Get failed login attempts for security monitoring
   */
  async getRecentFailedAttempts(
    email?: string,
    ipAddress?: string,
    minutesBack: number = 30
  ): Promise<LoginAttempt[]> {
    try {
      let query = `
        SELECT * FROM login_history
        WHERE login_status IN ('failed', 'suspicious', 'blocked')
          AND created_at > NOW() - INTERVAL '${minutesBack} minutes'
      `
      const params: any[] = []

      if (email) {
        query += ` AND email = $${params.length + 1}`
        params.push(email.toLowerCase())
      }

      if (ipAddress) {
        query += ` AND ip_address = $${params.length + 1}`
        params.push(ipAddress)
      }

      query += ` ORDER BY created_at DESC LIMIT 100`

      const result = await this.customQuery(query, params)
      return result.map(row => this.mapDatabaseRowToLoginAttempt(row))
    } catch (error) {
      console.error('❌ Error getting failed login attempts:', error)
      return []
    }
  }

  /**
   * Check for suspicious login patterns
   */
  private async checkForSuspiciousActivity(email?: string, ipAddress?: string): Promise<void> {
    try {
      if (email) {
        // Check for too many failed attempts from same email
        const emailAttempts = await this.getRecentFailedAttempts(email, undefined, 15)
        if (emailAttempts.length >= 5) {
          console.warn('🚨 Suspicious activity detected - too many failed attempts for email:', 
            email.replace(/(.{2}).*(@.*)/, '$1***$2'))
          
          // Could trigger additional security measures here
          await this.recordLoginAttempt({
            email,
            loginMethod: 'email',
            loginStatus: 'suspicious',
            ipAddress,
            failureReason: 'Too many failed attempts detected'
          })
        }
      }

      if (ipAddress) {
        // Check for too many failed attempts from same IP
        const ipAttempts = await this.getRecentFailedAttempts(undefined, ipAddress, 15)
        if (ipAttempts.length >= 10) {
          console.warn('🚨 Suspicious activity detected - too many failed attempts from IP:', 
            ipAddress.replace(/(\d+\.\d+).*/, '$1.x.x'))
        }
      }
    } catch (error) {
      console.error('⚠️ Error checking suspicious activity:', error)
      // Don't throw - this shouldn't break the login flow
    }
  }

  /**
   * Get login statistics for security dashboard
   */
  async getLoginStatistics(days: number = 7): Promise<any> {
    try {
      const query = `
        SELECT 
          login_method,
          login_status,
          DATE(created_at) as login_date,
          COUNT(*) as attempt_count
        FROM login_history 
        WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY login_method, login_status, DATE(created_at)
        ORDER BY login_date DESC, login_method
      `

      const result = await this.customQuery(query, [])
      return result
    } catch (error) {
      console.error('❌ Error getting login statistics:', error)
      return []
    }
  }

  /**
   * Ensure the login_history table exists (create if missing)
   */
  private async ensureLoginHistoryTable(): Promise<void> {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS login_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          email VARCHAR(255),
          login_method VARCHAR(50) NOT NULL,
          login_status VARCHAR(20) NOT NULL,
          ip_address INET,
          user_agent TEXT,
          device_fingerprint TEXT,
          geolocation JSONB,
          risk_score INTEGER,
          failure_reason TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_login_history_email ON login_history(email);
        CREATE INDEX IF NOT EXISTS idx_login_history_ip_address ON login_history(ip_address);
        CREATE INDEX IF NOT EXISTS idx_login_history_status ON login_history(login_status);
        CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at DESC);
      `

      await this.customQuery(createTableQuery, [])
    } catch (error) {
      // Table might already exist or there might be permission issues
      console.warn('⚠️ Could not ensure login_history table exists:', error.message)
    }
  }

  /**
   * Validate and enhance login data for accuracy and compliance
   */
  private validateAndEnhanceLoginData(data: CreateLoginAttemptRequest): CreateLoginAttemptRequest {
    const enhanced = { ...data }

    // Validate login method accuracy using multiple indicators
    if (enhanced.loginMethod && enhanced.userAgent) {
      const correctedMethod = this.inferActualLoginMethod(enhanced.loginMethod, enhanced.userAgent, enhanced.email)

      if (correctedMethod !== enhanced.loginMethod) {
        console.warn('🔧 Correcting login method:', {
          original: enhanced.loginMethod,
          corrected: correctedMethod,
          reason: 'User agent and context analysis',
          email: enhanced.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
        })
        enhanced.loginMethod = correctedMethod
      }
    }

    // Enhance risk score if missing
    if (!enhanced.riskScore && enhanced.userAgent && enhanced.ipAddress) {
      enhanced.riskScore = this.calculateEnhancedRiskScore(enhanced)
    }

    // Validate required fields for financial services compliance
    if (!enhanced.loginMethod || !enhanced.loginStatus) {
      throw new Error('Missing required fields for compliance logging')
    }

    // Ensure login method is one of allowed values
    const allowedMethods: Array<'email' | 'google' | 'passkey' | 'wallet'> = ['email', 'google', 'passkey', 'wallet']
    if (!allowedMethods.includes(enhanced.loginMethod as any)) {
      console.warn('⚠️ Invalid login method, defaulting to email:', enhanced.loginMethod)
      enhanced.loginMethod = 'email'
    }

    return enhanced
  }

  /**
   * Infer actual login method using user agent and context analysis for Alchemy Account Kit
   */
  private inferActualLoginMethod(
    reportedMethod: string,
    userAgent: string,
    email?: string
  ): 'email' | 'google' | 'passkey' | 'wallet' {
    // If method is already google or passkey, trust it (should be accurate from frontend detection)
    if (reportedMethod === 'google' || reportedMethod === 'passkey' || reportedMethod === 'wallet') {
      return reportedMethod as any
    }

    // Analyze user agent for OAuth indicators (fallback detection)
    const userAgentLower = userAgent.toLowerCase()

    // Check for Google OAuth redirect patterns
    if (userAgentLower.includes('google') ||
        userAgentLower.includes('gapi') ||
        userAgentLower.includes('oauth')) {
      return 'google'
    }

    // Check for passkey/WebAuthn indicators
    if (userAgentLower.includes('webauthn') ||
        userAgentLower.includes('passkey')) {
      return 'passkey'
    }

    // Check for Alchemy Account Kit wallet patterns (no MetaMask references)
    if (userAgentLower.includes('alchemy') ||
        userAgentLower.includes('account-kit') ||
        userAgentLower.includes('smart-account') ||
        !email) {
      return 'wallet'
    }

    // Default to email if we have an email address
    return email ? 'email' : 'wallet'
  }

  /**
   * Calculate enhanced risk score for financial services
   */
  private calculateEnhancedRiskScore(data: CreateLoginAttemptRequest): number {
    let score = 0

    // Missing user agent (bot indicator)
    if (!data.userAgent || data.userAgent === 'unknown') {
      score += 15
    }

    // Suspicious user agent patterns
    if (data.userAgent) {
      const ua = data.userAgent.toLowerCase()
      if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
        score += 25
      }
      if (ua.length < 50) { // Very short user agent
        score += 10
      }
    }

    // IP address analysis
    if (!data.ipAddress || data.ipAddress === 'unknown') {
      score += 10
    } else {
      // Check for localhost/private IPs in production
      if (data.ipAddress.startsWith('127.') ||
          data.ipAddress.startsWith('192.168.') ||
          data.ipAddress.startsWith('10.')) {
        score += 5
      }
    }

    // Missing device fingerprint
    if (!data.deviceFingerprint || data.deviceFingerprint === 'unknown') {
      score += 10
    }

    // Failed login attempt
    if (data.loginStatus === 'failed') {
      score += 20
    }

    return Math.min(score, 100) // Cap at 100
  }

  /**
   * Map database row to LoginAttempt object
   */
  private mapDatabaseRowToLoginAttempt(row: any): LoginAttempt {
    return {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      loginMethod: row.login_method,
      loginStatus: row.login_status,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      deviceFingerprint: row.device_fingerprint,
      geolocation: row.geolocation ? JSON.parse(row.geolocation) : undefined,
      riskScore: row.risk_score,
      failureReason: row.failure_reason,
      createdAt: new Date(row.created_at)
    }
  }
}

// Export singleton instance
export const loginHistoryService = new LoginHistoryService()
export default loginHistoryService