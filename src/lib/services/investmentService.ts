import { BaseService } from './baseService'
import type {
  TokenizedAsset,
  UserInvestment,
  AutoInvestPlan,
  DeFiProtocol,
  StablecoinSymbol,
  RiskLevel,
  PaginatedResult,
  DeFiProtocolWithUserData,
  InvestmentPortfolioSummary as IPortfolioSummary,
  UserDeFiPosition,
  StakingPool,
  UserStakingPosition,
  ChainId,
  InvestmentStrategy,
  InvestmentFrequency
} from '@/lib/database/models'

// Use types from models file
export type InvestmentPortfolioSummary = IPortfolioSummary

export interface StakingPoolData {
  id: string
  name: string
  protocol: string
  token: string
  apy: number
  minStake: number
  lockPeriod: number
  totalStaked: string
  userStake: string
  rewards: string
  riskLevel: RiskLevel
  features: string[]
  currency: StablecoinSymbol
  isActive: boolean
}

export class InvestmentService extends BaseService {
  constructor() {
    super('user_investments')
  }

  // Portfolio Overview
  async getPortfolioSummary(userId: string): Promise<InvestmentPortfolioSummary> {
    this.validateUUID(userId, 'userId')
    
    const cacheKey = this.getCacheKey('portfolio_summary', { userId })
    const cached = this.getCache<InvestmentPortfolioSummary>(cacheKey)
    if (cached) return cached

    try {
      const result = await this.customQuery<{
        total_invested: string
        total_current_value: string
        total_unrealized_pnl: string
        asset_count: string
        top_asset_name: string
        top_asset_symbol: string
        top_return_percentage: string
      }>(`
        WITH portfolio_stats AS (
          SELECT 
            COALESCE(SUM(ui.total_invested::numeric), 0) as total_invested,
            COALESCE(SUM(ui.current_value::numeric), 0) as total_current_value,
            COALESCE(SUM(ui.unrealized_pnl::numeric), 0) as total_unrealized_pnl,
            COUNT(ui.id) as asset_count
          FROM user_investments ui
          WHERE ui.user_id = $1
        ),
        top_performer AS (
          SELECT 
            ta.name as top_asset_name,
            ta.symbol as top_asset_symbol,
            CASE 
              WHEN ui.total_invested::numeric > 0 
              THEN ((ui.current_value::numeric - ui.total_invested::numeric) / ui.total_invested::numeric * 100)
              ELSE 0
            END as return_percentage
          FROM user_investments ui
          JOIN tokenized_assets ta ON ui.asset_id = ta.id
          WHERE ui.user_id = $1 AND ui.total_invested::numeric > 0
          ORDER BY return_percentage DESC
          LIMIT 1
        )
        SELECT 
          ps.total_invested,
          ps.total_current_value,
          ps.total_unrealized_pnl,
          ps.asset_count,
          tp.top_asset_name,
          tp.top_asset_symbol,
          COALESCE(tp.return_percentage, 0) as top_return_percentage
        FROM portfolio_stats ps
        LEFT JOIN top_performer tp ON true
      `, [userId])

      const row = result[0]
      const totalInvested = parseFloat(row.total_invested || '0')
      const totalCurrentValue = parseFloat(row.total_current_value || '0')
      
      const summary: InvestmentPortfolioSummary = {
        totalInvested: row.total_invested || '0',
        totalCurrentValue: row.total_current_value || '0',
        totalUnrealizedPnl: row.total_unrealized_pnl || '0',
        totalReturnPercentage: totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested * 100) : 0,
        assetCount: parseInt(row.asset_count || '0'),
        topPerformingAsset: row.top_asset_name ? {
          name: row.top_asset_name,
          symbol: row.top_asset_symbol,
          returnPercentage: parseFloat(row.top_return_percentage || '0')
        } : undefined
      }

      this.setCache(cacheKey, summary, 2 * 60 * 1000) // 2 minutes cache
      return summary
    } catch (error) {
      this.handleError(error, 'getPortfolioSummary')
    }
  }

  // Get User Investments with Asset Details
  async getUserInvestments(userId: string, page = 1, limit = 20): Promise<PaginatedResult<UserInvestment & { asset: TokenizedAsset }>> {
    this.validateUUID(userId, 'userId')

    try {
      const result = await this.customQuery<any>(`
        SELECT 
          ui.*,
          ta.name as asset_name,
          ta.symbol as asset_symbol,
          ta.category as asset_category,
          ta.current_price as asset_current_price,
          ta.current_apy as asset_current_apy,
          ta.risk_level as asset_risk_level,
          ta.provider as asset_provider,
          ta.features as asset_features
        FROM user_investments ui
        JOIN tokenized_assets ta ON ui.asset_id = ta.id
        WHERE ui.user_id = $1
        ORDER BY ui.current_value::numeric DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, (page - 1) * limit])

      // Get total count
      const countResult = await this.customQuery<{ count: string }>(`
        SELECT COUNT(*) as count 
        FROM user_investments 
        WHERE user_id = $1
      `, [userId])

      const total = parseInt(countResult[0].count)
      const totalPages = Math.ceil(total / limit)

      return {
        data: result.map(row => ({
          ...row,
          asset: {
            id: row.asset_id,
            name: row.asset_name,
            symbol: row.asset_symbol,
            category: row.asset_category,
            current_price: row.asset_current_price,
            current_apy: row.asset_current_apy,
            risk_level: row.asset_risk_level as RiskLevel,
            provider: row.asset_provider,
            features: row.asset_features || []
          } as TokenizedAsset
        })),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    } catch (error) {
      this.handleError(error, 'getUserInvestments')
    }
  }

  // Get Available Tokenized Assets
  async getTokenizedAssets(
    category?: string,
    riskLevel?: RiskLevel,
    page = 1,
    limit = 20
  ): Promise<PaginatedResult<TokenizedAsset>> {
    const cacheKey = this.getCacheKey('tokenized_assets', { category, riskLevel, page, limit })
    const cached = this.getCache<PaginatedResult<TokenizedAsset>>(cacheKey)
    if (cached) return cached

    try {
      let whereClause = 'WHERE ta.is_active = true'
      const params: any[] = []
      let paramIndex = 1

      if (category) {
        whereClause += ` AND ta.category = $${paramIndex}`
        params.push(category)
        paramIndex++
      }

      if (riskLevel) {
        whereClause += ` AND ta.risk_level = $${paramIndex}`
        params.push(riskLevel)
        paramIndex++
      }

      const result = await this.customQuery<TokenizedAsset>(`
        SELECT ta.*, 
               COALESCE(aph.price, ta.current_price) as latest_price,
               CASE WHEN aph.price IS NOT NULL THEN 
                 ((aph.price::numeric - prev_price.price::numeric) / prev_price.price::numeric * 100)
               ELSE 0 END as price_change_24h
        FROM tokenized_assets ta
        LEFT JOIN LATERAL (
          SELECT price 
          FROM asset_price_history 
          WHERE asset_id = ta.id 
          ORDER BY price_date DESC 
          LIMIT 1
        ) aph ON true
        LEFT JOIN LATERAL (
          SELECT price 
          FROM asset_price_history 
          WHERE asset_id = ta.id 
            AND price_date <= CURRENT_DATE - INTERVAL '1 day'
          ORDER BY price_date DESC 
          LIMIT 1
        ) prev_price ON true
        ${whereClause}
        ORDER BY ta.market_cap::numeric DESC NULLS LAST
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, (page - 1) * limit])

      // Get total count
      const countResult = await this.customQuery<{ count: string }>(`
        SELECT COUNT(*) as count 
        FROM tokenized_assets ta 
        ${whereClause}
      `, params)

      const total = parseInt(countResult[0].count)
      const totalPages = Math.ceil(total / limit)

      const paginatedResult = {
        data: result,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }

      this.setCache(cacheKey, paginatedResult, 5 * 60 * 1000) // 5 minutes cache
      return paginatedResult
    } catch (error) {
      this.handleError(error, 'getTokenizedAssets')
    }
  }

  // Get DeFi Protocols with User Data
  async getDeFiProtocols(userId: string): Promise<DeFiProtocolWithUserData[]> {
    this.validateUUID(userId, 'userId')

    const cacheKey = this.getCacheKey('defi_protocols', { userId })
    const cached = this.getCache<DeFiProtocolWithUserData[]>(cacheKey)
    if (cached) return cached

    try {
      const result = await this.customQuery<DeFiProtocolWithUserData>(`
        SELECT 
          dp.*,
          COALESCE(AVG(pc.current_apy::numeric), 0) as currentApy,
          COALESCE(SUM(pc.tvl_usd::numeric), 0) as tvlUsd,
          COALESCE(SUM(yp.deposit_amount::numeric), 0) as userDeposit,
          COALESCE(SUM(yp.earned_yield::numeric), 0) as userEarned,
          CASE WHEN COUNT(yp.id) > 0 THEN true ELSE false END as isUserParticipating
        FROM defi_protocols dp
        LEFT JOIN protocol_configurations pc ON dp.id = pc.protocol_id
        LEFT JOIN yield_positions yp ON dp.id = yp.protocol_id AND yp.user_id = $1 AND yp.is_active = true
        WHERE dp.is_active = true
        GROUP BY dp.id, dp.name, dp.protocol_key, dp.description, dp.website_url, dp.logo_url, dp.risk_level, dp.supported_chains, dp.is_active, dp.created_at, dp.updated_at
        ORDER BY tvlUsd DESC
      `, [userId])

      const protocols = result.map(row => ({
        ...row,
        currentApy: row.current_apy?.toString() || '0',
        tvlUsd: row.tvl_usd?.toString() || '0',
        userDeposit: row.userdeposit?.toString() || '0',
        userEarned: row.userearned?.toString() || '0',
        isUserParticipating: row.isuserparticipating || false
      }))

      this.setCache(cacheKey, protocols, 3 * 60 * 1000) // 3 minutes cache
      return protocols
    } catch (error) {
      this.handleError(error, 'getDeFiProtocols')
    }
  }

  // Get Staking Pools (derived from DeFi protocols and yield positions)
  async getStakingPools(userId: string): Promise<StakingPoolData[]> {
    this.validateUUID(userId, 'userId')

    const cacheKey = this.getCacheKey('staking_pools', { userId })
    const cached = this.getCache<StakingPoolData[]>(cacheKey)
    if (cached) return cached

    try {
      const result = await this.customQuery<any>(`
        SELECT 
          dp.id,
          dp.name || ' Staking Pool' as name,
          dp.name as protocol,
          CASE 
            WHEN dp.protocol_key = 'aave' THEN 'USDC'
            WHEN dp.protocol_key = 'compound' THEN 'USDC'
            WHEN dp.protocol_key = 'yearn' THEN 'USDC'
            ELSE 'USDC'
          END as token,
          COALESCE(AVG(pc.current_apy::numeric), 4.0) as apy,
          CASE 
            WHEN dp.risk_level = 'Low' THEN 100
            WHEN dp.risk_level = 'Medium' THEN 500
            ELSE 1000
          END as minStake,
          CASE 
            WHEN dp.protocol_key = 'compound' THEN 0
            WHEN dp.protocol_key = 'aave' THEN 0
            ELSE 30
          END as lockPeriod,
          COALESCE(SUM(pc.tvl_usd::numeric), 100000000) as totalStaked,
          COALESCE(SUM(CASE WHEN yp.user_id = $1 THEN yp.deposit_amount::numeric ELSE 0 END), 0) as userStake,
          COALESCE(SUM(CASE WHEN yp.user_id = $1 THEN yp.earned_yield::numeric ELSE 0 END), 0) as rewards,
          dp.risk_level,
          ARRAY[
            CASE WHEN dp.risk_level = 'Low' THEN 'Insurance covered' ELSE 'Higher yield' END,
            CASE WHEN dp.protocol_key IN ('compound', 'aave') THEN 'No lock period' ELSE '30-day lock' END,
            dp.name || ' protocol',
            'Real-time rewards'
          ] as features,
          CASE 
            WHEN dp.protocol_key IN ('yearn', 'curve') THEN 'USDC'
            ELSE 'USDC'
          END as currency,
          dp.is_active
        FROM defi_protocols dp
        LEFT JOIN protocol_configurations pc ON dp.id = pc.protocol_id
        LEFT JOIN yield_positions yp ON dp.id = yp.protocol_id AND yp.is_active = true
        WHERE dp.is_active = true
        GROUP BY dp.id, dp.name, dp.protocol_key, dp.risk_level, dp.is_active
        ORDER BY totalStaked DESC
      `, [userId])

      const stakingPools: StakingPoolData[] = result.map(row => ({
        id: row.id,
        name: row.name,
        protocol: row.protocol,
        token: row.token,
        apy: parseFloat(row.apy || '4.0'),
        minStake: row.minstake,
        lockPeriod: row.lockperiod,
        totalStaked: row.totalstaked?.toString() || '100000000',
        userStake: row.userstake?.toString() || '0',
        rewards: row.rewards?.toString() || '0',
        riskLevel: row.risk_level as RiskLevel,
        features: row.features || [],
        currency: row.currency as StablecoinSymbol,
        isActive: row.is_active
      }))

      this.setCache(cacheKey, stakingPools, 3 * 60 * 1000) // 3 minutes cache
      return stakingPools
    } catch (error) {
      this.handleError(error, 'getStakingPools')
    }
  }

  // Create Investment
  async createInvestment(data: {
    userId: string
    assetId: string
    quantity: string
    averageCost: string
    totalInvested: string
    currency: StablecoinSymbol
  }): Promise<UserInvestment> {
    this.validateRequired(data, ['userId', 'assetId', 'quantity', 'averageCost', 'totalInvested', 'currency'])
    this.validateUUID(data.userId, 'userId')
    this.validateUUID(data.assetId, 'assetId')

    try {
      return await this.withTransaction(async () => {
        // Check if asset exists and get current price
        const asset = await this.customQuery<TokenizedAsset>(`
          SELECT * FROM tokenized_assets WHERE id = $1 AND is_active = true
        `, [data.assetId])

        if (asset.length === 0) {
          throw new Error(`Asset not found or inactive: ${data.assetId}`)
        }

        const currentPrice = parseFloat(asset[0].current_price)
        const quantity = parseFloat(data.quantity)
        const currentValue = (currentPrice * quantity).toString()

        // Check if user already has this investment
        const existingInvestment = await this.findOne<UserInvestment>({
          user_id: data.userId,
          asset_id: data.assetId
        })

        if (existingInvestment) {
          // Update existing investment
          const existingQuantity = parseFloat(existingInvestment.quantity)
          const existingInvested = parseFloat(existingInvestment.total_invested)
          const newQuantity = existingQuantity + quantity
          const newTotalInvested = existingInvested + parseFloat(data.totalInvested)
          const newAverageCost = (newTotalInvested / newQuantity).toString()

          const updated = await this.updateOne<UserInvestment>({
            quantity: newQuantity.toString(),
            average_cost: newAverageCost,
            total_invested: newTotalInvested.toString(),
            current_value: (currentPrice * newQuantity).toString(),
            last_purchase_at: new Date().toISOString()
          }, { id: existingInvestment.id })

          this.clearCache('portfolio')
          return updated!
        } else {
          // Create new investment
          const newInvestment = await this.insertOne<UserInvestment>({
            user_id: data.userId,
            asset_id: data.assetId,
            quantity: data.quantity,
            average_cost: data.averageCost,
            total_invested: data.totalInvested,
            current_value: currentValue,
            currency: data.currency,
            first_purchase_at: new Date().toISOString(),
            last_purchase_at: new Date().toISOString()
          })

          this.clearCache('portfolio')
          return newInvestment
        }
      })
    } catch (error) {
      this.handleError(error, 'createInvestment')
    }
  }

  // Get Auto Invest Plans
  async getAutoInvestPlans(userId: string): Promise<AutoInvestPlan[]> {
    this.validateUUID(userId, 'userId')
    
    try {
      return await this.findMany<AutoInvestPlan>(
        { user_id: userId },
        'created_at DESC'
      )
    } catch (error) {
      this.handleError(error, 'getAutoInvestPlans')
    }
  }

  // Create Auto Invest Plan
  async createAutoInvestPlan(data: {
    userId: string
    name: string
    strategy: InvestmentStrategy
    frequency: InvestmentFrequency
    amount: string
    currency: StablecoinSymbol
    allocations: { assetId: string; percentage: number }[]
  }): Promise<AutoInvestPlan> {
    this.validateRequired(data, ['userId', 'name', 'strategy', 'frequency', 'amount', 'currency'])
    this.validateUUID(data.userId, 'userId')

    // Validate allocations sum to 100%
    const totalPercentage = data.allocations.reduce((sum, alloc) => sum + alloc.percentage, 0)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Allocation percentages must sum to 100%')
    }

    try {
      return await this.withTransaction(async () => {
        // Calculate next execution date
        const now = new Date()
        let nextExecution: Date
        switch (data.frequency) {
          case 'weekly':
            nextExecution = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            break
          case 'monthly':
            nextExecution = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
            break
          case 'quarterly':
            nextExecution = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
            break
          default:
            nextExecution = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Default to weekly
            break
        }

        const plan = await this.insertOne<AutoInvestPlan>({
          user_id: data.userId,
          name: data.name,
          strategy: data.strategy,
          frequency: data.frequency,
          amount: data.amount,
          currency: data.currency,
          is_active: true,
          next_execution_at: nextExecution.toISOString(),
          total_invested: '0',
          execution_count: 0
        })

        // Create allocations
        for (const allocation of data.allocations) {
          await this.customQuery(`
            INSERT INTO auto_invest_allocations (plan_id, asset_id, allocation_percentage)
            VALUES ($1, $2, $3)
          `, [plan.id, allocation.assetId, allocation.percentage.toString()])
        }

        return plan
      })
    } catch (error) {
      this.handleError(error, 'createAutoInvestPlan')
    }
  }
}

// Singleton instance
export const investmentService = new InvestmentService()