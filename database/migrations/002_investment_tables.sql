-- Investment Management Migration
-- Migration: 002_investment_tables
-- Description: Add investment management, tokenized assets, and auto-invest functionality

-- ============================================================================
-- INVESTMENT TABLES
-- ============================================================================

-- Tokenized assets
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

-- Asset price history
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

-- User investments
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

-- Auto-invest plans
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

-- Auto-invest allocations
CREATE TABLE auto_invest_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES auto_invest_plans(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES tokenized_assets(id),
    allocation_percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plan_id, asset_id)
);

-- Auto-invest executions
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
-- ADDITIONAL TABLES
-- ============================================================================

-- Balance history
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

-- Transaction references
CREATE TABLE transaction_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(transaction_id, reference_type, reference_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_tokenized_assets_category ON tokenized_assets(category);
CREATE INDEX idx_tokenized_assets_chain_id ON tokenized_assets(chain_id);
CREATE INDEX idx_tokenized_assets_active ON tokenized_assets(is_active);
CREATE INDEX idx_user_investments_user_id ON user_investments(user_id);
CREATE INDEX idx_user_investments_asset_id ON user_investments(asset_id);
CREATE INDEX idx_auto_invest_plans_user_id ON auto_invest_plans(user_id);
CREATE INDEX idx_auto_invest_plans_active ON auto_invest_plans(is_active);
CREATE INDEX idx_balance_history_user_date ON balance_history(user_id, snapshot_date);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_tokenized_assets_updated_at BEFORE UPDATE ON tokenized_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_investments_updated_at BEFORE UPDATE ON user_investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_invest_plans_updated_at BEFORE UPDATE ON auto_invest_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE INVESTMENT DATA
-- ============================================================================

INSERT INTO tokenized_assets (name, symbol, category, description, current_price, market_cap, total_supply, circulating_supply, min_investment, current_apy, risk_level, underlying_asset, provider, chain_id, features, launch_date) VALUES
('US Treasury Bills Token', 'USTB', 'Government Bonds', 'Tokenized short-term US government securities backed by physical Treasury bills', 100.25, 2500000000, 2500000000, 2495000000, 100, 5.2, 'Low', 'US Treasury Bills (3-month)', 'TreasuryDAO', '1', ARRAY['Government backed', 'Daily liquidity', 'Transparent pricing', 'Regulatory compliant'], '2023-06-15'),
('Real Estate Investment Trust', 'REIT', 'Real Estate', 'Diversified commercial real estate portfolio across major US markets', 52.80, 850000000, 16100000, 16100000, 50, 8.5, 'Medium', 'Commercial Real Estate Portfolio', 'PropTech Capital', '1', ARRAY['Property diversification', 'Monthly dividends', 'Professional management', 'Fractional ownership'], '2023-03-20'),
('Investment Grade Corporate Bonds', 'CORP', 'Corporate Bonds', 'Basket of investment-grade corporate bonds from Fortune 500 companies', 98.45, 1200000000, 1220000000, 1220000000, 250, 6.8, 'Medium', 'IG Corporate Bond Portfolio', 'BondChain Protocol', '1', ARRAY['Credit diversification', 'Fixed income', 'Investment grade only', 'Quarterly distributions'], '2023-01-10'),
('Physical Gold Token', 'GOLD', 'Precious Metals', 'Tokenized physical gold stored in secure vaults with full auditability', 1875.30, 450000000, 240000, 240000, 25, 3.2, 'Low', 'Physical Gold (LBMA certified)', 'MetalVault DAO', '1', ARRAY['Physical backing', 'Vault storage', 'Insurance coverage', 'Redeemable for gold'], '2022-11-05'),
('Technology Stock Index', 'TECH', 'Equity Index', 'Tokenized exposure to top technology companies and growth stocks', 145.67, 750000000, 5150000, 5150000, 100, 12.1, 'High', 'NASDAQ Technology Index', 'EquityChain Labs', '1', ARRAY['Growth potential', 'Tech exposure', 'Index tracking', 'High liquidity'], '2023-08-12'),
('Renewable Energy Infrastructure', 'GREEN', 'Infrastructure', 'Investment in renewable energy projects including solar and wind farms', 78.90, 320000000, 4055000, 4055000, 75, 9.3, 'Medium', 'Renewable Energy Projects', 'GreenEnergy Token', '1', ARRAY['ESG compliant', 'Government incentives', 'Long-term contracts', 'Sustainable returns'], '2023-04-18');