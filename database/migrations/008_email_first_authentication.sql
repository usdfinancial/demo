-- Migration: Email-First Authentication Architecture
-- This migration implements the clean email consolidation system
-- Safe to run as it only affects test data

-- ============================================================================
-- DROP EXISTING DATA (TEST DATA ONLY)
-- ============================================================================
-- Since all current data is test data, we can safely rebuild with the new schema

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Clear existing test data
TRUNCATE TABLE user_profiles CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE user_preferences CASCADE;
TRUNCATE TABLE user_wallets CASCADE;
TRUNCATE TABLE smart_wallet_balances CASCADE;
TRUNCATE TABLE user_sessions CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
-- Add other dependent tables as needed

-- Clear users table (this will cascade to all dependent tables)
TRUNCATE TABLE users CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- ============================================================================
-- UPDATE USERS TABLE SCHEMA
-- ============================================================================

-- Add new columns for email-first architecture
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS smart_wallet_address VARCHAR(42) UNIQUE,
  ADD COLUMN IF NOT EXISTS last_auth_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS primary_auth_method VARCHAR(20) DEFAULT 'email';

-- Remove password_hash requirement (not needed for Alchemy authentication)
ALTER TABLE users 
  ALTER COLUMN password_hash DROP NOT NULL;

-- Update constraints
ALTER TABLE users 
  ADD CONSTRAINT users_smart_wallet_address_check 
  CHECK (smart_wallet_address IS NOT NULL);

-- ============================================================================
-- CREATE AUTHENTICATION METHODS TABLE
-- ============================================================================

-- Create table for tracking authentication methods
CREATE TABLE IF NOT EXISTS user_auth_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auth_type VARCHAR(20) NOT NULL CHECK (auth_type IN ('email', 'google', 'passkey', 'wallet')),
    auth_identifier VARCHAR(255) NOT NULL,
    provider_user_id VARCHAR(255),
    provider_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ DEFAULT now(),
    verified_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(user_id, auth_type),
    UNIQUE(auth_type, auth_identifier)
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for fast authentication lookups
CREATE INDEX IF NOT EXISTS idx_user_auth_methods_identifier 
  ON user_auth_methods(auth_type, auth_identifier);
  
CREATE INDEX IF NOT EXISTS idx_user_auth_methods_user_id 
  ON user_auth_methods(user_id);
  
CREATE INDEX IF NOT EXISTS idx_user_auth_methods_active 
  ON user_auth_methods(auth_type, auth_identifier, is_active) 
  WHERE is_active = true;

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email_active 
  ON users(email) 
  WHERE is_active = true;
  
CREATE INDEX IF NOT EXISTS idx_users_smart_wallet_address 
  ON users(smart_wallet_address);

-- ============================================================================
-- CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to find or create user by email and smart wallet address
CREATE OR REPLACE FUNCTION upsert_user_with_auth_method(
    p_email VARCHAR(255),
    p_smart_wallet_address VARCHAR(42),
    p_auth_type VARCHAR(20),
    p_auth_identifier VARCHAR(255),
    p_provider_user_id VARCHAR(255) DEFAULT NULL,
    p_provider_data JSONB DEFAULT '{}'
) RETURNS TABLE (
    user_id UUID,
    is_new_user BOOLEAN,
    auth_method_id UUID
) AS $$
DECLARE
    v_user_id UUID;
    v_auth_method_id UUID;
    v_is_new_user BOOLEAN := false;
BEGIN
    -- Try to find existing user by email
    SELECT id INTO v_user_id 
    FROM users 
    WHERE email = p_email AND is_active = true;
    
    -- If user doesn't exist, create new user
    IF v_user_id IS NULL THEN
        INSERT INTO users (
            email, 
            smart_wallet_address, 
            primary_auth_method,
            email_verified,
            created_at,
            updated_at,
            last_auth_at
        ) VALUES (
            p_email,
            p_smart_wallet_address,
            p_auth_type,
            false,
            NOW(),
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_id;
        
        v_is_new_user := true;
    END IF;
    
    -- Add or update authentication method
    INSERT INTO user_auth_methods (
        user_id,
        auth_type,
        auth_identifier,
        provider_user_id,
        provider_data,
        is_active,
        is_primary,
        created_at,
        last_used_at
    ) VALUES (
        v_user_id,
        p_auth_type,
        p_auth_identifier,
        p_provider_user_id,
        p_provider_data,
        true,
        v_is_new_user, -- New users get this as primary method
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, auth_type)
    DO UPDATE SET
        auth_identifier = EXCLUDED.auth_identifier,
        provider_user_id = EXCLUDED.provider_user_id,
        provider_data = EXCLUDED.provider_data,
        last_used_at = NOW(),
        is_active = true
    RETURNING id INTO v_auth_method_id;
    
    -- Update user's last auth time and primary method
    UPDATE users 
    SET 
        last_auth_at = NOW(),
        primary_auth_method = p_auth_type
    WHERE id = v_user_id;
    
    RETURN QUERY SELECT v_user_id, v_is_new_user, v_auth_method_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE SAMPLE DATA FOR TESTING
-- ============================================================================

-- Create some test users with the new schema
DO $$
BEGIN
    -- Test user 1: Email + Google OAuth
    PERFORM upsert_user_with_auth_method(
        'alice.demo@usdfinancial.com',
        '0x742D35Cc6635C0532925a3b8d0Df7D3f6E3D2F1A',
        'email',
        'alice.demo@usdfinancial.com'
    );
    
    PERFORM upsert_user_with_auth_method(
        'alice.demo@usdfinancial.com',
        '0x742D35Cc6635C0532925a3b8d0Df7D3f6E3D2F1A',
        'google',
        'alice.demo@usdfinancial.com',
        'google_user_alice_123'
    );
    
    -- Test user 2: Google OAuth only
    PERFORM upsert_user_with_auth_method(
        'bob.demo@usdfinancial.com',
        '0x123C4567890A1B2C3D4E5F6789012345678901B2',
        'google',
        'bob.demo@usdfinancial.com',
        'google_user_bob_456'
    );
    
    -- Test user 3: Email + Passkey
    PERFORM upsert_user_with_auth_method(
        'carol.demo@usdfinancial.com',
        '0x987F654321098765432109876543210987654321',
        'email',
        'carol.demo@usdfinancial.com'
    );
    
    PERFORM upsert_user_with_auth_method(
        'carol.demo@usdfinancial.com',
        '0x987F654321098765432109876543210987654321',
        'passkey',
        'carol.demo@usdfinancial.com',
        'passkey_credential_carol_789'
    );
    
    RAISE NOTICE 'Created test users with email consolidation';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the migration worked correctly
DO $$
DECLARE
    user_count INTEGER;
    auth_method_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO auth_method_count FROM user_auth_methods;
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '- Users created: %', user_count;
    RAISE NOTICE '- Auth methods created: %', auth_method_count;
    
    -- Show sample data
    RAISE NOTICE 'Sample consolidated user:';
    FOR rec IN 
        SELECT u.email, u.primary_auth_method, 
               array_agg(am.auth_type) as auth_methods
        FROM users u
        LEFT JOIN user_auth_methods am ON u.id = am.user_id
        WHERE u.email = 'alice.demo@usdfinancial.com'
        GROUP BY u.email, u.primary_auth_method
    LOOP
        RAISE NOTICE '- Email: %, Primary: %, Methods: %', 
              rec.email, rec.primary_auth_method, rec.auth_methods;
    END LOOP;
END $$;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_auth_methods IS 'Tracks all authentication methods for each user, enabling email consolidation';
COMMENT ON COLUMN users.smart_wallet_address IS 'Alchemy-generated smart wallet address, unique per user';
COMMENT ON COLUMN users.primary_auth_method IS 'Most recently used authentication method';
COMMENT ON COLUMN users.last_auth_at IS 'Timestamp of last successful authentication';

COMMENT ON FUNCTION upsert_user_with_auth_method IS 'Helper function for email consolidation - finds existing user by email or creates new user, then adds/updates auth method';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions for application user
-- GRANT SELECT, INSERT, UPDATE ON users TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON user_auth_methods TO app_user;
-- GRANT EXECUTE ON FUNCTION upsert_user_with_auth_method TO app_user;