-- Migration 009: Persona KYC Integration
-- Add enhanced KYC tracking and Persona-specific fields
-- Created: 2025-01-14

BEGIN;

-- Add KYC specific metadata fields to users table
-- The metadata JSONB field will store Persona-specific information
COMMENT ON COLUMN users.metadata IS 'JSON metadata including KYC inquiry data, Persona information, and other flexible user data';

-- Create index for efficient KYC inquiry lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_kyc_inquiry_id 
    ON users USING GIN ((metadata->'kyc'->'inquiry_id'));

-- Create index for KYC status + created_at for efficient queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_kyc_status_created 
    ON users(kyc_status, created_at DESC);

-- Create partial index for pending KYC verifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_kyc_pending 
    ON users(created_at) WHERE kyc_status = 'pending';

-- Add constraint to ensure KYC inquiry ID is unique if present
-- This prevents duplicate KYC verifications
ALTER TABLE users ADD CONSTRAINT unique_kyc_inquiry_id 
    EXCLUDE USING btree ((metadata->'kyc'->>'inquiry_id')) 
    WHERE (metadata->'kyc'->>'inquiry_id' IS NOT NULL);

-- Create a view for KYC analytics
CREATE OR REPLACE VIEW kyc_analytics AS
SELECT 
    kyc_status,
    COUNT(*) as user_count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_processing_hours,
    COUNT(CASE WHEN metadata->'kyc'->'inquiry_id' IS NOT NULL THEN 1 END) as with_inquiry_id
FROM users
WHERE kyc_status != 'pending' OR created_at >= NOW() - INTERVAL '90 days'
GROUP BY kyc_status;

-- Grant permissions
GRANT SELECT ON kyc_analytics TO authenticated;

-- Create system setting for Persona configuration tracking
INSERT INTO system_settings (key, value, description, updated_at) VALUES
('persona_integration_enabled', 'true', 'Whether Persona KYC integration is active', NOW()),
('kyc_auto_approve_sandbox', 'true', 'Auto-approve KYC for sandbox/development environment', NOW()),
('kyc_required_features', '["cards", "loans", "high_value_transfers"]', 'Features that require KYC verification', NOW())
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;

-- Update user notification preferences to include KYC notifications
UPDATE user_profiles 
SET notification_preferences = COALESCE(notification_preferences, '{}') || '{"kyc_updates": true, "verification_reminders": true}'
WHERE notification_preferences IS NULL 
   OR NOT (notification_preferences ? 'kyc_updates');

COMMIT;

-- Verify the migration
DO $$
BEGIN
    -- Check that indexes were created
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_users_kyc_inquiry_id'
    ) THEN
        RAISE EXCEPTION 'Failed to create KYC inquiry ID index';
    END IF;
    
    -- Check that view was created
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'kyc_analytics'
    ) THEN
        RAISE EXCEPTION 'Failed to create KYC analytics view';
    END IF;
    
    RAISE NOTICE 'Persona KYC integration migration completed successfully';
END $$;