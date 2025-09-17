// Database models and types for USD Financial
// TypeScript interfaces matching the database schema

export type StablecoinSymbol = 'USDC' | 'USDT'
export type ChainId = '1' | '137' | '42161' | '10' | '56'
export type TransactionType = 
  | 'deposit' | 'withdrawal' | 'yield' | 'swap' | 'bridge' | 'spend' 
  | 'transfer' | 'reward' | 'fee' | 'investment' | 'loan' | 'insurance'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'
export type RiskLevel = 'Low' | 'Medium' | 'High'
export type AccountType = 'personal' | 'business' | 'institutional'
export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'expired'
export type CardType = 'virtual' | 'physical'
export type CardStatus = 'active' | 'blocked' | 'expired' | 'pending'
export type InvestmentStrategy = 'Conservative' | 'Moderate' | 'Aggressive'
export type InvestmentFrequency = 'weekly' | 'monthly' | 'quarterly'

// ============================================================================
// USER MANAGEMENT MODELS
// ============================================================================

export interface User {
  id: string
  email: string
  username?: string
  password_hash: string
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
  account_type: AccountType
  kyc_status: KYCStatus
  is_active: boolean
  email_verified: boolean
  phone_verified: boolean
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
  metadata: Record<string, any>
}

export interface UserProfile {
  id: string
  user_id: string
  avatar_url?: string
  bio?: string
  country_code?: string
  timezone: string
  preferred_currency: StablecoinSymbol
  notification_preferences: Record<string, any>
  privacy_settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  refresh_token?: string
  expires_at: string
  ip_address?: string
  user_agent?: string
  is_active: boolean
  created_at: string
}

export interface UserWallet {
  id: string
  user_id: string
  chain_id: ChainId
  address: string
  wallet_type: string
  is_primary: boolean
  label?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// PORTFOLIO AND BALANCE MODELS
// ============================================================================

export interface StablecoinBalance {
  id: string
  user_id: string
  wallet_id: string
  stablecoin: StablecoinSymbol
  chain_id: ChainId
  balance: string // Decimal as string for precision
  locked_balance: string
  available_balance: string // Computed column
  contract_address: string
  last_sync_at: string
  created_at: string
  updated_at: string
}

export interface BalanceHistory {
  id: string
  user_id: string
  stablecoin: StablecoinSymbol
  chain_id: ChainId
  balance: string
  locked_balance: string
  snapshot_date: string
  created_at: string
}

// ============================================================================
// DEFI PROTOCOL MODELS
// ============================================================================

export interface DeFiProtocol {
  id: string
  name: string
  protocol_key: string
  description?: string
  website_url?: string
  logo_url?: string
  risk_level: RiskLevel
  supported_chains: ChainId[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProtocolConfiguration {
  id: string
  protocol_id: string
  chain_id: ChainId
  stablecoin: StablecoinSymbol
  contract_address: string
  pool_address?: string
  current_apy: string
  tvl_usd: string
  last_updated: string
}

export interface YieldPosition {
  id: string
  user_id: string
  protocol_id: string
  stablecoin: StablecoinSymbol
  chain_id: ChainId
  deposit_amount: string
  current_balance: string
  earned_yield: string
  entry_apy: string
  current_apy: string
  duration_days: number
  is_active: boolean
  deposit_tx_hash?: string
  created_at: string
  updated_at: string
  withdrawn_at?: string
}

// ============================================================================
// TRANSACTION MODELS
// ============================================================================

export interface Transaction {
  id: string
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
  metadata: Record<string, any>
  block_number?: number
  block_timestamp?: string
  gas_used?: number
  gas_price?: string
  created_at: string
  updated_at: string
  confirmed_at?: string
}

export interface TransactionReference {
  id: string
  transaction_id: string
  reference_type: string
  reference_id: string
  created_at: string
}

// ============================================================================
// INVESTMENT MODELS
// ============================================================================

export interface TokenizedAsset {
  id: string
  name: string
  symbol: string
  category: string
  description?: string
  current_price: string
  market_cap?: string
  total_supply?: string
  circulating_supply?: string
  min_investment: string
  current_apy: string
  risk_level: RiskLevel
  underlying_asset?: string
  provider?: string
  contract_address?: string
  chain_id: ChainId
  features: string[]
  launch_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AssetPriceHistory {
  id: string
  asset_id: string
  price: string
  volume_24h?: string
  market_cap?: string
  price_date: string
  created_at: string
}

export interface UserInvestment {
  id: string
  user_id: string
  asset_id: string
  quantity: string
  average_cost: string
  total_invested: string
  current_value: string
  unrealized_pnl: string // Computed column
  currency: StablecoinSymbol
  first_purchase_at: string
  last_purchase_at?: string
  created_at: string
  updated_at: string
}

export interface AutoInvestPlan {
  id: string
  user_id: string
  name: string
  strategy: InvestmentStrategy
  frequency: InvestmentFrequency
  amount: string
  currency: StablecoinSymbol
  is_active: boolean
  next_execution_at: string
  total_invested: string
  execution_count: number
  created_at: string
  updated_at: string
}

export interface AutoInvestAllocation {
  id: string
  plan_id: string
  asset_id: string
  allocation_percentage: string
  created_at: string
}

export interface AutoInvestExecution {
  id: string
  plan_id: string
  transaction_id?: string
  execution_date: string
  amount: string
  status: TransactionStatus
  created_at: string
}

// ============================================================================
// CARD SYSTEM MODELS
// ============================================================================

export interface UserCard {
  id: string
  user_id: string
  card_type: CardType
  card_status: CardStatus
  card_number_hash?: string
  last_four_digits?: string
  expiry_month?: number
  expiry_year?: number
  cvv_hash?: string
  cardholder_name?: string
  billing_address?: Record<string, any>
  daily_limit: string
  monthly_limit: string
  currency: StablecoinSymbol
  is_primary: boolean
  issued_at?: string
  activated_at?: string
  blocked_at?: string
  created_at: string
  updated_at: string
}

export interface CardTransaction {
  id: string
  card_id: string
  user_id: string
  transaction_id?: string
  merchant_name?: string
  merchant_category?: string
  merchant_country?: string
  amount: string
  currency: StablecoinSymbol
  exchange_rate: string
  fee_amount: string
  cashback_amount: string
  status: TransactionStatus
  authorization_code?: string
  reference_number?: string
  transaction_date: string
  settlement_date?: string
  created_at: string
}

export interface CardSpendingControl {
  id: string
  card_id: string
  control_type: string
  control_value: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// BUSINESS MODELS
// ============================================================================

export interface BusinessProfile {
  id: string
  user_id: string
  company_name: string
  business_type?: string
  registration_number?: string
  tax_id?: string
  incorporation_country?: string
  business_address?: Record<string, any>
  website_url?: string
  employee_count?: number
  annual_revenue?: string
  industry?: string
  business_description?: string
  compliance_status: string
  created_at: string
  updated_at: string
}

export interface BusinessTeamMember {
  id: string
  business_id: string
  user_id: string
  role: string
  permissions: Record<string, any>
  is_active: boolean
  invited_by?: string
  invited_at: string
  joined_at?: string
}

// ============================================================================
// LOAN MODELS
// ============================================================================

export interface LoanApplication {
  id: string
  user_id: string
  loan_amount: string
  loan_currency: StablecoinSymbol
  collateral_amount: string
  collateral_token: string
  collateral_chain: ChainId
  ltv_ratio: string
  interest_rate: string
  loan_term_months: number
  application_status: string
  risk_assessment?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ActiveLoan {
  id: string
  application_id: string
  user_id: string
  principal_amount: string
  outstanding_balance: string
  interest_accrued: string
  collateral_locked: string
  current_ltv: string
  liquidation_threshold: string
  next_payment_due?: string
  payment_amount: string
  loan_status: string
  disbursed_at: string
  maturity_date: string
  created_at: string
  updated_at: string
}

export interface LoanPayment {
  id: string
  loan_id: string
  transaction_id?: string
  payment_amount: string
  principal_portion: string
  interest_portion: string
  payment_date: string
  payment_method?: string
  created_at: string
}

// ============================================================================
// INSURANCE MODELS
// ============================================================================

export interface InsurancePolicy {
  id: string
  user_id: string
  policy_name: string
  policy_type: string
  coverage_amount: string
  premium_amount: string
  premium_frequency: string
  coverage_details: Record<string, any>
  policy_status: string
  start_date: string
  end_date: string
  next_premium_due?: string
  created_at: string
  updated_at: string
}

export interface InsuranceClaim {
  id: string
  policy_id: string
  user_id: string
  claim_amount: string
  claim_reason: string
  incident_date: string
  supporting_documents?: Record<string, any>
  claim_status: string
  assessor_notes?: string
  payout_amount?: string
  payout_date?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// NOTIFICATION MODELS
// ============================================================================

export interface UserNotification {
  id: string
  user_id: string
  title: string
  message: string
  notification_type: string
  priority: string
  is_read: boolean
  action_url?: string
  metadata: Record<string, any>
  expires_at?: string
  created_at: string
}

export interface PriceAlert {
  id: string
  user_id: string
  asset_id?: string
  stablecoin?: StablecoinSymbol
  alert_type: string
  target_value: string
  current_value?: string
  is_active: boolean
  triggered_at?: string
  created_at: string
}

// ============================================================================
// SYSTEM MODELS
// ============================================================================

export interface SystemSetting {
  key: string
  value: Record<string, any>
  description?: string
  updated_at: string
}

export interface APIRateLimit {
  id: string
  user_id?: string
  endpoint: string
  requests_count: number
  window_start: string
  window_duration: string
  limit_per_window: number
  created_at: string
}

// ============================================================================
// VIEW MODELS (for database views)
// ============================================================================

export interface UserPortfolioSummary {
  user_id: string
  email: string
  total_balance_usd: string
  total_locked_usd: string
  total_available_usd: string
  stablecoin_count: number
  chain_count: number
  active_yield_positions: number
}

export interface UserTransactionSummary {
  user_id: string
  transaction_type: TransactionType
  status: TransactionStatus
  transaction_count: number
  total_amount: string
  average_amount: string
  first_transaction: string
  last_transaction: string
}

export interface InvestmentPerformance {
  user_id: string
  asset_id: string
  asset_name: string
  asset_symbol: string
  quantity: string
  total_invested: string
  current_value: string
  unrealized_pnl: string
  return_percentage: string
  current_apy: string
  risk_level: RiskLevel
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface DatabaseError {
  code: string
  message: string
  detail?: string
  hint?: string
  position?: string
}

export interface PaginationOptions {
  page: number
  limit: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ============================================================================
// CREATE/UPDATE INPUT TYPES
// ============================================================================

export interface CreateUserInput {
  email: string
  username?: string
  password_hash: string
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
  account_type?: AccountType
}

export interface UpdateUserProfileInput {
  avatar_url?: string
  bio?: string
  country_code?: string
  timezone?: string
  preferred_currency?: StablecoinSymbol
  notification_preferences?: Record<string, any>
  privacy_settings?: Record<string, any>
}

export interface CreateTransactionInput {
  user_id: string
  tx_hash?: string
  transaction_type: TransactionType
  amount: string
  fee_amount?: string
  stablecoin: StablecoinSymbol
  chain_id: ChainId
  from_address?: string
  to_address?: string
  description?: string
  metadata?: Record<string, any>
}

export interface CreateInvestmentInput {
  user_id: string
  asset_id: string
  quantity: string
  average_cost: string
  total_invested: string
  currency: StablecoinSymbol
}

// Export all types as a namespace as well for convenience
export * as DatabaseModels from './models'