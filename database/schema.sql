-- USD Financial Database Schema
-- PostgreSQL Database for Netlify DB (Powered by Neon)
-- Comprehensive schema for stablecoin-focused financial platform

-- ============================================================================
-- ENUMS AND CUSTOM TYPES
-- ============================================================================

-- Supported stablecoins (USDC only for demo)
CREATE TYPE stablecoin_symbol AS ENUM ('USDC');

-- Supported blockchain networks
CREATE TYPE chain_id AS ENUM ('1', '137', '42161', '10', '56'); -- Ethereum, Polygon, Arbitrum, Optimism, BSC

-- Transaction types
CREATE TYPE transaction_type AS ENUM (
    'deposit', 'withdrawal', 'yield', 'swap', 'bridge', 'spend', 
    'transfer', 'reward', 'fee', 'investment', 'loan', 'insurance'
);

-- Transaction status
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Risk levels
CREATE TYPE risk_level AS ENUM ('Low', 'Medium', 'High');

-- Account types
CREATE TYPE account_type AS ENUM ('personal', 'business', 'institutional');

-- KYC status
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- Card types
CREATE TYPE card_type AS ENUM ('virtual', 'physical');

-- Card status
CREATE TYPE card_status AS ENUM ('active', 'blocked', 'expired', 'pending');

-- Investment strategy types
CREATE TYPE investment_strategy AS ENUM ('Conservative', 'Moderate', 'Aggressive');

-- Auto-invest frequency
CREATE TYPE investment_frequency AS ENUM ('weekly', 'monthly', 'quarterly');

-- ============================================================================
-- WAITLIST
-- ============================================================================

-- Waitlist table - Users who sign up for early access
CREATE TABLE waitlist (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100) DEFAULT 'landing_page',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for email lookups
CREATE INDEX idx_waitlist_email ON waitlist(email);

-- Create index for created_at for time-based queries
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER waitlist_updated_at BEFORE UPDATE ON waitlist
    FOR EACH ROW EXECUTE PROCEDURE update_waitlist_updated_at();

-- ============================================================================
-- CORE USER MANAGEMENT
-- ============================================================================

-- Users table - Core user accounts with email-first architecture
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,                    -- Universal identifier
    smart_wallet_address VARCHAR(42) UNIQUE NOT NULL,      -- Alchemy smart wallet address
    username VARCHAR(50) UNIQUE,                           -- Optional display name
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    account_type account_type DEFAULT 'personal',
    kyc_status kyc_status DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_auth_at TIMESTAMPTZ,                              -- Track last authentication
    primary_auth_method VARCHAR(20) DEFAULT 'email',       -- Primary auth method used
    metadata JSONB DEFAULT '{}'
);

-- Authentication methods - Track all ways user can authenticate
CREATE TABLE user_auth_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auth_type VARCHAR(20) NOT NULL,                        -- 'email', 'google', 'passkey', 'wallet'
    auth_identifier VARCHAR(255) NOT NULL,                 -- email, wallet address, etc.
    provider_user_id VARCHAR(255),                         -- OAuth provider ID
    provider_data JSONB DEFAULT '{}',                      -- Store provider-specific data
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,                      -- Primary auth method
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ DEFAULT now(),
    verified_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(user_id, auth_type),                           -- One method per type per user
    UNIQUE(auth_type, auth_identifier)                    -- Prevent duplicate methods across users
);

-- Index for fast lookups
CREATE INDEX idx_user_auth_methods_identifier ON user_auth_methods(auth_type, auth_identifier);
CREATE INDEX idx_user_auth_methods_user_id ON user_auth_methods(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_smart_wallet_address ON users(smart_wallet_address);

-- User profiles - Extended user information
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    country_code VARCHAR(2),
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_currency stablecoin_symbol DEFAULT 'USDC',
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User sessions - Authentication sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- BLOCKCHAIN WALLET MANAGEMENT
-- ============================================================================

-- User wallets - Blockchain wallet addresses
CREATE TABLE user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chain_id chain_id NOT NULL,
    address VARCHAR(66) NOT NULL, -- Supports both Ethereum (42 chars) and longer addresses
    wallet_type VARCHAR(50) DEFAULT 'external', -- external, generated, custodial
    is_primary BOOLEAN DEFAULT false,
    label VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, address, chain_id)
);

-- ============================================================================
-- STABLECOIN PORTFOLIO MANAGEMENT
-- ============================================================================

-- Stablecoin balances - Current holdings per chain
CREATE TABLE stablecoin_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
    stablecoin stablecoin_symbol NOT NULL,
    chain_id chain_id NOT NULL,
    balance DECIMAL(36, 18) NOT NULL DEFAULT 0, -- High precision for crypto amounts
    locked_balance DECIMAL(36, 18) DEFAULT 0, -- Locked in DeFi protocols
    available_balance DECIMAL(36, 18) GENERATED ALWAYS AS (balance - locked_balance) STORED,
    contract_address VARCHAR(66) NOT NULL,
    last_sync_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, stablecoin, chain_id, wallet_id)
);

-- Balance history - Historical balance snapshots
CREATE TABLE balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stablecoin stablecoin_symbol NOT NULL,
    chain_id chain_id NOT NULL,
    balance DECIMAL(36, 18) NOT NULL,
    locked_balance DECIMAL(36, 18) DEFAULT 0,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, stablecoin, chain_id, snapshot_date)
);

-- ============================================================================
-- DEFI PROTOCOL INTEGRATION
-- ============================================================================

-- DeFi protocols - Supported yield farming protocols
CREATE TABLE defi_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    protocol_key VARCHAR(50) UNIQUE NOT NULL, -- aave, compound, yearn, etc.
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    risk_level risk_level NOT NULL,
    supported_chains chain_id[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Protocol configurations - Contract addresses per chain
CREATE TABLE protocol_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID NOT NULL REFERENCES defi_protocols(id) ON DELETE CASCADE,
    chain_id chain_id NOT NULL,
    stablecoin stablecoin_symbol NOT NULL,
    contract_address VARCHAR(66) NOT NULL,
    pool_address VARCHAR(66),
    current_apy DECIMAL(5, 2) DEFAULT 0, -- APY as percentage (e.g., 5.25)
    tvl_usd DECIMAL(20, 2) DEFAULT 0, -- Total Value Locked in USD
    last_updated TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(protocol_id, chain_id, stablecoin)
);

-- Yield positions - User positions in DeFi protocols
CREATE TABLE yield_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    protocol_id UUID NOT NULL REFERENCES defi_protocols(id),
    stablecoin stablecoin_symbol NOT NULL,
    chain_id chain_id NOT NULL,
    deposit_amount DECIMAL(36, 18) NOT NULL,
    current_balance DECIMAL(36, 18) NOT NULL,
    earned_yield DECIMAL(36, 18) DEFAULT 0,
    entry_apy DECIMAL(5, 2) NOT NULL,
    current_apy DECIMAL(5, 2) NOT NULL,
    duration_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    deposit_tx_hash VARCHAR(66),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    withdrawn_at TIMESTAMPTZ
);

-- ============================================================================
-- TRANSACTION MANAGEMENT
-- ============================================================================

-- Transactions - All user transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tx_hash VARCHAR(66) UNIQUE,
    transaction_type transaction_type NOT NULL,
    status transaction_status DEFAULT 'pending',
    amount DECIMAL(36, 18) NOT NULL,
    fee_amount DECIMAL(36, 18) DEFAULT 0,
    stablecoin stablecoin_symbol NOT NULL,
    chain_id chain_id NOT NULL,
    from_address VARCHAR(66),
    to_address VARCHAR(66),
    from_chain chain_id,
    to_chain chain_id,
    protocol_name VARCHAR(100),
    description TEXT,
    metadata JSONB DEFAULT '{}', -- Additional transaction data
    block_number BIGINT,
    block_timestamp TIMESTAMPTZ,
    gas_used BIGINT,
    gas_price DECIMAL(36, 18),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ
);

-- Transaction references - Link transactions to other entities
CREATE TABLE transaction_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    reference_type VARCHAR(50) NOT NULL, -- yield_position, investment, card_transaction, etc.
    reference_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(transaction_id, reference_type, reference_id)
);

-- ============================================================================
-- INVESTMENT MANAGEMENT
-- ============================================================================

-- Tokenized assets - Available investment assets
CREATE TABLE tokenized_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    current_price DECIMAL(18, 8) NOT NULL,
    market_cap DECIMAL(20, 2),
    total_supply DECIMAL(36, 18),
    circulating_supply DECIMAL(36, 18),
    min_investment DECIMAL(18, 8) NOT NULL,
    current_apy DECIMAL(5, 2) NOT NULL,
    risk_level risk_level NOT NULL,
    underlying_asset TEXT,
    provider VARCHAR(100),
    contract_address VARCHAR(66),
    chain_id chain_id NOT NULL,
    features TEXT[],
    launch_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asset price history - Historical pricing data
CREATE TABLE asset_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES tokenized_assets(id) ON DELETE CASCADE,
    price DECIMAL(18, 8) NOT NULL,
    volume_24h DECIMAL(20, 2),
    market_cap DECIMAL(20, 2),
    price_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(asset_id, price_date)
);

-- User investments - Individual asset holdings
CREATE TABLE user_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES tokenized_assets(id),
    quantity DECIMAL(36, 18) NOT NULL,
    average_cost DECIMAL(18, 8) NOT NULL,
    total_invested DECIMAL(20, 2) NOT NULL,
    current_value DECIMAL(20, 2) NOT NULL,
    unrealized_pnl DECIMAL(20, 2) GENERATED ALWAYS AS (current_value - total_invested) STORED,
    currency stablecoin_symbol NOT NULL,
    first_purchase_at TIMESTAMPTZ NOT NULL,
    last_purchase_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-invest plans - Automated investment strategies
CREATE TABLE auto_invest_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    strategy investment_strategy NOT NULL,
    frequency investment_frequency NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    currency stablecoin_symbol NOT NULL,
    is_active BOOLEAN DEFAULT true,
    next_execution_at TIMESTAMPTZ NOT NULL,
    total_invested DECIMAL(20, 2) DEFAULT 0,
    execution_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-invest allocations - Asset allocation for plans
CREATE TABLE auto_invest_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES auto_invest_plans(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES tokenized_assets(id),
    allocation_percentage DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(plan_id, asset_id)
);

-- Auto-invest executions - Execution history
CREATE TABLE auto_invest_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES auto_invest_plans(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    execution_date DATE NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    status transaction_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CARD SYSTEM
-- ============================================================================

-- User cards - Physical and virtual debit cards
CREATE TABLE user_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_type card_type NOT NULL,
    card_status card_status DEFAULT 'pending',
    card_number_hash VARCHAR(64), -- Hashed card number for security
    last_four_digits VARCHAR(4),
    expiry_month INTEGER,
    expiry_year INTEGER,
    cvv_hash VARCHAR(64), -- Hashed CVV
    cardholder_name VARCHAR(200),
    billing_address JSONB,
    daily_limit DECIMAL(10, 2) DEFAULT 1000,
    monthly_limit DECIMAL(10, 2) DEFAULT 10000,
    currency stablecoin_symbol DEFAULT 'USDC',
    is_primary BOOLEAN DEFAULT false,
    issued_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    blocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Card transactions - Card spending history
CREATE TABLE card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    merchant_name VARCHAR(200),
    merchant_category VARCHAR(100),
    merchant_country VARCHAR(2),
    amount DECIMAL(10, 2) NOT NULL,
    currency stablecoin_symbol NOT NULL,
    exchange_rate DECIMAL(10, 6) DEFAULT 1.0,
    fee_amount DECIMAL(10, 2) DEFAULT 0,
    cashback_amount DECIMAL(10, 2) DEFAULT 0,
    status transaction_status DEFAULT 'completed',
    authorization_code VARCHAR(20),
    reference_number VARCHAR(50),
    transaction_date TIMESTAMPTZ NOT NULL,
    settlement_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Card spending controls - Limits and restrictions
CREATE TABLE card_spending_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
    control_type VARCHAR(50) NOT NULL, -- merchant_category, country, daily_limit, etc.
    control_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- LOANS AND LENDING
-- ============================================================================

-- Loan applications - Crypto-collateralized loans
CREATE TABLE loan_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_amount DECIMAL(20, 2) NOT NULL,
    loan_currency stablecoin_symbol NOT NULL,
    collateral_amount DECIMAL(36, 18) NOT NULL,
    collateral_token VARCHAR(20) NOT NULL, -- BTC, ETH, etc.
    collateral_chain chain_id NOT NULL,
    ltv_ratio DECIMAL(5, 2) NOT NULL, -- Loan-to-Value ratio
    interest_rate DECIMAL(5, 2) NOT NULL,
    loan_term_months INTEGER NOT NULL,
    application_status VARCHAR(50) DEFAULT 'pending',
    risk_assessment JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Active loans - Approved and disbursed loans
CREATE TABLE active_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES loan_applications(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    principal_amount DECIMAL(20, 2) NOT NULL,
    outstanding_balance DECIMAL(20, 2) NOT NULL,
    interest_accrued DECIMAL(20, 2) DEFAULT 0,
    collateral_locked DECIMAL(36, 18) NOT NULL,
    current_ltv DECIMAL(5, 2) NOT NULL,
    liquidation_threshold DECIMAL(5, 2) NOT NULL,
    next_payment_due TIMESTAMPTZ,
    payment_amount DECIMAL(20, 2) NOT NULL,
    loan_status VARCHAR(50) DEFAULT 'active',
    disbursed_at TIMESTAMPTZ NOT NULL,
    maturity_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Loan payments - Payment history
CREATE TABLE loan_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES active_loans(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    payment_amount DECIMAL(20, 2) NOT NULL,
    principal_portion DECIMAL(20, 2) NOT NULL,
    interest_portion DECIMAL(20, 2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    payment_method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INSURANCE
-- ============================================================================

-- Insurance policies - DeFi protection policies
CREATE TABLE insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_name VARCHAR(200) NOT NULL,
    policy_type VARCHAR(100) NOT NULL, -- smart_contract, depeg, protocol, etc.
    coverage_amount DECIMAL(20, 2) NOT NULL,
    premium_amount DECIMAL(20, 2) NOT NULL,
    premium_frequency VARCHAR(20) NOT NULL, -- monthly, quarterly, annual
    coverage_details JSONB NOT NULL,
    policy_status VARCHAR(50) DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    next_premium_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insurance claims - Filed insurance claims
CREATE TABLE insurance_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    claim_amount DECIMAL(20, 2) NOT NULL,
    claim_reason TEXT NOT NULL,
    incident_date TIMESTAMPTZ NOT NULL,
    supporting_documents JSONB,
    claim_status VARCHAR(50) DEFAULT 'submitted',
    assessor_notes TEXT,
    payout_amount DECIMAL(20, 2),
    payout_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- BUSINESS ACCOUNTS
-- ============================================================================

-- Business profiles - Company information
CREATE TABLE business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(100),
    registration_number VARCHAR(100),
    tax_id VARCHAR(50),
    incorporation_country VARCHAR(2),
    business_address JSONB,
    website_url TEXT,
    employee_count INTEGER,
    annual_revenue DECIMAL(15, 2),
    industry VARCHAR(100),
    business_description TEXT,
    compliance_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Business team members - Team access management
CREATE TABLE business_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT now(),
    joined_at TIMESTAMPTZ,
    
    UNIQUE(business_id, user_id)
);

-- ============================================================================
-- NOTIFICATIONS AND ALERTS
-- ============================================================================

-- User notifications - System notifications
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Price alerts - Custom price alerts
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES tokenized_assets(id),
    stablecoin stablecoin_symbol,
    alert_type VARCHAR(50) NOT NULL, -- price_above, price_below, change_percent
    target_value DECIMAL(18, 8) NOT NULL,
    current_value DECIMAL(18, 8),
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

-- System settings - Global application settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- API rate limits - Rate limiting configuration
CREATE TABLE api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(200) NOT NULL,
    requests_count INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL,
    window_duration INTERVAL DEFAULT '1 hour',
    limit_per_window INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, endpoint, window_start)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- User-related indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Wallet and balance indexes
CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_user_wallets_chain_address ON user_wallets(chain_id, address);
CREATE INDEX idx_stablecoin_balances_user_id ON stablecoin_balances(user_id);
CREATE INDEX idx_stablecoin_balances_user_chain_coin ON stablecoin_balances(user_id, chain_id, stablecoin);

-- Transaction indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type_status ON transactions(transaction_type, status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_chain_id ON transactions(chain_id);

-- Investment indexes
CREATE INDEX idx_user_investments_user_id ON user_investments(user_id);
CREATE INDEX idx_user_investments_asset_id ON user_investments(asset_id);
CREATE INDEX idx_tokenized_assets_category ON tokenized_assets(category);
CREATE INDEX idx_tokenized_assets_chain_id ON tokenized_assets(chain_id);

-- Yield position indexes
CREATE INDEX idx_yield_positions_user_id ON yield_positions(user_id);
CREATE INDEX idx_yield_positions_protocol_id ON yield_positions(protocol_id);
CREATE INDEX idx_yield_positions_active ON yield_positions(is_active);

-- Card transaction indexes
CREATE INDEX idx_card_transactions_card_id ON card_transactions(card_id);
CREATE INDEX idx_card_transactions_user_id ON card_transactions(user_id);
CREATE INDEX idx_card_transactions_date ON card_transactions(transaction_date DESC);
CREATE INDEX idx_card_transactions_merchant ON card_transactions(merchant_category);

-- Notification indexes
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stablecoin_balances_updated_at BEFORE UPDATE ON stablecoin_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_defi_protocols_updated_at BEFORE UPDATE ON defi_protocols FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_yield_positions_updated_at BEFORE UPDATE ON yield_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tokenized_assets_updated_at BEFORE UPDATE ON tokenized_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_investments_updated_at BEFORE UPDATE ON user_investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_invest_plans_updated_at BEFORE UPDATE ON auto_invest_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_cards_updated_at BEFORE UPDATE ON user_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loan_applications_updated_at BEFORE UPDATE ON loan_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_active_loans_updated_at BEFORE UPDATE ON active_loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON insurance_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA INSERT (FOR DEVELOPMENT)
-- ============================================================================

-- Insert DeFi protocols
INSERT INTO defi_protocols (name, protocol_key, description, risk_level, supported_chains) VALUES
('Aave', 'aave', 'Leading decentralized lending protocol', 'Low', ARRAY['1', '137', '42161', '10']::chain_id[]),
('Compound', 'compound', 'Algorithmic money market protocol', 'Low', ARRAY['1', '137']::chain_id[]),
('Yearn Finance', 'yearn', 'Yield optimization protocol', 'Medium', ARRAY['1', '42161']::chain_id[]),
('Convex Finance', 'convex', 'Curve yield boosting platform', 'Medium', ARRAY['1']::chain_id[]),
('Curve Finance', 'curve', 'Stablecoin exchange protocol', 'Low', ARRAY['1', '137', '42161', '10']::chain_id[]);

-- Insert system settings
INSERT INTO system_settings (key, value, description) VALUES
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('max_daily_withdrawal', '50000', 'Maximum daily withdrawal limit in USD'),
('default_transaction_fee', '0.001', 'Default transaction fee percentage'),
('supported_stablecoins', '["USDC"]', 'List of supported stablecoins'),
('kyc_required_amount', '10000', 'Amount threshold requiring KYC verification');

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- User portfolio summary view
CREATE VIEW user_portfolio_summary AS
SELECT 
    u.id as user_id,
    u.email,
    COALESCE(SUM(sb.balance), 0) as total_balance_usd,
    COALESCE(SUM(sb.locked_balance), 0) as total_locked_usd,
    COALESCE(SUM(sb.available_balance), 0) as total_available_usd,
    COUNT(DISTINCT sb.stablecoin) as stablecoin_count,
    COUNT(DISTINCT sb.chain_id) as chain_count,
    COUNT(DISTINCT yp.id) as active_yield_positions
FROM users u
LEFT JOIN stablecoin_balances sb ON u.id = sb.user_id
LEFT JOIN yield_positions yp ON u.id = yp.user_id AND yp.is_active = true
GROUP BY u.id, u.email;

-- Transaction summary view
CREATE VIEW user_transaction_summary AS
SELECT 
    user_id,
    transaction_type,
    status,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    MIN(created_at) as first_transaction,
    MAX(created_at) as last_transaction
FROM transactions
GROUP BY user_id, transaction_type, status;

-- Investment performance view
CREATE VIEW investment_performance AS
SELECT 
    ui.user_id,
    ui.asset_id,
    ta.name as asset_name,
    ta.symbol as asset_symbol,
    ui.quantity,
    ui.total_invested,
    ui.current_value,
    ui.unrealized_pnl,
    (ui.unrealized_pnl / ui.total_invested * 100) as return_percentage,
    ta.current_apy,
    ta.risk_level
FROM user_investments ui
JOIN tokenized_assets ta ON ui.asset_id = ta.id
WHERE ui.quantity > 0;

-- ============================================================================
-- SECURITY POLICIES (ROW LEVEL SECURITY)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE stablecoin_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yield_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY users_policy ON users FOR ALL USING (id = current_setting('app.current_user_id')::uuid);
CREATE POLICY user_profiles_policy ON user_profiles FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY user_wallets_policy ON user_wallets FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY stablecoin_balances_policy ON stablecoin_balances FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY transactions_policy ON transactions FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY yield_positions_policy ON yield_positions FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY user_investments_policy ON user_investments FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY user_cards_policy ON user_cards FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY card_transactions_policy ON card_transactions FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- ============================================================================
-- FINAL COMMENTS
-- ============================================================================

/*
This database schema is designed for USD Financial - a comprehensive stablecoin-focused 
financial platform. Key features:

1. **Multi-chain Support**: Supports 5 major blockchain networks
2. **Stablecoin Focus**: Designed specifically for USDC
3. **DeFi Integration**: Native support for yield farming protocols
4. **Investment Management**: Tokenized assets and auto-invest features
5. **Card System**: Physical and virtual debit cards
6. **Business Accounts**: B2B functionality with team management
7. **Lending & Insurance**: Crypto-backed loans and DeFi insurance
8. **Security**: Row-level security and comprehensive audit trails
9. **Performance**: Optimized indexes for fast queries
10. **Scalability**: Designed to handle high transaction volumes

The schema follows PostgreSQL best practices and is optimized for Netlify DB (Neon).
*/