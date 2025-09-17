-- Card System Migration
-- Migration: 003_card_system
-- Description: Add debit card system with spending tracking and controls

-- ============================================================================
-- CARD SYSTEM TABLES
-- ============================================================================

-- User cards
CREATE TABLE user_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_type card_type NOT NULL,
    card_status card_status DEFAULT 'pending',
    card_number_hash VARCHAR(64),
    last_four_digits VARCHAR(4),
    expiry_month INTEGER,
    expiry_year INTEGER,
    cvv_hash VARCHAR(64),
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

-- Card transactions
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

-- Card spending controls
CREATE TABLE card_spending_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
    control_type VARCHAR(50) NOT NULL,
    control_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX idx_user_cards_status ON user_cards(card_status);
CREATE INDEX idx_card_transactions_card_id ON card_transactions(card_id);
CREATE INDEX idx_card_transactions_user_id ON card_transactions(user_id);
CREATE INDEX idx_card_transactions_date ON card_transactions(transaction_date DESC);
CREATE INDEX idx_card_transactions_merchant ON card_transactions(merchant_category);
CREATE INDEX idx_card_spending_controls_card_id ON card_spending_controls(card_id);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_user_cards_updated_at BEFORE UPDATE ON user_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_card_spending_controls_updated_at BEFORE UPDATE ON card_spending_controls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();