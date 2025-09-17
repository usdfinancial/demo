import { 
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
  UserNotification,
  CardType,
  CardStatus,
  LoanStatus,
  InsuranceStatus,
  RiskLevel
} from '@/lib/database/models'
import { DemoUser } from '@/lib/demoUsers'

// Merchant categories for card transactions
const MERCHANT_CATEGORIES = [
  'Restaurants', 'Gas Stations', 'Grocery Stores', 'Online Shopping',
  'Entertainment', 'Travel', 'Healthcare', 'Utilities', 'Education',
  'Subscription Services', 'Coffee Shops', 'Retail Stores'
]

const MERCHANT_NAMES = [
  'Starbucks Coffee', 'Amazon', 'Shell Gas Station', 'Whole Foods Market',
  'Netflix', 'Spotify', 'Uber', 'McDonald\'s', 'Target', 'Best Buy',
  'Apple Store', 'Google Play', 'Steam', 'Adobe', 'Microsoft'
]

const CITIES = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
  'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA'
]

export class MockDataExtensions {
  // Generate card data
  static generateCardData(user: DemoUser) {
    const cards: UserCard[] = []
    const cardTransactions: CardTransaction[] = []

    // Generate 1-3 cards based on account type
    const cardCount = user.accountType === 'business' ? 3 : 
                     user.accountType === 'premium' ? 2 : 1

    for (let i = 0; i < cardCount; i++) {
      const cardType: CardType = i === 0 ? 'physical' : 'virtual'
      const card: UserCard = {
        id: `card-${user.id}-${i}`,
        user_id: user.id,
        card_type: cardType,
        card_status: 'active',
        card_number_hash: `****-****-****-${Math.floor(Math.random() * 9000) + 1000}`,
        cvv_hash: '***',
        expiry_date: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().substr(0, 7),
        cardholder_name: user.name.toUpperCase(),
        spending_limit_daily: user.accountType === 'business' ? '50000' : '5000',
        spending_limit_monthly: user.accountType === 'business' ? '500000' : '50000',
        is_frozen: false,
        pin_set: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          rewards: {
            cashback: cardType === 'physical' ? 2.5 : 1.5,
            totalEarned: Math.floor(Math.random() * 500) + 100
          }
        }
      }
      cards.push(card)

      // Generate card transactions for the last 3 months
      for (let month = 0; month < 3; month++) {
        const monthlySpends = Math.floor(Math.random() * 20) + 10
        for (let j = 0; j < monthlySpends; j++) {
          const spendDate = new Date()
          spendDate.setMonth(spendDate.getMonth() - month)
          spendDate.setDate(Math.floor(Math.random() * 28) + 1)

          cardTransactions.push({
            id: `card-tx-${card.id}-${month}-${j}`,
            user_id: user.id,
            card_id: card.id,
            merchant_name: MERCHANT_NAMES[Math.floor(Math.random() * MERCHANT_NAMES.length)],
            merchant_category: MERCHANT_CATEGORIES[Math.floor(Math.random() * MERCHANT_CATEGORIES.length)],
            amount: (Math.random() * 200 + 10).toFixed(2),
            currency: 'USDC',
            status: 'completed',
            transaction_date: spendDate.toISOString(),
            location: CITIES[Math.floor(Math.random() * CITIES.length)],
            created_at: spendDate.toISOString(),
            updated_at: spendDate.toISOString(),
            metadata: {
              rewards: (Math.random() * 5 + 1).toFixed(2)
            }
          })
        }
      }
    }

    return { cards, transactions: cardTransactions }
  }

  // Generate investment portfolio
  static generateInvestmentPortfolio(user: DemoUser) {
    const TOKENIZED_ASSETS_DATA = [
      { name: 'US Treasury Bills', symbol: 'USTB', category: 'Government Bonds', apy: '5.2', risk: 'Low' },
      { name: 'Real Estate Index', symbol: 'REIT', category: 'Real Estate', apy: '7.8', risk: 'Medium' },
      { name: 'Gold ETF', symbol: 'GOLD', category: 'Commodities', apy: '3.1', risk: 'Low' },
      { name: 'Tech Stock Index', symbol: 'TECH', category: 'Equities', apy: '12.4', risk: 'High' },
      { name: 'Corporate Bonds', symbol: 'CORP', category: 'Corporate Bonds', apy: '4.8', risk: 'Medium' }
    ]

    const investments: UserInvestment[] = []
    const tokenizedAssets: TokenizedAsset[] = []

    // Generate tokenized assets
    TOKENIZED_ASSETS_DATA.forEach((asset, index) => {
      const currentPrice = 100 + Math.random() * 900 // $100-$1000
      const priceChange = (Math.random() - 0.5) * 0.2 // -10% to +10%
      
      tokenizedAssets.push({
        id: `asset-${index}`,
        name: asset.name,
        symbol: asset.symbol,
        category: asset.category,
        description: `Tokenized ${asset.name} providing exposure to ${asset.category.toLowerCase()}`,
        current_price: currentPrice.toFixed(2),
        price_change_24h: (priceChange * 100).toFixed(2),
        current_apy: asset.apy,
        risk_level: asset.risk as RiskLevel,
        provider: 'USD Financial',
        minimum_investment: '100',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        features: ['Instant Liquidity', 'Daily Compounding', 'No Lock Period'],
        market_cap: `${(Math.random() * 10 + 1).toFixed(1)}B`
      })
    })

    // Generate user investments (3-7 assets based on account type)
    const investmentCount = user.accountType === 'business' ? 7 : 
                           user.accountType === 'premium' ? 5 : 3

    for (let i = 0; i < investmentCount; i++) {
      const asset = tokenizedAssets[i]
      const investedAmount = user.balance * (0.05 + Math.random() * 0.15) // 5-20% of balance
      const quantity = investedAmount / parseFloat(asset.current_price)
      const currentValue = quantity * parseFloat(asset.current_price)
      const pnl = currentValue - investedAmount

      investments.push({
        id: `investment-${user.id}-${i}`,
        user_id: user.id,
        asset_id: asset.id,
        quantity: quantity.toFixed(6),
        average_cost: asset.current_price,
        total_invested: investedAmount.toFixed(2),
        current_value: currentValue.toFixed(2),
        unrealized_pnl: pnl.toFixed(2),
        currency: 'USDC',
        first_purchase_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
        last_purchase_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    return { assets: tokenizedAssets, investments }
  }

  // Generate DeFi positions
  static generateDeFiPositions(user: DemoUser) {
    const DEFI_PROTOCOLS_DATA = [
      { name: 'Aave', category: 'lending', apy: '4.2', risk: 'Low', tvl: '12.5B' },
      { name: 'Compound', category: 'lending', apy: '3.8', risk: 'Low', tvl: '8.2B' },
      { name: 'Yearn Finance', category: 'yield_farming', apy: '8.5', risk: 'Medium', tvl: '2.1B' },
      { name: 'Convex', category: 'yield_farming', apy: '12.3', risk: 'Medium', tvl: '4.8B' },
      { name: 'Curve', category: 'dex', apy: '6.7', risk: 'Low', tvl: '15.3B' }
    ]

    const protocols: DeFiProtocol[] = []
    const positions: UserDeFiPosition[] = []

    // Generate protocols
    DEFI_PROTOCOLS_DATA.forEach((protocol, index) => {
      protocols.push({
        id: `protocol-${index}`,
        protocol_key: protocol.name.toLowerCase().replace(' ', '_'),
        name: protocol.name,
        description: `${protocol.name} protocol for ${protocol.category}`,
        category: protocol.category as any,
        current_apy: protocol.apy,
        min_deposit: '100',
        max_deposit: '1000000',
        lock_period_days: Math.floor(Math.random() * 90),
        risk_level: protocol.risk as RiskLevel,
        tvl_usd: protocol.tvl,
        supported_chains: ['1', '137', '42161'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          website: `https://${protocol.name.toLowerCase().replace(' ', '')}.com`,
          audit: 'Audited by CertiK'
        }
      })
    })

    // Generate user positions (2-4 positions based on account type)
    const positionCount = user.accountType === 'business' ? 4 : 
                         user.accountType === 'premium' ? 3 : 2

    for (let i = 0; i < positionCount; i++) {
      const protocol = protocols[i]
      const depositAmount = user.balance * (0.1 + Math.random() * 0.2) // 10-30% of balance
      const earnedAmount = depositAmount * (parseFloat(protocol.current_apy) / 100) * (Math.random() * 0.5)

      positions.push({
        id: `position-${user.id}-${i}`,
        user_id: user.id,
        protocol_id: protocol.id,
        amount_deposited: depositAmount.toFixed(2),
        amount_earned: earnedAmount.toFixed(2),
        stablecoin: 'USDC',
        chain_id: '1',
        entry_apy: protocol.current_apy,
        deposit_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        last_claim_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          autoCompound: Math.random() > 0.5,
          nextClaimDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
    }

    return { protocols, positions }
  }

  // Generate loan data
  static generateLoanData(user: DemoUser) {
    if (user.accountType === 'personal' && Math.random() > 0.3) {
      return { applications: [], active: [] } // 30% chance for personal accounts
    }

    const applications: LoanApplication[] = []
    const activeLoans: ActiveLoan[] = []

    // Generate 1-2 loan applications
    const loanCount = user.accountType === 'business' ? 2 : 1

    for (let i = 0; i < loanCount; i++) {
      const loanAmount = user.balance * (0.3 + Math.random() * 0.4) // 30-70% of balance
      const collateralAmount = loanAmount * 1.5 // 150% collateralization
      const interestRate = 5 + Math.random() * 10 // 5-15% APR

      const application: LoanApplication = {
        id: `loan-app-${user.id}-${i}`,
        user_id: user.id,
        loan_amount: loanAmount.toFixed(2),
        collateral_amount: collateralAmount.toFixed(2),
        collateral_asset: 'USDC',
        interest_rate: interestRate.toFixed(2),
        loan_term_days: 365,
        ltv_ratio: '66.67',
        status: Math.random() > 0.2 ? 'approved' : 'pending',
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        approved_at: Math.random() > 0.2 ? new Date().toISOString() : undefined,
        metadata: {
          purpose: 'Business expansion',
          creditScore: Math.floor(Math.random() * 200) + 650
        }
      }
      applications.push(application)

      // If approved, create active loan
      if (application.status === 'approved') {
        const monthlyPayment = loanAmount * (interestRate / 100 / 12)
        const remainingBalance = loanAmount * (0.7 + Math.random() * 0.3) // 70-100% remaining

        activeLoans.push({
          id: `loan-${user.id}-${i}`,
          user_id: user.id,
          application_id: application.id,
          principal_amount: loanAmount.toFixed(2),
          outstanding_balance: remainingBalance.toFixed(2),
          interest_rate: interestRate.toFixed(2),
          monthly_payment: monthlyPayment.toFixed(2),
          next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          maturity_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          collateral_value: collateralAmount.toFixed(2),
          current_ltv: ((remainingBalance / collateralAmount) * 100).toFixed(2),
          status: 'active',
          created_at: application.approved_at!,
          updated_at: new Date().toISOString(),
          metadata: {
            paymentHistory: 'On-time',
            autoPayEnabled: Math.random() > 0.5
          }
        })
      }
    }

    return { applications, active: activeLoans }
  }

  // Generate insurance data
  static generateInsuranceData(user: DemoUser) {
    if (user.accountType === 'personal' && Math.random() > 0.4) {
      return { policies: [], claims: [] } // 40% chance for personal accounts
    }

    const policies: InsurancePolicy[] = []
    const claims: InsuranceClaim[] = []

    const policyTypes = ['DeFi Protocol Coverage', 'Smart Contract Insurance', 'Custody Protection']
    const policyCount = user.accountType === 'business' ? 3 : 1

    for (let i = 0; i < policyCount; i++) {
      const coverageAmount = user.balance * (0.5 + Math.random() * 0.5) // 50-100% coverage
      const premiumAmount = coverageAmount * 0.02 // 2% annual premium

      policies.push({
        id: `policy-${user.id}-${i}`,
        user_id: user.id,
        policy_type: policyTypes[i % policyTypes.length],
        coverage_amount: coverageAmount.toFixed(2),
        premium_amount: premiumAmount.toFixed(2),
        premium_frequency: 'monthly',
        status: 'active',
        start_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
        next_premium_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          deductible: (coverageAmount * 0.05).toFixed(2),
          provider: 'USD Financial Insurance'
        }
      })
    }

    return { policies, claims }
  }

  // Generate business data
  static generateBusinessData(user: DemoUser): BusinessProfile {
    const industries = ['Technology', 'Finance', 'Healthcare', 'Real Estate', 'Manufacturing']
    const businessTypes = ['LLC', 'Corporation', 'Partnership', 'Sole Proprietorship']

    return {
      id: `business-${user.id}`,
      user_id: user.id,
      company_name: `${user.name.split(' ')[1]} ${businessTypes[Math.floor(Math.random() * businessTypes.length)]}`,
      business_type: businessTypes[Math.floor(Math.random() * businessTypes.length)],
      registration_number: `REG-${Math.floor(Math.random() * 1000000)}`,
      tax_id: `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000000) + 1000000}`,
      address: '123 Business St, Finance City, FC 12345',
      website: `https://${user.name.split(' ')[1].toLowerCase()}business.com`,
      employee_count: Math.floor(Math.random() * 500) + 10,
      annual_revenue: (Math.random() * 10000000 + 1000000).toFixed(0),
      industry: industries[Math.floor(Math.random() * industries.length)],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        founded: new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000).getFullYear(),
        description: 'Leading provider of innovative financial solutions'
      }
    }
  }

  // Generate notifications
  static generateNotifications(user: DemoUser): UserNotification[] {
    const notifications: UserNotification[] = []
    const notificationTypes = [
      { type: 'info', title: 'Transaction Completed', message: 'Your USDC transfer has been completed successfully' },
      { type: 'success', title: 'Yield Earned', message: 'You earned $12.50 in yield from your DeFi position' },
      { type: 'warning', title: 'Card Spending Alert', message: 'You\'ve reached 80% of your monthly spending limit' },
      { type: 'info', title: 'New Investment Opportunity', message: 'Check out our new tokenized real estate offering' },
      { type: 'success', title: 'Loan Payment Processed', message: 'Your monthly loan payment has been processed' }
    ]

    for (let i = 0; i < 8; i++) {
      const notification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
      const createdDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)

      notifications.push({
        id: `notif-${user.id}-${i}`,
        user_id: user.id,
        title: notification.title,
        message: notification.message,
        type: notification.type as any,
        priority: Math.random() > 0.7 ? 'high' : 'normal',
        is_read: Math.random() > 0.4,
        created_at: createdDate.toISOString(),
        updated_at: createdDate.toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          category: 'financial',
          actionable: Math.random() > 0.5
        }
      })
    }

    return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
}
