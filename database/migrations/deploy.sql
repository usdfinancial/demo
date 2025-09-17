-- USD Financial Database Migration - Deploy Script
-- Run this script on your AWS RDS PostgreSQL instance
-- This creates the complete database schema for the stablecoin financial platform

-- ============================================================================
-- SAFETY CHECKS
-- ============================================================================

-- Ensure we're using the correct database
SELECT current_database();

-- Check PostgreSQL version (should be 12+)
SELECT version();

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions (for password hashing)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS AND CUSTOM TYPES
-- ============================================================================

-- Supported stablecoins (USDC and USDT focus)
DROP TYPE IF EXISTS stablecoin_symbol CASCADE;
CREATE TYPE stablecoin_symbol AS ENUM ('USDC', 'USDT', 'DAI', 'FRAX', 'TUSD', 'BUSD');

-- Supported blockchain networks
DROP TYPE IF EXISTS chain_id CASCADE;
CREATE TYPE chain_id AS ENUM ('1', '11155111', '137', '42161', '10', '56'); -- Ethereum, Sepolia, Polygon, Arbitrum, Optimism, BSC

-- Transaction types
DROP TYPE IF EXISTS transaction_type CASCADE;
CREATE TYPE transaction_type AS ENUM (
    'deposit', 'withdrawal', 'yield', 'swap', 'bridge', 'spend', 
    'transfer', 'reward', 'fee', 'investment', 'loan', 'insurance'
);

-- Transaction status
DROP TYPE IF EXISTS transaction_status CASCADE;
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Risk levels
DROP TYPE IF EXISTS risk_level CASCADE;
CREATE TYPE risk_level AS ENUM ('Low', 'Medium', 'High');

-- Account types
DROP TYPE IF EXISTS account_type CASCADE;
CREATE TYPE account_type AS ENUM ('personal', 'business', 'institutional');

-- KYC status
DROP TYPE IF EXISTS kyc_status CASCADE;
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- Card types
DROP TYPE IF EXISTS card_type CASCADE;
CREATE TYPE card_type AS ENUM ('virtual', 'physical');

-- Card status
DROP TYPE IF EXISTS card_status CASCADE;
CREATE TYPE card_status AS ENUM ('active', 'blocked', 'expired', 'pending');

-- Investment strategy types
DROP TYPE IF EXISTS investment_strategy CASCADE;
CREATE TYPE investment_strategy AS ENUM ('Conservative', 'Moderate', 'Aggressive');

-- Auto-invest frequency
DROP TYPE IF EXISTS investment_frequency CASCADE;
CREATE TYPE investment_frequency AS ENUM ('weekly', 'monthly', 'quarterly');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table - Core user accounts
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    metadata JSONB DEFAULT '{}'::jsonb
);

-- User profiles - Extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    country_code VARCHAR(2),
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_currency stablecoin_symbol DEFAULT 'USDC',
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    privacy_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- User sessions - Authentication sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User wallets - Blockchain wallet addresses
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Stablecoin balances - Current holdings per chain
CREATE TABLE IF NOT EXISTS stablecoin_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Transactions - All user transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional transaction data
    block_number BIGINT,
    block_timestamp TIMESTAMPTZ,
    gas_used BIGINT,
    gas_price DECIMAL(36, 18),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ
);

-- DeFi protocols - Supported yield farming protocols
CREATE TABLE IF NOT EXISTS defi_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Wallet and balance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_wallets_chain_address ON user_wallets(chain_id, address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stablecoin_balances_user_id ON stablecoin_balances(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stablecoin_balances_user_chain_coin ON stablecoin_balances(user_id, chain_id, stablecoin);

-- Transaction indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_type_status ON transactions(transaction_type, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);

-- Session indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

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
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON user_wallets;
CREATE TRIGGER update_user_wallets_updated_at 
    BEFORE UPDATE ON user_wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stablecoin_balances_updated_at ON stablecoin_balances;
CREATE TRIGGER update_stablecoin_balances_updated_at 
    BEFORE UPDATE ON stablecoin_balances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert DeFi protocols
INSERT INTO defi_protocols (name, protocol_key, description, risk_level, supported_chains) VALUES
('Aave', 'aave', 'Leading decentralized lending protocol', 'Low', ARRAY['1', '137', '42161', '10']::chain_id[]),
('Compound', 'compound', 'Algorithmic money market protocol', 'Low', ARRAY['1', '137']::chain_id[]),
('Yearn Finance', 'yearn', 'Yield optimization protocol', 'Medium', ARRAY['1', '42161']::chain_id[])
ON CONFLICT (protocol_key) DO NOTHING;

-- ============================================================================
-- SECURITY - Row Level Security (Optional for production)
-- ============================================================================

-- Enable RLS on sensitive tables (uncomment for production)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stablecoin_balances ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables were created
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verify indexes were created
SELECT 
    indexname, 
    tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Show table sizes (should be empty initially)
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE '✅ USD Financial database schema deployed successfully!';
    RAISE NOTICE '📊 Tables created: users, user_profiles, user_sessions, user_wallets, stablecoin_balances, transactions, defi_protocols';
    RAISE NOTICE '🚀 Ready for application connection';
    RAISE NOTICE '💡 Next step: Update your .env.local with the database connection string';
END $$;