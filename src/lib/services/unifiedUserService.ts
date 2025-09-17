import { BaseService, ServiceError, ErrorCode } from './baseService'

// Unified user types for consistent behavior across all services
export interface UnifiedUser {
  id: string
  email?: string
  smartWalletAddress: string
  eoaAddress?: string
  authMethod: AuthMethodType
  providerUserId?: string
  isEmailVerified: boolean
  createdAt: Date
  lastAuthAt?: Date
  profile?: UserProfile
}

export type AuthMethodType = 'email' | 'google' | 'passkey' | 'wallet'

export interface UserProfile {
  firstName?: string
  lastName?: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  timezone?: string
  preferences?: Record<string, any>
}

export interface CreateUserRequest {
  email?: string
  smartWalletAddress: string
  eoaAddress?: string
  authMethod: AuthMethodType
  providerUserId?: string
  profile?: UserProfile
}

/**
 * Unified User Service - Single Source of Truth
 *
 * This service provides consistent user operations for both NextJS and Netlify functions.
 * Eliminates duplication and ensures data consistency across all platforms.
 */
export class UnifiedUserService extends BaseService {
  constructor() {
    super('users')
  }

  /**
   * Create a new user with comprehensive validation
   */
  async createUser(userData: CreateUserRequest): Promise<UnifiedUser> {
    // Comprehensive validation
    this.validateCreateUserRequest(userData)

    return await this.withTransaction(async () => {
      const userId = this.generateId()

      const query = `
        INSERT INTO users (
          id, email, smart_wallet_address, eoa_address, primary_auth_method,
          first_name, last_name, email_verified, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
        RETURNING *
      `

      const result = await this.customQuery(query, [
        userId,
        userData.email?.toLowerCase() || null,
        userData.smartWalletAddress.toLowerCase(),
        userData.eoaAddress?.toLowerCase() || null,
        userData.authMethod,
        userData.profile?.firstName || null,
        userData.profile?.lastName || null,
        false // Email verification starts as false
      ])

      if (result.length === 0) {
        throw new ServiceError(
          ErrorCode.DATABASE_ERROR,
          'Failed to create user - no rows returned',
          'createUser'
        )
      }

      return this.mapDatabaseRowToUser(result[0])
    })
  }

  /**
   * Find user by smart wallet address with validation
   */
  async findUserByWalletAddress(walletAddress: string): Promise<UnifiedUser | null> {
    // Validate wallet address format
    this.validateAddress(walletAddress, 'walletAddress')

    const cacheKey = this.getCacheKey('find_by_wallet', { walletAddress: walletAddress.toLowerCase() })
    const cached = this.getCache<UnifiedUser>(cacheKey)
    if (cached) return cached

    try {
      const query = `
        SELECT * FROM users
        WHERE smart_wallet_address = $1 AND is_active = true
        LIMIT 1
      `

      const result = await this.customQuery(query, [walletAddress.toLowerCase()])

      if (result.length === 0) {
        return null
      }

      const user = this.mapDatabaseRowToUser(result[0])

      // Cache for 5 minutes
      this.setCache(cacheKey, user, 5 * 60 * 1000)

      return user
    } catch (error) {
      console.error('Error finding user by wallet address:', error)
      return null
    }
  }

  /**
   * Find user by email with validation
   */
  async findUserByEmail(email: string): Promise<UnifiedUser | null> {
    // Validate email format
    this.validateEmail(email)

    const cacheKey = this.getCacheKey('find_by_email', { email: email.toLowerCase() })
    const cached = this.getCache<UnifiedUser>(cacheKey)
    if (cached) return cached

    try {
      const query = `
        SELECT * FROM users
        WHERE email = $1 AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1
      `

      const result = await this.customQuery(query, [email.toLowerCase()])

      if (result.length === 0) {
        return null
      }

      const user = this.mapDatabaseRowToUser(result[0])

      // Cache for 5 minutes
      this.setCache(cacheKey, user, 5 * 60 * 1000)

      return user
    } catch (error) {
      console.error('Error finding user by email:', error)
      return null
    }
  }

  /**
   * Update user's last authentication time with cache invalidation
   */
  async updateLastAuth(userId: string): Promise<void> {
    this.validateUUID(userId, 'userId')

    try {
      const query = `
        UPDATE users
        SET last_auth_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND is_active = true
      `

      const result = await this.customQuery(query, [userId])

      // Clear related cache entries
      this.clearCache('find_by')

      console.log(`✅ Updated last auth for user ${userId}`)
    } catch (error) {
      console.error('Error updating last auth:', error)
      throw new ServiceError(
        ErrorCode.DATABASE_ERROR,
        'Failed to update last authentication time',
        'updateLastAuth',
        error
      )
    }
  }

  /**
   * Get user by ID with caching
   */
  async getUserById(userId: string): Promise<UnifiedUser | null> {
    this.validateUUID(userId, 'userId')

    const cacheKey = this.getCacheKey('find_by_id', { userId })
    const cached = this.getCache<UnifiedUser>(cacheKey)
    if (cached) return cached

    try {
      const query = `
        SELECT * FROM users
        WHERE id = $1 AND is_active = true
        LIMIT 1
      `

      const result = await this.customQuery(query, [userId])

      if (result.length === 0) {
        return null
      }

      const user = this.mapDatabaseRowToUser(result[0])

      // Cache for 10 minutes
      this.setCache(cacheKey, user, 10 * 60 * 1000)

      return user
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  /**
   * Verify user's email
   */
  async verifyEmail(userId: string): Promise<boolean> {
    this.validateUUID(userId, 'userId')

    try {
      const query = `
        UPDATE users
        SET email_verified = true, updated_at = NOW()
        WHERE id = $1 AND is_active = true
        RETURNING id
      `

      const result = await this.customQuery(query, [userId])

      // Clear cache for this user
      this.clearCache(`find_by_id:${userId}`)

      return result.length > 0
    } catch (error) {
      console.error('Error verifying email:', error)
      return false
    }
  }

  /**
   * Comprehensive validation for user creation
   */
  private validateCreateUserRequest(userData: CreateUserRequest): void {
    // Validate smart wallet address (required)
    if (!userData.smartWalletAddress) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        'Smart wallet address is required',
        'validateCreateUserRequest'
      )
    }

    this.validateAddress(userData.smartWalletAddress, 'smartWalletAddress')

    // Validate EOA address if provided
    if (userData.eoaAddress) {
      this.validateAddress(userData.eoaAddress, 'eoaAddress')
    }

    // Validate email if provided
    if (userData.email) {
      this.validateEmail(userData.email)
    }

    // Validate auth method
    this.validateEnum(userData.authMethod, ['email', 'google', 'passkey', 'wallet'], 'authMethod')

    // Business rule validation
    if (userData.authMethod === 'email' && !userData.email) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        'Email is required when authMethod is "email"',
        'validateCreateUserRequest'
      )
    }
  }

  /**
   * Enhanced email validation
   */
  private validateEmail(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        'Email must be a valid string',
        'validateEmail'
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid email format',
        'validateEmail'
      )
    }

    // Email length validation
    if (email.length > 255) {
      throw new ServiceError(
        ErrorCode.VALIDATION_ERROR,
        'Email address too long (max 255 characters)',
        'validateEmail'
      )
    }
  }

  /**
   * Map database row to user object with proper typing
   */
  private mapDatabaseRowToUser(row: any): UnifiedUser {
    return {
      id: row.id,
      email: row.email,
      smartWalletAddress: row.smart_wallet_address,
      eoaAddress: row.eoa_address,
      authMethod: row.primary_auth_method as AuthMethodType,
      isEmailVerified: row.email_verified,
      createdAt: new Date(row.created_at),
      lastAuthAt: row.last_auth_at ? new Date(row.last_auth_at) : undefined,
      profile: {
        firstName: row.first_name,
        lastName: row.last_name,
        displayName: row.display_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email || 'User'
      }
    }
  }
}

// Export singleton instance
export const unifiedUserService = new UnifiedUserService()
export default unifiedUserService

// Legacy compatibility exports
export type { UnifiedUser as SimpleUser }
export const userAuthService = unifiedUserService
export const simpleUserService = unifiedUserService