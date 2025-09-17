import { BaseService } from './baseService'
import type {
  Transaction,
  TransactionType,
  TransactionStatus,
  StablecoinSymbol,
  ChainId,
  PaginatedResult
} from '@/lib/database/models'

export interface TransactionSummary {
  totalTransactions: number
  totalVolume: string
  successRate: number
  avgTransactionValue: string
  topTransactionType: TransactionType
  recentActivity: {
    period: '24h' | '7d' | '30d'
    transactionCount: number
    volumeChange: number
  }
}

export interface TransactionWithDetails extends Transaction {
  networkName?: string
  explorerUrl?: string
  usdValue?: string
}

export interface TransactionFilters {
  type?: TransactionType[]
  transactionType?: TransactionType
  status?: TransactionStatus[]
  stablecoin?: StablecoinSymbol[]
  chainId?: ChainId[]
  dateFrom?: string
  dateTo?: string
  amountMin?: string
  amountMax?: string
  search?: string
  sortBy?: 'created_at' | 'amount' | 'status'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface CreateTransactionData {
  userId: string
  txHash?: string
  transactionType: TransactionType
  amount: string
  feeAmount?: string
  stablecoin: StablecoinSymbol
  chainId: ChainId
  fromAddress?: string
  toAddress?: string
  fromChain?: ChainId
  toChain?: ChainId
  protocolName?: string
  description?: string
  metadata?: Record<string, any>
  blockNumber?: number
  blockTimestamp?: string
  gasUsed?: number
  gasPrice?: string
}

export class TransactionService extends BaseService {
  constructor() {
    super('transactions')
  }

  // Get transaction summary for dashboard
  async getTransactionSummary(userId: string, period = '30d'): Promise<TransactionSummary> {
    this.validateUUID(userId, 'userId')

    const cacheKey = this.getCacheKey('transaction_summary', { userId, period })
    const cached = this.getCache<TransactionSummary>(cacheKey)
    if (cached) return cached

    try {
      let dateFilter = ''
      switch (period) {
        case '24h':
          dateFilter = "AND t.created_at >= NOW() - INTERVAL '24 hours'"
          break
        case '7d':
          dateFilter = "AND t.created_at >= NOW() - INTERVAL '7 days'"
          break
        case '30d':
        default:
          dateFilter = "AND t.created_at >= NOW() - INTERVAL '30 days'"
          break
      }

      const result = await this.customQuery<{
        total_transactions: string
        total_volume: string
        success_count: string
        avg_amount: string
        top_type: TransactionType
        volume_change: string
        transaction_count_change: string
      }>(`
        WITH current_stats AS (
          SELECT 
            COUNT(*) as total_transactions,
            COALESCE(SUM(amount::numeric), 0) as total_volume,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as success_count,
            COALESCE(AVG(amount::numeric), 0) as avg_amount,
            MODE() WITHIN GROUP (ORDER BY transaction_type) as top_type
          FROM transactions t
          WHERE t.user_id = $1 ${dateFilter}
        ),
        previous_stats AS (
          SELECT 
            COALESCE(SUM(amount::numeric), 0) as prev_volume,
            COUNT(*) as prev_count
          FROM transactions t
          WHERE t.user_id = $1 
            AND t.created_at >= NOW() - INTERVAL '${period === '24h' ? '48 hours' : period === '7d' ? '14 days' : '60 days'}'
            AND t.created_at < NOW() - INTERVAL '${period}'
        )
        SELECT 
          cs.total_transactions,
          cs.total_volume,
          cs.success_count,
          cs.avg_amount,
          cs.top_type,
          CASE 
            WHEN ps.prev_volume > 0 
            THEN ((cs.total_volume - ps.prev_volume) / ps.prev_volume * 100)
            ELSE 0 
          END as volume_change,
          CASE 
            WHEN ps.prev_count > 0 
            THEN ((cs.total_transactions - ps.prev_count)::numeric / ps.prev_count * 100)
            ELSE 0 
          END as transaction_count_change
        FROM current_stats cs
        CROSS JOIN previous_stats ps
      `, [userId])

      const row = result[0]
      const totalTransactions = parseInt(row.total_transactions || '0')
      const successCount = parseInt(row.success_count || '0')

      const summary: TransactionSummary = {
        totalTransactions,
        totalVolume: row.total_volume || '0',
        successRate: totalTransactions > 0 ? (successCount / totalTransactions * 100) : 0,
        avgTransactionValue: row.avg_amount || '0',
        topTransactionType: row.top_type || 'transfer',
        recentActivity: {
          period: period as '24h' | '7d' | '30d',
          transactionCount: totalTransactions,
          volumeChange: parseFloat(row.volume_change || '0')
        }
      }

      this.setCache(cacheKey, summary, 5 * 60 * 1000) // 5 minutes cache
      return summary
    } catch (error) {
      this.handleError(error, 'getTransactionSummary')
    }
  }

  // Get paginated transaction history with filters
  async getTransactionHistory(
    userId: string,
    filters: TransactionFilters = {},
    page = 1,
    limit = 20
  ): Promise<PaginatedResult<TransactionWithDetails>> {
    this.validateUUID(userId, 'userId')

    try {
      let whereClause = 'WHERE t.user_id = $1'
      const params: any[] = [userId]
      let paramIndex = 2

      // Apply filters
      if (filters.type && filters.type.length > 0) {
        whereClause += ` AND t.transaction_type = ANY($${paramIndex})`
        params.push(filters.type)
        paramIndex++
      }

      if (filters.status && filters.status.length > 0) {
        whereClause += ` AND t.status = ANY($${paramIndex})`
        params.push(filters.status)
        paramIndex++
      }

      if (filters.stablecoin && filters.stablecoin.length > 0) {
        whereClause += ` AND t.stablecoin = ANY($${paramIndex})`
        params.push(filters.stablecoin)
        paramIndex++
      }

      if (filters.chainId && filters.chainId.length > 0) {
        whereClause += ` AND t.chain_id = ANY($${paramIndex})`
        params.push(filters.chainId)
        paramIndex++
      }

      if (filters.dateFrom) {
        whereClause += ` AND t.created_at >= $${paramIndex}`
        params.push(filters.dateFrom)
        paramIndex++
      }

      if (filters.dateTo) {
        whereClause += ` AND t.created_at <= $${paramIndex}`
        params.push(filters.dateTo)
        paramIndex++
      }

      if (filters.amountMin) {
        whereClause += ` AND t.amount::numeric >= $${paramIndex}`
        params.push(filters.amountMin)
        paramIndex++
      }

      if (filters.amountMax) {
        whereClause += ` AND t.amount::numeric <= $${paramIndex}`
        params.push(filters.amountMax)
        paramIndex++
      }

      // Main query
      const transactions = await this.customQuery<TransactionWithDetails>(`
        SELECT 
          t.*,
          CASE t.chain_id
            WHEN '1' THEN 'Ethereum'
            WHEN '137' THEN 'Polygon'
            WHEN '42161' THEN 'Arbitrum'
            WHEN '10' THEN 'Optimism'
            WHEN '56' THEN 'BSC'
            ELSE 'Unknown'
          END as network_name,
          CASE t.chain_id
            WHEN '1' THEN 'https://etherscan.io/tx/' || COALESCE(t.tx_hash, '')
            WHEN '137' THEN 'https://polygonscan.com/tx/' || COALESCE(t.tx_hash, '')
            WHEN '42161' THEN 'https://arbiscan.io/tx/' || COALESCE(t.tx_hash, '')
            WHEN '10' THEN 'https://optimistic.etherscan.io/tx/' || COALESCE(t.tx_hash, '')
            WHEN '56' THEN 'https://bscscan.com/tx/' || COALESCE(t.tx_hash, '')
            ELSE ''
          END as explorer_url,
          CASE t.stablecoin
            WHEN 'USDC' THEN t.amount
            ELSE t.amount
          END as usd_value
        FROM transactions t
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, (page - 1) * limit])

      // Get total count
      const countResult = await this.customQuery<{ count: string }>(`
        SELECT COUNT(*) as count FROM transactions t ${whereClause}
      `, params)

      const total = parseInt(countResult[0].count)
      const totalPages = Math.ceil(total / limit)

      return {
        data: transactions,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    } catch (error) {
      this.handleError(error, 'getTransactionHistory')
    }
  }

  // Create new transaction
  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    this.validateRequired(data, ['userId', 'transactionType', 'amount', 'stablecoin', 'chainId'])
    this.validateUUID(data.userId, 'userId')
    this.validateDecimal(data.amount, 'amount')

    try {
      const transaction = await this.insertOne<Transaction>({
        user_id: data.userId,
        tx_hash: data.txHash,
        transaction_type: data.transactionType,
        status: 'pending',
        amount: data.amount,
        fee_amount: data.feeAmount || '0',
        stablecoin: data.stablecoin,
        chain_id: data.chainId,
        from_address: data.fromAddress,
        to_address: data.toAddress,
        from_chain: data.fromChain,
        to_chain: data.toChain,
        protocol_name: data.protocolName,
        description: data.description,
        metadata: data.metadata || {},
        block_number: data.blockNumber,
        block_timestamp: data.blockTimestamp,
        gas_used: data.gasUsed,
        gas_price: data.gasPrice
      })

      // Clear cache for this user
      this.clearCache(`transaction_summary:${data.userId}`)
      return transaction
    } catch (error) {
      this.handleError(error, 'createTransaction')
    }
  }

  // Update transaction status
  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    blockNumber?: number,
    blockTimestamp?: string,
    gasUsed?: number
  ): Promise<Transaction | null> {
    this.validateUUID(transactionId, 'transactionId')

    try {
      const updateData: any = { status }
      
      if (blockNumber) updateData.block_number = blockNumber
      if (blockTimestamp) updateData.block_timestamp = blockTimestamp
      if (gasUsed) updateData.gas_used = gasUsed
      if (status === 'completed') updateData.confirmed_at = new Date().toISOString()

      const updated = await this.updateOne<Transaction>(
        updateData,
        { id: transactionId }
      )

      if (updated) {
        // Clear cache for this user
        this.clearCache(`transaction_summary:${updated.user_id}`)
      }

      return updated
    } catch (error) {
      this.handleError(error, 'updateTransactionStatus')
    }
  }

  // Get transaction by ID
  async getTransaction(transactionId: string): Promise<TransactionWithDetails | null> {
    this.validateUUID(transactionId, 'transactionId')

    try {
      const result = await this.customQuery<TransactionWithDetails>(`
        SELECT 
          t.*,
          CASE t.chain_id
            WHEN '1' THEN 'Ethereum'
            WHEN '137' THEN 'Polygon'
            WHEN '42161' THEN 'Arbitrum'
            WHEN '10' THEN 'Optimism'
            WHEN '56' THEN 'BSC'
            ELSE 'Unknown'
          END as network_name,
          CASE t.chain_id
            WHEN '1' THEN 'https://etherscan.io/tx/' || COALESCE(t.tx_hash, '')
            WHEN '137' THEN 'https://polygonscan.com/tx/' || COALESCE(t.tx_hash, '')
            WHEN '42161' THEN 'https://arbiscan.io/tx/' || COALESCE(t.tx_hash, '')
            WHEN '10' THEN 'https://optimistic.etherscan.io/tx/' || COALESCE(t.tx_hash, '')
            WHEN '56' THEN 'https://bscscan.com/tx/' || COALESCE(t.tx_hash, '')
            ELSE ''
          END as explorer_url,
          t.amount as usd_value
        FROM transactions t
        WHERE t.id = $1
      `, [transactionId])

      return result[0] || null
    } catch (error) {
      this.handleError(error, 'getTransaction')
    }
  }

  // Get recent transactions (for dashboard widgets)
  async getRecentTransactions(userId: string, limit = 5): Promise<TransactionWithDetails[]> {
    this.validateUUID(userId, 'userId')

    const cacheKey = this.getCacheKey('recent_transactions', { userId, limit })
    const cached = this.getCache<TransactionWithDetails[]>(cacheKey)
    if (cached) return cached

    try {
      const transactions = await this.customQuery<TransactionWithDetails>(`
        SELECT 
          t.*,
          CASE t.chain_id
            WHEN '1' THEN 'Ethereum'
            WHEN '137' THEN 'Polygon'
            WHEN '42161' THEN 'Arbitrum'
            WHEN '10' THEN 'Optimism'
            WHEN '56' THEN 'BSC'
            ELSE 'Unknown'
          END as network_name,
          t.amount as usd_value
        FROM transactions t
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2
      `, [userId, limit])

      this.setCache(cacheKey, transactions, 2 * 60 * 1000) // 2 minutes cache
      return transactions
    } catch (error) {
      this.handleError(error, 'getRecentTransactions')
    }
  }

  // Get transaction analytics
  async getTransactionAnalytics(userId: string, period = '30d'): Promise<{
    chartData: Array<{
      date: string
      volume: number
      count: number
    }>
    typeBreakdown: Array<{
      type: TransactionType
      count: number
      volume: string
      percentage: number
    }>
    chainDistribution: Array<{
      chainId: ChainId
      chainName: string
      count: number
      volume: string
      percentage: number
    }>
  }> {
    this.validateUUID(userId, 'userId')

    const cacheKey = this.getCacheKey('transaction_analytics', { userId, period })
    const cached = this.getCache<any>(cacheKey)
    if (cached) return cached

    try {
      let dateFilter = ''
      let dateInterval = 'day'
      
      switch (period) {
        case '7d':
          dateFilter = "AND t.created_at >= NOW() - INTERVAL '7 days'"
          dateInterval = 'day'
          break
        case '30d':
          dateFilter = "AND t.created_at >= NOW() - INTERVAL '30 days'"
          dateInterval = 'day'
          break
        case '90d':
          dateFilter = "AND t.created_at >= NOW() - INTERVAL '90 days'"
          dateInterval = 'week'
          break
        default:
          dateFilter = "AND t.created_at >= NOW() - INTERVAL '30 days'"
          dateInterval = 'day'
          break
      }

      // Chart data
      const chartData = await this.customQuery<{
        date: string
        volume: string
        count: string
      }>(`
        SELECT 
          DATE_TRUNC('${dateInterval}', t.created_at)::date as date,
          COALESCE(SUM(t.amount::numeric), 0) as volume,
          COUNT(*) as count
        FROM transactions t
        WHERE t.user_id = $1 ${dateFilter}
        GROUP BY DATE_TRUNC('${dateInterval}', t.created_at)::date
        ORDER BY date ASC
      `, [userId])

      // Type breakdown
      const typeBreakdown = await this.customQuery<{
        transaction_type: TransactionType
        count: string
        volume: string
      }>(`
        SELECT 
          t.transaction_type,
          COUNT(*) as count,
          COALESCE(SUM(t.amount::numeric), 0) as volume
        FROM transactions t
        WHERE t.user_id = $1 ${dateFilter}
        GROUP BY t.transaction_type
        ORDER BY count DESC
      `, [userId])

      // Chain distribution
      const chainDistribution = await this.customQuery<{
        chain_id: ChainId
        count: string
        volume: string
      }>(`
        SELECT 
          t.chain_id,
          COUNT(*) as count,
          COALESCE(SUM(t.amount::numeric), 0) as volume
        FROM transactions t
        WHERE t.user_id = $1 ${dateFilter}
        GROUP BY t.chain_id
        ORDER BY count DESC
      `, [userId])

      const totalCount = typeBreakdown.reduce((sum, item) => sum + parseInt(item.count), 0)
      const totalVolume = chainDistribution.reduce((sum, item) => sum + parseFloat(item.volume), 0)

      const analytics = {
        chartData: chartData.map(item => ({
          date: item.date,
          volume: parseFloat(item.volume),
          count: parseInt(item.count)
        })),
        typeBreakdown: typeBreakdown.map(item => ({
          type: item.transaction_type,
          count: parseInt(item.count),
          volume: item.volume,
          percentage: totalCount > 0 ? (parseInt(item.count) / totalCount * 100) : 0
        })),
        chainDistribution: chainDistribution.map(item => ({
          chainId: item.chain_id,
          chainName: this.getChainName(item.chain_id),
          count: parseInt(item.count),
          volume: item.volume,
          percentage: totalCount > 0 ? (parseInt(item.count) / totalCount * 100) : 0
        }))
      }

      this.setCache(cacheKey, analytics, 10 * 60 * 1000) // 10 minutes cache
      return analytics
    } catch (error) {
      this.handleError(error, 'getTransactionAnalytics')
    }
  }

  // Export transactions to CSV or other formats
  async exportTransactions(
    userId: string, 
    filters: TransactionFilters = {}, 
    format: 'csv' | 'json' = 'csv'
  ): Promise<{ content: string; filename: string }> {
    try {
      // Get all matching transactions (no pagination for export)
      const allFilters = { ...filters, userId }
      const result = await this.getTransactionHistory(userId, filters, 1, 10000)
      const transactions = result.data

      if (format === 'csv') {
        const headers = [
          'Date',
          'Type',
          'Amount', 
          'Stablecoin',
          'Network',
          'Status',
          'Description',
          'Transaction Hash'
        ]

        const rows = transactions.map((tx: any) => [
          new Date(tx.created_at).toISOString(),
          tx.transaction_type,
          tx.amount,
          tx.stablecoin,
          tx.networkName || this.getChainName(tx.chain_id),
          tx.status,
          tx.description || '',
          tx.tx_hash || ''
        ])

        const csvContent = [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n')

        return {
          content: csvContent,
          filename: `transactions_${userId}_${new Date().toISOString().split('T')[0]}.csv`
        }
      } else {
        return {
          content: JSON.stringify(transactions, null, 2),
          filename: `transactions_${userId}_${new Date().toISOString().split('T')[0]}.json`
        }
      }
    } catch (error) {
      this.handleError(error, 'exportTransactions')
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
export const transactionService = new TransactionService()