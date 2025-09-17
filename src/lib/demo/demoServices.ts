import { mockDataGenerator } from './mockDataGenerator'
import { MockDataExtensions } from './mockDataExtensions'
import { findUserByEmail, DemoUser } from '@/lib/demoUsers'
import { 
  Transaction, 
  TransactionWithDetails, 
  PaginatedResult,
  UserCard,
  CardTransaction,
  TokenizedAsset,
  UserInvestment,
  DeFiProtocol,
  UserDeFiPosition,
  LoanApplication,
  ActiveLoan,
  InsurancePolicy,
  UserNotification
} from '@/lib/database/models'

// Demo Transaction Service
export class DemoTransactionService {
  async getTransactionSummary(userId: string, period = '30d') {
    const user = this.getUserFromId(userId)
    if (!user) throw new Error('User not found')

    const profile = mockDataGenerator.generateUserFinancialProfile(user)
    const transactions = profile.transactions as Transaction[]
    
    const periodMs = this.getPeriodMs(period)
    const cutoffDate = new Date(Date.now() - periodMs)
    const recentTxs = transactions.filter(tx => new Date(tx.created_at) > cutoffDate)
    
    const totalTransactions = recentTxs.length
    const successCount = recentTxs.filter(tx => tx.status === 'completed').length
    const totalVolume = recentTxs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
    const avgAmount = totalTransactions > 0 ? totalVolume / totalTransactions : 0

    // Get most common transaction type
    const typeCounts = recentTxs.reduce((acc, tx) => {
      acc[tx.transaction_type] = (acc[tx.transaction_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topType = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b, 'transfer')

    return {
      totalTransactions,
      totalVolume: totalVolume.toFixed(2),
      successRate: totalTransactions > 0 ? (successCount / totalTransactions * 100) : 0,
      avgTransactionValue: avgAmount.toFixed(2),
      topTransactionType: topType,
      recentActivity: {
        period: period as '24h' | '7d' | '30d',
        transactionCount: totalTransactions,
        volumeChange: Math.random() * 20 - 10 // -10% to +10%
      }
    }
  }

  async getTransactionHistory(userId: string, filters: any = {}, page = 1, limit = 20): Promise<PaginatedResult<TransactionWithDetails>> {
    const user = this.getUserFromId(userId)
    if (!user) throw new Error('User not found')

    const profile = mockDataGenerator.generateUserFinancialProfile(user)
    let transactions = profile.transactions as Transaction[]

    // Apply filters
    if (filters.transactionType) {
      transactions = transactions.filter(tx => tx.transaction_type === filters.transactionType)
    }
    if (filters.status && filters.status.length > 0) {
      transactions = transactions.filter(tx => filters.status.includes(tx.status))
    }
    if (filters.stablecoin && filters.stablecoin.length > 0) {
      transactions = transactions.filter(tx => filters.stablecoin.includes(tx.stablecoin))
    }
    if (filters.chainId && filters.chainId.length > 0) {
      transactions = transactions.filter(tx => filters.chainId.includes(tx.chain_id))
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Pagination
    const total = transactions.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedTxs = transactions.slice(offset, offset + limit)

    // Add network details
    const txsWithDetails: TransactionWithDetails[] = paginatedTxs.map(tx => ({
      ...tx,
      networkName: tx.metadata?.networkName || 'Unknown',
      explorerUrl: tx.metadata?.explorerUrl || '',
      usdValue: tx.amount
    }))

    return {
      data: txsWithDetails,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }

  async getRecentTransactions(userId: string, limit = 5): Promise<TransactionWithDetails[]> {
    const result = await this.getTransactionHistory(userId, {}, 1, limit)
    return result.data
  }

  async createTransaction(data: any): Promise<Transaction> {
    // In demo mode, just return a mock transaction
    const now = new Date().toISOString()
    return {
      id: `demo-tx-${Date.now()}`,
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
      description: data.description,
      created_at: now,
      updated_at: now,
      metadata: data.metadata || {}
    }
  }

  private getUserFromId(userId: string): DemoUser | undefined {
    // In a real app, this would query the database
    // For demo, we'll find by matching the user ID pattern
    const demoUsers = [
      'john@example.com', 'sarah@example.com', 'michael@example.com',
      'emma@example.com', 'david@example.com', 'lisa@example.com',
      'admin@usdfinancial.com', 'test@test.com'
    ]
    
    // Simple mapping - in real demo this would be more sophisticated
    const email = demoUsers[0] // Default to first user for now
    return findUserByEmail(email)
  }

  private getPeriodMs(period: string): number {
    switch (period) {
      case '24h': return 24 * 60 * 60 * 1000
      case '7d': return 7 * 24 * 60 * 60 * 1000
      case '30d': return 30 * 24 * 60 * 60 * 1000
      default: return 30 * 24 * 60 * 60 * 1000
    }
  }
}

// Demo Card Service
export class DemoCardService {
  async getUserCards(userId: string): Promise<UserCard[]> {
    const user = this.getUserFromId(userId)
    if (!user) return []

    const cardData = MockDataExtensions.generateCardData(user)
    return cardData.cards
  }

  async getCardTransactions(userId: string, cardId?: string): Promise<CardTransaction[]> {
    const user = this.getUserFromId(userId)
    if (!user) return []

    const cardData = MockDataExtensions.generateCardData(user)
    let transactions = cardData.transactions

    if (cardId) {
      transactions = transactions.filter(tx => tx.card_id === cardId)
    }

    return transactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
  }

  async getCardSpendingSummary(userId: string, period = '30d') {
    const transactions = await this.getCardTransactions(userId)
    const periodMs = this.getPeriodMs(period)
    const cutoffDate = new Date(Date.now() - periodMs)
    const recentTxs = transactions.filter(tx => new Date(tx.transaction_date) > cutoffDate)

    const totalSpent = recentTxs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
    const totalTransactions = recentTxs.length
    const avgTransaction = totalTransactions > 0 ? totalSpent / totalTransactions : 0

    // Category breakdown
    const categorySpending = recentTxs.reduce((acc, tx) => {
      acc[tx.merchant_category] = (acc[tx.merchant_category] || 0) + parseFloat(tx.amount)
      return acc
    }, {} as Record<string, number>)

    const topCategory = Object.keys(categorySpending).reduce((a, b) => 
      categorySpending[a] > categorySpending[b] ? a : b, 'Other')

    return {
      totalSpent: totalSpent.toFixed(2),
      totalTransactions,
      avgTransaction: avgTransaction.toFixed(2),
      topCategory,
      categoryBreakdown: Object.entries(categorySpending).map(([category, amount]) => ({
        category,
        amount: amount.toFixed(2),
        percentage: totalSpent > 0 ? (amount / totalSpent * 100).toFixed(1) : '0'
      }))
    }
  }

  private getUserFromId(userId: string): DemoUser | undefined {
    const email = 'john@example.com' // Default for demo
    return findUserByEmail(email)
  }

  private getPeriodMs(period: string): number {
    switch (period) {
      case '24h': return 24 * 60 * 60 * 1000
      case '7d': return 7 * 24 * 60 * 60 * 1000
      case '30d': return 30 * 24 * 60 * 60 * 1000
      default: return 30 * 24 * 60 * 60 * 1000
    }
  }
}

// Demo Investment Service
export class DemoInvestmentService {
  async getPortfolioSummary(userId: string) {
    const user = this.getUserFromId(userId)
    if (!user) throw new Error('User not found')

    const investmentData = MockDataExtensions.generateInvestmentPortfolio(user)
    const investments = investmentData.investments

    const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.total_invested), 0)
    const totalCurrentValue = investments.reduce((sum, inv) => sum + parseFloat(inv.current_value), 0)
    const totalPnl = totalCurrentValue - totalInvested
    const returnPercentage = totalInvested > 0 ? (totalPnl / totalInvested * 100) : 0

    // Find top performing asset
    const topAsset = investments.reduce((best, current) => {
      const currentReturn = parseFloat(current.unrealized_pnl) / parseFloat(current.total_invested) * 100
      const bestReturn = parseFloat(best.unrealized_pnl) / parseFloat(best.total_invested) * 100
      return currentReturn > bestReturn ? current : best
    }, investments[0])

    const topAssetData = investmentData.assets.find(asset => asset.id === topAsset?.asset_id)

    return {
      totalInvested: totalInvested.toFixed(2),
      totalCurrentValue: totalCurrentValue.toFixed(2),
      totalUnrealizedPnl: totalPnl.toFixed(2),
      totalReturnPercentage: returnPercentage,
      assetCount: investments.length,
      topPerformingAsset: topAssetData ? {
        name: topAssetData.name,
        symbol: topAssetData.symbol,
        returnPercentage: parseFloat(topAsset.unrealized_pnl) / parseFloat(topAsset.total_invested) * 100
      } : undefined
    }
  }

  async getAvailableAssets(): Promise<TokenizedAsset[]> {
    const user = this.getUserFromId('demo-user-1') // Use any user for available assets
    if (!user) return []

    const investmentData = MockDataExtensions.generateInvestmentPortfolio(user)
    return investmentData.assets
  }

  async getUserInvestments(userId: string): Promise<UserInvestment[]> {
    const user = this.getUserFromId(userId)
    if (!user) return []

    const investmentData = MockDataExtensions.generateInvestmentPortfolio(user)
    return investmentData.investments
  }

  private getUserFromId(userId: string): DemoUser | undefined {
    const email = 'john@example.com' // Default for demo
    return findUserByEmail(email)
  }
}

// Demo Loan Service
export class DemoLoanService {
  async getLoanApplications(userId: string): Promise<LoanApplication[]> {
    const user = this.getUserFromId(userId)
    if (!user) return []

    const loanData = MockDataExtensions.generateLoanData(user)
    return loanData.applications
  }

  async getActiveLoans(userId: string): Promise<ActiveLoan[]> {
    const user = this.getUserFromId(userId)
    if (!user) return []

    const loanData = MockDataExtensions.generateLoanData(user)
    return loanData.active
  }

  private getUserFromId(userId: string): DemoUser | undefined {
    const email = 'john@example.com' // Default for demo
    return findUserByEmail(email)
  }
}

// Demo Insurance Service
export class DemoInsuranceService {
  async getUserPolicies(userId: string): Promise<InsurancePolicy[]> {
    const user = this.getUserFromId(userId)
    if (!user) return []

    const insuranceData = MockDataExtensions.generateInsuranceData(user)
    return insuranceData.policies
  }

  private getUserFromId(userId: string): DemoUser | undefined {
    const email = 'john@example.com' // Default for demo
    return findUserByEmail(email)
  }
}

// Demo Notification Service
export class DemoNotificationService {
  async getUserNotifications(userId: string): Promise<UserNotification[]> {
    const user = this.getUserFromId(userId)
    if (!user) return []

    return MockDataExtensions.generateNotifications(user)
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    // In demo mode, always return success
    return true
  }

  private getUserFromId(userId: string): DemoUser | undefined {
    const email = 'john@example.com' // Default for demo
    return findUserByEmail(email)
  }
}

// Export demo service instances
export const demoTransactionService = new DemoTransactionService()
export const demoCardService = new DemoCardService()
export const demoInvestmentService = new DemoInvestmentService()
export const demoLoanService = new DemoLoanService()
export const demoInsuranceService = new DemoInsuranceService()
export const demoNotificationService = new DemoNotificationService()
