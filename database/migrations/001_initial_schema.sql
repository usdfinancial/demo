-- Initial Database Migration for USD Financial
-- Migration: 001_initial_schema
-- Description: Create core database structure with all tables, indexes, and constraints

-- ============================================================================
-- ENUMS AND CUSTOM TYPES
-- ============================================================================

CREATE TYPE stablecoin_symbol AS ENUM ('USDC');
CREATE TYPE chain_id AS ENUM ('1', '137', '42161', '10', '56');
CREATE TYPE transaction_type AS ENUM (
    'deposit', 'withdrawal', 'yield', 'swap', 'bridge', 'spend', 
    'transfer', 'reward', 'fee', 'investment', 'loan', 'insurance'
);
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE risk_level AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE account_type AS ENUM ('personal', 'business', 'institutional');
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE card_type AS ENUM ('virtual', 'physical');
CREATE TYPE card_status AS ENUM ('active', 'blocked', 'expired', 'pending');
CREATE TYPE investment_strategy AS ENUM ('Conservative', 'Moderate', 'Aggressive');
CREATE TYPE investment_frequency AS ENUM ('weekly', 'monthly', 'quarterly');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
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
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- User profiles
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

-- User sessions
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

-- User wallets
CREATE TABLE user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chain_id chain_id NOT NULL,
    address VARCHAR(66) NOT NULL,
    wallet_type VARCHAR(50) DEFAULT 'external',
    is_primary BOOLEAN DEFAULT false,
    label VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, address, chain_id)
);

-- Stablecoin balances
CREATE TABLE stablecoin_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
    stablecoin stablecoin_symbol NOT NULL,
    chain_id chain_id NOT NULL,
    balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    locked_balance DECIMAL(36, 18) DEFAULT 0,
    available_balance DECIMAL(36, 18) GENERATED ALWAYS AS (balance - locked_balance) STORED,
    contract_address VARCHAR(66) NOT NULL,
    last_sync_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, stablecoin, chain_id, wallet_id)
);

-- DeFi protocols
CREATE TABLE defi_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    protocol_key VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    risk_level risk_level NOT NULL,
    supported_chains chain_id[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Protocol configurations
CREATE TABLE protocol_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID NOT NULL REFERENCES defi_protocols(id) ON DELETE CASCADE,
    chain_id chain_id NOT NULL,
    stablecoin stablecoin_symbol NOT NULL,
    contract_address VARCHAR(66) NOT NULL,
    pool_address VARCHAR(66),
    current_apy DECIMAL(5, 2) DEFAULT 0,
    tvl_usd DECIMAL(20, 2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(protocol_id, chain_id, stablecoin)
);

-- Yield positions
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

-- Transactions
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
    metadata JSONB DEFAULT '{}',
    block_number BIGINT,
    block_timestamp TIMESTAMPTZ,
    gas_used BIGINT,
    gas_price DECIMAL(36, 18),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ
);

-- ============================================================================
-- BASIC INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_stablecoin_balances_user_id ON stablecoin_balances(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_yield_positions_user_id ON yield_positions(user_id);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stablecoin_balances_updated_at BEFORE UPDATE ON stablecoin_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_defi_protocols_updated_at BEFORE UPDATE ON defi_protocols FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_yield_positions_updated_at BEFORE UPDATE ON yield_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

INSERT INTO defi_protocols (name, protocol_key, description, risk_level, supported_chains) VALUES
('Aave', 'aave', 'Leading decentralized lending protocol', 'Low', ARRAY['1', '137', '42161', '10']::chain_id[]),
('Compound', 'compound', 'Algorithmic money market protocol', 'Low', ARRAY['1', '137']::chain_id[]),
('Yearn Finance', 'yearn', 'Yield optimization protocol', 'Medium', ARRAY['1', '42161']::chain_id[]),
('Convex Finance', 'convex', 'Curve yield boosting platform', 'Medium', ARRAY['1']::chain_id[]),
('Curve Finance', 'curve', 'Stablecoin exchange protocol', 'Low', ARRAY['1', '137', '42161', '10']::chain_id[]);