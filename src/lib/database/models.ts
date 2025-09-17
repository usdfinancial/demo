// Database model type definitions for USD Financial

export type StablecoinSymbol = 'USDC' | 'USDT'
export type ChainId = '1' | '137' | '42161' | '10' | '56'
export type TransactionType = 'deposit' | 'withdrawal' | 'yield' | 'swap' | 'bridge' | 'spend' | 'transfer' | 'reward' | 'fee' | 'investment' | 'loan' | 'insurance'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'
export type RiskLevel = 'Low' | 'Medium' | 'High'

// Base interface for database records
export interface BaseRecord {
  id: string
  created_at: string
  updated_at: string
}

// User related models
export interface User extends BaseRecord {
  address?: string
  smart_wallet_address?: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  country?: string
  date_of_birth?: string
  kyc_status?: 'pending' | 'approved' | 'rejected'
  kyc_level?: 'none' | 'basic' | 'full'
  primary_auth_method?: string
  email_verified?: boolean
  is_active?: boolean
  last_login?: string
  last_auth_at?: string
  preferences?: any
}

export interface UserProfile extends BaseRecord {
  user_id: string
  avatar_url?: string
  bio?: string
  timezone?: string
  country_code?: string
  preferred_currency?: StablecoinSymbol
  privacy_settings?: any
}

export interface UserWallet extends BaseRecord {
  user_id: string
  chain_id: ChainId
  address: string
  wallet_type: 'smart' | 'external'
  label?: string
  is_primary: boolean
  is_verified: boolean
  balance_last_updated?: string
}

export interface UserNotification extends BaseRecord {
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  priority: 'low' | 'normal' | 'high'
  is_read: boolean
  action_url?: string
  expires_at?: string
  metadata?: any
}

// Balance and transaction models
export interface StablecoinBalance extends BaseRecord {
  user_id: string
  chain_id: ChainId
  stablecoin: StablecoinSymbol
  balance: string
  locked_balance: string
  contract_address: string
  last_updated: string
}

export interface Transaction extends BaseRecord {
  user_id: string
  tx_hash?: string
  transaction_type: TransactionType
  status: TransactionStatus
  amount: string
  fee_amount: string
  stablecoin: StablecoinSymbol
  chain_id: ChainId
  from_address?: string
  to_address?: string
  from_chain?: ChainId
  to_chain?: ChainId
  protocol_name?: string
  description?: string
  block_number?: number
  block_timestamp?: string
  confirmed_at?: string
  gas_used?: number
  gas_price?: string
  metadata?: any
}

// Investment related models
export interface TokenizedAsset extends BaseRecord {
  name: string
  symbol: string
  category: string
  description?: string
  underlying_asset?: string
  total_supply?: string
  circulating_supply?: string
  current_price: string
  price_change_24h?: string
  market_cap?: string
  market_cap_usd?: string
  minimum_investment?: string
  expected_return?: string
  current_apy?: string
  risk_level: RiskLevel
  provider: string
  features?: string[]
  is_active: boolean
}

export interface UserInvestment extends BaseRecord {
  user_id: string
  asset_id: string
  quantity: string
  average_cost: string
  total_invested: string
  current_value: string
  unrealized_pnl: string
  currency: StablecoinSymbol
  first_purchase_at?: string
  last_purchase_at?: string
  is_active: boolean
}

export interface DeFiProtocol extends BaseRecord {
  protocol_key: string
  name: string
  description?: string
  category: 'lending' | 'dex' | 'yield_farming' | 'liquidity_mining' | 'staking'
  current_apy: string
  min_deposit: string
  max_deposit?: string
  lock_period_days: number
  risk_level: RiskLevel
  tvl_usd?: string
  supported_chains: ChainId[]
  contract_address?: string
  is_active: boolean
  metadata?: any
}

export interface UserDeFiPosition extends BaseRecord {
  user_id: string
  protocol_id: string
  amount_deposited: string
  amount_earned: string
  stablecoin: StablecoinSymbol
  chain_id: ChainId
  entry_apy: string
  deposit_date: string
  last_claim_date?: string
  is_active: boolean
  metadata?: any
}

export interface StakingPool extends BaseRecord {
  name: string
  token_symbol: string
  apy: string
  min_stake: string
  max_stake?: string
  lock_period_days: number
  risk_level: RiskLevel
  pool_size: string
  staked_amount: string
  reward_token: string
  chain_id: ChainId
  contract_address: string
  is_active: boolean
}

export interface UserStakingPosition extends BaseRecord {
  user_id: string
  pool_id: string
  staked_amount: string
  earned_rewards: string
  stake_date: string
  unlock_date?: string
  last_reward_claim?: string
  is_active: boolean
}

export type InvestmentStrategy = 'dca' | 'momentum' | 'value' | 'balanced'
export type InvestmentFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'
export type CardType = 'virtual' | 'physical'
export type CardStatus = 'active' | 'blocked' | 'expired' | 'pending'
export type LoanStatus = 'pending' | 'approved' | 'active' | 'completed' | 'defaulted'
export type InsuranceStatus = 'active' | 'expired' | 'cancelled' | 'claimed'

export interface AutoInvestPlan extends BaseRecord {
  user_id: string
  name: string
  strategy: InvestmentStrategy
  frequency: InvestmentFrequency
  amount: string
  currency: StablecoinSymbol
  allocations: any // JSON object with allocation percentages
  next_execution: string
  next_execution_at?: string
  execution_count?: number
  is_active: boolean
  total_invested: string
  total_value?: string
  metadata?: any
}

// Card related models
export interface UserCard extends BaseRecord {
  user_id: string
  card_type: CardType
  card_status: CardStatus
  card_number_hash: string
  cvv_hash: string
  expiry_date: string
  cardholder_name: string
  spending_limit_daily: string
  spending_limit_monthly: string
  is_frozen: boolean
  pin_set: boolean
  metadata?: any
}

export interface CardTransaction extends BaseRecord {
  user_id: string
  card_id: string
  merchant_name: string
  merchant_category: string
  amount: string
  currency: StablecoinSymbol
  status: TransactionStatus
  transaction_date: string
  location?: string
  metadata?: any
}

// Loan related models
export interface LoanApplication extends BaseRecord {
  user_id: string
  loan_amount: string
  collateral_amount: string
  collateral_asset: string
  interest_rate: string
  loan_term_days: number
  ltv_ratio: string
  status: LoanStatus
  approved_at?: string
  metadata?: any
}

export interface ActiveLoan extends BaseRecord {
  user_id: string
  application_id: string
  principal_amount: string
  outstanding_balance: string
  interest_rate: string
  monthly_payment: string
  next_payment_date: string
  maturity_date: string
  collateral_value: string
  current_ltv: string
  status: LoanStatus
  metadata?: any
}

// Insurance related models
export interface InsurancePolicy extends BaseRecord {
  user_id: string
  policy_type: string
  coverage_amount: string
  premium_amount: string
  premium_frequency: 'monthly' | 'quarterly' | 'annually'
  status: InsuranceStatus
  start_date: string
  end_date: string
  next_premium_date?: string
  metadata?: any
}

export interface InsuranceClaim extends BaseRecord {
  user_id: string
  policy_id: string
  claim_amount: string
  claim_reason: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  filed_date: string
  processed_date?: string
  payout_amount?: string
  metadata?: any
}

// Business related models
export interface BusinessProfile extends BaseRecord {
  user_id: string
  company_name: string
  business_type: string
  registration_number?: string
  tax_id?: string
  address: string
  website?: string
  employee_count?: number
  annual_revenue?: string
  industry: string
  metadata?: any
}

// Utility types
export interface PaginatedResult<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Extended types for API responses
export interface TransactionWithDetails extends Transaction {
  networkName?: string
  explorerUrl?: string
  usdValue?: string
}

export interface DeFiProtocolWithUserData extends DeFiProtocol {
  userDeposit?: string
  userEarned?: string
  isUserParticipating?: boolean
}

export interface UserDashboardData {
  user: User
  totalBalance: string
  balanceByChain: Array<{
    chainId: ChainId
    chainName: string
    stablecoin: StablecoinSymbol
    balance: string
  }>
  portfolioSummary: {
    totalValue: string
    totalInvested: string
    pnl: string
    pnlPercentage: number
  }
  recentActivity: Array<{
    id: string
    type: TransactionType
    description: string
    amount?: string
    timestamp: string
  }>
  notifications: Array<{
    id: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
  }>
}

export interface InvestmentPortfolioSummary {
  totalInvested: string
  totalCurrentValue: string
  totalUnrealizedPnl: string
  totalReturnPercentage: number
  assetCount: number
  topPerformingAsset?: {
    name: string
    symbol: string
    returnPercentage: number
  }
}

// All types are already exported above with their definitions