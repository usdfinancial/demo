-- USD Financial Database Migration - Waitlist Table
-- Migration 010: Create waitlist table for user registration
-- This migration creates the waitlist table for early access signups

-- ============================================================================
-- WAITLIST TABLE MIGRATION
-- ============================================================================

-- Create waitlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100) DEFAULT 'landing_page',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_source ON waitlist(source);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS waitlist_updated_at ON waitlist;
CREATE TRIGGER waitlist_updated_at 
    BEFORE UPDATE ON waitlist
    FOR EACH ROW 
    EXECUTE PROCEDURE update_waitlist_updated_at();

-- Add comments for documentation
COMMENT ON TABLE waitlist IS 'Stores early access signup information for USD Financial platform';
COMMENT ON COLUMN waitlist.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN waitlist.name IS 'Full name of the user signing up';
COMMENT ON COLUMN waitlist.email IS 'Unique email address - case insensitive';
COMMENT ON COLUMN waitlist.source IS 'Source of signup (landing_page, referral, etc.)';
COMMENT ON COLUMN waitlist.metadata IS 'Additional data like user agent, IP, etc.';

-- Verify the table was created successfully
SELECT 
    'waitlist' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'waitlist' AND table_schema = 'public';

-- Show table structure
\d waitlist;