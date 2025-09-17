-- USD Financial Database Seed Data
-- This file contains sample data for development and testing

-- ============================================================================
-- DEVELOPMENT USER DATA
-- ============================================================================

-- Sample users (passwords should be properly hashed in production)
INSERT INTO users (id, email, username, password_hash, first_name, last_name, phone, account_type, kyc_status, is_active, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'johndoe', '$2b$10$rOdLrUhQZhHcBTj0nIwGVOQfK4HU4NbkKqXlVRJ1QGPNaQ1l0nQfG', 'John', 'Doe', '+1234567890', 'personal', 'approved', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'janesmith', '$2b$10$rOdLrUhQZhHcBTj0nIwGVOQfK4HU4NbkKqXlVRJ1QGPNaQ1l0nQfG', 'Jane', 'Smith', '+1234567891', 'personal', 'approved', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'business@acmecorp.com', 'acmecorp', '$2b$10$rOdLrUhQZhHcBTj0nIwGVOQfK4HU4NbkKqXlVRJ1QGPNaQ1l0nQfG', 'Business', 'Admin', '+1234567892', 'business', 'approved', true, true);

-- User profiles
INSERT INTO user_profiles (user_id, avatar_url, country_code, timezone, preferred_currency) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'https://avatar.example.com/john.jpg', 'US', 'America/New_York', 'USDC'),
('550e8400-e29b-41d4-a716-446655440002', 'https://avatar.example.com/jane.jpg', 'US', 'America/Los_Angeles', 'USDC'),
('550e8400-e29b-41d4-a716-446655440003', 'https://avatar.example.com/business.jpg', 'US', 'America/Chicago', 'USDC');

-- User wallets
INSERT INTO user_wallets (user_id, chain_id, address, wallet_type, is_primary, label) VALUES
('550e8400-e29b-41d4-a716-446655440001', '1', '0x742c4f79b36bFa3c4fBe3ab16F7EBDC6b1c9b2db', 'external', true, 'Main Ethereum Wallet'),
('550e8400-e29b-41d4-a716-446655440001', '137', '0x742c4f79b36bFa3c4fBe3ab16F7EBDC6b1c9b2db', 'external', false, 'Polygon Wallet'),
('550e8400-e29b-41d4-a716-446655440002', '1', '0x8ba1f109551bFe88b4b3bb8e79C8a66c3bC5A5a2', 'external', true, 'Main Ethereum Wallet'),
('550e8400-e29b-41d4-a716-446655440002', '42161', '0x8ba1f109551bFe88b4b3bb8e79C8a66c3bC5A5a2', 'external', false, 'Arbitrum Wallet');

-- Stablecoin balances
INSERT INTO stablecoin_balances (user_id, wallet_id, stablecoin, chain_id, balance, locked_balance, contract_address) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM user_wallets WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' AND chain_id = '1'), 'USDC', '1', 15750.50, 2500.00, '0xA0b86a33E6441bC8c5FCbF0906b03a2eE5b21B8e'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM user_wallets WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' AND chain_id = '137'), 'USDC', '137', 8250.25, 1200.00, '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM user_wallets WHERE user_id = '550e8400-e29b-41d4-a716-446655440002' AND chain_id = '1'), 'USDC', '1', 12500.75, 800.00, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM user_wallets WHERE user_id = '550e8400-e29b-41d4-a716-446655440002' AND chain_id = '42161'), 'USDC', '42161', 6750.00, 0.00, '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d');

-- ============================================================================
-- YIELD POSITIONS DATA
-- ============================================================================

-- Sample yield positions
INSERT INTO yield_positions (user_id, protocol_id, stablecoin, chain_id, deposit_amount, current_balance, earned_yield, entry_apy, current_apy, duration_days, deposit_tx_hash) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM defi_protocols WHERE protocol_key = 'aave'), 'USDC', '1', 2500.00, 2631.25, 131.25, 5.25, 5.42, 90, '0xabc123...'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM defi_protocols WHERE protocol_key = 'compound'), 'USDC', '137', 1200.00, 1248.60, 48.60, 4.05, 4.12, 60, '0xdef456...'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM defi_protocols WHERE protocol_key = 'yearn'), 'USDC', '1', 800.00, 856.80, 56.80, 7.10, 6.95, 45, '0x789abc...');

-- ============================================================================
-- TRANSACTION HISTORY
-- ============================================================================

-- Sample transactions
INSERT INTO transactions (user_id, tx_hash, transaction_type, status, amount, fee_amount, stablecoin, chain_id, from_address, to_address, description, block_number, confirmed_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'deposit', 'completed', 5000.00, 2.50, 'USDC', '1', '0x742c4f79b36bFa3c4fBe3ab16F7EBDC6b1c9b2db', '0xA0b86a33E6441bC8c5FCbF0906b03a2eE5b21B8e', 'Initial deposit', 18500000, now() - interval '30 days'),
('550e8400-e29b-41d4-a716-446655440001', '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef1', 'yield', 'completed', 2500.00, 1.25, 'USDC', '1', '0x742c4f79b36bFa3c4fBe3ab16F7EBDC6b1c9b2db', '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', 'Aave deposit', 18510000, now() - interval '25 days'),
('550e8400-e29b-41d4-a716-446655440001', '0x3456789012cdef123456789012cdef123456789012cdef123456789012cdef12', 'bridge', 'completed', 3000.00, 15.00, 'USDC', '1', '0x742c4f79b36bFa3c4fBe3ab16F7EBDC6b1c9b2db', '0x742c4f79b36bFa3c4fBe3ab16F7EBDC6b1c9b2db', 'Bridge to Polygon', 18520000, now() - interval '20 days'),
('550e8400-e29b-41d4-a716-446655440002', '0x4567890123def1234567890123def1234567890123def1234567890123def123', 'deposit', 'completed', 8000.00, 4.00, 'USDC', '1', '0x8ba1f109551bFe88b4b3bb8e79C8a66c3bC5A5a2', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 'Initial deposit', 18530000, now() - interval '15 days'),
('550e8400-e29b-41d4-a716-446655440002', '0x567890134ef12345678901234ef12345678901234ef12345678901234ef1234', 'spend', 'completed', 250.50, 0.00, 'USDC', '1', '0x8ba1f109551bFe88b4b3bb8e79C8a66c3bC5A5a2', '0x1234567890123456789012345678901234567890', 'Coffee shop payment', 18540000, now() - interval '10 days');

-- ============================================================================
-- INVESTMENT DATA
-- ============================================================================

-- Sample user investments
INSERT INTO user_investments (user_id, asset_id, quantity, average_cost, total_invested, current_value, currency, first_purchase_at, last_purchase_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM tokenized_assets WHERE symbol = 'USTB'), 50.00, 100.25, 5012.50, 5125.00, 'USDC', now() - interval '60 days', now() - interval '30 days'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM tokenized_assets WHERE symbol = 'REIT'), 75.50, 52.80, 3986.40, 4250.75, 'USDC', now() - interval '45 days', now() - interval '15 days'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM tokenized_assets WHERE symbol = 'GOLD'), 2.50, 1875.30, 4688.25, 4850.60, 'USDC', now() - interval '90 days', now() - interval '20 days'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM tokenized_assets WHERE symbol = 'TECH'), 25.00, 145.67, 3641.75, 3925.50, 'USDC', now() - interval '30 days', now() - interval '5 days');

-- Sample auto-invest plans
INSERT INTO auto_invest_plans (user_id, name, strategy, frequency, amount, currency, next_execution_at, total_invested, execution_count) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Conservative Growth Plan', 'Conservative', 'monthly', 500.00, 'USDC', now() + interval '15 days', 2500.00, 5),
('550e8400-e29b-41d4-a716-446655440002', 'Aggressive Tech Focus', 'Aggressive', 'weekly', 200.00, 'USDC', now() + interval '3 days', 1600.00, 8);

-- Auto-invest allocations
INSERT INTO auto_invest_allocations (plan_id, asset_id, allocation_percentage) VALUES
((SELECT id FROM auto_invest_plans WHERE name = 'Conservative Growth Plan'), (SELECT id FROM tokenized_assets WHERE symbol = 'USTB'), 60.00),
((SELECT id FROM auto_invest_plans WHERE name = 'Conservative Growth Plan'), (SELECT id FROM tokenized_assets WHERE symbol = 'CORP'), 30.00),
((SELECT id FROM auto_invest_plans WHERE name = 'Conservative Growth Plan'), (SELECT id FROM tokenized_assets WHERE symbol = 'GOLD'), 10.00),
((SELECT id FROM auto_invest_plans WHERE name = 'Aggressive Tech Focus'), (SELECT id FROM tokenized_assets WHERE symbol = 'TECH'), 70.00),
((SELECT id FROM auto_invest_plans WHERE name = 'Aggressive Tech Focus'), (SELECT id FROM tokenized_assets WHERE symbol = 'REIT'), 20.00),
((SELECT id FROM auto_invest_plans WHERE name = 'Aggressive Tech Focus'), (SELECT id FROM tokenized_assets WHERE symbol = 'GREEN'), 10.00);

-- ============================================================================
-- CARD SYSTEM DATA
-- ============================================================================

-- Sample user cards
INSERT INTO user_cards (user_id, card_type, card_status, last_four_digits, expiry_month, expiry_year, cardholder_name, daily_limit, monthly_limit, currency, is_primary, issued_at, activated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'physical', 'active', '1234', 12, 2027, 'JOHN DOE', 2000.00, 15000.00, 'USDC', true, now() - interval '180 days', now() - interval '175 days'),
('550e8400-e29b-41d4-a716-446655440001', 'virtual', 'active', '5678', 8, 2026, 'JOHN DOE', 500.00, 3000.00, 'USDC', false, now() - interval '90 days', now() - interval '90 days'),
('550e8400-e29b-41d4-a716-446655440002', 'physical', 'active', '9012', 3, 2028, 'JANE SMITH', 1500.00, 12000.00, 'USDC', true, now() - interval '120 days', now() - interval '115 days');

-- Sample card transactions
INSERT INTO card_transactions (card_id, user_id, merchant_name, merchant_category, merchant_country, amount, currency, fee_amount, cashback_amount, authorization_code, transaction_date) VALUES
((SELECT id FROM user_cards WHERE last_four_digits = '1234'), '550e8400-e29b-41d4-a716-446655440001', 'Starbucks Coffee', 'Food & Dining', 'US', 8.50, 'USDC', 0.00, 0.17, 'AUTH001', now() - interval '2 days'),
((SELECT id FROM user_cards WHERE last_four_digits = '1234'), '550e8400-e29b-41d4-a716-446655440001', 'Amazon.com', 'Online Shopping', 'US', 129.99, 'USDC', 0.00, 2.60, 'AUTH002', now() - interval '5 days'),
((SELECT id FROM user_cards WHERE last_four_digits = '5678'), '550e8400-e29b-41d4-a716-446655440001', 'Netflix', 'Entertainment', 'US', 15.99, 'USDC', 0.00, 0.32, 'AUTH003', now() - interval '1 day'),
((SELECT id FROM user_cards WHERE last_four_digits = '9012'), '550e8400-e29b-41d4-a716-446655440002', 'Shell Gas Station', 'Gas & Fuel', 'US', 45.67, 'USDC', 0.00, 0.91, 'AUTH004', now() - interval '3 days'),
((SELECT id FROM user_cards WHERE last_four_digits = '9012'), '550e8400-e29b-41d4-a716-446655440002', 'Whole Foods Market', 'Groceries', 'US', 234.78, 'USDC', 0.00, 4.70, 'AUTH005', now() - interval '1 week');

-- ============================================================================
-- BUSINESS ACCOUNT DATA
-- ============================================================================

-- Sample business profile
INSERT INTO business_profiles (user_id, company_name, business_type, registration_number, tax_id, incorporation_country, website_url, employee_count, annual_revenue, industry, business_description, compliance_status) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'ACME Corp', 'LLC', 'REG123456789', 'TAX987654321', 'US', 'https://acmecorp.com', 25, 2500000.00, 'Technology', 'Software development and consulting services', 'approved');

-- ============================================================================
-- NOTIFICATION DATA
-- ============================================================================

-- Sample notifications
INSERT INTO user_notifications (user_id, title, message, notification_type, priority, is_read) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Investment Performance Update', 'Your Conservative Growth Plan has earned $45.25 this month', 'investment', 'normal', false),
('550e8400-e29b-41d4-a716-446655440001', 'Card Transaction Alert', 'Card ending in 1234 was used for $129.99 at Amazon.com', 'transaction', 'normal', true),
('550e8400-e29b-41d4-a716-446655440002', 'Yield Position Update', 'Your Yearn Finance position has earned $12.50 in yield', 'yield', 'normal', false),
('550e8400-e29b-41d4-a716-446655440002', 'Price Alert Triggered', 'TECH token has increased by 5% in the last 24 hours', 'price_alert', 'high', false);

-- Sample price alerts
INSERT INTO price_alerts (user_id, asset_id, alert_type, target_value, current_value, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM tokenized_assets WHERE symbol = 'USTB'), 'price_above', 101.00, 100.25, true),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM tokenized_assets WHERE symbol = 'TECH'), 'price_above', 150.00, 145.67, true),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM tokenized_assets WHERE symbol = 'GOLD'), 'price_below', 1800.00, 1875.30, true);

-- ============================================================================
-- PROTOCOL CONFIGURATIONS
-- ============================================================================

-- Sample protocol configurations with current APY data
INSERT INTO protocol_configurations (protocol_id, chain_id, stablecoin, contract_address, current_apy, tvl_usd) VALUES
((SELECT id FROM defi_protocols WHERE protocol_key = 'aave'), '1', 'USDC', '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', 5.42, 1250000000.00),
((SELECT id FROM defi_protocols WHERE protocol_key = 'aave'), '1', 'USDC', '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', 5.35, 980000000.00),
((SELECT id FROM defi_protocols WHERE protocol_key = 'compound'), '1', 'USDC', '0x39AA39c021dfbaE8faC545936693aC917d5E7563', 4.12, 890000000.00),
((SELECT id FROM defi_protocols WHERE protocol_key = 'compound'), '137', 'USDC', '0xF25212E676D1F7F89Cd72fFEe66158f541246445', 4.25, 125000000.00),
((SELECT id FROM defi_protocols WHERE protocol_key = 'yearn'), '1', 'USDC', '0x7Da96a3891Add058AdA2E826306D812C638D87a7', 6.95, 450000000.00),
((SELECT id FROM defi_protocols WHERE protocol_key = 'curve'), '1', 'USDC', '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7', 3.85, 2100000000.00);

-- ============================================================================
-- ASSET PRICE HISTORY
-- ============================================================================

-- Sample price history for assets (last 30 days)
INSERT INTO asset_price_history (asset_id, price, volume_24h, market_cap, price_date) VALUES
-- USTB price history
((SELECT id FROM tokenized_assets WHERE symbol = 'USTB'), 100.15, 2500000.00, 2503750000, current_date - interval '30 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'USTB'), 100.18, 2650000.00, 2504500000, current_date - interval '25 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'USTB'), 100.22, 2300000.00, 2505500000, current_date - interval '20 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'USTB'), 100.20, 2800000.00, 2505000000, current_date - interval '15 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'USTB'), 100.23, 2900000.00, 2505750000, current_date - interval '10 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'USTB'), 100.25, 3100000.00, 2506250000, current_date - interval '5 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'USTB'), 100.25, 2750000.00, 2506250000, current_date),

-- TECH price history
((SELECT id FROM tokenized_assets WHERE symbol = 'TECH'), 138.50, 1200000.00, 713575000, current_date - interval '30 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'TECH'), 142.75, 1450000.00, 735162500, current_date - interval '25 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'TECH'), 139.80, 980000.00, 719970000, current_date - interval '20 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'TECH'), 144.25, 1650000.00, 742887500, current_date - interval '15 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'TECH'), 147.90, 1880000.00, 761685000, current_date - interval '10 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'TECH'), 145.50, 1320000.00, 749325000, current_date - interval '5 days'),
((SELECT id FROM tokenized_assets WHERE symbol = 'TECH'), 145.67, 1456000.00, 750200500, current_date);

-- ============================================================================
-- BALANCE HISTORY SNAPSHOTS
-- ============================================================================

-- Sample balance history (daily snapshots for last 7 days)
INSERT INTO balance_history (user_id, stablecoin, chain_id, balance, locked_balance, snapshot_date) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'USDC', '1', 15650.25, 2500.00, current_date - interval '7 days'),
('550e8400-e29b-41d4-a716-446655440001', 'USDC', '1', 15675.50, 2500.00, current_date - interval '6 days'),
('550e8400-e29b-41d4-a716-446655440001', 'USDC', '1', 15698.75, 2500.00, current_date - interval '5 days'),
('550e8400-e29b-41d4-a716-446655440001', 'USDC', '1', 15720.00, 2500.00, current_date - interval '4 days'),
('550e8400-e29b-41d4-a716-446655440001', 'USDC', '1', 15735.25, 2500.00, current_date - interval '3 days'),
('550e8400-e29b-41d4-a716-446655440001', 'USDC', '1', 15742.75, 2500.00, current_date - interval '2 days'),
('550e8400-e29b-41d4-a716-446655440001', 'USDC', '1', 15750.50, 2500.00, current_date - interval '1 day');

-- ============================================================================
-- FINAL SETUP QUERIES
-- ============================================================================

-- Update sequences to avoid conflicts
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));

-- Refresh materialized views if any exist
-- REFRESH MATERIALIZED VIEW IF EXISTS user_portfolio_summary;

-- Analyze tables for better query planning
ANALYZE users;
ANALYZE stablecoin_balances;
ANALYZE transactions;
ANALYZE tokenized_assets;
ANALYZE user_investments;

-- Show summary statistics
SELECT 
    'Users' as table_name, 
    COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
    'Transactions' as table_name, 
    COUNT(*) as record_count 
FROM transactions
UNION ALL
SELECT 
    'Investments' as table_name, 
    COUNT(*) as record_count 
FROM user_investments
UNION ALL
SELECT 
    'Yield Positions' as table_name, 
    COUNT(*) as record_count 
FROM yield_positions
UNION ALL
SELECT 
    'Cards' as table_name, 
    COUNT(*) as record_count 
FROM user_cards;

-- Success message
SELECT 'USD Financial database seeded successfully!' as status;