-- USD Financial Database Rollback Script
-- Use this script to safely remove the database schema if needed
-- ⚠️  WARNING: This will DELETE ALL DATA! Use with extreme caution!

-- ============================================================================
-- SAFETY CHECKS
-- ============================================================================

-- Ensure we're using the correct database
SELECT current_database();

-- Show current table count before deletion
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';

-- ============================================================================
-- CONFIRMATION (Uncomment to proceed)
-- ============================================================================

-- Uncomment this line to confirm you want to proceed with rollback
-- DO $$ BEGIN RAISE NOTICE 'PROCEEDING WITH ROLLBACK - ALL DATA WILL BE LOST!'; END $$;

-- ============================================================================
-- DROP TABLES (in reverse dependency order)
-- ============================================================================

-- Drop dependent tables first
DROP TABLE IF EXISTS insurance_claims CASCADE;
DROP TABLE IF EXISTS insurance_policies CASCADE;
DROP TABLE IF EXISTS loan_payments CASCADE;
DROP TABLE IF EXISTS active_loans CASCADE;
DROP TABLE IF EXISTS loan_applications CASCADE;
DROP TABLE IF EXISTS card_spending_controls CASCADE;
DROP TABLE IF EXISTS card_transactions CASCADE;
DROP TABLE IF EXISTS user_cards CASCADE;
DROP TABLE IF EXISTS auto_invest_executions CASCADE;
DROP TABLE IF EXISTS auto_invest_allocations CASCADE;
DROP TABLE IF EXISTS auto_invest_plans CASCADE;
DROP TABLE IF EXISTS user_investments CASCADE;
DROP TABLE IF EXISTS asset_price_history CASCADE;
DROP TABLE IF EXISTS tokenized_assets CASCADE;
DROP TABLE IF EXISTS transaction_references CASCADE;
DROP TABLE IF EXISTS yield_positions CASCADE;
DROP TABLE IF EXISTS protocol_configurations CASCADE;
DROP TABLE IF EXISTS defi_protocols CASCADE;
DROP TABLE IF EXISTS balance_history CASCADE;
DROP TABLE IF EXISTS stablecoin_balances CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS user_wallets CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS business_team_members CASCADE;
DROP TABLE IF EXISTS business_profiles CASCADE;
DROP TABLE IF EXISTS price_alerts CASCADE;
DROP TABLE IF EXISTS user_notifications CASCADE;
DROP TABLE IF EXISTS api_rate_limits CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;

-- Drop core table last
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- DROP CUSTOM TYPES
-- ============================================================================

DROP TYPE IF EXISTS investment_frequency CASCADE;
DROP TYPE IF EXISTS investment_strategy CASCADE;
DROP TYPE IF EXISTS card_status CASCADE;
DROP TYPE IF EXISTS card_type CASCADE;
DROP TYPE IF EXISTS kyc_status CASCADE;
DROP TYPE IF EXISTS account_type CASCADE;
DROP TYPE IF EXISTS risk_level CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS chain_id CASCADE;
DROP TYPE IF EXISTS stablecoin_symbol CASCADE;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_waitlist_updated_at() CASCADE;

-- ============================================================================
-- DROP VIEWS
-- ============================================================================

DROP VIEW IF EXISTS investment_performance CASCADE;
DROP VIEW IF EXISTS user_transaction_summary CASCADE;
DROP VIEW IF EXISTS user_portfolio_summary CASCADE;

-- ============================================================================
-- CLEANUP EXTENSIONS (Optional - only if not used by other databases)
-- ============================================================================

-- Uncomment if you want to remove extensions (be careful!)
-- DROP EXTENSION IF EXISTS "pgcrypto";
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all tables are removed
SELECT 
    COUNT(*) as remaining_tables,
    string_agg(table_name, ', ') as table_names
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';

-- Verify all custom types are removed
SELECT COUNT(*) as remaining_types 
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND typtype = 'e'; -- enum types

-- Verify all functions are removed
SELECT COUNT(*) as remaining_functions
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE '🧹 USD Financial database rollback completed';
    RAISE NOTICE '📊 All tables, types, and functions have been removed';
    RAISE NOTICE '⚠️  All data has been permanently deleted';
    RAISE NOTICE '🔄 You can now run deploy.sql to recreate the schema';
END $$;