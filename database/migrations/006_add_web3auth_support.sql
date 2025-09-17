-- Migration: Add Web3Auth Support
-- Adds Web3Auth integration fields to support social login and wallet authentication

-- Add Web3Auth ID column to users table
ALTER TABLE users 
ADD COLUMN web3auth_id VARCHAR(255) UNIQUE,
ADD COLUMN profile_image TEXT;

-- Make password_hash nullable for Web3Auth users who don't have passwords
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Add index for faster Web3Auth ID lookups
CREATE INDEX idx_users_web3auth_id ON users(web3auth_id);

-- Add index for profile image (for faster user profile queries)
CREATE INDEX idx_users_profile_image ON users(profile_image) WHERE profile_image IS NOT NULL;

-- Update users table comment
COMMENT ON COLUMN users.web3auth_id IS 'Web3Auth verifier ID for social login users';
COMMENT ON COLUMN users.profile_image IS 'Profile image URL from social providers or uploaded by user';