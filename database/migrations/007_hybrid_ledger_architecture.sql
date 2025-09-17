-- Migration: Hybrid Ledger Architecture on AWS
-- Migration: 007_hybrid_ledger_architecture
-- Description: Adds tables for the hybrid ledger system and reflects AWS-native design.

-- ============================================================================
-- ENUMS FOR NEW TABLES
-- ============================================================================

CREATE TYPE blockchain_tx_status AS ENUM ('submitted', 'pending', 'confirmed', 'failed', 'reverted');
CREATE TYPE blockchain_tx_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE bridge_tx_status AS ENUM ('initiated', 'source_confirmed', 'attestation_received', 'destination_pending', 'completed', 'failed', 'reconciled');

-- ============================================================================
-- ON-CHAIN TRANSACTION LEDGER (For Amazon Aurora)
-- ============================================================================
-- This table provides a detailed, queryable log of all on-chain transactions.
-- The source of truth is an Amazon QLDB ledger, and this table is populated via a data stream.

CREATE TABLE blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    internal_tx_id UUID REFERENCES transactions(id), -- Link to the master transaction log
    tx_hash VARCHAR(66) NOT NULL,
    chain_id chain_id NOT NULL,
    status blockchain_tx_status DEFAULT 'submitted',
    direction blockchain_tx_direction NOT NULL,
    from_address VARCHAR(66) NOT NULL,
    to_address VARCHAR(66) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    stablecoin stablecoin_symbol NOT NULL,
    gas_limit BIGINT,
    gas_used BIGINT,
    gas_price DECIMAL(36, 18),
    block_number BIGINT,
    block_timestamp TIMESTAMPTZ,
    nonce INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tx_hash, chain_id)
);

-- Add comment to reflect AWS architecture
COMMENT ON TABLE blockchain_transactions IS 'Queryable replica of on-chain events. The immutable source of truth is the Amazon QLDB ledger.';

-- Indexes for performance
CREATE INDEX idx_blockchain_tx_user_id ON blockchain_transactions(user_id);
CREATE INDEX idx_blockchain_tx_status ON blockchain_transactions(status);
CREATE INDEX idx_blockchain_tx_hash ON blockchain_transactions(tx_hash);

-- Update trigger
CREATE TRIGGER update_blockchain_transactions_updated_at BEFORE UPDATE ON blockchain_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- CROSS-CHAIN BRIDGE LEDGER (For Amazon Aurora)
-- ============================================================================
-- This table's state transitions are managed by an AWS Step Function workflow.

CREATE TABLE bridge_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_tx_id UUID REFERENCES blockchain_transactions(id),
    destination_tx_id UUID REFERENCES blockchain_transactions(id),
    status bridge_tx_status DEFAULT 'initiated',
    source_chain chain_id NOT NULL,
    destination_chain chain_id NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    stablecoin stablecoin_symbol NOT NULL,
    bridge_provider VARCHAR(50), -- e.g., 'CCTP', 'Wormhole'
    attestation_id VARCHAR(255), -- For CCTP or other protocols
    estimated_completion_time TIMESTAMPTZ,
    error_details TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment to reflect AWS architecture
COMMENT ON TABLE bridge_transactions IS 'Tracks cross-chain transfers. State is managed by an AWS Step Function.';

-- Indexes for performance
CREATE INDEX idx_bridge_tx_user_id ON bridge_transactions(user_id);
CREATE INDEX idx_bridge_tx_status ON bridge_transactions(status);

-- Update trigger
CREATE TRIGGER update_bridge_transactions_updated_at BEFORE UPDATE ON bridge_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- CONCEPTUAL REPRESENTATION OF DYNAMODB TABLE
-- ============================================================================
-- The following is not executable SQL but represents the structure
-- of the 'audit_logs' table to be created in Amazon DynamoDB.
/*
CREATE TABLE audit_logs (
    user_id: String, (Partition Key)
    timestamp_action: String, (Sort Key, e.g., '2025-08-26T10:00:00Z#LOGIN_SUCCESS')
    ip_address: String,
    user_agent: String,
    details: Map (JSON object)
);
*/
