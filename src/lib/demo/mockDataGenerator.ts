import { 
  StablecoinSymbol, 
  ChainId, 
  TransactionType, 
  TransactionStatus,
  CardType,
  CardStatus,
  LoanStatus,
  InsuranceStatus,
  RiskLevel,
  Transaction,
  UserCard,
  CardTransaction,
  LoanApplication,
  ActiveLoan,
  InsurancePolicy,
  InsuranceClaim,
  BusinessProfile,
  TokenizedAsset,
  UserInvestment,
  DeFiProtocol,
  UserDeFiPosition,
  StakingPool,
  UserStakingPosition,
  AutoInvestPlan,
  UserNotification
} from '@/lib/database/models'
import { DemoUser } from '@/lib/demoUsers'

// Chain configuration
export const CHAIN_CONFIG = {
  '1': { name: 'Ethereum', symbol: 'ETH', icon: '⟠' },
  '137': { name: 'Polygon', symbol: 'MATIC', icon: '🟣' },
  '42161': { name: 'Arbitrum', symbol: 'ETH', icon: '🔺' },
  '10': { name: 'Optimism', symbol: 'ETH', icon: '🔴' },
  '56': { name: 'BSC', symbol: 'BNB', icon: '🟡' }
} as const

// Merchant categories for card transactions
const MERCHANT_CATEGORIES = [
  'Restaurants', 'Gas Stations', 'Grocery Stores', 'Online Shopping',
  'Entertainment', 'Travel', 'Healthcare', 'Utilities', 'Education',
  'Subscription Services', 'Coffee Shops', 'Retail Stores'
]

// DeFi protocols data
const DEFI_PROTOCOLS_DATA = [
  { name: 'Aave', category: 'lending', apy: '4.2', risk: 'Low', tvl: '12.5B' },
  { name: 'Compound', category: 'lending', apy: '3.8', risk: 'Low', tvl: '8.2B' },
  { name: 'Yearn Finance', category: 'yield_farming', apy: '8.5', risk: 'Medium', tvl: '2.1B' },
  { name: 'Convex', category: 'yield_farming', apy: '12.3', risk: 'Medium', tvl: '4.8B' },
  { name: 'Curve', category: 'dex', apy: '6.7', risk: 'Low', tvl: '15.3B' }
] as const

// Tokenized assets data
const TOKENIZED_ASSETS_DATA = [
  { name: 'US Treasury Bills', symbol: 'USTB', category: 'Government Bonds', apy: '5.2', risk: 'Low' },
  { name: 'Real Estate Index', symbol: 'REIT', category: 'Real Estate', apy: '7.8', risk: 'Medium' },
  { name: 'Gold ETF', symbol: 'GOLD', category: 'Commodities', apy: '3.1', risk: 'Low' },
  { name: 'Tech Stock Index', symbol: 'TECH', category: 'Equities', apy: '12.4', risk: 'High' },
  { name: 'Corporate Bonds', symbol: 'CORP', category: 'Corporate Bonds', apy: '4.8', risk: 'Medium' }
] as const

export class MockDataGenerator {
  private static instance: MockDataGenerator
  private userDataCache = new Map<string, any>()

  static getInstance(): MockDataGenerator {
    if (!MockDataGenerator.instance) {
      MockDataGenerator.instance = new MockDataGenerator()
    }
    return MockDataGenerator.instance
  }

  // Generate comprehensive user financial profile
  generateUserFinancialProfile(user: DemoUser): any {
    if (this.userDataCache.has(user.id)) {
      return this.userDataCache.get(user.id)
    }

    const profile = {
      ...user,
      balances: this.generateMultiChainBalances(user),
      transactions: this.generateTransactionHistory(user, 6), // 6 months
      cards: this.generateCardData(user),
      investments: this.generateInvestmentPortfolio(user),
      defiPositions: this.generateDeFiPositions(user),
      loans: this.generateLoanData(user),
      insurance: this.generateInsuranceData(user),
      business: user.accountType === 'business' ? this.generateBusinessData(user) : null,
      notifications: this.generateNotifications(user)
    }

    this.userDataCache.set(user.id, profile)
    return profile
  }

  // Generate multi-chain balances
  private generateMultiChainBalances(user: DemoUser) {
    const chains: ChainId[] = ['1', '137', '42161', '10', '56']
    const balances: Record<ChainId, any> = {} as any

    chains.forEach(chainId => {
      const chainBalance = user.balance * (0.1 + Math.random() * 0.3) // 10-40% per chain
      const lockedPercentage = Math.random() * 0.2 // 0-20% locked
      
      balances[chainId] = {
        USDC: chainBalance * 0.7, // 70% USDC
        USDT: chainBalance * 0.3, // 30% USDT
        locked: chainBalance * lockedPercentage,
        available: chainBalance * (1 - lockedPercentage),
        lastUpdated: new Date().toISOString()
      }
    })

    return balances
  }

  // Generate realistic transaction history
  generateTransactionHistory(user: DemoUser, months: number): Transaction[] {
    const transactions: Transaction[] = []
    const now = new Date()
    const transactionTypes: TransactionType[] = [
      'deposit', 'withdrawal', 'swap', 'bridge', 'spend', 'transfer', 
      'yield', 'reward', 'fee', 'investment'
    ]

    // Generate 5-15 transactions per month based on account type
    const monthlyTxCount = user.accountType === 'business' ? 25 : 
                          user.accountType === 'premium' ? 15 : 8

    for (let month = 0; month < months; month++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - month, 1)
      
      for (let i = 0; i < monthlyTxCount + Math.floor(Math.random() * 10); i++) {
        const txDate = new Date(monthDate)
        txDate.setDate(Math.floor(Math.random() * 28) + 1)
        txDate.setHours(Math.floor(Math.random() * 24))
        txDate.setMinutes(Math.floor(Math.random() * 60))

        const txType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]
        const amount = this.generateRealisticAmount(txType, user.accountType)
        const chainId = (['1', '137', '42161', '10', '56'] as ChainId[])[Math.floor(Math.random() * 5)]

        transactions.push({
          id: `tx-${user.id}-${month}-${i}`,
          user_id: user.id,
          tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          transaction_type: txType,
          status: Math.random() > 0.05 ? 'completed' : 'pending', // 95% completed
          amount: amount.toString(),
          fee_amount: (amount * 0.001 + Math.random() * 0.01).toFixed(6), // 0.1% + random fee
          stablecoin: Math.random() > 0.7 ? 'USDT' : 'USDC',
          chain_id: chainId,
          from_address: `0x${Math.random().toString(16).substr(2, 40)}`,
          to_address: `0x${Math.random().toString(16).substr(2, 40)}`,
          description: this.generateTransactionDescription(txType),
          created_at: txDate.toISOString(),
          updated_at: txDate.toISOString(),
          confirmed_at: Math.random() > 0.05 ? txDate.toISOString() : undefined,
          block_number: Math.floor(Math.random() * 1000000) + 18000000,
          gas_used: Math.floor(Math.random() * 100000) + 21000,
          gas_price: (Math.random() * 50 + 10).toFixed(9),
          metadata: {
            networkName: CHAIN_CONFIG[chainId].name,
            explorerUrl: this.generateExplorerUrl(chainId, `0x${Math.random().toString(16).substr(2, 64)}`)
          }
        })
      }
    }

    return transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  // Helper methods
  private generateRealisticAmount(txType: TransactionType, accountType: string): number {
    const baseAmount = accountType === 'business' ? 5000 : 
                      accountType === 'premium' ? 1000 : 200

    switch (txType) {
      case 'deposit':
        return baseAmount * (1 + Math.random() * 4) // 1x-5x base
      case 'withdrawal':
        return baseAmount * (0.5 + Math.random() * 2) // 0.5x-2.5x base
      case 'spend':
        return Math.random() * 500 + 10 // $10-$510
      case 'investment':
        return baseAmount * (2 + Math.random() * 8) // 2x-10x base
      case 'yield':
      case 'reward':
        return Math.random() * 100 + 5 // $5-$105
      case 'fee':
        return Math.random() * 10 + 1 // $1-$11
      default:
        return baseAmount * (0.1 + Math.random() * 1.9) // 0.1x-2x base
    }
  }

  private generateTransactionDescription(txType: TransactionType): string {
    const descriptions = {
      deposit: 'Deposit from bank account',
      withdrawal: 'Withdrawal to bank account',
      swap: 'Token swap on DEX',
      bridge: 'Cross-chain bridge transfer',
      spend: 'Card payment',
      transfer: 'P2P transfer',
      yield: 'DeFi yield earned',
      reward: 'Cashback reward',
      fee: 'Network transaction fee',
      investment: 'Investment purchase',
      loan: 'Loan disbursement',
      insurance: 'Insurance premium payment'
    }
    return descriptions[txType] || 'Transaction'
  }

  private generateExplorerUrl(chainId: ChainId, txHash: string): string {
    const explorers = {
      '1': 'https://etherscan.io/tx/',
      '137': 'https://polygonscan.com/tx/',
      '42161': 'https://arbiscan.io/tx/',
      '10': 'https://optimistic.etherscan.io/tx/',
      '56': 'https://bscscan.com/tx/'
    }
    return explorers[chainId] + txHash
  }

  generateCardData(user: DemoUser): UserCard[] {
    const cards: UserCard[] = []
    const cardCount = user.accountType === 'business' ? 3 : user.accountType === 'premium' ? 2 : 1
    
    for (let i = 0; i < cardCount; i++) {
      cards.push({
        id: `card-${user.id}-${i}`,
        user_id: user.id,
        card_type: i === 0 ? 'virtual' : 'physical',
        card_name: i === 0 ? 'Virtual Card' : `Physical Card ${i}`,
        last_four_digits: Math.floor(1000 + Math.random() * 9000).toString(),
        expiry_month: Math.floor(1 + Math.random() * 12),
        expiry_year: new Date().getFullYear() + Math.floor(1 + Math.random() * 5),
        card_status: 'active',
        spending_limit_daily: (user.accountType === 'business' ? 50000 : 5000).toString(),
        spending_limit_monthly: (user.accountType === 'business' ? 500000 : 50000).toString(),
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    return cards
  }

  generateInvestmentPortfolio(user: DemoUser): UserInvestment[] {
    const investments: UserInvestment[] = []
    const investmentCount = user.accountType === 'business' ? 8 : user.accountType === 'premium' ? 5 : 3
    
    const assets = ['BTC-ETF', 'ETH-ETF', 'GOLD-TOKEN', 'SP500-TOKEN', 'REAL-ESTATE-TOKEN', 'BOND-TOKEN', 'TECH-ETF', 'GREEN-ENERGY']
    
    for (let i = 0; i < investmentCount; i++) {
      const asset = assets[i % assets.length]
      const investedAmount = Math.floor(1000 + Math.random() * 50000)
      const returnPercent = -20 + Math.random() * 60 // -20% to +40%
      const currentValue = investedAmount * (1 + returnPercent / 100)
      
      investments.push({
        id: `inv-${user.id}-${i}`,
        user_id: user.id,
        asset_id: `asset-${asset}`,
        quantity: (investedAmount / (100 + Math.random() * 500)).toString(), // Mock price
        average_cost: (100 + Math.random() * 500).toString(),
        current_value: currentValue.toString(),
        unrealized_pnl: (currentValue - investedAmount).toString(),
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    return investments
  }

  generateDeFiPositions(user: DemoUser): UserDeFiPosition[] {
    const positions: UserDeFiPosition[] = []
    const positionCount = user.accountType === 'business' ? 5 : user.accountType === 'premium' ? 3 : 2
    
    for (let i = 0; i < positionCount; i++) {
      const protocol = DEFI_PROTOCOLS_DATA[i % DEFI_PROTOCOLS_DATA.length]
      const stakedAmount = Math.floor(1000 + Math.random() * 20000)
      
      positions.push({
        id: `defi-${user.id}-${i}`,
        user_id: user.id,
        protocol_id: `protocol-${protocol.name.toLowerCase()}`,
        stablecoin_symbol: Math.random() > 0.5 ? 'USDC' : 'USDT',
        staked_amount: stakedAmount,
        current_apy: parseFloat(protocol.apy),
        rewards_earned: stakedAmount * parseFloat(protocol.apy) / 100 * (Math.random() * 0.5), // Up to 6 months rewards
        auto_compound: Math.random() > 0.3,
        created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    return positions
  }

  generateLoanData(user: DemoUser): ActiveLoan[] {
    if (user.accountType === 'personal' && Math.random() > 0.3) return [] // 70% chance no loans for personal
    
    const loans: ActiveLoan[] = []
    const loanCount = user.accountType === 'business' ? 2 : 1
    
    for (let i = 0; i < loanCount; i++) {
      const principalAmount = Math.floor(5000 + Math.random() * 95000)
      const interestRate = 5 + Math.random() * 10 // 5-15%
      const termMonths = [6, 12, 24, 36][Math.floor(Math.random() * 4)]
      const monthsElapsed = Math.floor(Math.random() * termMonths)
      const remainingBalance = principalAmount * (1 - monthsElapsed / termMonths)
      
      loans.push({
        id: `loan-${user.id}-${i}`,
        user_id: user.id,
        application_id: `app-${user.id}-${i}`,
        principal_amount: principalAmount,
        interest_rate: interestRate,
        term_months: termMonths,
        monthly_payment: (principalAmount * (1 + interestRate / 100)) / termMonths,
        remaining_balance: remainingBalance,
        next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        loan_status: 'active',
        collateral_type: 'crypto',
        collateral_amount: principalAmount * 1.5, // 150% collateralization
        created_at: new Date(Date.now() - monthsElapsed * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    return loans
  }

  generateInsuranceData(user: DemoUser): InsurancePolicy[] {
    const policies: InsurancePolicy[] = []
    const policyCount = user.accountType === 'business' ? 3 : user.accountType === 'premium' ? 2 : 1
    
    const policyTypes = ['defi', 'deposit', 'cyber', 'custody']
    
    for (let i = 0; i < policyCount; i++) {
      const policyType = policyTypes[i % policyTypes.length]
      const coverageAmount = Math.floor(10000 + Math.random() * 490000)
      const premium = coverageAmount * 0.02 * (1 + Math.random()) // 2-4% of coverage
      
      policies.push({
        id: `policy-${user.id}-${i}`,
        user_id: user.id,
        policy_type: policyType as any,
        coverage_amount: coverageAmount,
        premium_amount: premium,
        deductible: coverageAmount * 0.1, // 10% deductible
        policy_status: 'active',
        start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    return policies
  }

  generateBusinessData(user: DemoUser): BusinessProfile | null {
    if (user.accountType !== 'business') return null
    
    return {
      id: `business-${user.id}`,
      user_id: user.id,
      business_name: user.name.includes('LLC') || user.name.includes('Inc') ? user.name : `${user.name} LLC`,
      business_type: 'llc',
      industry: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'][Math.floor(Math.random() * 5)],
      tax_id: `${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000000 + Math.random() * 9000000)}`,
      registration_number: `REG${Math.floor(100000 + Math.random() * 900000)}`,
      business_address: '123 Business St, City, State 12345',
      business_phone: '+1-555-0123',
      website: `https://${user.name.toLowerCase().replace(/\s+/g, '')}.com`,
      description: 'A leading company in the industry providing innovative solutions.',
      employee_count: Math.floor(5 + Math.random() * 495), // 5-500 employees
      annual_revenue: (Math.floor(100000 + Math.random() * 9900000)).toString(),
      founded_date: new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      verification_status: 'verified',
      kyb_status: 'approved',
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  generateNotifications(user: DemoUser): UserNotification[] {
    const notifications: UserNotification[] = []
    const notificationCount = Math.floor(3 + Math.random() * 8) // 3-10 notifications
    
    const notificationTypes = [
      { type: 'transaction', title: 'Transaction Completed', message: 'Your USDC transfer has been completed successfully.' },
      { type: 'security', title: 'Security Alert', message: 'New device login detected from Chrome on Windows.' },
      { type: 'yield', title: 'Yield Earned', message: 'You earned $12.45 in DeFi yield from Aave protocol.' },
      { type: 'card', title: 'Card Payment', message: 'Card payment of $45.67 at Coffee Shop was approved.' },
      { type: 'investment', title: 'Investment Update', message: 'Your BTC-ETF investment is up 3.2% today.' },
      { type: 'loan', title: 'Loan Payment Due', message: 'Your loan payment of $1,250 is due in 3 days.' },
      { type: 'insurance', title: 'Policy Renewal', message: 'Your DeFi insurance policy renews in 30 days.' },
      { type: 'system', title: 'System Maintenance', message: 'Scheduled maintenance on Sunday 2AM-4AM EST.' }
    ]
    
    for (let i = 0; i < notificationCount; i++) {
      const notification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
      const daysAgo = Math.floor(Math.random() * 30) // Within last 30 days
      
      notifications.push({
        id: `notif-${user.id}-${i}`,
        user_id: user.id,
        notification_type: notification.type as any,
        title: notification.title,
        message: notification.message,
        is_read: Math.random() > 0.3, // 70% chance of being read
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        action_url: null,
        created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
      })
    }
    
    // Sort by creation date (newest first)
    return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  // Clear cache for testing
  clearCache(): void {
    this.userDataCache.clear()
  }
}

// Export singleton instance
export const mockDataGenerator = MockDataGenerator.getInstance()
