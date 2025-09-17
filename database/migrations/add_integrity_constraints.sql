-- USD Financial Database Integrity Constraints Migration
-- Fixes critical data integrity issues identified in audit
--
-- This migration adds missing constraints to ensure data consistency
-- and prevent data integrity violations

-- ============================================================================
-- SAFETY CHECKS
-- ============================================================================

-- Ensure we're running on the correct database
SELECT current_database() as database_name;

-- Check PostgreSQL version
SELECT version();

-- ============================================================================
-- USER SESSION CONSTRAINTS
-- ============================================================================

-- Add unique constraint for active sessions (only one active session per user)
-- This prevents multiple active sessions for the same user
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_active_user_session'
    ) THEN
        -- Add unique partial index for active sessions
        CREATE UNIQUE INDEX idx_active_user_sessions
        ON user_sessions(user_id)
        WHERE is_active = true;

        ALTER TABLE user_sessions
        ADD CONSTRAINT unique_active_user_session
        EXCLUDE (user_id WITH =)
        WHERE (is_active = true);

        RAISE NOTICE 'Added unique active session constraint';
    ELSE
        RAISE NOTICE 'Unique active session constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- BALANCE CONSISTENCY CONSTRAINTS
-- ============================================================================

-- Add check constraint for non-negative balances
-- This prevents negative balances which would be a critical financial error
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_balance_non_negative'
    ) THEN
        ALTER TABLE stablecoin_balances
        ADD CONSTRAINT chk_balance_non_negative
        CHECK (balance >= 0 AND locked_balance >= 0);

        RAISE NOTICE 'Added non-negative balance constraint';
    ELSE
        RAISE NOTICE 'Non-negative balance constraint already exists';
    END IF;
END $$;

-- Add check constraint for balance consistency (locked_balance <= total_balance)
-- This ensures locked balance never exceeds total balance
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_balance_consistency'
    ) THEN
        ALTER TABLE stablecoin_balances
        ADD CONSTRAINT chk_balance_consistency
        CHECK (locked_balance <= balance);

        RAISE NOTICE 'Added balance consistency constraint';
    ELSE
        RAISE NOTICE 'Balance consistency constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- INVESTMENT AMOUNT CONSTRAINTS
-- ============================================================================

-- Add check constraint for positive investment amounts
-- This prevents zero or negative investments
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_positive_investment'
    ) THEN
        ALTER TABLE user_investments
        ADD CONSTRAINT chk_positive_investment
        CHECK (quantity::numeric > 0 AND total_invested::numeric > 0);

        RAISE NOTICE 'Added positive investment constraint';
    ELSE
        RAISE NOTICE 'Positive investment constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- TRANSACTION AMOUNT CONSTRAINTS
-- ============================================================================

-- Add check constraint for positive transaction amounts
-- This prevents zero or negative transaction amounts
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_positive_transaction_amount'
    ) THEN
        ALTER TABLE transactions
        ADD CONSTRAINT chk_positive_transaction_amount
        CHECK (amount::numeric > 0);

        RAISE NOTICE 'Added positive transaction amount constraint';
    ELSE
        RAISE NOTICE 'Positive transaction amount constraint already exists';
    END IF;
END $$;

-- Add check constraint for non-negative fee amounts
-- This prevents negative fees
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_non_negative_fee'
    ) THEN
        ALTER TABLE transactions
        ADD CONSTRAINT chk_non_negative_fee
        CHECK (fee_amount::numeric >= 0);

        RAISE NOTICE 'Added non-negative fee constraint';
    ELSE
        RAISE NOTICE 'Non-negative fee constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- USER DATA CONSTRAINTS
-- ============================================================================

-- Add check constraint for valid email format
-- This ensures email addresses are properly formatted
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_valid_email_format'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT chk_valid_email_format
        CHECK (email IS NULL OR email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

        RAISE NOTICE 'Added valid email format constraint';
    ELSE
        RAISE NOTICE 'Valid email format constraint already exists';
    END IF;
END $$;

-- Add check constraint for valid wallet address format
-- This ensures wallet addresses are properly formatted (Ethereum format)
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_valid_wallet_address'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT chk_valid_wallet_address
        CHECK (smart_wallet_address ~ '^0x[a-fA-F0-9]{40}$');

        RAISE NOTICE 'Added valid wallet address constraint';
    ELSE
        RAISE NOTICE 'Valid wallet address constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- CARD LIMIT CONSTRAINTS
-- ============================================================================

-- Add check constraint for positive card limits
-- This prevents negative or zero card limits
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_positive_card_limits'
    ) THEN
        ALTER TABLE user_cards
        ADD CONSTRAINT chk_positive_card_limits
        CHECK (daily_limit > 0 AND monthly_limit > 0 AND daily_limit <= monthly_limit);

        RAISE NOTICE 'Added positive card limits constraint';
    ELSE
        RAISE NOTICE 'Positive card limits constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- LOGIN HISTORY UNIQUENESS CONSTRAINTS
-- ============================================================================

-- Add unique constraint for login history to prevent exact duplicates
-- This prevents duplicate login records for the same user/timestamp
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_successful_login_per_minute'
    ) THEN
        -- Create partial unique index for successful logins within same minute
        CREATE UNIQUE INDEX idx_unique_successful_login_per_minute
        ON login_history(user_id, date_trunc('minute', created_at))
        WHERE login_status = 'success';

        RAISE NOTICE 'Added unique successful login per minute constraint';
    ELSE
        RAISE NOTICE 'Unique successful login constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- PERFORMANCE INDEXES FOR CONSTRAINTS
-- ============================================================================

-- Add supporting indexes for constraint performance
-- These indexes improve constraint checking performance

-- Index for balance queries
CREATE INDEX IF NOT EXISTS idx_stablecoin_balances_consistency
ON stablecoin_balances(user_id, balance, locked_balance)
WHERE balance < locked_balance;

-- Index for investment queries
CREATE INDEX IF NOT EXISTS idx_user_investments_amounts
ON user_investments(user_id, total_invested, current_value)
WHERE total_invested::numeric <= 0;

-- Index for transaction amounts
CREATE INDEX IF NOT EXISTS idx_transactions_amounts
ON transactions(user_id, amount, fee_amount)
WHERE amount::numeric <= 0 OR fee_amount::numeric < 0;

-- ============================================================================
-- CONSTRAINT VALIDATION
-- ============================================================================

-- Validate that existing data meets new constraints
-- This will show any data that violates the new constraints

-- Check for negative balances (should be 0 after constraints)
SELECT
  'stablecoin_balances' as table_name,
  COUNT(*) as violation_count
FROM stablecoin_balances
WHERE balance < 0 OR locked_balance < 0 OR locked_balance > balance;

-- Check for invalid investments (should be 0 after constraints)
SELECT
  'user_investments' as table_name,
  COUNT(*) as violation_count
FROM user_investments
WHERE quantity::numeric <= 0 OR total_invested::numeric <= 0;

-- Check for invalid transactions (should be 0 after constraints)
SELECT
  'transactions' as table_name,
  COUNT(*) as violation_count
FROM transactions
WHERE amount::numeric <= 0 OR fee_amount::numeric < 0;

-- Check for invalid user data (should be 0 after constraints)
SELECT
  'users' as table_name,
  COUNT(*) as violation_count
FROM users
WHERE (email IS NOT NULL AND email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
   OR smart_wallet_address !~ '^0x[a-fA-F0-9]{40}$';

-- ============================================================================
-- SUMMARY
-- ============================================================================

RAISE NOTICE '============================================================================';
RAISE NOTICE 'USD Financial Database Integrity Constraints Migration Complete';
RAISE NOTICE '============================================================================';
RAISE NOTICE 'Added constraints:';
RAISE NOTICE '1. Unique active user sessions';
RAISE NOTICE '2. Non-negative balance constraints';
RAISE NOTICE '3. Balance consistency constraints';
RAISE NOTICE '4. Positive investment amount constraints';
RAISE NOTICE '5. Positive transaction amount constraints';
RAISE NOTICE '6. Valid email format constraints';
RAISE NOTICE '7. Valid wallet address format constraints';
RAISE NOTICE '8. Positive card limit constraints';
RAISE NOTICE '9. Unique login history constraints';
RAISE NOTICE '10. Supporting performance indexes';
RAISE NOTICE '============================================================================';

-- Run validation queries above to check for any constraint violations
-- If violations exist, they should be resolved before production deployment