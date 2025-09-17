import { BaseService } from './baseService'
import type {
  User,
  UserProfile,
  UserWallet,
  UserNotification,
  StablecoinBalance,
  StablecoinSymbol,
  ChainId,
  TransactionType,
  PaginatedResult,
  UserDashboardData as IUserDashboardData
} from '@/lib/database/models'

// Use type from models file
export type UserDashboardData = IUserDashboardData

export interface PersonalizationPreferences {
  preferredCurrency: StablecoinSymbol
  dashboardLayout: 'compact' | 'detailed' | 'cards'
  chartTimeframe: '24h' | '7d' | '30d' | '90d'
  showBalances: boolean
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  notifications: {
    priceAlerts: boolean
    transactionUpdates: boolean
    marketNews: boolean
    productUpdates: boolean
    emailDigest: 'none' | 'daily' | 'weekly'
  }
  investmentGoals: Array<{
    type: 'retirement' | 'education' | 'house' | 'emergency' | 'other'
    targetAmount: string
    targetDate: string
    priority: 'low' | 'medium' | 'high'
  }>
}

export class UserService extends BaseService {
  constructor() {
    super('users')
  }

  // Get complete user profile with personalization data
  async getUserProfile(userId: string): Promise<User & {
    profile?: UserProfile
  }> {
    this.validateUUID(userId, 'userId')

    const cacheKey = this.getCacheKey('user_profile', { userId })
    const cached = this.getCache<User & { profile?: UserProfile }>(cacheKey)
    if (cached) return cached

    try {
      const user = await this.findOne<User>({ id: userId })
      if (!user) {
        throw new Error(`User not found: ${userId}`)
      }

      let profile = await this.customQuery<UserProfile>(`
        SELECT * FROM user_profiles WHERE user_id = $1
      `, [userId])

      // Create default profile if doesn't exist
      if (profile.length === 0) {
        const newProfile = await this.customQuery<UserProfile>(`
          INSERT INTO user_profiles (user_id, timezone, preferred_currency)
          VALUES ($1, 'UTC', 'USDC')
          RETURNING *
        `, [userId])
        profile = newProfile
      }

      const result = {
        ...user,
        profile: profile[0]
      }

      this.setCache(cacheKey, result, 10 * 60 * 1000) // 10 minutes cache
      return result
    } catch (error) {
      this.handleError(error, 'getUserProfile')
    }
  }

  // Get comprehensive dashboard data
  async getDashboardData(userId: string): Promise<UserDashboardData> {
    this.validateUUID(userId, 'userId')

    const cacheKey = this.getCacheKey('dashboard_data', { userId })
    const cached = this.getCache<UserDashboardData>(cacheKey)
    if (cached) return cached

    try {
      // Get user and profile
      const userWithProfile = await this.getUserProfile(userId)
      const user = userWithProfile
      const profile = userWithProfile.profile

      // Get total balance across all chains
      const balanceData = await this.customQuery<{
        total_balance: string
        chain_id: ChainId
        stablecoin: StablecoinSymbol
        balance: string
      }>(`
        SELECT 
          SUM(sb.balance::numeric) as total_balance,
          sb.chain_id,
          sb.stablecoin,
          sb.balance
        FROM stablecoin_balances sb
        WHERE sb.user_id = $1
        GROUP BY sb.chain_id, sb.stablecoin, sb.balance
        ORDER BY sb.balance::numeric DESC
      `, [userId])

      const totalBalance = balanceData.reduce((sum, item) => sum + parseFloat(item.balance || '0'), 0).toString()
      
      const balanceByChain = balanceData.map(item => ({
        chainId: item.chain_id,
        chainName: this.getChainName(item.chain_id),
        balance: item.balance,
        stablecoin: item.stablecoin
      }))

      // Get portfolio summary
      const portfolioData = await this.customQuery<{
        total_invested: string
        total_value: string
        unrealized_pnl: string
      }>(`
        SELECT 
          COALESCE(SUM(ui.total_invested::numeric), 0) as total_invested,
          COALESCE(SUM(ui.current_value::numeric), 0) as total_value,
          COALESCE(SUM(ui.unrealized_pnl::numeric), 0) as unrealized_pnl
        FROM user_investments ui
        WHERE ui.user_id = $1
      `, [userId])

      const portfolio = portfolioData[0]
      const totalInvested = parseFloat(portfolio.total_invested || '0')
      const totalValue = parseFloat(portfolio.total_value || '0')
      
      const portfolioSummary = {
        totalInvested: portfolio.total_invested || '0',
        totalValue: portfolio.total_value || '0',
        pnl: portfolio.unrealized_pnl || '0',
        pnlPercentage: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested * 100) : 0
      }

      // Get recent activity
      const recentActivity = await this.customQuery<{
        id: string
        type: string
        description: string
        amount: string
        created_at: string
      }>(`
        (
          SELECT 
            t.id,
            'transaction' as type,
            COALESCE(t.description, 
              CASE t.transaction_type
                WHEN 'deposit' THEN 'Deposited ' || t.amount || ' ' || t.stablecoin
                WHEN 'withdrawal' THEN 'Withdrew ' || t.amount || ' ' || t.stablecoin
                WHEN 'yield' THEN 'Yield earned from ' || COALESCE(t.protocol_name, 'DeFi')
                WHEN 'bridge' THEN 'Bridged ' || t.amount || ' ' || t.stablecoin
                WHEN 'investment' THEN 'Invested ' || t.amount || ' ' || t.stablecoin
                ELSE t.transaction_type || ' transaction'
              END
            ) as description,
            t.amount,
            t.created_at
          FROM transactions t
          WHERE t.user_id = $1
          ORDER BY t.created_at DESC
          LIMIT 3
        )
        UNION ALL
        (
          SELECT 
            ui.id,
            'investment' as type,
            'Investment in ' || ta.name as description,
            ui.total_invested as amount,
            ui.created_at
          FROM user_investments ui
          JOIN tokenized_assets ta ON ui.asset_id = ta.id
          WHERE ui.user_id = $1
          ORDER BY ui.created_at DESC
          LIMIT 2
        )
        ORDER BY created_at DESC
        LIMIT 5
      `, [userId])

      // Get notifications
      const notifications = await this.customQuery<{
        id: string
        title: string
        message: string
        notification_type: string
        is_read: boolean
        created_at: string
      }>(`
        SELECT id, title, message, notification_type, is_read, created_at
        FROM user_notifications
        WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
        LIMIT 10
      `, [userId])

      const dashboardData: UserDashboardData = {
        user,
        totalBalance,
        balanceByChain,
        portfolioSummary,
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          type: activity.type as TransactionType,
          description: activity.description,
          amount: activity.amount,
          timestamp: activity.created_at
        })),
        notifications: notifications.map(notif => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.notification_type,
          isRead: notif.is_read,
          createdAt: notif.created_at
        }))
      }

      this.setCache(cacheKey, dashboardData, 5 * 60 * 1000) // 5 minutes cache
      return dashboardData
    } catch (error) {
      this.handleError(error, 'getDashboardData')
    }
  }

  // Update user profile
  async updateUserProfile(
    userId: string,
    updates: Partial<{
      firstName: string
      lastName: string
      phone: string
      dateOfBirth: string
      avatarUrl: string
      bio: string
      countryCode: string
      timezone: string
      preferredCurrency: StablecoinSymbol
    }>
  ): Promise<User & { profile?: UserProfile }> {
    this.validateUUID(userId, 'userId')

    try {
      return await this.withTransaction(async () => {
        // Update user table if needed
        const userUpdates: any = {}
        if (updates.firstName) userUpdates.first_name = updates.firstName
        if (updates.lastName) userUpdates.last_name = updates.lastName
        if (updates.phone) userUpdates.phone = updates.phone
        if (updates.dateOfBirth) userUpdates.date_of_birth = updates.dateOfBirth

        if (Object.keys(userUpdates).length > 0) {
          await this.customQuery(`
            UPDATE users 
            SET ${Object.keys(userUpdates).map((key, index) => `${key} = $${index + 2}`).join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [userId, ...Object.values(userUpdates)])
        }

        // Update profile table
        const profileUpdates: any = {}
        if (updates.avatarUrl) profileUpdates.avatar_url = updates.avatarUrl
        if (updates.bio) profileUpdates.bio = updates.bio
        if (updates.countryCode) profileUpdates.country_code = updates.countryCode
        if (updates.timezone) profileUpdates.timezone = updates.timezone
        if (updates.preferredCurrency) profileUpdates.preferred_currency = updates.preferredCurrency

        if (Object.keys(profileUpdates).length > 0) {
          await this.customQuery(`
            UPDATE user_profiles 
            SET ${Object.keys(profileUpdates).map((key, index) => `${key} = $${index + 2}`).join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
          `, [userId, ...Object.values(profileUpdates)])
        }

        // Clear cache
        this.clearCache(`user_profile:${userId}`)
        this.clearCache(`dashboard_data:${userId}`)

        // Return updated profile
        return await this.getUserProfile(userId)
      })
    } catch (error) {
      this.handleError(error, 'updateUserProfile')
    }
  }

  // Update personalization preferences
  async updatePreferences(
    userId: string,
    preferences: Partial<PersonalizationPreferences>
  ): Promise<UserProfile> {
    this.validateUUID(userId, 'userId')

    try {
      // Get current profile
      const userWithProfile = await this.getUserProfile(userId)
      const profile = userWithProfile.profile
      const currentPrefs = profile.privacy_settings || {}

      // Merge preferences
      const newPrefs = {
        ...currentPrefs,
        ...preferences,
        notifications: {
          ...currentPrefs.notifications,
          ...preferences.notifications
        },
        investmentGoals: preferences.investmentGoals || currentPrefs.investmentGoals || []
      }

      const updated = await this.customQuery<UserProfile>(`
        UPDATE user_profiles 
        SET privacy_settings = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `, [userId, JSON.stringify(newPrefs)])

      this.clearCache(`user_profile:${userId}`)
      this.clearCache(`dashboard_data:${userId}`)

      return updated[0]
    } catch (error) {
      this.handleError(error, 'updatePreferences')
    }
  }

  // Get user's wallets
  async getUserWallets(userId: string): Promise<UserWallet[]> {
    this.validateUUID(userId, 'userId')

    const cacheKey = this.getCacheKey('user_wallets', { userId })
    const cached = this.getCache<UserWallet[]>(cacheKey)
    if (cached) return cached

    try {
      const wallets = await this.findMany<UserWallet>(
        { user_id: userId, is_active: true },
        'is_primary DESC, created_at ASC'
      )

      this.setCache(cacheKey, wallets, 30 * 60 * 1000) // 30 minutes cache
      return wallets
    } catch (error) {
      this.handleError(error, 'getUserWallets')
    }
  }

  // Add new wallet
  async addWallet(data: {
    userId: string
    chainId: ChainId
    address: string
    walletType?: string
    label?: string
    isPrimary?: boolean
  }): Promise<UserWallet> {
    this.validateRequired(data, ['userId', 'chainId', 'address'])
    this.validateUUID(data.userId, 'userId')

    try {
      return await this.withTransaction(async () => {
        // Check if wallet already exists
        const existing = await this.customQuery<UserWallet>(`
          SELECT * FROM user_wallets 
          WHERE user_id = $1 AND address = $2 AND chain_id = $3
        `, [data.userId, data.address, data.chainId])

        if (existing.length > 0) {
          throw new Error('Wallet already exists for this user and chain')
        }

        // If this is set as primary, unset other primary wallets for this chain
        if (data.isPrimary) {
          await this.customQuery(`
            UPDATE user_wallets 
            SET is_primary = false 
            WHERE user_id = $1 AND chain_id = $2
          `, [data.userId, data.chainId])
        }

        const wallet = await this.customQuery<UserWallet>(`
          INSERT INTO user_wallets (user_id, chain_id, address, wallet_type, label, is_primary)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [
          data.userId,
          data.chainId,
          data.address,
          data.walletType || 'external',
          data.label,
          data.isPrimary || false
        ])

        this.clearCache(`user_wallets:${data.userId}`)
        return wallet[0]
      })
    } catch (error) {
      this.handleError(error, 'addWallet')
    }
  }

  // Create notification
  async createNotification(data: {
    userId: string
    title: string
    message: string
    type: string
    priority?: string
    actionUrl?: string
    metadata?: Record<string, any>
    expiresAt?: string
  }): Promise<void> {
    this.validateRequired(data, ['userId', 'title', 'message', 'type'])
    this.validateUUID(data.userId, 'userId')

    try {
      await this.customQuery(`
        INSERT INTO user_notifications (user_id, title, message, notification_type, priority, action_url, metadata, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        data.userId,
        data.title,
        data.message,
        data.type,
        data.priority || 'medium',
        data.actionUrl,
        JSON.stringify(data.metadata || {}),
        data.expiresAt
      ])

      this.clearCache(`dashboard_data:${data.userId}`)
    } catch (error) {
      this.handleError(error, 'createNotification')
    }
  }

  // Mark notification as read
  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    this.validateUUID(userId, 'userId')
    this.validateUUID(notificationId, 'notificationId')

    try {
      await this.customQuery(`
        UPDATE user_notifications 
        SET is_read = true 
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId])

      this.clearCache(`dashboard_data:${userId}`)
    } catch (error) {
      this.handleError(error, 'markNotificationRead')
    }
  }

  // Update user KYC status
  async updateUserKycStatus(
    userId: string,
    kycData: {
      kycStatus: 'pending' | 'approved' | 'rejected' | 'expired'
      kycInquiryId: string
      kycMetadata?: Record<string, any>
    }
  ): Promise<User> {
    this.validateUUID(userId, 'userId')
    this.validateRequired(kycData, ['kycStatus', 'kycInquiryId'])

    try {
      const updated = await this.customQuery<User>(`
        UPDATE users 
        SET 
          kyc_status = $2,
          metadata = jsonb_set(
            COALESCE(metadata, '{}'),
            '{kyc}',
            jsonb_build_object(
              'inquiry_id', $3,
              'status', $2,
              'updated_at', $4,
              'metadata', $5
            )
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [
        userId,
        kycData.kycStatus,
        kycData.kycInquiryId,
        new Date().toISOString(),
        JSON.stringify(kycData.kycMetadata || {})
      ])

      if (updated.length === 0) {
        throw new Error('User not found')
      }

      // Clear relevant caches
      this.clearCache(`user_profile:${userId}`)
      this.clearCache(`dashboard_data:${userId}`)

      return updated[0]
    } catch (error) {
      this.handleError(error, 'updateUserKycStatus')
    }
  }

  // Find user by KYC inquiry ID
  async findUserByKycInquiryId(inquiryId: string): Promise<User | null> {
    try {
      const result = await this.customQuery<User>(`
        SELECT * FROM users 
        WHERE metadata->'kyc'->>'inquiry_id' = $1
      `, [inquiryId])

      return result.length > 0 ? result[0] : null
    } catch (error) {
      this.handleError(error, 'findUserByKycInquiryId')
    }
  }

  private getChainName(chainId: ChainId): string {
    const chainNames: Record<ChainId, string> = {
      '1': 'Ethereum',
      '137': 'Polygon',
      '42161': 'Arbitrum',
      '10': 'Optimism',
      '56': 'BSC',
      '43114': 'Avalanche',
      '250': 'Fantom',
      '11155111': 'Ethereum Sepolia',
      '84532': 'Base Sepolia',
      '421614': 'Arbitrum Sepolia'
    }
    return chainNames[chainId] || 'Unknown'
  }
}

// Singleton instance
export const userService = new UserService()