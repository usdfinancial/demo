import { BaseService } from './baseService'

// Simplified user types for standard Alchemy Account Kit behavior
export interface SimpleUser {
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
 * Simplified User Service - Standard Alchemy Account Kit Behavior
 * 
 * This service stores users separately for each authentication method.
 * No email consolidation - each auth method creates its own user record.
 * This matches Alchemy Account Kit's default behavior.
 */
class SimpleUserService extends BaseService {
  constructor() {
    super('users')
  }

  /**
   * Create a new user (one user per auth method)
   */
  async createUser(userData: CreateUserRequest): Promise<SimpleUser> {
    try {
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
        throw new Error('Failed to create user')
      }
      
      return this.mapDatabaseRowToUser(result[0])
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  /**
   * Find user by smart wallet address
   */
  async findUserByWalletAddress(walletAddress: string): Promise<SimpleUser | null> {
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
      
      return this.mapDatabaseRowToUser(result[0])
    } catch (error) {
      console.error('Error finding user by wallet address:', error)
      return null
    }
  }

  /**
   * Find user by email (first match only - no consolidation)
   */
  async findUserByEmail(email: string): Promise<SimpleUser | null> {
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
      
      return this.mapDatabaseRowToUser(result[0])
    } catch (error) {
      console.error('Error finding user by email:', error)
      return null
    }
  }

  /**
   * Update user's last authentication time
   */
  async updateLastAuth(userId: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET last_auth_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `
      
      await this.customQuery(query, [userId])
    } catch (error) {
      console.error('Error updating last auth:', error)
    }
  }

  /**
   * Verify user's email
   */
  async verifyEmail(userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE users 
        SET email_verified = true, updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `
      
      const result = await this.customQuery(query, [userId])
      return result.length > 0
    } catch (error) {
      console.error('Error verifying email:', error)
      return false
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<SimpleUser | null> {
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
      
      return this.mapDatabaseRowToUser(result[0])
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<SimpleUser | null> {
    try {
      const query = `
        UPDATE users 
        SET 
          first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          updated_at = NOW()
        WHERE id = $1 AND is_active = true
        RETURNING *
      `
      
      const result = await this.customQuery(query, [
        userId,
        profile.firstName || null,
        profile.lastName || null
      ])
      
      if (result.length === 0) {
        return null
      }
      
      return this.mapDatabaseRowToUser(result[0])
    } catch (error) {
      console.error('Error updating user profile:', error)
      return null
    }
  }

  /**
   * Map database row to user object
   */
  private mapDatabaseRowToUser(row: any): SimpleUser {
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

// Export singleton instance (renamed for compatibility)
export const userAuthService = new SimpleUserService()
export default userAuthService

// Legacy exports for compatibility
export type USDFinancialUser = SimpleUser
export type AuthenticationResult = { user: SimpleUser; isNewUser: boolean }

// Also export with original name for any remaining references
export const simpleUserService = userAuthService