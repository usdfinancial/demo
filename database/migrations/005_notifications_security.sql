-- Notifications and Security Migration
-- Migration: 005_notifications_security
-- Description: Add notification system, security features, and system configuration

-- ============================================================================
-- NOTIFICATIONS AND ALERTS
-- ============================================================================

-- User notifications
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

-- Price alerts
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES tokenized_assets(id),
    stablecoin stablecoin_symbol,
    alert_type VARCHAR(50) NOT NULL,
    target_value DECIMAL(18, 8) NOT NULL,
    current_value DECIMAL(18, 8),
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

-- System settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- API rate limits
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
-- INDEXES
-- ============================================================================

CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(is_active) WHERE is_active = true;
CREATE INDEX idx_api_rate_limits_user_endpoint ON api_rate_limits(user_id, endpoint);

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
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY user_notifications_policy ON user_notifications FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- ============================================================================
-- INITIAL SYSTEM SETTINGS
-- ============================================================================

INSERT INTO system_settings (key, value, description) VALUES
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('max_daily_withdrawal', '50000', 'Maximum daily withdrawal limit in USD'),
('default_transaction_fee', '0.001', 'Default transaction fee percentage'),
('supported_stablecoins', '["USDC", "USDT"]', 'List of supported stablecoins'),
('kyc_required_amount', '10000', 'Amount threshold requiring KYC verification'),
('min_investment_amount', '25', 'Minimum investment amount in USD'),
('max_auto_invest_plans', '10', 'Maximum auto-invest plans per user'),
('card_daily_limit_default', '1000', 'Default daily card spending limit'),
('card_monthly_limit_default', '10000', 'Default monthly card spending limit');